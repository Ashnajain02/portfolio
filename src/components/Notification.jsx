import { useEffect } from 'react'
import { motion } from 'framer-motion'

export default function Notification({ title, message, onDismiss }) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 5000)
    return () => clearTimeout(timer)
  }, [onDismiss])

  return (
    <motion.div
      className="notification"
      initial={{ x: 320, opacity: 0, scale: 0.8 }}
      animate={{ x: 0, opacity: 1, scale: 1 }}
      exit={{ x: 320, opacity: 0, scale: 0.8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      onClick={onDismiss}
      layout
    >
      <div className="notification-icon">
        {title === 'Welcome!' ? '👋' : title === 'About' ? '✦' : '💡'}
      </div>
      <div className="notification-body">
        <div className="notification-title">{title}</div>
        <div className="notification-message">{message}</div>
      </div>
      <div className="notification-close">×</div>
    </motion.div>
  )
}
