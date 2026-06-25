           'use client'

import { FormEvent, useState } from 'react'

import { NavBar } from '@/app/components/NavBar'

type Message = {
  id: number
  role: 'user' | 'assistant'
  content: string
  subject?: string
  concept?: string
  saveState?: 'idle' | 'saving' | 'saved'
}

type ParsedSummary = {
  masteryLevel: string
  overviewGist: string
  deepDiveGist: string[]
  strongAreas: string[]
  weakAreas: string[]
  nextSteps: string[]
  notes: string
}

function parseSummary(text: string): ParsedSummary {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  const deepDiveGist: string[] = []
  const strongAreas: string[] = []
  const weakAreas: string[] = []
  const nextSteps: string[] = []
  let overviewGist = ''
  let notes = ''
  let currentSection: 'overview' | 'deepDive' | 'strong' | 'weak' | 'next' | 'notes' = 'overview'

  for (const line of lines) {
    if (/^strong areas?:/i.test(line)) {
      currentSection = 'strong'
      continue
    }
    if (/^weak areas?:/i.test(line)) {
      currentSection = 'weak'
      continue
    }
    if (/^next steps?:/i.test(line)) {
      currentSection = 'next'
      continue
    }
    if (/^(notes|summary):/i.test(line)) {
      currentSection = 'notes'
      continue
    }
    if (/^deep dive|^key ideas|^important points/i.test(line)) {
      currentSection = 'deepDive'
      continue
    }

    const cleaned = line.replace(/^[-*•]\s*/, '')

    if (!overviewGist && currentSection === 'overview') {
      overviewGist = cleaned
      continue
    }

    if (currentSection === 'deepDive') {
      deepDiveGist.push(cleaned)
    } else if (currentSection === 'strong') {
      strongAreas.push(cleaned)
    } else if (currentSection === 'weak') {
      weakAreas.push(cleaned)
    } else if (currentSection === 'next') {
      nextSteps.push(cleaned)
    } else if (currentSection === 'notes') {
      notes = `${notes} ${cleaned}`.trim()
    }
  }

  const lower = text.toLowerCase()
  let masteryLevel = 'Introduced'
  if (/proficient|strong|advanced|expert/i.test(lower)) {
    masteryLevel = 'Proficient'
  } else if (/develop|intermediate|moderate/i.test(lower)) {
    masteryLevel = 'Developing'
  }

  return {
    masteryLevel,
    overviewGist: overviewGist || text.slice(0, 240),
    deepDiveGist,
    strongAreas,
    weakAreas,
    nextSteps,
    notes,
  }
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const userMessage = input.trim()
    if (!userMessage || isStreaming) {
      return
    }

    setInput('')
    setError(null)

    const userMessageId = Date.now()
    const assistantMessageId = userMessageId + 1

    setMessages((current) => [
      ...current,
      { id: userMessageId, role: 'user', content: userMessage },
      { id: assistantMessageId, role: 'assistant', content: '' },
    ])

    setIsStreaming(true)

    try {
      const detectResponse = await fetch('/api/detect-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage }),
      })

      const detectData = await detectResponse.json()
      const subject = typeof detectData?.subject === 'string' ? detectData.subject : ''
      const concept = typeof detectData?.concept === 'string' ? detectData.concept : ''

      const chatResponse = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userMessage, subject, concept }),
      })

      if (!chatResponse.ok || !chatResponse.body) {
        throw new Error('Unable to stream the response right now.')
      }

      const reader = chatResponse.body.getReader()
      const decoder = new TextDecoder()
      let streamedText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          break
        }

        streamedText += decoder.decode(value, { stream: true })
        setMessages((current) =>
          current.map((message) =>
            message.id === assistantMessageId
              ? { ...message, content: streamedText, subject, concept }
              : message
          )
        )
      }

      streamedText += decoder.decode()
      setMessages((current) =>
        current.map((message) =>
          message.id === assistantMessageId
            ? { ...message, content: streamedText, subject, concept }
            : message
        )
      )
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong.'
      setError(message)
      setMessages((current) =>
        current.map((messageItem) =>
          messageItem.id === assistantMessageId
            ? { ...messageItem, content: 'Sorry, I could not complete that response.' }
            : messageItem
        )
      )
    } finally {
      setIsStreaming(false)
    }
  }

  async function handleSaveProgress(message: Message) {
    if (!message.subject || !message.concept || !message.content) {
      return
    }

    setMessages((current) =>
      current.map((item) =>
        item.id === message.id ? { ...item, saveState: 'saving' } : item
      )
    )

    const parsed = parseSummary(message.content)

    try {
      const response = await fetch('/api/save-concept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: message.subject,
          concept: message.concept,
          masteryLevel: parsed.masteryLevel,
          overviewGist: parsed.overviewGist,
          deepDiveGist: parsed.deepDiveGist,
          strongAreas: parsed.strongAreas,
          weakAreas: parsed.weakAreas,
          nextSteps: parsed.nextSteps,
          notes: parsed.notes,
        }),
      })

      if (!response.ok) {
        throw new Error('Unable to save progress right now.')
      }

      setMessages((current) =>
        current.map((item) =>
          item.id === message.id ? { ...item, saveState: 'saved' } : item
        )
      )
    } catch (err) {
      const messageText = err instanceof Error ? err.message : 'Saving failed.'
      setError(messageText)
      setMessages((current) =>
        current.map((item) =>
          item.id === message.id ? { ...item, saveState: 'idle' } : item
        )
      )
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <NavBar />
      <main className="px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-[calc(100vh-3rem)] max-w-4xl flex-col rounded-3xl border border-zinc-800 bg-zinc-900/80 shadow-2xl shadow-black/30">
          <header className="border-b border-zinc-800 px-5 py-4 sm:px-6">
            <h1 className="text-xl font-semibold">Study Coach</h1>
            <p className="mt-1 text-sm text-zinc-400">
              Ask about a concept and I will tutor you with context from your saved progress.
            </p>
          </header>

          <section className="flex-1 space-y-4 overflow-y-auto px-4 py-4 sm:px-6">
          {messages.length === 0 && (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/70 p-4 text-sm text-zinc-400">
              Try: “Help me understand derivatives” or “Explain recursion like I’m a beginner.”
            </div>
          )}

          {messages.map((message) => (
            <div key={message.id} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-7 shadow-sm ${message.role === 'user' ? 'bg-blue-600 text-white' : 'border border-zinc-800 bg-zinc-950/80 text-zinc-200'}`}>
                <div className="whitespace-pre-wrap">{message.content || (message.role === 'assistant' ? 'Thinking…' : '')}</div>

                {message.role === 'assistant' && message.subject && message.concept && (
                  <div className="mt-3 flex items-center justify-between gap-3 border-t border-zinc-800 pt-3">
                    <span className="text-xs uppercase tracking-[0.2em] text-zinc-500">
                      {message.subject} • {message.concept}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSaveProgress(message)}
                      disabled={message.saveState === 'saving' || message.saveState === 'saved'}
                      className="rounded-full border border-zinc-700 px-3 py-1 text-xs font-medium text-zinc-300 transition hover:border-blue-500 hover:text-blue-300 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {message.saveState === 'saving'
                        ? 'Saving…'
                        : message.saveState === 'saved'
                          ? 'Saved'
                          : 'Save progress'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {error && (
            <div className="rounded-2xl border border-red-800/60 bg-red-950/50 p-3 text-sm text-red-200">
              {error}
            </div>
          )}
        </section>

        <form onSubmit={handleSubmit} className="border-t border-zinc-800 bg-zinc-900/90 p-4 sm:p-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask your next question…"
              className="flex-1 rounded-2xl border border-zinc-700 bg-zinc-950 px-4 py-3 text-sm text-zinc-100 outline-none ring-0 transition focus:border-blue-500"
              disabled={isStreaming}
            />
            <button
              type="submit"
              disabled={isStreaming || !input.trim()}
              className="rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-zinc-700"
            >
              {isStreaming ? 'Thinking…' : 'Send'}
            </button>
          </div>
        </form>
        </div>
      </main>
    </div>
  )
}
