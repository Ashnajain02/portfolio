import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Terminal from './Terminal'
import StickyNote from './StickyNote'
import ResumeViewer from './ResumeViewer'
import BrowserWidget from './BrowserWidget'
import ChatWidget from './ChatWidget'
import { FOLDERS, STICKY_NOTES } from '../data/folders'
import { BROWSER_PROJECTS } from '../data/siteConfig'

// Pre-compute layout positions for browser widgets
const BROWSER_POSITIONS = [
  { left: 480, top: 50 },
  { left: 200, top: 310 },
  { left: 350, top: 180 },
  { left: 500, top: 280 },
  { left: 300, top: 100 },
]

function ClickHint({ show }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="click-hint"
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4, transition: { duration: 0.2 } }}
          transition={{ delay: 3.5, duration: 0.4 }}
        >
          click me
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hook to distinguish drag from click
function useDragClick(onClickAction) {
  const didDrag = useRef(false)

  const onDragStart = () => { didDrag.current = true }
  const onDragEnd = () => {
    // Reset after a tick so onClick can check it
    setTimeout(() => { didDrag.current = false }, 0)
  }
  const onClick = (e) => {
    if (didDrag.current) return
    onClickAction(e)
  }

  return { onDragStart, onDragEnd, onClick }
}

function FolderIcon({ folder, onOpen, index, clicked }) {
  const ref = useRef(null)

  const { onDragStart, onDragEnd, onClick } = useDragClick(() => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    onOpen(folder, rect)
  })

  return (
    <motion.div
      ref={ref}
      className={`folder-icon folder--${folder.color}`}
      style={{ left: folder.position.x, top: folder.position.y }}
      drag
      dragMomentum={false}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: 2.3 + index * 0.1,
      }}
      whileHover={{
        scale: 1.12,
        y: -4,
        transition: { type: 'spring', stiffness: 400, damping: 15 },
      }}
      whileTap={{ scale: 0.9 }}
    >
      <div className="folder-icon-graphic">
        <div className="folder-tab" />
        <div className="folder-body" />
      </div>
      <span className="folder-icon-label">{folder.name}</span>
      <ClickHint show={!clicked} />
    </motion.div>
  )
}

function PdfIcon({ onClick: onClickProp, index, clicked }) {
  const { onDragStart, onDragEnd, onClick } = useDragClick(onClickProp)

  return (
    <motion.div
      className="folder-icon"
      style={{ left: 140, top: 50 }}
      drag
      dragMomentum={false}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: 2.3 + index * 0.1,
      }}
      whileHover={{
        scale: 1.12,
        y: -4,
        transition: { type: 'spring', stiffness: 400, damping: 15 },
      }}
      whileTap={{ scale: 0.9 }}
      data-clickable
    >
      <div className="pdf-icon-graphic">
        <div className="pdf-icon-page">
          <div className="pdf-icon-fold" />
          <div className="pdf-icon-lines">
            <div /><div /><div /><div />
          </div>
          <div className="pdf-icon-badge">PDF</div>
        </div>
      </div>
      <span className="folder-icon-label">Resume.pdf</span>
      <ClickHint show={!clicked} />
    </motion.div>
  )
}

function ChatIcon({ onClick: onClickProp, index, clicked }) {
  const { onDragStart, onDragEnd, onClick } = useDragClick(onClickProp)

  return (
    <motion.div
      className="folder-icon"
      style={{ left: 40, top: 380 }}
      drag
      dragMomentum={false}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: 2.3 + index * 0.1,
      }}
      whileHover={{
        scale: 1.12,
        y: -4,
        transition: { type: 'spring', stiffness: 400, damping: 15 },
      }}
      whileTap={{ scale: 0.9 }}
      data-clickable
    >
      <div className="chat-icon-graphic">
        <div className="chat-icon-dots">
          <span /><span /><span />
        </div>
      </div>
      <span className="folder-icon-label">Ask Ashna</span>
      <ClickHint show={!clicked} />
    </motion.div>
  )
}

function TerminalIcon({ onClick: onClickProp, index, clicked }) {
  const { onDragStart, onDragEnd, onClick } = useDragClick(onClickProp)

  return (
    <motion.div
      className="folder-icon"
      style={{ left: 140, top: 270 }}
      drag
      dragMomentum={false}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 20,
        delay: 2.3 + index * 0.1,
      }}
      whileHover={{
        scale: 1.12,
        y: -4,
        transition: { type: 'spring', stiffness: 400, damping: 15 },
      }}
      whileTap={{ scale: 0.9 }}
      data-clickable
    >
      <div className="terminal-icon-graphic">
        <div className="terminal-icon-screen">
          <span className="terminal-icon-prompt">&gt;_</span>
        </div>
      </div>
      <span className="folder-icon-label">Terminal</span>
      <ClickHint show={!clicked} />
    </motion.div>
  )
}

export default function Desktop({ onFolderOpen }) {
  const [resumeOpen, setResumeOpen] = useState(false)
  const [terminalOpen, setTerminalOpen] = useState(true)
  const [chatOpen, setChatOpen] = useState(false)
  const [clickedItems, setClickedItems] = useState({})

  // Dynamic state for all browser projects
  const [browserOpen, setBrowserOpen] = useState(
    () => Object.fromEntries(BROWSER_PROJECTS.map((p) => [p.id, false]))
  )

  const zCounter = useRef(10)
  const initialZ = { terminal: 10, resume: 11, chat: 15 }
  BROWSER_PROJECTS.forEach((p, i) => { initialZ[p.id] = 12 + i })
  const [zIndices, setZIndices] = useState(initialZ)

  const bringToFront = useCallback((key) => {
    zCounter.current += 1
    setZIndices((prev) => ({ ...prev, [key]: zCounter.current }))
  }, [])

  const markClicked = (id) => {
    setClickedItems((prev) => ({ ...prev, [id]: true }))
  }

  const openBrowser = (id) => {
    setBrowserOpen((prev) => ({ ...prev, [id]: true }))
    bringToFront(id)
    markClicked(id)
  }

  const closeBrowser = (id) => {
    setBrowserOpen((prev) => ({ ...prev, [id]: false }))
  }

  const handleFolderClick = (folder, rect) => {
    const browserProject = BROWSER_PROJECTS.find((p) => p.id === folder.id)
    if (browserProject) {
      openBrowser(folder.id)
    } else {
      markClicked(folder.id)
      onFolderOpen(folder, rect)
    }
  }

  return (
    <div className="desktop-area">
      {FOLDERS.map((folder, i) => (
        <FolderIcon
          key={folder.id}
          folder={folder}
          onOpen={handleFolderClick}
          index={i}
          clicked={!!clickedItems[folder.id]}
        />
      ))}

      <PdfIcon
        onClick={() => { setResumeOpen(true); bringToFront('resume'); markClicked('resume') }}
        index={FOLDERS.length}
        clicked={!!clickedItems.resume}
      />

      <TerminalIcon
        onClick={() => { setTerminalOpen(true); bringToFront('terminal'); markClicked('terminal') }}
        index={FOLDERS.length + 1}
        clicked={!!clickedItems.terminal}
      />

      <ChatIcon
        onClick={() => { setChatOpen(true); bringToFront('chat'); markClicked('chat') }}
        index={FOLDERS.length + 2}
        clicked={!!clickedItems.chat}
      />

      <Terminal
        isOpen={terminalOpen}
        onClose={() => setTerminalOpen(false)}
        style={{ position: 'absolute', left: 280, top: 50 }}
        zIndex={zIndices.terminal}
        onFocus={() => bringToFront('terminal')}
      />

      {BROWSER_PROJECTS.map((project, i) => {
        const pos = BROWSER_POSITIONS[i] || BROWSER_POSITIONS[0]
        return (
          <BrowserWidget
            key={project.id}
            isOpen={browserOpen[project.id]}
            onClose={() => closeBrowser(project.id)}
            url={project.url}
            title={project.name}
            style={{ position: 'absolute', left: pos.left, top: pos.top }}
            zIndex={zIndices[project.id]}
            onFocus={() => bringToFront(project.id)}
          />
        )
      })}

      <ResumeViewer
        isOpen={resumeOpen}
        onClose={() => setResumeOpen(false)}
        style={{ position: 'absolute', right: 30, top: 310 }}
        zIndex={zIndices.resume}
        onFocus={() => bringToFront('resume')}
      />

      <ChatWidget
        isOpen={chatOpen}
        onClose={() => setChatOpen(false)}
        style={{ position: 'absolute', left: 350, top: 60 }}
        zIndex={zIndices.chat}
        onFocus={() => bringToFront('chat')}
      />

      {STICKY_NOTES.map((note) => (
        <StickyNote
          key={note.id}
          title={note.title}
          content={note.content}
          color={note.color}
          style={note.style}
          delay={note.delay}
        />
      ))}
    </div>
  )
}
