import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { PROFILE } from '../data/siteConfig'

const API_URL = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:3001'

const WELCOME_LINES = [
  { type: 'system', text: `${PROFILE.name.split(' ')[0].toLowerCase()}@portfolio ~ $` },
  { type: 'response', text: `Hey! I'm an AI version of ${PROFILE.name}.` },
  { type: 'response', text: 'I can talk about my work, projects, code, journal, newsletter, and more.' },
  { type: 'system', text: '' },
  { type: 'source', text: 'try: "what projects is Ashna working on?"' },
  { type: 'source', text: '     "what is undercover agents about?"' },
  { type: 'source', text: '     "does Ashna journal on the days she also codes?"' },
  { type: 'system', text: '' },
]

export default function Terminal({ isOpen, style, zIndex, onFocus, onClose }) {
  const dragControls = useDragControls()
  const [lines, setLines] = useState(WELCOME_LINES)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [hasTokens, setHasTokens] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const bodyRef = useRef(null)
  const inputRef = useRef(null)
  const pendingRef = useRef(null)
  const rafRef = useRef(null)

  const scrollToBottom = () => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight
    }
  }

  useEffect(() => {
    scrollToBottom()
  }, [lines, isStreaming])

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300)
  }, [isOpen])

  const sendMessage = useCallback(async () => {
    const text = input.trim()
    if (!text || isStreaming) return

    // Add user input line
    setLines(prev => [...prev, { type: 'prompt', text }])
    setInput('')
    setIsStreaming(true)
    setHasTokens(false)

    // Add empty response line that we'll stream into
    const responseId = Date.now()
    setLines(prev => [...prev, { type: 'response', text: '', id: responseId }])

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          ...(sessionId && { sessionId }),
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      })

      if (!response.ok) throw new Error(`Server error: ${response.status}`)

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let content = ''
      let sources = []
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const eventLines = buffer.split('\n')
        buffer = eventLines.pop() || ''

        for (const line of eventLines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))
            switch (event.type) {
              case 'session':
                setSessionId(event.data)
                break
              case 'token':
                content += event.data
                setHasTokens(true)
                // Batch updates via rAF
                pendingRef.current = content
                if (!rafRef.current) {
                  rafRef.current = requestAnimationFrame(() => {
                    rafRef.current = null
                    const c = pendingRef.current
                    if (c !== null) {
                      setLines(prev => prev.map(l => l.id === responseId ? { ...l, text: c } : l))
                    }
                  })
                }
                break
              case 'sources':
                sources = event.data
                break
              case 'done':
                // Final flush
                if (rafRef.current) cancelAnimationFrame(rafRef.current)
                rafRef.current = null
                setLines(prev => {
                  const updated = prev.map(l => l.id === responseId ? { ...l, text: content } : l)
                  if (sources.length > 0) {
                    updated.push({ type: 'source', text: `[sources: ${sources.join(', ')}]` })
                  }
                  return updated
                })
                pendingRef.current = null
                break
              case 'error':
                setLines(prev => prev.map(l =>
                  l.id === responseId ? { ...l, text: 'Error: something went wrong. Try again.' } : l
                ))
                break
            }
          } catch { /* skip malformed events */ }
        }
      }
    } catch (err) {
      setLines(prev => prev.map(l =>
        l.id === responseId ? { ...l, text: "Couldn't connect to the server. Is it running?" } : l
      ))
    } finally {
      setIsStreaming(false)
      setLines(prev => [...prev, { type: 'system', text: '' }])
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [input, isStreaming, sessionId])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      sendMessage()
    }
  }

  const renderLine = (line, i) => {
    switch (line.type) {
      case 'prompt':
        return (
          <div key={i} className="terminal-line">
            <span className="terminal-prompt">~ $ </span>
            <span className="terminal-command">{line.text}</span>
          </div>
        )
      case 'response': {
        // Hide empty response lines during streaming (thinking indicator handles that)
        if (isStreaming && line.id && !line.text) return null
        // Only show cursor on the actively streaming response (the last one with an id)
        const isActiveResponse = isStreaming && line.id && line === lines.findLast(l => l.id)
        return (
          <div key={line.id || i} className="terminal-line">
            <span className="terminal-response">{line.text}</span>
            {isActiveResponse && <span className="terminal-cursor" />}
          </div>
        )
      }
      case 'source':
        return (
          <div key={i} className="terminal-line">
            <span className="terminal-source">{line.text}</span>
          </div>
        )
      case 'system':
        return line.text ? (
          <div key={i} className="terminal-line">
            <span className="terminal-system">{line.text}</span>
          </div>
        ) : <div key={i} className="terminal-line-spacer" />
      default:
        return null
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="terminal-widget"
          style={{ ...style, zIndex }}
          drag
          dragMomentum={false}
          dragListener={false}
          dragControls={dragControls}
          onPointerDown={onFocus}
          initial={{ opacity: 0, scale: 0.8, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 20 }}
          transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        >
          <div
            className="terminal-header"
            onPointerDown={(e) => dragControls.start(e)}
            style={{ cursor: 'grab', touchAction: 'none' }}
          >
            <div className="window-dots">
              <div className="window-dot window-dot--close" onClick={onClose} data-clickable />
            </div>
            <span className="terminal-header-title">ask-{PROFILE.name.split(' ')[0].toLowerCase()}</span>
            <div style={{ width: 24 }} />
          </div>
          <div className="terminal-body" ref={bodyRef} onClick={() => inputRef.current?.focus()}>
            {lines.map(renderLine)}

            {/* Active input line */}
            {!isStreaming && (
              <div className="terminal-line terminal-input-line">
                <span className="terminal-prompt">~ $ </span>
                <input
                  ref={inputRef}
                  className="terminal-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="ask me anything..."
                  disabled={isStreaming}
                  autoComplete="off"
                  spellCheck={false}
                />
              </div>
            )}
            {isStreaming && !hasTokens && (
              <div className="terminal-line">
                <span className="terminal-prompt">~ </span>
                <span className="terminal-thinking">thinking</span>
                <span className="terminal-cursor" />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
