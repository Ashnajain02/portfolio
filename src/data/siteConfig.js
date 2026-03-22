// ============================================================
// SITE CONFIG — Edit this file to update everything across the site.
// Name, links, bio, resume, projects, sticky notes — all in one place.
// ============================================================

export const PROFILE = {
  name: 'Ashna Jain',
  title: 'Software Engineer',
  email: 'ashnajain02@gmail.com',
  phone: '508-471-0784',
  github: 'https://github.com/ashnajain02',
  linkedin: 'https://www.linkedin.com/in/ashna-jain/',
  // This file should be placed in /public/resume.pdf for the download button
  resumeDownloadFile: '/resume.pdf',
}

export const TERMINAL_BIO = [
  { prompt: true, text: 'whoami' },
  { prompt: false, text: `${PROFILE.name} — ${PROFILE.title}` },
  { prompt: true, text: 'cat about.txt' },
  { prompt: false, text: 'I design and build full-stack apps' },
   { prompt: true, text: 'cat todo.txt' },
  { prompt: false, text: 'Click on the folder to explore my work!' },
  { prompt: true, text: 'echo "Welcome to my desktop!"' },
  { prompt: false, text: 'Welcome to my desktop!' },
]

export const DOCK_LINKS = {
  github: PROFILE.github,
  linkedin: PROFILE.linkedin,
  email: `mailto:${PROFILE.email}`,
}

// ============================================================
// BROWSER WIDGETS — Sites that open in a fake browser on the desktop
// Each needs: id, name, url, color (for folder icon)
// ============================================================
export const BROWSER_PROJECTS = [
  {
    id: 'echo',
    name: 'Echo',
    url: 'https://echo-entries.com',
    color: 'sage',
    position: { x: 40, y: 50 },
  },
  {
    id: 'twix',
    name: 'Twix',
    url: 'https://twix-chat.vercel.app',
    color: 'terra',
    position: { x: 40, y: 160 },
  },
  {
    id: 'undercover-agents',
    name: 'Undercover Agents',
    url: 'https://undercover-agents.beehiiv.com/',
    color: 'warm',
    position: { x: 40, y: 270 },
  },
]

// ============================================================
// PHOTO GALLERY — Add/remove photos from /public/photos/
// ============================================================
export const PHOTOS = [
  { src: '/photos/1.jpg', label: 'Portrait' },
  { src: '/photos/2.jpg', label: 'City days' },
  { src: '/photos/3.jpg', label: 'The crew' },
  { src: '/photos/4.jpg', label: 'On stage' },
  { src: '/photos/5.jpg', label: 'Presenting' },
]

export const PHOTOS_FOLDER = {
  id: 'photos',
  name: 'Photos',
  color: 'rose',
  position: { x: 140, y: 160 },
}

// ============================================================
// STICKY NOTES — Fun facts on the desktop
// ============================================================
export const STICKY_NOTES = [
  {
    id: 'note-1',
    title: 'Did you know?',
    content: "There's a picture of me on the moon",
    color: 'yellow',
    style: { right: 30, top: 50, rotate: 3 },
    delay: 3.2,
  },
  {
    id: 'note-2',
    title: '15 years & counting',
    content: "I've been vegan for 15 years. Yes, I get enough protein.",
    color: 'pink',
    style: { right: 30, top: 210, rotate: -2 },
    delay: 3.4,
  },
  {
    id: 'note-3',
    title: 'Try this!',
    content: 'Click on Undercover Agents and see if you can solve some cool AI riddles.',
    color: 'green',
    style: { right: 210, top: 50, rotate: 1 },
    delay: 3.6,
  },
]

// ============================================================
// RESUME — All resume content in one place
// ============================================================
export const RESUME = {
  education: {
    school: 'University of Massachusetts Amherst',
    degree: 'Bachelor of Science in Computer Science - Commonwealth Honors College (GPA: 3.8)',
    location: 'Amherst, MA',
  },
  experience: [
    {
      title: 'Software Engineer I',
      company: 'TJX Companies',
      date: 'Sept 2024 - Present',
      bullets: [
        'Working in a team of engineers to implement a new labor planning and budgeting software across all HomeGoods, Marshalls, and TJ Maxx stores worldwide',
        'Performed in-depth data analysis in Python and SQL to understand metric shifts between new vs legacy software',
        'Built key UI components in React for a new customer service page, reducing click-heavy interactions',
        'Employed React Router to establish protected routes for login pages and admin dashboards',
      ],
    },
    {
      title: 'Software Engineer Intern',
      company: 'Elastiq',
      date: 'Dec 2023 - May 2024',
      bullets: [
        'Built a hybrid entity resolution web app with React & Node.js, reducing manual review time by 50%',
        'Trained neural networks, improving F1 scores on models by up to 30%',
        'Optimized database indexing for 50,000+ images using PostgreSQL and vector search, improving query speeds 3x',
      ],
    },
    {
      title: 'Software Engineer Intern',
      company: 'TJX Companies',
      date: 'Jun 2023 - Aug 2023',
      bullets: [
        'Created infrastructure patch automations decreasing server downtime',
        'Developed Azure data dashboard for compliance, auditing and infrastructure visualization',
      ],
    },
  ],
  projects: [
    {
      title: "'Undercover Agents' Newsletter",
      date: 'May 2025 - Present',
      bullets: [
        'Publish a newsletter highlighting innovative AI agents, achieving ~3% weekly growth and ~16% per article release',
      ],
    },
    {
      title: 'Eternal Entries',
      date: 'May 2025 - Present',
      bullets: [
        'Built a digital diary website with web and mobile frontend and RESTful API on Node.js backend',
      ],
    },
  ],
  awards: [
    {
      title: 'Won 2nd Place SF Tech Week Hackathon',
      subtitle: "$20,000 Prize ('Shift Up')",
      date: 'Oct 2025',
    },
    {
      title: 'Won 1st Place in JIA Pitch Competition',
      subtitle: "('Parivartan')",
      date: 'April - Dec 2024',
    },
  ],
  skills: 'Python, Java, JavaScript, SQL, TypeScript, Node.js, Express, React, PostgreSQL, MongoDB, GCP, Azure, Docker, PGvector, S3, Claude Code',
}
