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
 * Chunks a long text into smaller segments for embedding.
 * Uses sentence-aware splitting to avoid cutting mid-thought.
 */
export function chunkText(
  text: string,
  maxChunkSize: number = 500,
  overlap: number = 50,
): string[] {
  if (text.length <= maxChunkSize) return [text];

  const sentences = text.match(/[^.!?]+[.!?]+\s*/g) ?? [text];
  const chunks: string[] = [];
  let current = '';

  for (const sentence of sentences) {
    if (current.length + sentence.length > maxChunkSize && current.length > 0) {
      chunks.push(current.trim());
      // Keep overlap from end of previous chunk
      const words = current.split(' ');
      const overlapWords = words.slice(-Math.ceil(overlap / 5));
      current = overlapWords.join(' ') + ' ' + sentence;
    } else {
      current += sentence;
    }
  }

  if (current.trim().length > 0) {
    chunks.push(current.trim());
  }

  return chunks;
}
