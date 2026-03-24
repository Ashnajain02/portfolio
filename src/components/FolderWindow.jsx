import { motion } from 'framer-motion'

function GalleryContent({ content }) {
  return (
    <>
      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        {content.title}
      </motion.h2>
      <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        {content.subtitle}
      </motion.h3>
      <motion.div className="photo-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
        {content.photos.map((photo, i) => (
          <motion.div
            key={i}
            className="photo-item"
            initial={{ opacity: 0, scale: 0.5, rotate: -5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 15,
              delay: 0.3 + i * 0.06,
            }}
            whileHover={{ scale: 1.08, rotate: 2, zIndex: 2 }}
            whileTap={{ scale: 0.95 }}
            title={photo.label}
          >
            <img src={photo.src} alt={photo.label} className="photo-img" />
          </motion.div>
        ))}
      </motion.div>
    </>
  )
}

export default function FolderWindow({ folder, origin, onClose }) {
  const windowWidth = 560
  const windowHeight = 500
  const targetX = (window.innerWidth - windowWidth) / 2
  const targetY = (window.innerHeight - windowHeight) / 2

  const renderContent = () => {
    if (folder.type === 'gallery') {
      return <GalleryContent content={folder.content} />
    }
    return null
  }

  return (
    <>
      <motion.div
        className="window-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        onClick={onClose}
      />
      <motion.div
        className="window"
        style={{
          width: windowWidth,
          height: windowHeight,
          left: targetX,
          top: targetY,
          transformOrigin: `${origin.x - targetX}px ${origin.y - targetY}px`,
        }}
        initial={{ scale: 0, opacity: 0, borderRadius: 28 }}
        animate={{ scale: 1, opacity: 1, borderRadius: 14 }}
        exit={{ scale: 0, opacity: 0, borderRadius: 28 }}
        transition={{
          type: 'spring',
          stiffness: 300,
          damping: 26,
        }}
      >
        <div className="window-titlebar">
          <div className="window-dots">
            <div className="window-dot window-dot--close" onClick={onClose} />
          </div>
          <span className="window-title">{folder.name}</span>
          <div style={{ width: 54 }} />
        </div>
        <div className="window-content">
          {renderContent()}
        </div>
      </motion.div>
    </>
  )
}
