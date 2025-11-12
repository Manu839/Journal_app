// src/lib/journal.ts
// Minimal in-memory journal logic — text only (no image handling).

export type Entry = {
  id: string;
  content: string;
  tags?: string[];
  keywords?: string[];
  items?: string[];
  createdAt: string;
};

let entries: Entry[] = [];

/* -------------------- helpers -------------------- */
const STOPWORDS = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "of",
  "in",
  "on",
  "at",
  "for",
  "with",
  "that",
  "this",
  "it",
  "is",
  "are",
  "be",
  "i",
  "you",
  "we",
  "they",
  "me",
  "my",
  "your",
  "our",
  "have",
  "has",
  "had",
  "will",
  "please",
  "next",
  "time",
  "from",
  "as",
  "by",
  "about",
  "so",
  "but",
]);

const COMMON_VERBS = new Set([
  "add",
  "buy",
  "bought",
  "buying",
  "remember",
  "remind",
  "shopping",
  "list",
  "show",
  "need",
]);

function normalizeText(s: string) {
  return String(s || "")
    .toLowerCase()
    .replace(/[\u2018\u2019\u201c\u201d]/g, "'") // normalize smart quotes
    .replace(/[^a-z0-9\s,&\-']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stem(word: string) {
  if (!word) return word;
  if (word.length > 4 && word.endsWith("ies")) return word.slice(0, -3) + "y";
  if (word.length > 3 && word.endsWith("es")) return word.slice(0, -2);
  if (word.length > 2 && word.endsWith("s")) return word.slice(0, -1);
  return word;
}

/* -------------------- keyword extractor -------------------- */
function extractKeywords(text: string): string[] {
  const s = normalizeText(text);
  const tokens = s.split(/[\s,]+/).filter(Boolean);
  const kept = tokens
    .map((t) => t.trim())
    .filter((t) => !STOPWORDS.has(t) && !COMMON_VERBS.has(t))
    .map((t) => stem(t))
    .filter((t) => t.length > 1);

  const seen = new Set<string>();
  const out: string[] = [];
  for (const k of kept) {
    if (!seen.has(k)) {
      seen.add(k);
      out.push(k);
    }
  }
  return out;
}

/* -------------------- fallback item extractor -------------------- */
function fallbackExtractItems(content: string): string[] {
  const s = normalizeText(content);

  // Strong phrase-level patterns (capture the meaningful chunk)
  const patterns = [
    // capture after verbs like add/buy/need/remember ... but stop at common prepositions/phrases
    /(?:add|put|buy|need|remember|remind me to|don't forget to|note to)\s+(.*?)(?:\s+(?:to|in|on|at|for|my|the|from)\b|$)/i,
    // list: X or shopping list: X or to-do list: X
    /(?:shopping list:|shopping:|to-?do list:|todo:)\s*(.+)$/i,
    // short forms: also X / and also X
    /(?:also|and also|plus)\s+(.+)$/i,
  ];

  for (const pat of patterns) {
    const m = s.match(pat);
    if (m && m[1]) {
      // clean the chunk: remove list words, trailing 'list' markers, quotes, extra punctuation
      let chunk = m[1]
        .replace(
          /\b(to-?do|todo|shopping|shopping list|to-?do list|my|the|list)\b/gi,
          " "
        )
        .replace(/['"`]/g, "")
        .replace(/\s+/g, " ")
        .trim();

      // split on commas / " and " only if multiple items present
      const parts = chunk
        .split(/\s*,\s*|\s+and\s+/i)
        .map((p) => p.trim())
        .filter(Boolean);

      const items = parts
        .map((p) => p.replace(/[^a-z0-9\s\-']/gi, "").trim()) // strip stray punctuation
        .map((p) => stem(p)) // basic plural -> singular
        .map((p) => p.toLowerCase())
        .filter(
          (p) => p.length > 1 && !COMMON_VERBS.has(p) && !STOPWORDS.has(p)
        );

      if (items.length > 0) return Array.from(new Set(items));
    }
  }

  // If nothing matched, be conservative: try to extract noun-like tokens but return short list
  const tokens = s
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const candidates = tokens
    .map((t) => t.replace(/[^a-z0-9\-']/g, ""))
    .map((t) => stem(t))
    .filter((t) => t.length > 2 && !COMMON_VERBS.has(t) && !STOPWORDS.has(t));

  // return up to 4 sensible tokens (avoid full sentence split)
  const uniq: string[] = [];
  for (const c of candidates) {
    if (!uniq.includes(c)) uniq.push(c);
    if (uniq.length >= 4) break;
  }
  return uniq.map((i) => i.toLowerCase());
}

/* -------------------- core exports -------------------- */
export function addEntry(
  content: string,
  tags: string[] = [],
  items: string[] = []
) {
  const keywords = extractKeywords(content);
  const e: Entry = {
    id: String(Date.now()),
    content,
    tags,
    keywords,
    items: (items || []).map((i) => i.toLowerCase()),
    createdAt: new Date().toISOString(),
  };
  entries.unshift(e);
  return e;
}

function isShoppingQueryInternal(q: string) {
  if (!q) return false;
  const norm = normalizeText(q);
  return /\b(supermarket|grocery|shopping list|grocery list|to-?do list|todo|what should i buy|what is my shopping list|what is my to-?do list|what's on my list|shopping|to-?do)\b/i.test(
    norm
  );
}
export function isShoppingQueryFromLib(q: string) {
  return isShoppingQueryInternal(q);
}

export function queryEntries(query: string) {
  const q = normalizeText(query);
  const qTokens = q
    .split(/[\s,]+/)
    .map((t) => stem(t))
    .filter((t) => t && !STOPWORDS.has(t));

  return entries.filter((e) => {
    if (isShoppingQueryInternal(q)) {
      if ((e.items || []).length > 0) return true;
      if ((e.keywords || []).length > 0) return true;
      if (/(?:buy|add|shopping|supermarket|grocery)/i.test(e.content))
        return true;
      return false;
    }

    const entryKeywords = (e.keywords || []).map((k) => k.toLowerCase());
    for (const qt of qTokens) {
      if (!qt) continue;
      if (entryKeywords.some((ek) => ek.includes(qt) || qt.includes(ek)))
        return true;
      if (e.content.toLowerCase().includes(qt)) return true;
    }
    return false;
  });
}

export function getShoppingItemsForResults(results: Entry[]): string[] {
  const items: string[] = [];

  for (const r of results) {
    // Prefer explicitly extracted structured items
    if (r.items && r.items.length > 0) {
      for (const it of r.items) {
        const cleanItem = it.trim().toLowerCase();
        if (cleanItem && !items.includes(cleanItem)) {
          items.push(cleanItem);
        }
      }
      continue;
    }

    // If no structured items, fallback once from content (not keywords)
    const fromContent = fallbackExtractItems(r.content || "");
    for (const it of fromContent) {
      const cleanItem = it.trim().toLowerCase();
      if (cleanItem && !items.includes(cleanItem)) {
        items.push(cleanItem);
      }
    }
  }

  return items;
}

export function allEntries() {
  return entries;
}

export function fallbackExtractItemsFromLib(content: string) {
  return fallbackExtractItems(content);
}
