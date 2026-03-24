import express from 'express';
import cors from 'cors';
import { env } from './config/env.js';
import { chatRouter } from './routes/chat.js';
import { registerAllTools } from './tools/index.js';
import { initVectorStore, closePool } from './rag/vectorStore.js';
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

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', env: env.NODE_ENV });
  });

  // Periodic cleanup
  const cleanupInterval = setInterval(cleanupSessions, 10 * 60 * 1000);

  // Start server
  const server = app.listen(env.PORT, () => {
    console.log(`[server] Running on http://localhost:${env.PORT}`);
    console.log(`[server] CORS origin: ${env.FRONTEND_URL}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[server] ${signal} received, shutting down...`);
    clearInterval(cleanupInterval);
    server.close(() => console.log('[server] HTTP server closed'));
    await closePool();
    console.log('[server] Database pool closed');
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((err) => {
  console.error('[server] Fatal error:', err);
  process.exit(1);
});
