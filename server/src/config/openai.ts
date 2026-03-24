import OpenAI from 'openai';
import { env } from './env.js';

/** Shared OpenAI client singleton — used across agent, planner, and embeddings. */
export const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });
