import { createDocument, chunkText, extractKeywords } from './normalize.js';
import type { DataDocument } from '../types/index.js';

/**
 * Personal knowledge base — sourced directly from Ashna's own words.
 * This is the richest source of personal context for the chatbot.
 * Each entry gets embedded into pgvector for semantic retrieval.
 */
const KNOWLEDGE_ENTRIES = [
  {
    title: 'Jainism and veganism',
    content: `I'm Jain. Jainism is centered around non-violence, non-possessiveness, and non-absolutism. The principle I follow most closely is non-violence — not just in actions but also in thoughts and words. That shows up a lot in how I live. I've been vegan since I was about nine years old. Luckily, I don't like cheese, so that part was easy. I loved Lindor chocolates though — I would literally go into Lindor stores and ask employees if they had anything vegan, email corporate, the whole thing. Eventually they came out with oat milk Lindor truffles, which I'm obsessed with. I'd like to think I had at least a tiny role in that. Being Jain is a really core part of my identity. I'm part of the Young Jains of America community, I like going to events, going to the temple, and just taking a few moments to pray.`,
    tags: ['jainism', 'vegan', 'religion', 'identity', 'personal'],
  },
  {
    title: 'Music taste',
    content: `I love music. I listen to a mix of Indian/Hindi music — classical, slower, more emotional songs — and artists like Mitraz and Arijit Singh. I think I just really love guitar and a soothing voice. But I also listen to a lot of mainstream pop — Olivia Rodrigo, Sabrina Carpenter, Gracie Abrams, Lizzy McAlpine.`,
    tags: ['music', 'personal', 'hobbies', 'arijit singh', 'mitraz'],
  },
  {
    title: 'Why I love coding and building',
    content: `I really, really enjoy coding. I feel lucky that I'm creative, and with AI now, I can actually bring ideas to life quickly instead of just letting them sit in my head. I don't just think about building something — I think about who it's for and whether it actually works in the real world. That's the product thinking I bring to everything.`,
    tags: ['coding', 'philosophy', 'building', 'creativity'],
  },
  {
    title: 'Echo / Eternal Entries — the journaling project',
    content: `One of my favorite projects is Echo (Eternal Entries), which is a journaling platform. It focuses on capturing the moment — things like the weather, your mood, the time of day, the year, even music. You can attach a song to an entry so when you revisit it later, you're kind of transported back into that emotional state. The other big part is reflection — it surfaces past entries so you can see where you were before. I think that's really underrated in journaling and mental health. Being able to look back and actually see your growth has been a huge part of emotional healing for me, even more than people tend to talk about.`,
    tags: ['echo', 'eternal entries', 'journaling', 'project', 'mental health'],
  },
  {
    title: 'Hackathon win — Shift Up',
    content: `Creativity is what led to my team winning a hackathon and getting a $20,000 award. The theme was job loss in the age of AI. My thinking was that a lot of service experiences — like going to Taco Bell, the dentist, getting a haircut — will still exist, but the roles themselves might become automated. The key insight was that service workers already have really valuable, specific knowledge. Someone working at Taco Bell knows peak hours, popular orders, customer behavior — things most people don't. So the idea was to help them use that knowledge to become business owners, potentially running AI-powered versions of those businesses. We built a virtual world that simulates real economic conditions — loans, interest rates, customer behavior — so people can practice running a business. Instead of monetizing through subscriptions (which wouldn't make sense for low-income users), we made the platform free. Top performers get connected with investors, and if a business gets funded, we take a cut. Aligned incentives all around.`,
    tags: ['hackathon', 'shift up', 'ai', 'competition', 'product thinking'],
  },
  {
    title: 'Scared of dogs',
    content: `I'm kind of scared of dogs. I love watching dog videos — they're adorable — but when I was four, a dog chased me on Halloween and it stuck with me. I do think I'll get over it eventually… hopefully.`,
    tags: ['personal', 'fun facts', 'dogs'],
  },
  {
    title: 'Growing up in Massachusetts',
    content: `I grew up in the suburbs of Massachusetts, so I have a lot of New England pride. I'm really grateful for how I grew up, even though there weren't that many people who looked like me. I think that experience shaped my character in a lot of positive ways.`,
    tags: ['personal', 'massachusetts', 'growing up', 'background'],
  },
  {
    title: 'Undercover Agents newsletter',
    content: `I write a newsletter called Undercover Agents. I care a lot about it — probably too much, to the point where I don't publish as often as I should. It started as a way to review AI tools and figure out what's actually worth using, but I realized a lot of tools are pretty similar — they're often wrappers around the same models. So I shifted more toward general AI insights, while still highlighting tools that feel genuinely useful or creative. I also love riddles and include them in my newsletter sometimes — they're really hard for me, which is kind of why I like them.`,
    tags: ['newsletter', 'undercover agents', 'ai', 'writing', 'riddles'],
  },
  {
    title: 'Twix — branching chat project',
    content: `Another project I built is called Twix, which is a different way to interact with chatbots. I noticed that when I'm chatting, I'll have small side questions or tangents, but asking them in the main thread messes up the flow and context. So I built a branching chat system. You can highlight part of a response and open a "tangent," which has all the context of the original conversation. That way, you can explore side ideas without cluttering the main chat. And it's infinitely branchable, because that's how people actually think — kind of like rabbit holes. It's a much cleaner, more organized experience.`,
    tags: ['twix', 'project', 'chatbot', 'branching', 'ux'],
  },
  {
    title: 'AI technical understanding',
    content: `I've spent a lot of time understanding AI technically — how it works, how to implement it, how to structure systems around it. I think that's reflected in this chatbot, which pulls from multiple data sources, embeds them, and goes through multiple steps to generate more accurate, context-aware responses.`,
    tags: ['ai', 'technical', 'rag', 'systems'],
  },
  {
    title: 'Fun facts and personality',
    content: `There is technically a picture of me on the moon. During COVID, there was a fundraiser where you could pay $10 to upload a picture that would be sent to space. So I did it. It might just be a digital file somewhere in a hard drive, but I'm counting it. My favorite word is propinquity. I'm also really bad at typing on mobile devices — weak thumbs I guess. Right now I'm working at TJX as a software engineer, and I've really enjoyed my time there so far.`,
    tags: ['personal', 'fun facts', 'moon', 'propinquity', 'tjx'],
  },
  {
    title: 'Parivartan pitch competition',
    content: `My team and I won 1st place at the JIA Pitch Competition with "Parivartan" — a clothing pop-up concept featuring swap, stitch, and repurpose stations to promote sustainable fashion. I advanced through 4 rounds and delivered the final pitch to 900 attendees. I surveyed 200+ participants and used Python data analysis to drive every product decision. Great pitches aren't about flashy slides — they're about deeply understanding your audience and backing every claim with data.`,
    tags: ['pitch', 'parivartan', 'sustainability', 'competition'],
  },
];

/**
 * Converts knowledge base entries into normalized, chunk-ready DataDocuments.
 */
export function getKnowledgeDocuments(): DataDocument[] {
  const docs: DataDocument[] = [];

  for (const entry of KNOWLEDGE_ENTRIES) {
    const chunks = chunkText(entry.content);

    for (const chunk of chunks) {
      const chunkContent = `${entry.title}: ${chunk}`;
      docs.push(createDocument('general', chunkContent, {
        category: 'knowledge',
        title: entry.title,
        tags: ['knowledge', ...entry.tags, ...extractKeywords(chunk)],
        sourceRef: `Knowledge Base > ${entry.title}`,
      }));
    }
  }

  return docs;
}
