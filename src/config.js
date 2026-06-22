import dotenv from 'dotenv';

dotenv.config();

export const config = {
  MODEL_URL: process.env.MODEL_URL || 'http://localhost:8000/v1',
  MODEL_API_KEY: process.env.MODEL_API_KEY,
  MODEL_NAME: process.env.MODEL_NAME || 'gpt-4',
  PORT: Number(process.env.PORT) || 3000,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
};
