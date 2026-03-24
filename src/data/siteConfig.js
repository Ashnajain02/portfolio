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
        'Designed and implemented multi-step data integration pipelines across internal and vendor systems, handling inconsistent and incomplete data formats',
        'Diagnosed and resolved data discrepancies between legacy and new systems through large-scale Python/SQL analysis, improving data reliability',
        'Collaborated on system architecture and integration design, defining data contracts, transformation logic, and workflow orchestration',
        'Built frontend components in React and implemented secure routing and access control mechanisms for internal tools',
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
      title: 'About Ashna (Portfolio + AI Agent)',
      url: 'https://about-ashna-jain.vercel.app/',
      date: 'March 2026 - Present',
      bullets: [
        'Built a production-grade agentic AI system with multi-source RAG pipeline using pgvector',
        'Designed query planning layer using GPT-4o-mini for dynamic tool selection',
        'Implemented tool orchestration with 7+ tools (GitHub, Beehiiv, Echo API, semantic search)',
        'Optimized performance through context window management, caching, and structured outputs',
      ],
    },
    {
      title: 'Echo',
      url: 'https://echo-entries.com/',
      date: 'May 2025 - Present',
      bullets: [
        'Built a context-aware journaling platform enriching entries with weather and song data',
        'Developed web and mobile frontend and RESTful API endpoints on a Node.js backend',
      ],
    },
  ],
  awards: [
    {
      title: 'Won 2nd Place SF Tech Week Hackathon',
      subtitle: "$20,000 Prize ('Shift Up')",
      date: 'Oct 2025',
    },
  ],
  skills: 'Python, Java, JavaScript, SQL, TypeScript, Node.js, Express, React, PostgreSQL, MongoDB, Supabase, GCP, Azure, pgvector, Neon, LLM Application Development, RAG, Tool Calling & Agent Orchestration, Embeddings, Semantic Search, Context & Memory Systems',
}
