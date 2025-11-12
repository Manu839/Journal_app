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
### src/
### ├── app/
### │ ├── api/
### │ │ └── chat/
### │ │ └── route.ts # Core API logic (intent detection + LLM + fallback)
### │ ├── globals.css
### │ └── page.tsx
### ├── components/
### │ └── ChatClient.tsx # Frontend chat UI (React + Tailwind)
### └── lib/
### └── journal.ts # Logic for storage + extraction + keyword parsing

## 🧠 Future Improvements

###🗄️ Add persistent DB (MongoDB/Firebase)

### 📱 Add authentication per user

### 🔔 Push reminders for tasks

### 💬 Multi-turn chat context memory

### 📑 Export journal as Markdown/PDF
