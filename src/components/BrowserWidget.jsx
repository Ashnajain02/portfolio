import { useState } from 'react'
import { motion, AnimatePresence, useDragControls } from 'framer-motion'

export default function BrowserWidget({ isOpen, onClose, url, title, style, zIndex, onFocus }) {
  const [loaded, setLoaded] = useState(false)
  const dragControls = useDragControls()
  const displayUrl = url.replace('https://', '')

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="browser-widget"
          style={{ ...style, zIndex }}
          drag
          dragMomentum={false}
          dragListener={false}
          dragControls={dragControls}
          onPointerDown={onFocus}
          initial={{ opacity: 0, scale: 0.85, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 30 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <div
            className="browser-widget-titlebar"
            onPointerDown={(e) => dragControls.start(e)}
            style={{ cursor: 'grab', touchAction: 'none' }}
          >
            <div className="window-dots">
              <div
                className="window-dot window-dot--close"
                onClick={onClose}
                data-clickable
              />
              <div className="window-dot window-dot--minimize" />
              <div className="window-dot window-dot--maximize" />
            </div>

            <div className="browser-widget-url">
              <a
                className="browser-widget-url-inner"
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                data-clickable
                onPointerDown={(e) => e.stopPropagation()}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0110 0v4" />
                </svg>
                <span>{displayUrl}</span>
              </a>
            </div>

            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="browser-widget-open-btn"
              data-clickable
              onClick={(e) => e.stopPropagation()}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            </a>
          </div>

          <div className="browser-widget-viewport">
            {!loaded && (
              <div className="browser-widget-loading">
                <div className="browser-widget-spinner" />
                <span>Loading {displayUrl}...</span>
              </div>
            )}
            <iframe
              src={url}
              title={title}
              className="browser-widget-iframe"
              onLoad={() => setLoaded(true)}
              sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
              style={{ opacity: loaded ? 1 : 0 }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
