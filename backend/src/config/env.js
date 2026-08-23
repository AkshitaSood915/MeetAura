import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/meetaura',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000,http://localhost:5173',
  geminiApiKey: (process.env.GEMINI_API_KEY || '').trim().replace(/^["']|["']$/g, '')
};

