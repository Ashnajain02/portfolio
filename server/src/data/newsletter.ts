import { env } from '../config/env.js';
import { MAX_PAGINATION_PAGES } from '../config/constants.js';
import { createDocument, chunkText, extractKeywords } from './normalize.js';
import type { DataDocument } from '../types/index.js';

const BEEHIIV_API = 'https://api.beehiiv.com/v2';

interface BeehiivPost {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  web_url: string;
  publish_date: number;
  preview_text: string;
  content_tags: string[];
  content: {
    free: {
      web: string;  // HTML content
    };
  };
}

/**
 * Strips HTML tags and extracts clean text from newsletter HTML content.
 * Handles common Beehiiv formatting patterns.
 */
function htmlToText(html: string): string {
  return html
    // Remove style and script blocks entirely
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    // Convert common block elements to newlines
    .replace(/<\/?(p|div|br|h[1-6]|li|tr|blockquote)[^>]*>/gi, '\n')
    // Convert list items to bullet points
    .replace(/<li[^>]*>/gi, '\n- ')
    // Strip remaining HTML tags
    .replace(/<[^>]+>/g, '')
    // Decode common HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, '/')
    // Clean up whitespace
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .trim();
}

/**
 * Fetches all published newsletter posts from Beehiiv.
 */
async function fetchAllPosts(): Promise<BeehiivPost[]> {
  if (!env.BEEHIIV_API_KEY || !env.BEEHIIV_PUBLICATION_ID) {
    throw new Error('Beehiiv API not configured');
  }

  const posts: BeehiivPost[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const url = `${BEEHIIV_API}/publications/${env.BEEHIIV_PUBLICATION_ID}/posts?status=confirmed&limit=10&page=${page}&expand=free_web_content`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${env.BEEHIIV_API_KEY}` },
    });

    if (!response.ok) {
      throw new Error(`Beehiiv API ${response.status}: ${response.statusText}`);
    }

    const data = await response.json() as {
      data: BeehiivPost[];
      total_pages: number;
    };

    posts.push(...data.data);
    hasMore = page < data.total_pages && page < MAX_PAGINATION_PAGES;
    page++;
  }

  return posts;
}

/**
 * Converts newsletter posts into chunked, normalized DataDocuments
 * ready for embedding into pgvector.
 *
 * Each article is chunked into ~500 char segments with overlap,
 * preserving the article title and metadata in each chunk for context.
 */
export async function getNewsletterDocuments(): Promise<DataDocument[]> {
  const posts = await fetchAllPosts();
  const docs: DataDocument[] = [];

  for (const post of posts) {
    const htmlContent = post.content?.free?.web;
    if (!htmlContent) continue;

    const plainText = htmlToText(htmlContent);
    if (plainText.length < 50) continue; // Skip empty/tiny posts

    const publishDate = new Date(post.publish_date * 1000).toISOString();

    // Create a summary document for the whole article
    const summary = [
      `Newsletter article: "${post.title}"`,
      post.subtitle ? `Subtitle: ${post.subtitle}` : '',
      `Published: ${publishDate.slice(0, 10)}`,
      `URL: ${post.web_url}`,
      post.preview_text ? `Preview: ${post.preview_text}` : '',
    ].filter(Boolean).join('. ');

    docs.push(createDocument('newsletter', summary, {
      category: 'article_summary',
      title: post.title,
      url: post.web_url,
      timestamp: publishDate,
      tags: ['newsletter', 'summary', ...(post.content_tags || []), ...extractKeywords(summary)],
      sourceRef: `Newsletter > "${post.title}" (${publishDate.slice(0, 10)})`,
    }));

    // Chunk the full article text
    const chunks = chunkText(plainText);

    for (let i = 0; i < chunks.length; i++) {
      const chunkContent = `From newsletter article "${post.title}": ${chunks[i]}`;

      docs.push(createDocument('newsletter', chunkContent, {
        category: 'article_content',
        title: post.title,
        url: post.web_url,
        timestamp: publishDate,
        tags: ['newsletter', 'content', ...(post.content_tags || []), ...extractKeywords(chunks[i])],
        sourceRef: `Newsletter > "${post.title}" > chunk ${i + 1}/${chunks.length}`,
        chunkIndex: i,
        totalChunks: chunks.length,
      }));
    }
  }

  return docs;
}
