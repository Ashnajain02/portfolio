import { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { PROFILE } from '../data/siteConfig'

const API_URL = import.meta.env.VITE_CHAT_API_URL || 'http://localhost:3001'

const INITIAL_MESSAGES = [
  {
    id: 'welcome',
    role: 'assistant',
    content: `Hey! I'm the AI version of ${PROFILE.name}. Ask me anything — my experience, projects, skills, or just say hi.`,
    timestamp: Date.now(),
  },
]

function TypingIndicator() {
  return (
    <div className="chat-typing">
      <span className="chat-typing-dot" style={{ animationDelay: '0ms' }} />
      <span className="chat-typing-dot" style={{ animationDelay: '150ms' }} />
      <span className="chat-typing-dot" style={{ animationDelay: '300ms' }} />
    </div>
  )
}

function SourceBadge({ source }) {
  const labels = { resume: 'Resume', journal: 'Journal', github: 'GitHub', drive: 'Drive' }
  return (
    <span className="chat-source-badge">
      {labels[source] || source}
    </span>
  )
}

function ChatMessage({ message }) {
  const isUser = message.role === 'user'

  return (
    <motion.div
      className={`chat-message ${isUser ? 'chat-message--user' : 'chat-message--assistant'}`}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
    >
      <div className={`chat-bubble ${isUser ? 'chat-bubble--user' : 'chat-bubble--assistant'}`}>
        {message.content}
      </div>
      {message.sources && message.sources.length > 0 && (
        <div className="chat-sources">
          {message.sources.map((s, i) => <SourceBadge key={i} source={s} />)}
        </div>
      )}
    </motion.div>
  )
}

export default function ChatWidget({ isOpen, onClose, style, zIndex, onFocus }) {
  const dragControls = useDragControls()
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [sessionId, setSessionId] = useState(null)
  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  // Accumulate tokens in a ref, flush to state via rAF to avoid per-token re-renders
  const pendingContentRef = useRef(null)
  const rafRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, isStreaming])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300)
    }
  }, [isOpen])

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || isStreaming) return

    const userMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsStreaming(true)

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

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`)
      }

      const reader = response.body?.getReader()
      if (!reader) throw new Error('No response body')

      const decoder = new TextDecoder()
      let assistantContent = ''
      let sources = []
      const assistantId = `assistant-${Date.now()}`

      // Add placeholder message
      setMessages(prev => [...prev, {
        id: assistantId,
        role: 'assistant',
        content: '',
        timestamp: Date.now(),
        sources: [],
      }])

      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })

        // Parse SSE events from buffer
        const lines = buffer.split('\n')
        buffer = lines.pop() || '' // Keep incomplete line

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const jsonStr = line.slice(6)
          if (!jsonStr.trim()) continue

          try {
            const event = JSON.parse(jsonStr)

            switch (event.type) {
              case 'session':
                setSessionId(event.data)
                break

              case 'token':
                assistantContent += event.data
                // Batch token updates via rAF (~60fps) instead of per-token
                pendingContentRef.current = assistantContent
                if (!rafRef.current) {
                  rafRef.current = requestAnimationFrame(() => {
                    rafRef.current = null
                    const content = pendingContentRef.current
                    if (content !== null) {
                      setMessages(prev =>
                        prev.map(m => m.id === assistantId ? { ...m, content } : m)
                      )
                    }
                  })
                }
                break

              case 'sources':
                sources = event.data
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantId
                      ? { ...m, sources }
                      : m
                  )
                )
                break

              case 'error':
                console.error('[chat] Stream error:', event.data)
                setMessages(prev =>
                  prev.map(m =>
                    m.id === assistantId
                      ? { ...m, content: "Sorry, something went wrong. Try again?" }
                      : m
                  )
                )
                break

              case 'done':
                // Final flush of any pending content
                if (rafRef.current) cancelAnimationFrame(rafRef.current)
                rafRef.current = null
                if (pendingContentRef.current !== null) {
                  const finalContent = pendingContentRef.current
                  setMessages(prev =>
                    prev.map(m => m.id === assistantId ? { ...m, content: finalContent } : m)
                  )
                  pendingContentRef.current = null
                }
                break
            }
          } catch {
            // Skip malformed events
          }
        }
      }
    } catch (err) {
      console.error('[chat] Error:', err)
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: "Hmm, I couldn't connect to my brain. Make sure the server is running!",
        timestamp: Date.now(),
      }])
    } finally {
      setIsStreaming(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="chat-widget"
          style={{ ...style, zIndex }}
          drag
          dragMomentum={false}
          dragListener={false}
          dragControls={dragControls}
          onPointerDown={onFocus}
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 30 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          {/* Title bar */}
          <div
            className="chat-widget-titlebar"
            onPointerDown={(e) => dragControls.start(e)}
            style={{ cursor: 'grab', touchAction: 'none' }}
          >
            <div className="window-dots">
              <div className="window-dot window-dot--close" onClick={onClose} data-clickable />
            </div>
            <div className="chat-widget-header-info">
              <div className="chat-widget-avatar">AJ</div>
              <div>
                <div className="chat-widget-name">{PROFILE.name}</div>
                <div className="chat-widget-status">
                  {isStreaming ? 'typing...' : 'AI Agent'}
                </div>
              </div>
            </div>
            <div style={{ width: 24 }} />
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <ChatMessage
                key={msg.id}
                message={msg}
              />
            ))}
            {isStreaming && messages[messages.length - 1]?.content === '' && (
              <div className="chat-message chat-message--assistant">
                <div className="chat-bubble chat-bubble--assistant">
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="chat-input-area">
            <textarea
              ref={inputRef}
              className="chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything..."
              rows={1}
              disabled={isStreaming}
            />
            <button
              className="chat-send-btn"
              onClick={sendMessage}
              disabled={!input.trim() || isStreaming}
              data-clickable
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
