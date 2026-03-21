import { useRef, useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import Terminal from './Terminal'
import StickyNote from './StickyNote'
import ResumeViewer from './ResumeViewer'
import BrowserWidget from './BrowserWidget'
import { FOLDERS, STICKY_NOTES } from '../data/folders'

function FolderIcon({ folder, onClick, index }) {
  const ref = useRef(null)

  const handleClick = () => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    onClick(folder, rect)
  }

  return (
    <motion.div
      ref={ref}
      className={`folder-icon folder--${folder.color}`}
      style={{ left: folder.position.x, top: folder.position.y }}
      drag
      dragMomentum={false}
      onClick={handleClick}
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
    </motion.div>
  )
}

function PdfIcon({ onClick, index }) {
  return (
    <motion.div
      className="folder-icon"
      style={{ left: 140, top: 50 }}
      drag
      dragMomentum={false}
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
    </motion.div>
  )
}

export default function Desktop({ onFolderOpen }) {
  const [resumeOpen, setResumeOpen] = useState(false)
  const [twixOpen, setTwixOpen] = useState(false)
  const [eternalOpen, setEternalOpen] = useState(false)
  const [newsletterOpen, setNewsletterOpen] = useState(false)
  const zCounter = useRef(10)
  const [zIndices, setZIndices] = useState({
    terminal: 10,
    resume: 11,
    twix: 12,
    eternal: 13,
    newsletter: 14,
  })

  const bringToFront = useCallback((key) => {
    zCounter.current += 1
    setZIndices((prev) => ({ ...prev, [key]: zCounter.current }))
  }, [])

  useEffect(() => {
    const resumeTimer = setTimeout(() => setResumeOpen(true), 3200)
    const twixTimer = setTimeout(() => setTwixOpen(true), 3600)
    const eternalTimer = setTimeout(() => setEternalOpen(true), 4000)
    return () => {
      clearTimeout(resumeTimer)
      clearTimeout(twixTimer)
      clearTimeout(eternalTimer)
    }
  }, [])

  const handleFolderClick = (folder, rect) => {
    if (folder.id === 'twix-chat') {
      setTwixOpen(true)
      bringToFront('twix')
    } else if (folder.id === 'eternal-entries') {
      setEternalOpen(true)
      bringToFront('eternal')
    } else if (folder.id === 'undercover-agents') {
      setNewsletterOpen(true)
      bringToFront('newsletter')
    } else {
      onFolderOpen(folder, rect)
    }
  }

  return (
    <div className="desktop-area">
      {FOLDERS.map((folder, i) => (
        <FolderIcon
          key={folder.id}
          folder={folder}
          onClick={handleFolderClick}
          index={i}
        />
      ))}

      <PdfIcon onClick={() => { setResumeOpen(true); bringToFront('resume') }} index={FOLDERS.length} />

      <Terminal
        style={{ position: 'absolute', left: 280, top: 50 }}
        zIndex={zIndices.terminal}
        onFocus={() => bringToFront('terminal')}
      />

      <BrowserWidget
        isOpen={eternalOpen}
        onClose={() => setEternalOpen(false)}
        url="https://eternal-entries.vercel.app"
        title="Eternal Entries"
        style={{ position: 'absolute', left: 480, top: 50 }}
        zIndex={zIndices.eternal}
        onFocus={() => bringToFront('eternal')}
      />

      <BrowserWidget
        isOpen={twixOpen}
        onClose={() => setTwixOpen(false)}
        url="https://twix-chat.vercel.app"
        title="Twix Chat"
        style={{ position: 'absolute', left: 200, top: 310 }}
        zIndex={zIndices.twix}
        onFocus={() => bringToFront('twix')}
      />

      <ResumeViewer
        isOpen={resumeOpen}
        onClose={() => setResumeOpen(false)}
        style={{ position: 'absolute', right: 30, top: 310 }}
        zIndex={zIndices.resume}
        onFocus={() => bringToFront('resume')}
      />

      <BrowserWidget
        isOpen={newsletterOpen}
        onClose={() => setNewsletterOpen(false)}
        url="https://undercover-agents.beehiiv.com/"
        title="Undercover Agents"
        style={{ position: 'absolute', left: 350, top: 180 }}
        zIndex={zIndices.newsletter}
        onFocus={() => bringToFront('newsletter')}
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
