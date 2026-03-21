import { motion, AnimatePresence, useDragControls } from 'framer-motion'

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
                data-clickable
              />
              <div className="window-dot window-dot--minimize" />
              <div className="window-dot window-dot--maximize" />
            </div>
            <span className="window-title">Resume.pdf</span>
            <a
              href="/resume.pdf"
              download="Ashna_Jain_Resume.pdf"
              className="resume-download-btn"
              data-clickable
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
                <h1>Ashna Jain</h1>
                <div className="resume-pdf-contact">
                  <a href="https://linkedin.com/in/ashna-jain" target="_blank" rel="noopener noreferrer">linkedin.com/in/ashna-jain</a>
                  <span>508-471-0784</span>
                  <a href="mailto:ashnajain02@gmail.com">ashnajain02@gmail.com</a>
                  <a href="https://github.com/ashnajain02" target="_blank" rel="noopener noreferrer">github.com/ashnajain02</a>
                </div>
              </div>

              <div className="resume-pdf-section">
                <div className="resume-pdf-section-title">Education</div>
                <div className="resume-pdf-row">
                  <div>
                    <strong>University of Massachusetts Amherst</strong>
                    <div className="resume-pdf-subtitle">Bachelor of Science in Computer Science - Commonwealth Honors College (GPA: 3.8)</div>
                  </div>
                  <div className="resume-pdf-date">Amherst, MA</div>
                </div>
              </div>

              <div className="resume-pdf-section">
                <div className="resume-pdf-section-title">Experience</div>
                <div className="resume-pdf-entry">
                  <div className="resume-pdf-row">
                    <div><strong>Software Engineer I</strong> - <em>TJX Companies</em></div>
                    <div className="resume-pdf-date">Sept 2024 - Present</div>
                  </div>
                  <ul>
                    <li>Working in a team of engineers to implement a new labor planning and budgeting software across all HomeGoods, Marshalls, and TJ Maxx stores worldwide</li>
                    <li>Performed in-depth data analysis in Python and SQL to understand metric shifts between new vs legacy software</li>
                    <li>Built key UI components in React for a new customer service page, reducing click-heavy interactions</li>
                    <li>Employed React Router to establish protected routes for login pages and admin dashboards</li>
                  </ul>
                </div>
                <div className="resume-pdf-entry">
                  <div className="resume-pdf-row">
                    <div><strong>Software Engineer Intern</strong> - <em>Elastiq</em></div>
                    <div className="resume-pdf-date">Dec 2023 - May 2024</div>
                  </div>
                  <ul>
                    <li>Built a hybrid entity resolution web app with React & Node.js, reducing manual review time by 50%</li>
                    <li>Trained neural networks, improving F1 scores on models by up to 30%</li>
                    <li>Optimized database indexing for 50,000+ images using PostgreSQL and vector search, improving query speeds 3x</li>
                  </ul>
                </div>
                <div className="resume-pdf-entry">
                  <div className="resume-pdf-row">
                    <div><strong>Software Engineer Intern</strong> - <em>TJX Companies</em></div>
                    <div className="resume-pdf-date">Jun 2023 - Aug 2023</div>
                  </div>
                  <ul>
                    <li>Created infrastructure patch automations decreasing server downtime</li>
                    <li>Developed Azure data dashboard for compliance, auditing and infrastructure visualization</li>
                  </ul>
                </div>
              </div>

              <div className="resume-pdf-section">
                <div className="resume-pdf-section-title">Projects</div>
                <div className="resume-pdf-entry">
                  <div className="resume-pdf-row">
                    <div><strong>'Undercover Agents' Newsletter</strong></div>
                    <div className="resume-pdf-date">May 2025 - Present</div>
                  </div>
                  <ul>
                    <li>Publish a newsletter highlighting innovative AI agents, achieving ~3% weekly growth and ~16% per article release</li>
                  </ul>
                </div>
                <div className="resume-pdf-entry">
                  <div className="resume-pdf-row">
                    <div><strong>Eternal Entries</strong></div>
                    <div className="resume-pdf-date">May 2025 - Present</div>
                  </div>
                  <ul>
                    <li>Built a digital diary website with web and mobile frontend and RESTful API on Node.js backend</li>
                  </ul>
                </div>
              </div>

              <div className="resume-pdf-section">
                <div className="resume-pdf-section-title">Leadership & Awards</div>
                <div className="resume-pdf-entry">
                  <div className="resume-pdf-row">
                    <div><strong>Won 2nd Place SF Tech Week Hackathon</strong> - $20,000 Prize ('Shift Up')</div>
                    <div className="resume-pdf-date">Oct 2025</div>
                  </div>
                </div>
                <div className="resume-pdf-entry">
                  <div className="resume-pdf-row">
                    <div><strong>Won 1st Place in JIA Pitch Competition</strong> ('Parivartan')</div>
                    <div className="resume-pdf-date">April - Dec 2024</div>
                  </div>
                </div>
              </div>

              <div className="resume-pdf-section">
                <div className="resume-pdf-section-title">Coursework & Skills</div>
                <div className="resume-pdf-skills">
                  <p>Python, Java, JavaScript, SQL, TypeScript, Node.js, Express, React, Django, Svelte, PostgreSQL, MongoDB, Supabase, GCP, Azure, Git, Docker</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
