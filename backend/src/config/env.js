import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check potential .env locations
const envPaths = [
  path.resolve(__dirname, '../../.env'),          // backend/.env
  path.resolve(__dirname, '../../../.env'),         // root/.env
  path.resolve(process.cwd(), '.env'),             // current working directory/.env
  path.resolve(process.cwd(), 'backend/.env'),     // current working directory/backend/.env
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

// Fallback standard load
dotenv.config();

export const config = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/meetaura',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000,http://localhost:5173',
  geminiApiKey: (process.env.GEMINI_API_KEY || '').trim()
};

export default config;
