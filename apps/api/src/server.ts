import dns from 'node:dns';
dns.setServers(['1.1.1.1', '8.8.8.8']);

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Recreate modern __dirname compatibility for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inject the environment context safely using the rebuilt path
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 5000;

const startServer = async (): Promise<void> => {
  try {
    // Resolve database cluster lifecycle handshake first
    await connectDB();

    // Open port listener safely after validation
    app.listen(PORT, () => {
      console.log(`[Server] Car Dealership API running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`[Server] Critical bootstrap system crash: ${(error as Error).message}`);
    process.exit(1);
  }
};

startServer();