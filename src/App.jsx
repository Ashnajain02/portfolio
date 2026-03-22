import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TopBar from './components/TopBar'
import Desktop from './components/Desktop'
import Dock from './components/Dock'
import FolderWindow from './components/FolderWindow'
import Splash from './components/Splash'
import ContextMenu from './components/ContextMenu'
import Notification from './components/Notification'

export const AppContext = createContext()

export function useApp() {
  return useContext(AppContext)
}


function Wallpaper() {
  return (
    <div className="wallpaper wallpaper--day">
      <div className="wallpaper-orb" />
      <div className="wallpaper-orb" />
      <div className="wallpaper-orb" />
      <div className="wallpaper-orb" />
      <div className="wallpaper-orb" />
      <div className="wallpaper-grid" />
    </div>
  )
}

const TIPS = [
  { title: 'Welcome!', message: 'Click on any folder to explore my projects.' },
  { title: 'Tip', message: 'Try right-clicking on the desktop!' },
  { title: 'Tip', message: 'Everything is draggable — move things around!' },
]

export default function App() {
  const [openFolder, setOpenFolder] = useState(null)
  const [folderOrigin, setFolderOrigin] = useState({ x: 0, y: 0 })
  const [musicPlaying, setMusicPlaying] = useState(false)
  const [showSplash, setShowSplash] = useState(true)
  const [contextMenu, setContextMenu] = useState(null)
  const [notifications, setNotifications] = useState([])
  const notifTimerRef = useRef(null)

  // Show tips sequentially after splash
  useEffect(() => {
    if (showSplash) return
    let tipIndex = 0
    const showNext = () => {
      if (tipIndex >= TIPS.length) return
      const tip = TIPS[tipIndex]
      const id = Date.now() + tipIndex
      setNotifications((prev) => [...prev, { id, ...tip }])
      tipIndex++
      notifTimerRef.current = setTimeout(showNext, 4000)
    }
    notifTimerRef.current = setTimeout(showNext, 1500)
    return () => clearTimeout(notifTimerRef.current)
  }, [showSplash])

  const dismissNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const handleFolderOpen = useCallback((folder, originRect) => {
    setFolderOrigin({
      x: originRect.x + originRect.width / 2,
      y: originRect.y + originRect.height / 2,
    })
    setOpenFolder(folder)
  }, [])

  const handleFolderClose = useCallback(() => {
    setOpenFolder(null)
  }, [])

  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    setContextMenu({ x: e.clientX, y: e.clientY })
  }, [])

  const handleClick = useCallback(() => {
    if (contextMenu) setContextMenu(null)
  }, [contextMenu])

  return (
    <AppContext.Provider value={{ musicPlaying, setMusicPlaying }}>
      <AnimatePresence>
        {showSplash && <Splash onComplete={() => setShowSplash(false)} />}
      </AnimatePresence>

      <Wallpaper />

      <div
        className="app-container"
        onContextMenu={handleContextMenu}
        onClick={handleClick}
      >
        <TopBar />
        <Desktop onFolderOpen={handleFolderOpen} />
        <Dock />
      </div>

      {/* Notifications */}
      <div className="notification-stack">
        <AnimatePresence>
          {notifications.map((notif, i) => (
            <Notification
              key={notif.id}
              title={notif.title}
              message={notif.message}
              index={i}
              onDismiss={() => dismissNotification(notif.id)}
            />
          ))}
        </AnimatePresence>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu && (
          <ContextMenu
            x={contextMenu.x}
            y={contextMenu.y}
            onClose={() => setContextMenu(null)}
            onAction={(action) => {
              setContextMenu(null)
              if (action === 'about') {
                setNotifications((prev) => [
                  ...prev,
                  { id: Date.now(), title: 'About', message: 'Built with React + Framer Motion by Ashna Jain' },
                ])
              }
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openFolder && (
          <FolderWindow
            folder={openFolder}
            origin={folderOrigin}
            onClose={handleFolderClose}
          />
        )}
      </AnimatePresence>
    </AppContext.Provider>
  )
}
