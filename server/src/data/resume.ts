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
        'Designed and implemented multi-step data integration pipelines across internal and vendor systems, handling inconsistent and incomplete data formats.',
        'Diagnosed and resolved data discrepancies between legacy and new systems through large-scale Python/SQL analysis, improving data reliability.',
        'Collaborated on system architecture and integration design, defining data contracts, transformation logic, and workflow orchestration.',
        'Built frontend components in React and implemented secure routing and access control mechanisms for internal tools.',
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
      title: 'About Ashna (Portfolio + AI Agent)',
      url: 'https://about-ashna-jain.vercel.app/',
      date: 'March 2026 - Present',
      description: 'Built a production-grade agentic AI system integrating a multi-source RAG pipeline using vector embeddings (pgvector) over structured and unstructured personal data. Designed a query planning and routing layer using GPT-4o-mini to dynamically select between semantic retrieval, tool execution, and multi-step reasoning. Implemented a tool orchestration framework with 7+ tools (GitHub, Beehiiv, Echo API, semantic search), enabling cross-source reasoning and real-time data integration. Optimized system performance through context window management, caching, and structured outputs, improving response latency and reducing token usage.',
    },
    {
      title: 'Echo',
      url: 'https://echo-entries.com/',
      date: 'May 2025 - Present',
      description: 'Built Echo, a context-aware journaling platform that enriches entries with stunning UI for weather and song data, creating a more immersive and memory-linked journaling experience. Developed web and mobile frontend and created supporting RESTful API endpoints on a Node.js backend.',
    },
  ],
  awards: [
    {
      title: "Won 2nd Place SF Tech Week Hackathon - $20,000 Prize ('Shift Up')",
      date: 'Oct 2025',
      description: 'Part of a team of 3 that pitched a solution to help displaced workers combat job loss in the world of AI. Awarded $20,000 prize. Used intelligent prompting to develop a functional full-stack prototype with minimal errors.',
    },
  ],
  skills: {
    coursework: [
      'Data Structures and Algorithms', 'Networking', 'Search Engines',
      'Databases', 'Artificial Intelligence', 'Machine Learning',
      'Secure Distributed Systems',
    ],
    technical: [
      'Python', 'Java', 'JavaScript', 'SQL', 'TypeScript',
      'Node.js', 'Express', 'React', 'PostgreSQL', 'MongoDB',
      'Supabase', 'GCP', 'Azure', 'pgvector', 'Neon',
      'LLM Application Development', 'RAG',
      'Tool Calling & Agent Orchestration', 'Embeddings',
      'Semantic Search', 'Context & Memory Systems',
    ],
  },
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

  // Education
  docs.push(createDocument('resume', [
    `Education: ${RESUME_DATA.education.degree} at ${RESUME_DATA.education.school}, ${RESUME_DATA.education.location}.`,
    `GPA: ${RESUME_DATA.education.gpa}.`,
    `Ashna studied Computer Science at UMass Amherst in the Commonwealth Honors College.`,
  ].join(' '), {
    category: 'education',
    title: 'Education',
    tags: ['education', 'university', 'school', 'degree', 'computer science'],
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
    `Technical skills: ${RESUME_DATA.skills.technical.join(', ')}.`,
    `Coursework: ${RESUME_DATA.skills.coursework.join(', ')}.`,
  ].join(' '), {
    category: 'skills',
    title: 'Technical Skills',
    tags: ['skills', 'technical'],
  }));

  return docs;
}

