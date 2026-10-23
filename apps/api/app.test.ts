import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import app from './src/app.js';
import { Vehicle } from './src/models/Vehicle.js';
import { connectDB } from './src/config/db.js';


describe('API Backend - Checkpoint Tests', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URI = mongoUri;
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Vehicle.deleteMany({});
  });

  it('should throw an error explicitly if MONGODB_URI is absent', async () => {
    const originalUri = process.env.MONGODB_URI;
    delete process.env.MONGODB_URI;
    await expect(connectDB()).rejects.toThrow('MONGODB_URI is not defined in the environment variables.');
    process.env.MONGODB_URI = originalUri;
  });

  it('should reject persistence operations when required elements like VIN are missing', async () => {
    const brokenVehicle = new Vehicle({ make: 'Tesla', model: 'Model 3', year: 2024, price: 35000 });
    let error: any = null;
    try { await brokenVehicle.validate(); } catch (err) { error = err; }
    expect(error).not.toBeNull();
    expect(error.errors.vin).toBeDefined();
  });

  it('should successfully commit valid entities to the isolated test database', async () => {
    const validVehicle = new Vehicle({
      make: 'Toyota', model: 'RAV4', year: 2025, price: 32000, vin: 'JTMDFRFV6RD000002', status: 'available'
    });
    const saved = await validVehicle.save();
    expect(saved._id).toBeDefined();
    
    const queried = await Vehicle.findOne({ vin: 'JTMDFRFV6RD000002' });
    expect(queried?.model).toBe('RAV4');
  });

  it('should hit the unpinned app pipeline via supertest without port collision', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
  });
});
