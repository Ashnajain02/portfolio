import { motion } from 'framer-motion'

const MENU_ITEMS = [
  { id: 'about', label: 'About This Portfolio', icon: '~' },
  { id: 'divider' },
  { id: 'github', label: 'View Source Code', icon: '<>' },
  { id: 'contact', label: 'Get in Touch', icon: '@' },
  { id: 'divider2' },
  { id: 'refresh', label: 'Refresh Desktop', icon: '#' },
]

export default function ContextMenu({ x, y, onClose, onAction }) {
  const menuWidth = 200
  const menuHeight = 180
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 10)
  const adjustedY = Math.min(y, window.innerHeight - menuHeight - 10)

  return (
    <motion.div
      className="context-menu"
      style={{ left: adjustedX, top: adjustedY }}
      initial={{ opacity: 0, scale: 0.8, y: -10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: -10 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      onClick={(e) => e.stopPropagation()}
    >
      {MENU_ITEMS.map((item) =>
        item.id.startsWith('divider') ? (
          <div key={item.id} className="context-menu-divider" />
        ) : (
          <motion.div
            key={item.id}
            className="context-menu-item"
            data-clickable
            onClick={() => {
              if (item.id === 'refresh') window.location.reload()
              else if (item.id === 'github') window.open('https://github.com/ashnajain02', '_blank')
              else if (item.id === 'contact') window.location.href = 'mailto:ashnajain02@gmail.com'
              else onAction(item.id)
            }}
            whileHover={{ x: 2, backgroundColor: 'var(--accent-warm)', color: 'white' }}
            transition={{ duration: 0.15 }}
          >
            <span className="context-menu-icon">{item.icon}</span>
            <span>{item.label}</span>
          </motion.div>
        )
      )}
    </motion.div>
  )
}
