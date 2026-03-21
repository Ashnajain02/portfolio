import { useState, useEffect } from 'react'
import { motion, useDragControls } from 'framer-motion'

const BIO_LINES = [
  { prompt: true, text: 'whoami' },
  { prompt: false, text: 'Ashna Jain — Software Engineer' },
  { prompt: true, text: 'cat about.txt' },
  { prompt: false, text: 'I design and build full-stack' },
  { prompt: false, text: 'products that solve actual problems.' },
  { prompt: false, text: '' },
  { prompt: false, text: 'Powered by plants, curiosity,' },
  { prompt: false, text: 'and the coolest AI tools.' },
  { prompt: true, text: 'echo "Welcome to my desktop!"' },
  { prompt: false, text: 'Welcome to my desktop!' },
]

export default function Terminal({ style, zIndex, onFocus }) {
  const dragControls = useDragControls()
  const [visibleLines, setVisibleLines] = useState([])
  const [currentChar, setCurrentChar] = useState(0)
  const [lineIndex, setLineIndex] = useState(0)
  const [typing, setTyping] = useState(true)

  useEffect(() => {
    if (lineIndex >= BIO_LINES.length) {
      setTyping(false)
      return
    }

    const line = BIO_LINES[lineIndex]
    const speed = line.prompt ? 60 : 20

    if (currentChar < line.text.length) {
      const timer = setTimeout(() => {
        setCurrentChar((c) => c + 1)
      }, speed)
      return () => clearTimeout(timer)
    } else {
      const delay = line.prompt ? 400 : 150
      const timer = setTimeout(() => {
        setVisibleLines((prev) => [
          ...prev,
          { ...line, text: line.text },
        ])
        setLineIndex((i) => i + 1)
        setCurrentChar(0)
      }, delay)
      return () => clearTimeout(timer)
    }
  }, [lineIndex, currentChar])

  const currentLine = lineIndex < BIO_LINES.length ? BIO_LINES[lineIndex] : null

  return (
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
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 3 }}
    >
      <div
        className="terminal-header"
        onPointerDown={(e) => dragControls.start(e)}
        style={{ cursor: 'grab', touchAction: 'none' }}
      >
        <div className="terminal-dot" style={{ background: '#E85D4A' }} />
        <div className="terminal-dot" style={{ background: '#F5C040' }} />
        <div className="terminal-dot" style={{ background: '#62C554' }} />
      </div>
      <div className="terminal-body">
        {visibleLines.map((line, i) => (
          <div key={i}>
            {line.prompt && <span className="terminal-prompt">~ $ </span>}
            {!line.prompt && <span>  </span>}
            <span className={line.prompt ? 'terminal-command' : 'terminal-response'}>{line.text}</span>
          </div>
        ))}
        {currentLine && (
          <div>
            {currentLine.prompt && <span className="terminal-prompt">~ $ </span>}
            {!currentLine.prompt && <span>  </span>}
            <span className={currentLine.prompt ? 'terminal-command' : 'terminal-response'}>{currentLine.text.slice(0, currentChar)}</span>
            <span className="terminal-cursor" />
          </div>
        )}
        {!typing && <div><span className="terminal-prompt">~ $ </span><span className="terminal-cursor" /></div>}
      </div>
    </motion.div>
  )
}
