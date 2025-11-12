# 📝 Journal Chat — Smart To-Do & Shopping List AI App

An intelligent journaling web app built with **Next.js 14**, **TypeScript**, and **TailwindCSS**, where users can naturally chat with an assistant that **understands, stores, and retrieves** text-based entries like:

- Shopping lists 🛒  
- To-do tasks ✅  
- Regular journal notes 🗒️  

The app uses the **Google Gemini API** (via `@ai-sdk/google` and `ai` library) for natural language understanding and **in-memory persistence** (no database required).

---

## 🚀 Features

✅ **Smart Intent Detection**  
Automatically understands whether you’re:
- Adding something to a *to-do* or *shopping* list  
- Asking to view your saved items  
- Writing a general journal note  

✅ **In-memory Storage**  
No backend DB required — entries are stored in temporary server memory.

✅ **Fallback Extraction**  
If Gemini API fails or is unavailable, a **regex-based fallback** extracts items reliably.

✅ **Unified Lists**  
Supports both **Shopping Lists** and **To-Do Lists**, automatically labeling each based on your chat context.

✅ **Minimal UI + TailwindCSS**  
Clean, lightweight chat interface with auto-scroll and styled message bubbles.

✅ **TypeScript Support**  
Strong typing for cleaner, safer code.

---

## 🧩 Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React (Next.js 14, TypeScript, TailwindCSS) |
| Backend | Next.js Route Handlers |
| AI | Google Gemini API (via `@ai-sdk/google`, `ai`) |
| Styling | TailwindCSS |
| State | React Hooks (useState, useEffect) |
| Storage | In-memory (Node.js variables) |

---

## 📂 Folder Structure
src/
├── app/
│ ├── api/
│ │ └── chat/
│ │ └── route.ts # Core API logic (intent detection + LLM + fallback)
│ ├── globals.css
│ └── page.tsx
├── components/
│ └── ChatClient.tsx # Frontend chat UI (React + Tailwind)
└── lib/
└── journal.ts # Logic for storage + extraction + keyword parsing

🧠 Core Logic Breakdown
🪄 Intent Detection (route.ts)
function looksLikeAddIntent(text: string) {
  if (!text) return false
  const s = text.toLowerCase()
  return (
    /\b(add|put|buy|need|remember|remind|get)\b/.test(s) &&
    /\b(list|shopping|grocery|to-?do|todo|task|supermarket)\b/.test(s)
  )
}


Detects add-intent for both “shopping list” and “to-do list” contexts.

Handles natural phrases like:

“Add milk to my shopping list”

“Add ‘send email to professor’ to my to-do list”




🧰 Fallback Extraction Logic (journal.ts)

If the Gemini API fails or is unavailable, we use this regex-based logic:

const patterns = [
  /(?:add(?: to)?(?: my)?(?: (?:shopping|to-?do|todo) list)?|add)\s+([a-z0-9 ,&and\-']+)/i,
  /(?:buy|buying|bought)\s+([a-z0-9 ,&and\-']+)/i,
  /(?:don't forget|remember|remind me to)\s+([a-z0-9 ,&and\-']+)/i,
  /(?:also|and also|plus)\s+([a-z0-9 ,&and\-']+)/i,
]


Extracts phrases after add, buy, remember, or don’t forget.

Cleans, stems, and returns as lowercase item strings.


🧩 Example:

Input	Extracted Items
“Add eggs and milk to my shopping list”	["egg", "milk"]
“Add send email to professor to my to-do list”	["send email to professor"]
“Don’t forget bread”	["bread"]


🧠 Gemini Extraction Logic (route.ts)

If the API key exists, Gemini is used first for structured extraction:

const prompt = `
You are a journaling assistant.
Extract structured items from the text and return JSON only.

User message:
"""${text}"""

Return this structure between markers:

JSON_START
{"items": ["item1","item2"], "content": "original user text"}
JSON_END
`

const result = await generateText({ model, prompt, maxOutputTokens: 300 })

🗂 In-Memory Storage

All entries are stored inside a simple array:

let entries: Entry[] = []

export function addEntry(content: string, tags: string[] = [], items: string[] = []) {
  const e: Entry = {
    id: String(Date.now()),
    content,
    items: items.map(i => i.toLowerCase()),
    createdAt: new Date().toISOString()
  }
  entries.unshift(e)
  return e
}


No database — data resets when the server restarts.

🧩 Query Matching Logic

When user asks:

“What is my to-do list?” or “Show my shopping list”

It triggers a simple keyword-based check:

function isShoppingQueryInternal(q: string) {
  const norm = q.toLowerCase()
  return /\b(shopping list|grocery list|to-?do|todo|supermarket)\b/i.test(norm)
}

💬 Frontend Logic (ChatClient.tsx)

The chat UI is built with React and TailwindCSS:

Auto-scrolls on new messages

Distinguishes user & assistant bubbles

Displays Saved entry cards

Shows extracted Shopping List or To-Do List dynamically

const isTodoContext = lastUserMessage && /\b(to-?do|todo)\b/i.test(lastUserMessage.text)

{m.shoppingItems && (
  <div>
    <div className="font-medium mb-2">
      {isTodoContext ? 'To-Do List' : 'Shopping List'}
    </div>
    <ul>
      {m.shoppingItems.map(it => <li key={it}>{it}</li>)}
    </ul>
  </div>
)}

🧠 Future Improvements

🗄️ Add persistent DB (MongoDB/Firebase)

📱 Add authentication per user

🔔 Push reminders for tasks

💬 Multi-turn chat context memory

📑 Export journal as Markdown/PDF
