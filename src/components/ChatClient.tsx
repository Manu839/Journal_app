'use client'

import React, { useEffect, useRef, useState } from 'react'

type Entry = {
  id: string
  content: string
  keywords?: string[]
  items?: string[]
  createdAt: string
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  text: string
  entry?: Entry
  shoppingItems?: string[]
  ts?: string
}

export default function ChatClient() {
  const [messages, setMessages] = useState<Message[]>([])
  const [value, setValue] = useState('')
  const [loading, setLoading] = useState(false)
  const listRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!listRef.current) return
    listRef.current.scrollTop = listRef.current.scrollHeight
  }, [messages, loading])

  async function send() {
    const text = value.trim()
    if (!text) return

    const userMsg: Message = { id: String(Date.now()), role: 'user', text, ts: new Date().toISOString() }
    setMessages(m => [...m, userMsg])
    setValue('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      })

      const data = await res.json()
      const assistantText: string = data.assistant ?? 'No response'
      const assistantMsg: Message = {
        id: String(Date.now() + 1),
        role: 'assistant',
        text: assistantText,
        entry: data.entry ?? undefined,
        shoppingItems: data.shoppingItems ?? undefined,
        ts: new Date().toISOString(),
      }
      setMessages(m => [...m, assistantMsg])
    } catch (err) {
      console.error(err)
      setMessages(m => [...m, { id: String(Date.now() + 2), role: 'assistant', text: 'Error contacting server', ts: new Date().toISOString() }])
    } finally {
      setLoading(false)
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!loading) send()
    }
  }

  // 👇 Determine if recent query involves "to-do"
  const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0]
  const isTodoContext = lastUserMessage && /\b(to-?do|todo)\b/i.test(lastUserMessage.text)

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-semibold">Journal Chat</h1>
        <div className="text-sm text-slate-500">Text-only • In-memory</div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div ref={listRef} className="h-[60vh] p-4 space-y-4 overflow-y-auto bg-gradient-to-b from-slate-50 to-white">
          {messages.length === 0 && (
            <div className="text-center text-sm text-slate-500 py-10">
              Say something to start your journal…
            </div>
          )}

          {messages.map(m => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className="max-w-[72%]">
                <div className={`rounded-lg p-3 break-words ${
                  m.role === 'user'
                    ? 'bg-emerald-100 text-slate-900'
                    : 'bg-slate-100 text-slate-900'
                }`}>
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  <div className="mt-1 text-2xs text-slate-400 flex items-center gap-2">
                    <span className="text-xs">{m.role === 'user' ? 'You' : 'Assistant'}</span>
                    <span>•</span>
                    <time className="text-[11px]">
                      {m.ts ? new Date(m.ts).toLocaleTimeString() : ''}
                    </time>
                  </div>
                </div>

                {/* Entry card */}
                {m.entry && (
                  <div className="mt-2 p-3 bg-white border rounded-md shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Saved entry</div>
                      <div className="text-xs text-slate-400">
                        {new Date(m.entry.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="mt-2 text-sm text-slate-800">{m.entry.content}</div>
                    {m.entry.items && m.entry.items.length > 0 && (
                      <div className="mt-3">
                        <div className="text-xs text-slate-500 mb-1">Items</div>
                        <div className="flex flex-wrap gap-2">
                          {m.entry.items.map(it => (
                            <span key={it} className="px-2 py-1 bg-emerald-50 text-emerald-800 text-xs rounded">
                              {it}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {m.entry.keywords && m.entry.keywords.length > 0 && (
                      <div className="mt-2 text-xs text-slate-400">
                        Keywords: {m.entry.keywords.join(', ')}
                      </div>
                    )}
                  </div>
                )}

                {/* Dynamic list card — Shopping or To-Do */}
                {m.shoppingItems && m.shoppingItems.length > 0 && (
                  <div className="mt-2 p-3 bg-white border rounded-md shadow-sm">
                    <div className="text-sm font-medium mb-2">
                      {isTodoContext ? 'To-Do List' : 'Shopping List'}
                    </div>
                    <ul className="grid grid-cols-2 gap-2 text-sm">
                      {m.shoppingItems.map(it => (
                        <li key={it} className="flex items-center gap-2">
                          <span className="inline-block w-2 h-2 bg-emerald-500 rounded-full" />
                          <span className="capitalize">{it}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t bg-white flex items-center gap-3">
          <input
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Write a journal entry or ask your journal..."
            className="flex-1 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-200"
            disabled={loading}
            aria-label="Message"
          />
          <button
            onClick={send}
            disabled={loading || !value.trim()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-slate-800 text-white disabled:opacity-50"
          >
            {loading ? (
              <svg
                className="w-4 h-4 animate-spin"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="white"
                  strokeWidth="3"
                  strokeDasharray="50"
                  strokeLinecap="round"
                  fill="none"
                />
              </svg>
            ) : (
              'Send'
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
