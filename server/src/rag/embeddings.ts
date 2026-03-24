import { openai } from '../config/openai.js';
import { EMBEDDING_MODEL } from '../config/constants.js';

/**
 * Generates an embedding vector for a single text string.
 */
export async function embedText(text: string): Promise<number[]> {
  const cleaned = text.replace(/\n/g, ' ').trim();
  if (!cleaned) throw new Error('Cannot embed empty text');

  const response = await openai.embeddings.create({
    model: EMBEDDING_MODEL,
    input: cleaned,
  });

  if (!response.data[0]) throw new Error('No embedding returned');
  return response.data[0].embedding;
}

/**
 * Generates embeddings for multiple texts in a single API call.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const BATCH_SIZE = 2048;
  const results: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE).map(t => t.replace(/\n/g, ' ').trim());
    const response = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: batch,
    });
    results.push(...response.data.map(d => d.embedding));
  }

  return results;
}
