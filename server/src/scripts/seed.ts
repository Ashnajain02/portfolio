import { getResumeDocuments } from '../data/resume.js';
import { embedBatch } from '../rag/embeddings.js';
import { initVectorStore, upsertDocument, clearSource, getDocumentCounts, closePool } from '../rag/vectorStore.js';

/**
 * Seeds the vector store with all data sources.
 * Run with: npm run seed
 */
async function seed() {
  console.log('[seed] Starting...');

  // Initialize schema
  await initVectorStore();

  // --- Resume data ---
  console.log('[seed] Loading resume data...');
  const resumeDocs = getResumeDocuments();
  console.log(`[seed] ${resumeDocs.length} resume documents to embed`);

  // Clear existing resume data
  const cleared = await clearSource('resume');
  console.log(`[seed] Cleared ${cleared} existing resume documents`);

  // Generate embeddings in batch
  console.log('[seed] Generating embeddings...');
  const texts = resumeDocs.map(d => d.content);
  const embeddings = await embedBatch(texts);

  // Upsert all documents
  console.log('[seed] Upserting documents...');
  for (let i = 0; i < resumeDocs.length; i++) {
    await upsertDocument(resumeDocs[i], embeddings[i]);
  }

  // Verify
  const counts = await getDocumentCounts();
  console.log('[seed] Document counts:', counts);

  await closePool();
  console.log('[seed] Done!');
}

seed().catch((err) => {
  console.error('[seed] Error:', err);
  process.exit(1);
});
