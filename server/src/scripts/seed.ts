import { getResumeDocuments } from '../data/resume.js';
import { getNewsletterDocuments } from '../data/newsletter.js';
import { getKnowledgeDocuments } from '../data/knowledge.js';
import { embedBatch } from '../rag/embeddings.js';
import {
  initVectorStore, upsertDocument, clearSource,
  getDocumentCounts, closePool,
} from '../rag/vectorStore.js';
import type { DataDocument, DataSource } from '../types/index.js';

async function seedSource(
  name: string,
  source: DataSource,
  getDocs: () => DataDocument[] | Promise<DataDocument[]>,
) {
  console.log(`\n[seed] --- ${name} ---`);

  const docs = await getDocs();
  console.log(`[seed] ${docs.length} documents to embed`);

  if (docs.length === 0) {
    console.log(`[seed] Skipping ${name} — no documents`);
    return;
  }

  const cleared = await clearSource(source);
  console.log(`[seed] Cleared ${cleared} existing ${name} documents`);

  console.log(`[seed] Generating embeddings...`);
  const texts = docs.map(d => d.content);
  const embeddings = await embedBatch(texts);

  console.log(`[seed] Upserting ${docs.length} documents...`);
  for (let i = 0; i < docs.length; i++) {
    await upsertDocument(docs[i], embeddings[i]);
  }

  console.log(`[seed] ${name} done!`);
}

async function seed() {
  console.log('[seed] Starting full seed...');
  await initVectorStore();

  // 1. Resume
  await seedSource('Resume', 'resume', getResumeDocuments);

  // 2. Newsletter articles (from Beehiiv API)
  await seedSource('Newsletter', 'newsletter', getNewsletterDocuments);

  // 3. Personal knowledge base
  await seedSource('Knowledge Base', 'general', getKnowledgeDocuments);

  // Summary
  const counts = await getDocumentCounts();
  console.log('\n[seed] Final document counts:', counts);
  console.log(`[seed] Total: ${Object.values(counts).reduce((a, b) => a + b, 0)} documents`);

  await closePool();
  console.log('[seed] All done!');
}

seed().catch((err) => {
  console.error('[seed] Error:', err);
  process.exit(1);
});
