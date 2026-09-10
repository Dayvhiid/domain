/**
 * Bootstrap - Load environment variables FIRST before any other imports
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '..', '.env');
const result = config({ path: envPath });

if (result.error) {
  console.error('Failed to load .env:', result.error.message);
  process.exit(1);
}

// Dynamic import so dotenv runs first (ESM hoists static imports)
await import('./server.js');
