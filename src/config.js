import dotenv from 'dotenv';

dotenv.config();

export const config = {
  MODEL_URL: process.env.MODEL_URL || 'http://localhost:8000/v1/chat/completions',
  MODEL_API_KEY: process.env.MODEL_API_KEY,
  MODEL_NAME: process.env.MODEL_NAME || 'gpt-4',
  PORT: Number(process.env.PORT) || 3000,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://coder:coder123@postgres:5432/coder',
  JWT_SECRET: process.env.JWT_SECRET || 'change-me-in-production',
};
