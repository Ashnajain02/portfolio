import { motion } from 'framer-motion'

export default function StickyNote({ title, content, color = 'yellow', style, delay = 0 }) {
  return (
    <motion.div
      className={`sticky-note sticky-note--${color}`}
      style={style}
      drag
      dragMomentum={false}
      initial={{ opacity: 0, scale: 0, rotate: -10 }}
      animate={{ opacity: 1, scale: 1, rotate: style?.rotate || 0 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 20,
        delay,
      }}
      whileHover={{
        scale: 1.05,
        rotate: 0,
        boxShadow: '4px 8px 24px rgba(0,0,0,0.15)',
      }}
      whileTap={{ scale: 0.95 }}
    >
      {title && <div className="sticky-note-title">{title}</div>}
      <div>{content}</div>
    </motion.div>
  )
}
