import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { chatRouter } from './routes/chat.js';
import { registerAllTools } from './tools/index.js';
import { initVectorStore } from './rag/vectorStore.js';
import { cleanupSessions } from './agent/memory.js';

async function start() {
  const app = express();

  // Middleware
  app.use(cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    exposedHeaders: ['X-Session-Id'],
  }));
  app.use(express.json({ limit: '1mb' }));

  // Initialize systems
  console.log('[server] Initializing vector store...');
  await initVectorStore();

  console.log('[server] Registering tools...');
  registerAllTools();

  // Routes
  app.use('/api/chat', chatRouter);

  // Health check
  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', env: env.NODE_ENV });
  });

  // Periodic session cleanup (every 10 minutes)
  setInterval(cleanupSessions, 10 * 60 * 1000);

  // Start
  app.listen(env.PORT, () => {
    console.log(`[server] Running on http://localhost:${env.PORT}`);
    console.log(`[server] CORS origin: ${env.FRONTEND_URL}`);
  });
}

start().catch((err) => {
  console.error('[server] Fatal error:', err);
  process.exit(1);
});
