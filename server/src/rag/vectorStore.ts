import pg from 'pg';
import { env } from '../config/env.js';
import { EMBEDDING_DIMENSIONS } from './embeddings.js';
import type { DataDocument, DataSource, SearchResult } from '../types/index.js';

const { Pool } = pg;

let pool: pg.Pool | null = null;

function getPool(): pg.Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }
  return pool;
}

/**
 * Initializes the vector store schema.
 * Creates the documents table with pgvector extension if it doesn't exist.
 */
export async function initVectorStore(): Promise<void> {
  const db = getPool();

  await db.query('CREATE EXTENSION IF NOT EXISTS vector');

  await db.query(`
    CREATE TABLE IF NOT EXISTS documents (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      content TEXT NOT NULL,
      metadata JSONB DEFAULT '{}',
      embedding vector(${EMBEDDING_DIMENSIONS}),
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // Index for fast cosine similarity search
  await db.query(`
    CREATE INDEX IF NOT EXISTS documents_embedding_idx
    ON documents
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 10)
  `);

  // Index for source filtering
  await db.query(`
    CREATE INDEX IF NOT EXISTS documents_source_idx
    ON documents (source)
  `);

  console.log('[vectorStore] Schema initialized');
}

/**
 * Upserts a document with its embedding into the vector store.
 */
export async function upsertDocument(
  doc: DataDocument,
  embedding: number[],
): Promise<void> {
  const db = getPool();

  await db.query(
    `INSERT INTO documents (id, source, content, metadata, embedding)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT (id) DO UPDATE SET
       content = EXCLUDED.content,
       metadata = EXCLUDED.metadata,
       embedding = EXCLUDED.embedding`,
    [
      doc.id,
      doc.source,
      doc.content,
      JSON.stringify(doc.metadata),
      `[${embedding.join(',')}]`,
    ],
  );
}

/**
 * Semantic search: finds the most similar documents to a query embedding.
 * Supports optional source filtering for targeted retrieval.
 */
export async function searchSimilar(
  queryEmbedding: number[],
  options: {
    limit?: number;
    threshold?: number;
    sources?: DataSource[];
  } = {},
): Promise<SearchResult[]> {
  const { limit = 5, threshold = 0.3, sources } = options;
  const db = getPool();

  let query: string;
  let params: unknown[];

  if (sources && sources.length > 0) {
    query = `
      SELECT id, source, content, metadata,
        1 - (embedding <=> $1::vector) AS score
      FROM documents
      WHERE source = ANY($2)
        AND 1 - (embedding <=> $1::vector) > $3
      ORDER BY embedding <=> $1::vector
      LIMIT $4
    `;
    params = [`[${queryEmbedding.join(',')}]`, sources, threshold, limit];
  } else {
    query = `
      SELECT id, source, content, metadata,
        1 - (embedding <=> $1::vector) AS score
      FROM documents
      WHERE 1 - (embedding <=> $1::vector) > $2
      ORDER BY embedding <=> $1::vector
      LIMIT $3
    `;
    params = [`[${queryEmbedding.join(',')}]`, threshold, limit];
  }

  const result = await db.query(query, params);

  return result.rows.map((row: any) => ({
    document: {
      id: row.id,
      source: row.source as DataSource,
      content: row.content,
      metadata: row.metadata,
    },
    score: parseFloat(row.score),
  }));
}

/**
 * Clears all documents from a specific source.
 * Useful when re-seeding data.
 */
export async function clearSource(source: DataSource): Promise<number> {
  const db = getPool();
  const result = await db.query('DELETE FROM documents WHERE source = $1', [source]);
  return result.rowCount ?? 0;
}

/**
 * Returns document count by source for debugging.
 */
export async function getDocumentCounts(): Promise<Record<string, number>> {
  const db = getPool();
  const result = await db.query(
    'SELECT source, COUNT(*) as count FROM documents GROUP BY source',
  );
  return Object.fromEntries(result.rows.map((r: any) => [r.source, parseInt(r.count)]));
}

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
