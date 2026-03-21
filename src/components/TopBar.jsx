import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../App'

export default function TopBar() {
  const { musicPlaying, setMusicPlaying } = useApp()
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(interval)
  }, [])

  const formatTime = (d) =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })

  const formatDate = (d) =>
    d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <motion.div
      className="topbar"
      initial={{ y: -36 }}
      animate={{ y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20, delay: 2.2 }}
    >
      <div className="topbar-left">
        <span className="topbar-name">Ashna Jain</span>
        <button className="topbar-btn" onClick={() => setMusicPlaying(!musicPlaying)}>
          <div className="music-indicator">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={`music-bar ${!musicPlaying ? 'music-bar--paused' : ''}`}
              />
            ))}
          </div>
          <span style={{ fontSize: 11 }}>{musicPlaying ? 'On' : 'Off'}</span>
        </button>
      </div>

      <div className="topbar-right">
        <span className="topbar-clock">{formatDate(time)}</span>
        <span className="topbar-clock">{formatTime(time)}</span>
      </div>
    </motion.div>
  )
}
