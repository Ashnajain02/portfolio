import { createDocument, chunkText } from './normalize.js';
import type { DataDocument } from '../types/index.js';

/**
 * Personal knowledge base — things the chatbot should know about Ashna
 * that aren't captured in the resume, newsletter, or other APIs.
 *
 * Edit this array to add/update personal context.
 * Each entry gets embedded into pgvector for semantic retrieval.
 */
const KNOWLEDGE_ENTRIES = [
  {
    title: 'Why I build products',
    content: `I build products because I genuinely believe technology should solve real problems for real people. I'm not interested in building things that are technically impressive but useless. Every project I work on starts with a problem I've personally experienced or seen others struggle with. Eternal Entries came from my own journaling habit — I wanted a way to link music and weather to my entries. Twix Chat came from frustration with how linear chat apps are when conversations naturally branch.`,
    tags: ['philosophy', 'motivation', 'building'],
  },
  {
    title: 'My approach to AI',
    content: `I'm deep into using AI tools to build faster and smarter. I use Claude Code extensively for development, and I believe the best engineers aren't the ones who avoid AI — they're the ones who know how to leverage it effectively. I write my Undercover Agents newsletter specifically to highlight AI tools and agents that are genuinely useful but under the radar. I think the future of software engineering is hybrid: human creativity and judgment combined with AI speed and breadth.`,
    tags: ['ai', 'philosophy', 'tools'],
  },
  {
    title: 'Hackathon experience — Shift Up',
    content: `At the SF Tech Week Hackathon in October 2025, my team of 3 built "Shift Up" — a platform to help workers displaced by AI find new career paths. We won 2nd place and a $20,000 prize. The key was using intelligent prompting to develop a full-stack prototype in under 24 hours with minimal bugs. I handled the frontend and product design, while my teammates focused on the AI matching engine and backend. The judges loved that we addressed a real, timely problem — AI displacement — with a practical solution rather than just another chatbot.`,
    tags: ['hackathon', 'shift up', 'competition', 'ai'],
  },
  {
    title: 'Parivartan pitch competition',
    content: `I won 1st place at the JIA Pitch Competition with "Parivartan" — a clothing pop-up concept featuring swap, stitch, and repurpose stations to promote sustainable fashion. I advanced through 4 rounds and delivered the final pitch to 900 attendees. What made this special was the research: I surveyed 200+ participants and used Python data analysis to drive every product decision. I learned that great pitches aren't about flashy slides — they're about deeply understanding your audience and backing every claim with data.`,
    tags: ['pitch', 'parivartan', 'sustainability', 'competition'],
  },
  {
    title: 'Personal facts and personality',
    content: `I've been vegan for 15 years — yes, I get enough protein. There's a picture of me on the moon through a lunar archive project. I live in the Bay Area and love the tech energy here. I journal consistently (current streak tracked on Eternal Entries), usually late at night around 3 AM. I listen to a lot of Arijit Singh while journaling. I believe the best products come from empathy + engineering. I'm always open to collaborating on cool projects.`,
    tags: ['personal', 'fun facts', 'vegan', 'hobbies'],
  },
  {
    title: 'Technical philosophy',
    content: `I believe in writing clean, modular code that other engineers can actually understand. I favor TypeScript for its type safety, React for its component model, and Node.js for full-stack JavaScript consistency. I've worked with Python extensively for data analysis and ML tasks. I'm comfortable across the full stack — from database design with PostgreSQL and pgvector to frontend animations with Framer Motion. I think the best technical decisions are the simplest ones that solve the problem.`,
    tags: ['technical', 'philosophy', 'stack'],
  },
  {
    title: 'Career goals',
    content: `I want to work at the intersection of AI and product engineering. I'm passionate about building AI-powered products that are genuinely useful — not just wrappers around language models, but systems with real retrieval, reasoning, and multi-source intelligence. I'm particularly interested in agentic AI systems, RAG architectures, and making AI tools accessible to non-technical users. I'm looking for roles where I can own features end-to-end and work with teams that ship fast.`,
    tags: ['career', 'goals', 'ai', 'future'],
  },
  {
    title: 'Work experience insights — TJX',
    content: `At TJX, I'm not just writing code — I'm deeply involved in design decisions for a labor planning system that affects every HomeGoods, Marshalls, and TJ Maxx store worldwide. What I love about this role is the scale: when I ship something, it impacts thousands of stores. I've done everything from Python data analysis to find why metrics differ between our new and legacy systems, to building React components for customer service pages. The biggest lesson: enterprise software is about understanding the business problem as deeply as the technical one.`,
    tags: ['tjx', 'work', 'enterprise', 'experience'],
  },
  {
    title: 'Work experience insights — Elastiq',
    content: `My internship at Elastiq was formative. I built an entity resolution system — basically, figuring out when two customer records are the same person. This involved training neural networks, optimizing vector search over 50,000+ images with pgvector, and building a React frontend. I reduced manual review time by 50%. This is where I first fell in love with vector databases and similarity search, which directly led to me building RAG systems later.`,
    tags: ['elastiq', 'work', 'ml', 'vector search', 'experience'],
  },
  {
    title: 'The Undercover Agents newsletter',
    content: `I started "Undercover AI: Agents You Didn't Know You Needed" because I noticed a gap — there are tons of AI tools being built, but most people only know about ChatGPT and Midjourney. My newsletter digs into the lesser-known but genuinely useful AI agents. I analyze subscriber funnels, iterate on content based on engagement data, and have achieved consistent ~3% weekly growth and ~16% growth per article release. Writing the newsletter has made me a better engineer because I have to deeply understand each tool I cover.`,
    tags: ['newsletter', 'undercover agents', 'writing', 'ai'],
  },
];

/**
 * Converts knowledge base entries into normalized, chunk-ready DataDocuments.
 */
export function getKnowledgeDocuments(): DataDocument[] {
  const docs: DataDocument[] = [];

  for (const entry of KNOWLEDGE_ENTRIES) {
    const chunks = chunkText(entry.content, 500, 80);

    for (const chunk of chunks) {
      const chunkContent = `${entry.title}: ${chunk}`;
      docs.push(createDocument('general', chunkContent, {
        category: 'knowledge',
        title: entry.title,
        tags: ['knowledge', ...entry.tags],
      }));
    }
  }

  return docs;
}
