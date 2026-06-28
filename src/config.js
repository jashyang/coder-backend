import dotenv from 'dotenv';

dotenv.config();

export const config = {
  PORT: Number(process.env.PORT) || 3000,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*',
  MODEL_URL: process.env.MODEL_URL || 'http://47.111.10.148:3000/v1/chat/completions',
  MODEL_NAME: process.env.MODEL_NAME || 'gpt-4',
  ACCOUNT_CENTER_URL: process.env.ACCOUNT_CENTER_URL || 'http://47.111.10.148/account/api/v1',
  NEWAPI_GROUP: process.env.NEWAPI_GROUP || 'coder-group',
};
