import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: Number(process.env.PORT) || 3000,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  MODEL_URL: process.env.MODEL_URL || 'http://47.111.10.148:3000/v1/chat/completions',
  MODEL_NAME: process.env.MODEL_NAME || 'coder-troubleshooting',
  ACCOUNT_CENTER_URL: process.env.ACCOUNT_CENTER_URL || 'http://47.111.10.148/account/api/v1',
  NEWAPI_TOKEN_GROUP: process.env.NEWAPI_TOKEN_GROUP || 'coder-troubleshooting',
  NEWAPI_ACCOUNT_GROUP: process.env.NEWAPI_ACCOUNT_GROUP || 'coder-troubleshooting',
  JWT_SECRET: process.env.JWT_SECRET || 'coder-jwt-secret-dev',
  ACCOUNT_API_KEY: process.env.ACCOUNT_API_KEY || '',
};
