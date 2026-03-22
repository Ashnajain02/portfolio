import { useState, useEffect } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { TERMINAL_BIO } from '../data/siteConfig'

export default function Terminal({ isOpen, style, zIndex, onFocus, onClose }) {
  const dragControls = useDragControls()
  const [visibleLines, setVisibleLines] = useState([])
  const [currentChar, setCurrentChar] = useState(0)
  const [lineIndex, setLineIndex] = useState(0)

  useEffect(() => {
    if (!isOpen) return
    if (lineIndex >= TERMINAL_BIO.length) return

    const line = TERMINAL_BIO[lineIndex]
    if (currentChar < line.text.length) {
      const speed = line.prompt ? 60 : 25
      const timer = setTimeout(() => setCurrentChar((c) => c + 1), speed)
      return () => clearTimeout(timer)
    } else {
      const timer = setTimeout(() => {
        setVisibleLines((prev) => [...prev, line])
        setCurrentChar(0)
        setLineIndex((i) => i + 1)
      }, line.prompt ? 400 : 150)
      return () => clearTimeout(timer)
    }
  }, [lineIndex, currentChar, isOpen])

  const currentLine = lineIndex < TERMINAL_BIO.length ? TERMINAL_BIO[lineIndex] : null

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
              <div
                className="window-dot window-dot--close"
                onClick={onClose}
                data-clickable
              />
            </div>
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
                <span className={currentLine.prompt ? 'terminal-command' : 'terminal-response'}>
                  {currentLine.text.slice(0, currentChar)}
                </span>
                <span className="terminal-cursor" />
              </div>
            )}
            {lineIndex >= TERMINAL_BIO.length && (
              <div>
                <span className="terminal-prompt">~ $ </span>
                <span className="terminal-cursor" />
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
