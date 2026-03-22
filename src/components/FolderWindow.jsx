import { motion } from 'framer-motion'

function BrowserMockup({ url }) {
  return (
    <motion.div
      className="browser-mockup"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
    >
      <div className="browser-toolbar">
        <div className="browser-dots-mini">
          <span /><span /><span />
        </div>
        <div className="browser-url-bar">
          <span className="browser-lock">🔒</span>
          <span>{url}</span>
        </div>
      </div>
      <div className="browser-viewport">
        <div className="browser-placeholder">
          <div className="browser-placeholder-nav" />
          <div className="browser-placeholder-hero" />
          <div className="browser-placeholder-grid">
            <div /><div /><div />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

function StatCard({ stat, index }) {
  return (
    <motion.div
      className="stat-card"
      initial={{ opacity: 0, y: 15, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: 0.35 + index * 0.08, type: 'spring', stiffness: 300 }}
      whileHover={{ y: -2, boxShadow: '0 6px 20px var(--glass-shadow)' }}
    >
      <div className="stat-value">{stat.value}</div>
      <div className="stat-label">{stat.label}</div>
    </motion.div>
  )
}

function ProjectContent({ content }) {
  return (
    <>
      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
        {content.title}
      </motion.h2>
      <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        {content.subtitle}
      </motion.h3>

      {content.mockupUrl && <BrowserMockup url={content.mockupUrl} />}

      <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
        {content.description}
      </motion.p>

      {content.features && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }}>
          <h4 className="window-section-title">Key Features</h4>
          <ul className="feature-list">
            {content.features.map((f, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.05 }}
              >
                <span className="feature-bullet" />
                {f}
              </motion.li>
            ))}
          </ul>
        </motion.div>
      )}

      {(content.stats || content.pitchHighlights) && (
        <div className="stat-row">
          {(content.stats || content.pitchHighlights).map((s, i) => (
            <StatCard key={s.label} stat={s} index={i} />
          ))}
        </div>
      )}

      {content.tags && (
        <motion.div className="window-tags" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
          {content.tags.map((tag) => (
            <span key={tag} className="window-tag">{tag}</span>
          ))}
        </motion.div>
      )}

      {content.link && (
        <motion.a
          href={content.link}
          target="_blank"
          rel="noopener noreferrer"
          className="window-link"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
        >
          {content.linkLabel || 'Visit Project'}
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12h14m-7-7l7 7-7 7" />
          </svg>
        </motion.a>
      )}
    </>
  )
}

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
    switch (folder.type) {
      case 'gallery':
        return <GalleryContent content={folder.content} />
      default:
        return <ProjectContent content={folder.content} />
    }
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
            <div className="window-dot window-dot--close" onClick={onClose} data-clickable />
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
