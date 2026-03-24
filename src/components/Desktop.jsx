import { useRef, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Terminal from './Terminal'
import StickyNote from './StickyNote'
import ResumeViewer from './ResumeViewer'
import BrowserWidget from './BrowserWidget'
import { FOLDERS, STICKY_NOTES } from '../data/folders'
import { BROWSER_PROJECTS, PROFILE } from '../data/siteConfig'

// Pre-compute layout positions for browser widgets
const BROWSER_POSITIONS = [
  { left: 480, top: 50 },
  { left: 200, top: 310 },
  { left: 350, top: 180 },
  { left: 500, top: 280 },
  { left: 300, top: 100 },
]

// Shared motion config for all desktop icons
const ICON_HOVER = { scale: 1.12, y: -4, transition: { type: 'spring', stiffness: 400, damping: 15 } }
const ICON_TAP = { scale: 0.9 }

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

// Hook to distinguish drag from click on draggable elements
function useDragClick(onClickAction) {
  const didDrag = useRef(false)
  return {
    onDragStart: () => { didDrag.current = true },
    onDragEnd: () => { setTimeout(() => { didDrag.current = false }, 0) },
    onClick: (e) => { if (!didDrag.current) onClickAction(e) },
  }
}

/**
 * Shared draggable desktop icon — eliminates duplication across
 * FolderIcon, PdfIcon, TerminalIcon, and ChatIcon.
 */
function DesktopIcon({ position, index, clicked, onClickAction, className, children, label }) {
  const ref = useRef(null)
  const { onDragStart, onDragEnd, onClick } = useDragClick(() => {
    onClickAction(ref.current?.getBoundingClientRect())
  })

  return (
    <motion.div
      ref={ref}
      className={`folder-icon ${className || ''}`}
      style={{ left: position.x, top: position.y }}
      drag
      dragMomentum={false}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      initial={{ opacity: 0, scale: 0, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 2.3 + index * 0.1 }}
      whileHover={ICON_HOVER}
      whileTap={ICON_TAP}
      data-clickable
    >
      {children}
      <span className="folder-icon-label">{label}</span>
      <ClickHint show={!clicked} />
    </motion.div>
  )
}

// Pre-compute initial z-indices at module scope (not per render)
const INITIAL_Z = { terminal: 10, resume: 11 }
BROWSER_PROJECTS.forEach((p, i) => { INITIAL_Z[p.id] = 12 + i })

export default function Desktop({ onFolderOpen }) {
  const [resumeOpen, setResumeOpen] = useState(false)
  const [terminalOpen, setTerminalOpen] = useState(true)
  const [clickedItems, setClickedItems] = useState({})
  const [browserOpen, setBrowserOpen] = useState(
    () => Object.fromEntries(BROWSER_PROJECTS.map((p) => [p.id, false]))
  )

  const zCounter = useRef(10)
  const [zIndices, setZIndices] = useState(INITIAL_Z)

  const bringToFront = useCallback((key) => {
    zCounter.current += 1
    setZIndices((prev) => ({ ...prev, [key]: zCounter.current }))
  }, [])

  const markClicked = useCallback((id) => {
    setClickedItems((prev) => ({ ...prev, [id]: true }))
  }, [])

  const openBrowser = useCallback((id) => {
    setBrowserOpen((prev) => ({ ...prev, [id]: true }))
    bringToFront(id)
    markClicked(id)
  }, [bringToFront, markClicked])

  const closeBrowser = useCallback((id) => {
    setBrowserOpen((prev) => ({ ...prev, [id]: false }))
  }, [])

  const handleFolderClick = useCallback((folder, rect) => {
    const browserProject = BROWSER_PROJECTS.find((p) => p.id === folder.id)
    if (browserProject) {
      openBrowser(folder.id)
    } else {
      markClicked(folder.id)
      onFolderOpen(folder, rect)
    }
  }, [openBrowser, markClicked, onFolderOpen])

  return (
    <div className="desktop-area">
      {/* Folder icons */}
      {FOLDERS.map((folder, i) => (
        <DesktopIcon
          key={folder.id}
          position={folder.position}
          index={i}
          clicked={!!clickedItems[folder.id]}
          className={`folder--${folder.color}`}
          label={folder.name}
          onClickAction={(rect) => handleFolderClick(folder, rect)}
        >
          <div className="folder-icon-graphic">
            <div className="folder-tab" />
            <div className="folder-body" />
          </div>
        </DesktopIcon>
      ))}

      {/* PDF Resume icon */}
      <DesktopIcon
        position={{ x: 140, y: 50 }}
        index={FOLDERS.length}
        clicked={!!clickedItems.resume}
        label="Resume.pdf"
        onClickAction={() => { setResumeOpen(true); bringToFront('resume'); markClicked('resume') }}
      >
        <div className="pdf-icon-graphic">
          <div className="pdf-icon-page">
            <div className="pdf-icon-fold" />
            <div className="pdf-icon-lines"><div /><div /><div /><div /></div>
            <div className="pdf-icon-badge">PDF</div>
          </div>
        </div>
      </DesktopIcon>

      {/* Terminal icon */}
      <DesktopIcon
        position={{ x: 140, y: 270 }}
        index={FOLDERS.length + 1}
        clicked={!!clickedItems.terminal}
        label="Terminal"
        onClickAction={() => { setTerminalOpen(true); bringToFront('terminal'); markClicked('terminal') }}
      >
        <div className="terminal-icon-graphic">
          <div className="terminal-icon-screen">
            <span className="terminal-icon-prompt">&gt;_</span>
          </div>
        </div>
      </DesktopIcon>

      {/* Widgets */}
      <Terminal
        isOpen={terminalOpen}
        onClose={() => setTerminalOpen(false)}
        style={{ position: 'absolute', left: 280, top: 50 }}
        zIndex={zIndices.terminal}
        onFocus={() => bringToFront('terminal')}
      />

      {BROWSER_PROJECTS.map((project, i) => (
        <BrowserWidget
          key={project.id}
          isOpen={browserOpen[project.id]}
          onClose={() => closeBrowser(project.id)}
          url={project.url}
          title={project.name}
          style={{ position: 'absolute', left: (BROWSER_POSITIONS[i] || BROWSER_POSITIONS[0]).left, top: (BROWSER_POSITIONS[i] || BROWSER_POSITIONS[0]).top }}
          zIndex={zIndices[project.id]}
          onFocus={() => bringToFront(project.id)}
        />
      ))}

      <ResumeViewer
        isOpen={resumeOpen}
        onClose={() => setResumeOpen(false)}
        style={{ position: 'absolute', right: 30, top: 310 }}
        zIndex={zIndices.resume}
        onFocus={() => bringToFront('resume')}
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
