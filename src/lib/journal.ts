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

  const patterns = [
    /(?:add(?: to)?(?: my)?(?: (?:shopping|to-?do|todo) list)?|add)\s+([a-z0-9 ,&and\-']+)/i,
    /(?:buy|buying|bought)\s+([a-z0-9 ,&and\-']+)/i,
    /(?:don't forget(?: to)?|do not forget(?: to)?|remember(?: to)?|remind me to)\s+([a-z0-9 ,&and\-']+)/i,
    /(?:also|and also|plus)\s+([a-z0-9 ,&and\-']+)/i,
    /(?:shopping list:|shopping:|to-?do list:|todo:)\s*([a-z0-9 ,&and\-']+)/i,
  ];

  for (const pat of patterns) {
    const m = s.match(pat);
    if (m && m[1]) {
      const chunk = m[1];
      const items = chunk
        .split(/,| and | & /)
        .map((t) => t.trim().replace(/[^a-z0-9\s\-']/g, ""))
        .filter(Boolean)
        .map((t) => stem(t))
        .filter(
          (t) => t.length > 1 && !COMMON_VERBS.has(t) && !STOPWORDS.has(t)
        )
        .map((t) => t.toLowerCase());
      if (items.length > 0) return Array.from(new Set(items));
    }
  }

  // fallback: pick noun-like tokens
  const tokens = s
    .split(/[\s,]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  const candidates = tokens
    .map((t) => t.replace(/[^a-z0-9\-']/g, ""))
    .map((t) => stem(t))
    .filter((t) => t.length > 1 && !COMMON_VERBS.has(t) && !STOPWORDS.has(t));

  const uniq: string[] = [];
  for (const c of candidates) {
    if (!uniq.includes(c)) uniq.push(c);
    if (uniq.length >= 6) break;
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
    if (r.items && r.items.length > 0) {
      for (const it of r.items) if (!items.includes(it)) items.push(it);
      continue;
    }
    const fromContent = fallbackExtractItems(r.content || "");
    for (const it of fromContent) if (!items.includes(it)) items.push(it);
    for (const k of r.keywords || []) {
      const kk = stem(k).toLowerCase();
      if (kk.length > 1 && !COMMON_VERBS.has(kk) && !items.includes(kk))
        items.push(kk);
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
