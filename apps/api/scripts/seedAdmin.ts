import dns from 'node:dns';
try {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
} catch {
  // Ignore in environments where custom DNS servers cannot be set
}

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../src/models/User.js';

dotenv.config();

export interface SeedAdminOptions {
  email?: string;
  password?: string;
  name?: string;
}

export async function seedAdmin(options: SeedAdminOptions = {}) {
  const email = (options.email || process.env.ADMIN_EMAIL || 'admin@dealership.com').toLowerCase().trim();
  const password = options.password || process.env.ADMIN_PASSWORD || 'Admin123!';
  const name = (options.name || process.env.ADMIN_NAME || 'Administrator').trim();

  const isConnected = mongoose.connection.readyState === 1;
  if (!isConnected) {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in the environment variables.');
    }
    await mongoose.connect(mongoUri);
  }

  try {
    const existingAdmin = await User.findOne({ email });
    if (existingAdmin) {
      console.log(`[SeedAdmin] Admin user with email "${email}" already exists.`);
      return existingAdmin;
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const adminUser = await User.create({
      name,
      email,
      passwordHash,
      role: 'admin',
    });

    console.log(`[SeedAdmin] Successfully seeded admin user: ${email}`);
    return adminUser;
  } finally {
    if (!isConnected && mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
    }
  }
}

const isDirectRun =
  process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/seedAdmin.ts') ||
  process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/seedAdmin.js');

if (isDirectRun) {
  seedAdmin()
    .then(() => {
      console.log('[SeedAdmin] Seeding completed.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[SeedAdmin] Seeding failed:', err);
      process.exit(1);
    });
}
