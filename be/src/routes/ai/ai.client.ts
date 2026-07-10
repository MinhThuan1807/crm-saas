import OpenAI from 'openai';
import envConfig from '../../common/config';

const isGroq = envConfig.AI_PROVIDER === 'groq';

export const openai = new OpenAI(
  isGroq
    ? {
        apiKey: envConfig.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
      }
    : {
        apiKey: envConfig.OPENAI_API_KEY,
      }
);

export const AI_MODEL = isGroq
  ? (envConfig.GROQ_MODEL || 'llama-3.3-70b-versatile')
  : (envConfig.OPENAI_MODEL || 'gpt-4o-mini');
