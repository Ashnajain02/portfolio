import { motion, AnimatePresence, useDragControls } from 'framer-motion'
import { PROFILE, RESUME } from '../data/siteConfig'

export default function ResumeViewer({ isOpen, onClose, style, zIndex, onFocus }) {
  const dragControls = useDragControls()

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="resume-viewer"
          style={{ ...style, zIndex }}
          drag
          dragMomentum={false}
          dragListener={false}
          dragControls={dragControls}
          onPointerDown={onFocus}
          initial={{ opacity: 0, scale: 0.8, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 30 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
        >
          <div
            className="resume-viewer-titlebar"
            onPointerDown={(e) => dragControls.start(e)}
            style={{ cursor: 'grab', touchAction: 'none' }}
          >
            <div className="window-dots">
              <div
                className="window-dot window-dot--close"
                onClick={onClose}
              />
            </div>
            <span className="window-title">Resume.pdf</span>
            <a
              href={PROFILE.resumeDownloadFile}
              download={`${PROFILE.name.replace(/\s+/g, '_')}_Resume.pdf`}
              className="resume-download-btn"
              onClick={(e) => e.stopPropagation()}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download
            </a>
          </div>
          <div className="resume-viewer-body">
            <div className="resume-pdf-page">
              <div className="resume-pdf-header">
                <h1>{PROFILE.name}</h1>
                <div className="resume-pdf-contact">
                  <a href={PROFILE.linkedin} target="_blank" rel="noopener noreferrer">
                    {PROFILE.linkedin.replace('https://www.', '').replace('https://', '')}
                  </a>
                  <span>{PROFILE.phone}</span>
                  <a href={`mailto:${PROFILE.email}`}>{PROFILE.email}</a>
                  <a href={PROFILE.github} target="_blank" rel="noopener noreferrer">
                    {PROFILE.github.replace('https://', '')}
                  </a>
                </div>
              </div>

              <div className="resume-pdf-section">
                <div className="resume-pdf-section-title">Education</div>
                <div className="resume-pdf-row">
                  <div>
                    <strong>{RESUME.education.school}</strong>
                    <div className="resume-pdf-subtitle">{RESUME.education.degree}</div>
                  </div>
                  <div className="resume-pdf-date">{RESUME.education.location}</div>
                </div>
              </div>

              <div className="resume-pdf-section">
                <div className="resume-pdf-section-title">Experience</div>
                {RESUME.experience.map((exp, i) => (
                  <div className="resume-pdf-entry" key={i}>
                    <div className="resume-pdf-row">
                      <div><strong>{exp.title}</strong> - <em>{exp.company}</em></div>
                      <div className="resume-pdf-date">{exp.date}</div>
                    </div>
                    <ul>
                      {exp.bullets.map((b, j) => <li key={j}>{b}</li>)}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="resume-pdf-section">
                <div className="resume-pdf-section-title">Projects</div>
                {RESUME.projects.map((proj, i) => (
                  <div className="resume-pdf-entry" key={i}>
                    <div className="resume-pdf-row">
                      <div>
                        <strong>{proj.title}</strong>
                        {proj.url && <> - <a href={proj.url} target="_blank" rel="noopener noreferrer">{proj.url}</a></>}
                      </div>
                      <div className="resume-pdf-date">{proj.date}</div>
                    </div>
                    <ul>
                      {proj.bullets.map((b, j) => <li key={j}>{b}</li>)}
                    </ul>
                  </div>
                ))}
              </div>

              <div className="resume-pdf-section">
                <div className="resume-pdf-section-title">Leadership & Awards</div>
                {RESUME.awards.map((award, i) => (
                  <div className="resume-pdf-entry" key={i}>
                    <div className="resume-pdf-row">
                      <div><strong>{award.title}</strong> {award.subtitle && `- ${award.subtitle}`}</div>
                      <div className="resume-pdf-date">{award.date}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="resume-pdf-section">
                <div className="resume-pdf-section-title">Coursework & Skills</div>
                <div className="resume-pdf-skills">
                  <p>{RESUME.skills}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
