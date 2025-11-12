// src/app/api/chat/route.ts
import { NextResponse } from 'next/server'
import {
  addEntry,
  queryEntries,
  isShoppingQueryFromLib,
  getShoppingItemsForResults,
  fallbackExtractItemsFromLib,
} from '../../../lib/journal'
import { generateText } from 'ai'

const SYSTEM_PROMPT =
  'You are a journaling assistant whose job is to extract item names from user text when the user wants to add things to a shopping or to-do list. Return JSON only when extracting items.'

function looksLikeAddIntent(text: string) {
  if (!text) return false
  const s = String(text).toLowerCase()
  return (
    /\b(add|put|buy|need|remember|remind|get)\b/.test(s) &&
    /\b(list|shopping|grocery|to-?do|todo|task|supermarket)\b/.test(s)
  )
}

// small retry helper for transient LLM errors
async function callWithOneRetry(fn: () => Promise<any>) {
  try {
    return await fn()
  } catch (err) {
    // try once more (brief delay)
    await new Promise(r => setTimeout(r, 600))
    return await fn()
  }
}

export async function POST(req: Request) {
  try {
    const { message } = await req.json()
    if (!message) return NextResponse.json({ error: 'No message provided' }, { status: 400 })

    const text = String(message).trim()
    console.log('[chat] received:', text)

    // 1) quick auto-save for short non-questions like "milk"
    const autoAddThreshold = 30
    const looksLikeQuestion = /[?¿]$/.test(text) || /\b(what|how|why|when|where|who|do|did|does|is|are|can|should)\b/i.test(text)
    if (text.length > 0 && text.length <= autoAddThreshold && !looksLikeQuestion) {
      const items = fallbackExtractItemsFromLib(text)
      const entry = addEntry(text, [], items)
      console.log('[chat] auto-saved short message with items:', items)
      return NextResponse.json({ assistant: `Saved to journal: ${entry.content}`, entry })
    }

    // 2) add-intent: use LLM extraction (if key present) -> fallback if needed
    if (looksLikeAddIntent(text) || /\b(add|put|buy|need|remind)\b/i.test(text)) {
      console.log('[chat] detected add intent')

      const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
      if (!apiKey) {
        console.warn('[chat] no GOOGLE_GENERATIVE_AI_API_KEY — using fallback extractor')
        const fallbackItems = fallbackExtractItemsFromLib(text)
        const entry = addEntry(text, [], fallbackItems)
        return NextResponse.json({ assistant: `Saved to journal (fallback): ${entry.content}`, entry })
      }

      // Use modelId string directly with generateText (avoids SDK helper signature problems)
      const modelId = process.env.GOOGLE_MODEL_ID ?? 'models/gemini-2.5-flash'

      const prompt = `
${SYSTEM_PROMPT}

User message:
"""${text}"""

Return EXACTLY one JSON object (no extra text) between JSON_START and JSON_END:

JSON_START
{"items": ["item1","item2", ...], "content": "original user text"}
JSON_END

- Items should be lowercase, singular where possible.
- If none found, return {"items": [], "content":"..."}
`

      // call model with single retry to handle transient overloaded errors
      let result: any = null
      try {
        result = await callWithOneRetry(() =>
          generateText({
            model: modelId,        // modelId string (not a "google(...)" object)
            prompt,
            maxOutputTokens: 300,
            // pass apiKey via env (the SDK usually reads env) but also accept it in runtime if needed.
            // If your ai SDK needs explicit credentials, ensure process.env is set in Vercel.
          })
        )
      } catch (err: any) {
        console.error('[chat] LLM call failed after retries:', err?.responseBody ?? err)
        const fallbackItems = fallbackExtractItemsFromLib(text)
        const fallbackEntry = addEntry(text, [], fallbackItems)
        return NextResponse.json({
          assistant: `Saved to journal (fallback): ${fallbackEntry.content}`,
          entry: fallbackEntry,
          warning: 'LLM call failed; used fallback extractor.',
        })
      }

      const raw = (result as any).text ? String((result as any).text).trim() : String(result ?? '').trim()
      console.log('[chat] LLM raw:', raw)

      // extract JSON between markers or first {...}
      let jsonText: string | null = null
      const m = raw.match(/JSON_START\s*([\s\S]*?)\s*JSON_END/)
      if (m && m[1]) jsonText = m[1].trim()
      else {
        const j = raw.match(/(\{[\s\S]*\})/)
        if (j && j[1]) jsonText = j[1]
      }

      let parsed: any = null
      if (jsonText) {
        try { parsed = JSON.parse(jsonText) } catch { parsed = null }
      }

      if (parsed && Array.isArray(parsed.items)) {
        const items = parsed.items.map((it: any) => String(it).toLowerCase().trim()).filter(Boolean)
        const entry = addEntry(text, [], items)
        console.log('[chat] saved via LLM items:', items)
        return NextResponse.json({ assistant: `Saved items: ${items.join(', ')}`, entry })
      }

      // fallback if parse failed
      const fallbackItems = fallbackExtractItemsFromLib(text)
      const fallbackEntry = addEntry(text, [], fallbackItems)
      console.log('[chat] LLM parse failed — saved fallback items:', fallbackItems)
      return NextResponse.json({
        assistant: `Saved to journal (fallback): ${fallbackEntry.content}`,
        entry: fallbackEntry,
        warning: "Couldn't parse LLM output reliably; used fallback extractor.",
      })
    }

    // 3) shopping/to-do query -> local search
    if (isShoppingQueryFromLib(text)) {
      console.log('[chat] detected shopping query — running local query')
      const results = queryEntries(text)
      const shoppingItems = getShoppingItemsForResults(results)
      return NextResponse.json({ assistant: `Found ${results.length} matching entries.`, results, shoppingItems })
    }

    // 4) default: save as general entry
    const defaultEntry = addEntry(text, [], [])
    console.log('[chat] default save (no items)')
    return NextResponse.json({ assistant: `Saved to journal: ${defaultEntry.content}`, entry: defaultEntry })
  } catch (err) {
    console.error('[chat] route error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
