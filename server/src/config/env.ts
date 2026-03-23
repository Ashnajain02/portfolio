import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const envSchema = z.object({
  OPENAI_API_KEY: z.string().min(1, 'OPENAI_API_KEY is required'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  E2B_API_KEY: z.string().optional().default(''),
  JOURNAL_API_URL: z.string().optional().default(''),
  JOURNAL_API_KEY: z.string().optional().default(''),
  BEEHIIV_API_KEY: z.string().optional().default(''),
  BEEHIIV_PUBLICATION_ID: z.string().optional().default(''),
  PORT: z.coerce.number().default(3001),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
});

function loadEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.format();
    console.error('Environment validation failed:', formatted);
    throw new Error('Missing or invalid environment variables');
  }
  return result.data;
}

export const env = loadEnv();
export type Env = z.infer<typeof envSchema>;
