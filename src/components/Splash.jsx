import { useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { PROFILE } from '../data/siteConfig'

const letterVariants = {
  hidden: { y: 40, opacity: 0, rotateX: -90 },
  visible: (i) => ({
    y: 0,
    opacity: 1,
    rotateX: 0,
    transition: {
      type: 'spring',
      stiffness: 200,
      damping: 15,
      delay: 0.3 + i * 0.06,
    },
  }),
  exit: (i) => ({
    y: -30,
    opacity: 0,
    scale: 0.8,
    transition: {
      duration: 0.3,
      delay: i * 0.02,
    },
  }),
}

export default function Splash({ onComplete }) {
  const name = PROFILE.name
  const hasFired = useRef(false)
  const timerRef = useRef(null)

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  const handleComplete = () => {
    if (hasFired.current) return
    hasFired.current = true
    timerRef.current = setTimeout(onComplete, 800)
  }

  return (
    <motion.div
      className="splash-screen"
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div style={{ textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', perspective: 600 }}>
          {name.split('').map((char, i) => (
            <motion.span
              key={i}
              className="splash-text"
              custom={i}
              variants={letterVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ display: 'inline-block', minWidth: char === ' ' ? '16px' : undefined }}
            >
              {char}
            </motion.span>
          ))}
        </div>
        <motion.p
          style={{
            marginTop: 12,
            fontSize: 16,
            color: 'var(--text-muted)',
            fontWeight: 400,
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.6 }}
          exit={{ opacity: 0 }}
          onAnimationComplete={handleComplete}
        >
          Welcome to my desktop
        </motion.p>

        <motion.div
          style={{
            marginTop: 24,
            width: 200,
            height: 3,
            borderRadius: 2,
            background: 'var(--bg-tertiary)',
            overflow: 'hidden',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            style={{
              height: '100%',
              borderRadius: 2,
              background: 'var(--accent-warm)',
            }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ delay: 1.2, duration: 0.8, ease: 'easeInOut' }}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}
