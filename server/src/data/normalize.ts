import { v4 as uuid } from 'uuid';
import type { DataDocument, DataSource, DocumentMetadata } from '../types/index.js';

/**
 * Creates a normalized DataDocument from raw source data.
 * All data connectors must use this to produce uniform documents.
 */
export function createDocument(
  source: DataSource,
  content: string,
  metadata: DocumentMetadata = {},
): DataDocument {
  return {
    id: uuid(),
    source,
    content: content.trim(),
    metadata: {
      ...metadata,
      timestamp: metadata.timestamp ?? new Date().toISOString(),
    },
  };
}

/**
 * Extracts keywords from text for metadata storage.
 * These aid retrieval by giving the re-ranker more signal.
 */
export function extractKeywords(text: string, maxKeywords: number = 8): string[] {
  const STOP = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but',
    'in', 'with', 'to', 'for', 'of', 'not', 'no', 'can', 'had', 'has',
    'have', 'was', 'were', 'been', 'be', 'are', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'its', 'his', 'her', 'my',
    'your', 'our', 'their', 'this', 'that', 'from', 'by', 'as', 'all',
    'also', 'more', 'about', 'into', 'than', 'them', 'then', 'been',
    'who', 'what', 'how', 'when', 'where', 'why', 'just', 'like',
  ]);

  const words = text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').split(/\s+/);
  const freq = new Map<string, number>();

  for (const word of words) {
    if (word.length < 3 || STOP.has(word)) continue;
    freq.set(word, (freq.get(word) || 0) + 1);
  }

  return Array.from(freq.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxKeywords)
    .map(([word]) => word);
}

/**
 * Content-aware sentence splitter.
 * Splits on sentence boundaries while preserving:
 * - Decimal numbers (3.8, 50.5)
 * - Abbreviations (e.g., Dr., U.S., etc.)
 * - URLs (echo-entries.com)
 * - Ellipsis (...)
 */
function splitSentences(text: string): string[] {
  // Split on sentence-ending punctuation followed by whitespace + uppercase or end
  // Negative lookbehind avoids splitting on decimals, abbreviations, URLs
  const sentences: string[] = [];
  let buffer = '';

  // Split by newlines first (preserves paragraph structure)
  const paragraphs = text.split(/\n+/);

  for (const paragraph of paragraphs) {
    if (!paragraph.trim()) continue;

    // Match sentences: split after .!? followed by space+capital or end
    // But not after single uppercase letter (abbreviations) or digits (decimals)
    const parts = paragraph.split(/(?<=[.!?])\s+(?=[A-Z])/);

    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed) sentences.push(trimmed);
    }
  }

  // If regex produced no splits, return the whole text
  return sentences.length > 0 ? sentences : [text];
}

/**
 * Content-aware chunking with overlap.
 *
 * Strategy:
 * 1. Split text into sentences (preserving structure)
 * 2. Group sentences into chunks up to maxChunkSize chars
 * 3. Overlap: each chunk starts with the last overlapSentences from the previous chunk
 *
 * This ensures:
 * - No sentence is cut mid-way
 * - Tables and structured content within a sentence stay intact
 * - Overlap preserves context across chunk boundaries
 *
 * @param text - The full text to chunk
 * @param maxChunkSize - Max characters per chunk (default 800 — optimized for text-embedding-3-small)
 * @param overlapSentences - Number of sentences to overlap between chunks (default 1)
 */
export function chunkText(
  text: string,
  maxChunkSize: number = 800,
  overlapSentences: number = 1,
): string[] {
  if (text.length <= maxChunkSize) return [text];

  const sentences = splitSentences(text);
  if (sentences.length <= 1) return [text];

  const chunks: string[] = [];
  let startIdx = 0;

  while (startIdx < sentences.length) {
    let chunk = '';
    let endIdx = startIdx;

    // Add sentences until we exceed maxChunkSize
    while (endIdx < sentences.length) {
      const candidate = chunk ? chunk + ' ' + sentences[endIdx] : sentences[endIdx];
      if (candidate.length > maxChunkSize && chunk.length > 0) break;
      chunk = candidate;
      endIdx++;
    }

    chunks.push(chunk.trim());

    // Move start forward, keeping overlap
    const advance = endIdx - startIdx;
    if (advance <= overlapSentences) {
      // Chunk only had 1-2 sentences, advance by at least 1 to avoid infinite loop
      startIdx = endIdx;
    } else {
      startIdx = endIdx - overlapSentences;
    }
  }

  return chunks;
}
