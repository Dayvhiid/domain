// entry.js - Main entry point, loads environment variables FIRST

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

// Verify env vars are loaded
console.log('Environment loaded:', {
  NODE_ENV: process.env.NODE_ENV,
  MONGODB_URI: process.env.MONGODB_URI ? 'SET' : 'MISSING',
  SESSION_SECRET: process.env.SESSION_SECRET ? 'SET' : 'MISSING',
  OPENPROVIDER_USERNAME: process.env.OPENPROVIDER_USERNAME ? 'SET' : 'MISSING',
});

// Now dynamically import the server
import('./server.js');