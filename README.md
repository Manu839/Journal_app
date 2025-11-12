# 📝 Journal Chat — Smart To-Do & Shopping List AI App

An intelligent journaling web application built with **Next.js 14**, **TypeScript**, and **TailwindCSS**, where users can naturally interact with an AI assistant that can **understand, store, and recall** different types of text-based inputs such as:

- 🛒 Shopping lists  
- ✅ To-do tasks  
- 🗒️ Personal journal notes  

The app acts as a **smart digital notebook** that lets you “talk” to your lists instead of manually managing them. You can simply type things like:

> “Add eggs and milk to my shopping list”  
> “Add send project report to my to-do list”  
> “Show my to-do list”

and the assistant automatically understands and organizes everything.

- It uses the **Google Gemini API** (via `@ai-sdk/google` and `ai` libraries) to understand natural language and extract structured data.  
- All data is stored in **in-memory storage** on the server (so no external database setup is required).

---

## 🚀 Features

✅ **🧠 Smart Intent Detection**  
Automatically distinguishes between:
- Adding to a *to-do list*  
- Adding to a *shopping list*  
- Viewing existing lists  
- Or writing a regular journal entry  

✅ **💾 In-Memory Storage**  
- Data is stored temporarily in server memory for simplicity.  
- No database or setup required — ideal for prototypes and demos.

✅ **🧰 Fallback Extraction**  
- When the Gemini API isn’t available, a powerful **regex-based fallback** extracts meaningful items from user messages.

✅ **🧾 Unified List Management**  
- Both **Shopping Lists** and **To-Do Lists** are handled under one chat interface.  
- The assistant automatically labels them correctly based on context.

✅ **💬 Beautiful, Minimal Chat UI**  
A clean TailwindCSS-powered chat interface with:
- Smooth message bubbles  
- Auto-scroll  
- Context-based list rendering  
- Clear distinction between user and assistant messages  

✅ **⚙️ TypeScript Support**  
- Full static typing across both backend and frontend ensures stability and clarity during development.

---

## 🧩 Tech Stack

| Layer | Technology Used |
|--------|----------------|
| **Frontend** | React (Next.js 14), TypeScript, TailwindCSS |
| **Backend** | Next.js Route Handlers |
| **AI Model** | Google Gemini API (`@ai-sdk/google`, `ai`) |
| **Styling** | TailwindCSS |
| **State Management** | React Hooks (`useState`, `useEffect`) |
| **Storage** | Temporary in-memory array (Node.js memory) |

---

## 📂 Folder Structure

The project is cleanly organized for clarity and scalability:


## ⚙️ Environment Variables
- Variable	Description
- GOOGLE_GENERATIVE_AI_API_KEY	Your Gemini API Key
- GOOGLE_MODEL_ID	Model name (default: models/gemini-2.5-flash)
  
## 🧠 Example Interactions

| User Input | Assistant Response |
|-------------|--------------------|
| “Add eggs and milk to my shopping list.” | ✅ *Saved items: eggs, milk* |
| “Add send email to professor to my to-do list.” | ✅ *Saved items: send email to professor* |
| “Show my to-do list.” | 🧾 *Found 1 matching entry: send email to professor* |
| “Remind me to buy bread.” | ✅ *Saved item: bread* |

## 🧱 Future Improvements
- 🗄️ Add persistent database (MongoDB/Firebase) : To retain entries permanently instead of in-memory.
- 📱 Add authentication per user : Each user can have private, synced journals.
- 🔔 Push reminders for tasks : Enable timed to-do notifications (e.g., “Remind me at 6 PM”).
- 💬 Multi-turn conversational memory : Allow contextual, multi-message conversations.
- 📑 Export journal as Markdown/PDF : Let users download or export their chat-based journal.
