import { createDocument, chunkText } from './normalize.js';
import type { DataDocument } from '../types/index.js';

/**
 * Raw resume data — edit this object to update resume content.
 * This is the single source of truth for resume-based Q&A.
 */
const RESUME_DATA = {
  name: 'Ashna Jain',
  contact: {
    linkedin: 'linkedin.com/in/ashna-jain',
    phone: '508-471-0784',
    email: 'ashnajain02@gmail.com',
    github: 'github.com/ashnajain02',
  },
  education: {
    school: 'University of Massachusetts Amherst',
    location: 'Amherst, MA',
    degree: 'Bachelor of Science in Computer Science - Commonwealth Honors College',
    gpa: '3.8',
  },
  experience: [
    {
      title: 'Software Engineer I',
      company: 'TJX Companies',
      date: 'Sept 2024 - Present',
      bullets: [
        'Working in a team of engineers to implement a new labor planning and budgeting software across all HomeGoods, Marshalls, and TJ Maxx stores worldwide; heavily involved in design decisions, including for the data inputs, update frequency, report generation, KPIs, and structure of delivery workflows pipelines.',
        'Performed in-depth data analysis in Python and SQL to understand metric shifts between new vs legacy software; identified data discrepancies, documented findings, and implemented the fixes.',
        'Collaborated on technical design doc and mapping integration docs to support migration between systems.',
        'Built modular, multi-step integrations, enabling reuse across future projects.',
        'Built key UI components in React for a new customer service page, helping to reduce click-heavy interactions.',
        'Employed React Router to establish protected routes for login pages and admin dashboards, resulting in enhanced user access control and system security.',
      ],
    },
    {
      title: 'Software Engineer Intern',
      company: 'Elastiq',
      date: 'Dec 2023 - May 2024',
      bullets: [
        'Built a hybrid entity resolution web app with React & Node.js that helped combine and match duplicate customer records, reducing manual review time by 50%.',
        'Trained neural networks, improving F1 scores on models by up to 30% for tasks such as facial recognition and image based search.',
        'Optimized database indexing for 50,000+ images using PostgreSQL and vector search, improving query speeds 3x.',
        'Improved code quality across entire application through solving dozens of technical defects and refactoring.',
      ],
    },
    {
      title: 'Software Engineer Intern',
      company: 'TJX Companies',
      date: 'Jun 2023 - Aug 2023',
      bullets: [
        'Created infrastructure patch automations decreasing server downtime.',
        'Developed Azure data dashboard for compliance, auditing and infrastructure visualization — increasing policy alignment significantly.',
      ],
    },
    {
      title: 'SAT Math Tutor',
      company: 'Freelance',
      date: 'Sept 2018 - Present',
      bullets: [
        'Privately tutored over 25 students in SAT, Algebra I and II, simplifying complex mathematical concepts significantly improving their test scores.',
      ],
    },
  ],
  projects: [
    {
      title: "'Undercover Agents' Newsletter",
      url: 'https://undercover-agents.beehiiv.com/',
      date: 'May 2025 - Present',
      description: 'Publish a newsletter called "Undercover AI: Agents You Didn\'t Know You Needed" to help highlight innovative AI. Analyzed subscriber funnel from acquisition to engagement, identifying drop-off points and iterating on content and design to improve retention. Achieved consistent audience growth (~3% weekly; ~16% per article release).',
    },
    {
      title: 'Eternal Entries',
      url: 'https://eternal-entries.vercel.app/',
      date: 'May 2025 - Present',
      description: 'Built a digital diary website inspired by my own habit of journaling and wanting an easy way to revisit past entries & link music to entries. Developed web and mobile frontend and created supporting RESTful API endpoints on a Node.js backend.',
    },
  ],
  awards: [
    {
      title: "Won 2nd Place SF Tech Week Hackathon - $20,000 Prize ('Shift Up')",
      date: 'Oct 2025',
      description: 'Part of a team of 3 that pitched a solution to help displaced workers combat job loss in the world of AI. Awarded $20,000 prize. Used intelligent prompting to develop a functional full-stack prototype with minimal errors.',
    },
    {
      title: "Won 1st Place in JIA Pitch Competition ('Parivartan')",
      date: 'April 2024 - Dec 2024',
      description: 'Advanced through 4 competition rounds, delivering the winning pitch to 900 convention attendees for a clothing pop-up that featured swap, stitch, and repurpose stations to promote sustainable fashion. Conducted research with 200+ participants, and performed data analysis via Python to drive product decisions.',
    },
  ],
  skills: {
    coursework: [
      'Data Structures and Algorithms', 'Networking', 'Search Engines',
      'Databases', 'Artificial Intelligence', 'Machine Learning',
      'Secure Distributed Systems',
    ],
    languages: [
      'Python', 'Java', 'JavaScript', 'SQL', 'TypeScript',
    ],
    frameworks: [
      'Node.js', 'Express', 'React', 'Django', 'Svelte',
    ],
    databases: [
      'PostgreSQL', 'MongoDB', 'Supabase', 'Neon',
    ],
    tools: [
      'GCP', 'Azure', 'Git', 'Docker', 'Claude Code', 'pgvector',
    ],
  },
  personalFacts: [
    'Has been vegan for 15 years.',
    'There is a picture of her on the moon (via a lunar archive project).',
    'Lives in San Francisco.',
    'Believes the best products come from empathy + engineering.',
    'Deep into using AI tools like Claude Code to build faster and smarter.',
  ],
};

/**
 * Converts resume data into normalized, chunk-friendly DataDocuments
 * ready for embedding and vector search.
 */
export function getResumeDocuments(): DataDocument[] {
  const docs: DataDocument[] = [];

  // Profile overview
  docs.push(createDocument('resume', [
    `${RESUME_DATA.name} is a software engineer.`,
    `Contact: ${RESUME_DATA.contact.email}, ${RESUME_DATA.contact.phone}.`,
    `LinkedIn: ${RESUME_DATA.contact.linkedin}. GitHub: ${RESUME_DATA.contact.github}.`,
    `Education: ${RESUME_DATA.education.degree} at ${RESUME_DATA.education.school} (GPA: ${RESUME_DATA.education.gpa}).`,
  ].join(' '), {
    category: 'profile',
    title: 'Profile Overview',
    tags: ['contact', 'education', 'overview'],
  }));

  // Each experience entry
  for (const exp of RESUME_DATA.experience) {
    const text = [
      `${exp.title} at ${exp.company} (${exp.date}).`,
      ...exp.bullets,
    ].join(' ');

    const chunks = chunkText(text);
    for (const chunk of chunks) {
      docs.push(createDocument('resume', chunk, {
        category: 'experience',
        title: `${exp.title} - ${exp.company}`,
        tags: ['experience', 'work', exp.company.toLowerCase()],
        timestamp: exp.date,
      }));
    }
  }

  // Projects
  for (const proj of RESUME_DATA.projects) {
    docs.push(createDocument('resume', [
      `Project: ${proj.title} (${proj.date}).`,
      proj.description,
      proj.url ? `URL: ${proj.url}` : '',
    ].join(' '), {
      category: 'project',
      title: proj.title,
      tags: ['project'],
      url: proj.url,
      timestamp: proj.date,
    }));
  }

  // Awards
  for (const award of RESUME_DATA.awards) {
    docs.push(createDocument('resume', [
      `Award: ${award.title} (${award.date}).`,
      award.description,
    ].join(' '), {
      category: 'award',
      title: award.title,
      tags: ['award', 'leadership'],
      timestamp: award.date,
    }));
  }

  // Skills (single document)
  docs.push(createDocument('resume', [
    `Technical skills:`,
    `Languages: ${RESUME_DATA.skills.languages.join(', ')}.`,
    `Frameworks: ${RESUME_DATA.skills.frameworks.join(', ')}.`,
    `Databases: ${RESUME_DATA.skills.databases.join(', ')}.`,
    `Tools: ${RESUME_DATA.skills.tools.join(', ')}.`,
    `Coursework: ${RESUME_DATA.skills.coursework.join(', ')}.`,
  ].join(' '), {
    category: 'skills',
    title: 'Technical Skills',
    tags: ['skills', 'technical'],
  }));

  // Personal facts
  docs.push(createDocument('resume', [
    `Personal facts about ${RESUME_DATA.name}:`,
    ...RESUME_DATA.personalFacts,
  ].join(' '), {
    category: 'personal',
    title: 'Personal Facts',
    tags: ['personal', 'fun facts'],
  }));

  return docs;
}

/** Returns the raw resume data for direct access */
export function getResumeRaw() {
  return RESUME_DATA;
}
