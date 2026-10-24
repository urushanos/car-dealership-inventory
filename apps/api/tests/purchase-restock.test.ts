import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { Vehicle } from '../src/models/Vehicle.js';
import { purchaseVehicle, restockVehicle } from '../src/services/vehicle.service.js';

describe('Phase 4 — Purchase and Restock Operations', () => {
  let mongoServer: MongoMemoryServer;
  const JWT_SECRET = 'test-secret-key-12345';
  let adminToken: string;
  let userToken: string;
  let adminUserId: string;
  let regularUserId: string;

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URI = mongoUri;
    await mongoose.connect(mongoUri);

    adminUserId = new mongoose.Types.ObjectId().toString();
    regularUserId = new mongoose.Types.ObjectId().toString();

    adminToken = jwt.sign(
      { sub: adminUserId, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    userToken = jwt.sign(
      { sub: regularUserId, role: 'user' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await Vehicle.deleteMany({});
  });

  describe('Authentication & Authorization Guards', () => {
    it('should reject unauthenticated requests to purchase with 401', async () => {
      const vehicle = await Vehicle.create({
        make: 'Toyota',
        model: 'Corolla',
        category: 'Sedan',
        price: 22000,
        quantity: 3,
        vin: '1HGCR2F83HA000001',
      });

      const res = await request(app).post(`/api/vehicles/${vehicle._id}/purchase`);
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized|Invalid/i);
    });

    it('should reject unauthenticated requests to restock with 401', async () => {
      const vehicle = await Vehicle.create({
        make: 'Toyota',
        model: 'Corolla',
        category: 'Sedan',
        price: 22000,
        quantity: 3,
        vin: '1HGCR2F83HA000001',
      });

      const res = await request(app)
        .post(`/api/vehicles/${vehicle._id}/restock`)
        .send({ quantity: 5 });
      expect(res.status).toBe(401);
      expect(res.body.message).toMatch(/Unauthorized|Invalid/i);
    });

    it('should forbid a regular user from restocking with 403', async () => {
      const vehicle = await Vehicle.create({
        make: 'Toyota',
        model: 'Corolla',
        category: 'Sedan',
        price: 22000,
        quantity: 3,
        vin: '1HGCR2F83HA000001',
      });

      const res = await request(app)
        .post(`/api/vehicles/${vehicle._id}/restock`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ quantity: 5 });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Admin access required');
    });

    it('should allow a regular user to purchase a vehicle', async () => {
      const vehicle = await Vehicle.create({
        make: 'Honda',
        model: 'Civic',
        category: 'Sedan',
        price: 24000,
        quantity: 3,
        vin: '1HGCR2F83HA000002',
      });

      const res = await request(app)
        .post(`/api/vehicles/${vehicle._id}/purchase`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.quantity).toBe(2);
    });
  });

  describe('Purchase Operation (POST /api/vehicles/:id/purchase)', () => {
    it('should reduce quantity from 3 to 2 upon purchase', async () => {
      const vehicle = await Vehicle.create({
        make: 'Subaru',
        model: 'Crosstrek',
        category: 'SUV',
        price: 27000,
        quantity: 3,
        vin: 'JF2SKAHC7PH000001',
      });

      const res = await request(app)
        .post(`/api/vehicles/${vehicle._id}/purchase`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.quantity).toBe(2);

      // Verify in DB
      const updated = await Vehicle.findById(vehicle._id);
      expect(updated!.quantity).toBe(2);
    });

    it('should purchase a vehicle with quantity 1 resulting in quantity 0', async () => {
      const vehicle = await Vehicle.create({
        make: 'Mazda',
        model: '3',
        category: 'Sedan',
        price: 23000,
        quantity: 1,
        vin: 'JM1BN1V35H1000001',
      });

      const res = await request(app)
        .post(`/api/vehicles/${vehicle._id}/purchase`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.quantity).toBe(0);

      // Verify in DB
      const updated = await Vehicle.findById(vehicle._id);
      expect(updated!.quantity).toBe(0);
    });

    it('should return 409 Conflict when attempting to purchase a vehicle with quantity zero', async () => {
      const vehicle = await Vehicle.create({
        make: 'Nissan',
        model: 'Sentra',
        category: 'Sedan',
        price: 20000,
        quantity: 0,
        vin: '3N1AB8CV6NY000001',
      });

      const res = await request(app)
        .post(`/api/vehicles/${vehicle._id}/purchase`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(409);
      expect(res.body.message).toBe('Vehicle out of stock');

      // Verify DB quantity unchanged
      const updated = await Vehicle.findById(vehicle._id);
      expect(updated!.quantity).toBe(0);
    });

    it('should return 404 Not Found when purchasing a missing vehicle', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post(`/api/vehicles/${nonExistentId}/purchase`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Vehicle not found');
    });

    it('should return 400 Bad Request for an invalid vehicle ID', async () => {
      const res = await request(app)
        .post('/api/vehicles/invalid-object-id/purchase')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid vehicle ID/i);
    });
  });

  describe('Concurrency — Parallel Purchases', () => {
    it('should never reduce quantity below zero under concurrent purchases', async () => {
      const initialStock = 3;
      const vehicle = await Vehicle.create({
        make: 'Ford',
        model: 'Mustang Mach-E',
        category: 'SUV',
        price: 43000,
        quantity: initialStock,
        vin: '3FMTK3SU5PM000001',
      });

      const totalRequests = 10;
      const promises = Array.from({ length: totalRequests }).map(() =>
        request(app)
          .post(`/api/vehicles/${vehicle._id}/purchase`)
          .set('Authorization', `Bearer ${userToken}`)
      );

      const responses = await Promise.all(promises);

      const successfulPurchases = responses.filter((r) => r.status === 200);
      const outOfStockResponses = responses.filter((r) => r.status === 409);

      expect(successfulPurchases.length).toBe(initialStock);
      expect(outOfStockResponses.length).toBe(totalRequests - initialStock);

      for (const res of outOfStockResponses) {
        expect(res.body.message).toBe('Vehicle out of stock');
      }

      // Final check in database: quantity must be exactly 0, never negative
      const finalVehicle = await Vehicle.findById(vehicle._id);
      expect(finalVehicle!.quantity).toBe(0);
    });
  });

  describe('Restock Operation (POST /api/vehicles/:id/restock)', () => {
    it('should increase stock by the supplied quantity when called by admin', async () => {
      const vehicle = await Vehicle.create({
        make: 'BMW',
        model: 'X5',
        category: 'SUV',
        price: 65000,
        quantity: 2,
        vin: '5UXCR6C08N9000001',
      });

      const res = await request(app)
        .post(`/api/vehicles/${vehicle._id}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 5 });

      expect(res.status).toBe(200);
      expect(res.body.quantity).toBe(7);

      // Verify in DB
      const updated = await Vehicle.findById(vehicle._id);
      expect(updated!.quantity).toBe(7);
    });

    it('should also accept quantityToAdd field name in restock body', async () => {
      const vehicle = await Vehicle.create({
        make: 'Audi',
        model: 'A4',
        category: 'Sedan',
        price: 42000,
        quantity: 1,
        vin: 'WAUB8AF45KA000001',
      });

      const res = await request(app)
        .post(`/api/vehicles/${vehicle._id}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantityToAdd: 4 });

      expect(res.status).toBe(200);
      expect(res.body.quantity).toBe(5);

      const updated = await Vehicle.findById(vehicle._id);
      expect(updated!.quantity).toBe(5);
    });

    it('should reject zero restock amount with 400 Bad Request', async () => {
      const vehicle = await Vehicle.create({
        make: 'BMW',
        model: '330i',
        category: 'Sedan',
        price: 45000,
        quantity: 2,
        vin: 'WBA5R1C55KA000002',
      });

      const res = await request(app)
        .post(`/api/vehicles/${vehicle._id}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 0 });

      expect(res.status).toBe(400);
      // Verify quantity unchanged
      const updated = await Vehicle.findById(vehicle._id);
      expect(updated!.quantity).toBe(2);
    });

    it('should reject negative restock amounts with 400 Bad Request', async () => {
      const vehicle = await Vehicle.create({
        make: 'BMW',
        model: '330i',
        category: 'Sedan',
        price: 45000,
        quantity: 2,
        vin: 'WBA5R1C55KA000003',
      });

      const res = await request(app)
        .post(`/api/vehicles/${vehicle._id}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: -3 });

      expect(res.status).toBe(400);
      const updated = await Vehicle.findById(vehicle._id);
      expect(updated!.quantity).toBe(2);
    });

    it('should reject fractional restock amounts with 400 Bad Request', async () => {
      const vehicle = await Vehicle.create({
        make: 'BMW',
        model: '330i',
        category: 'Sedan',
        price: 45000,
        quantity: 2,
        vin: 'WBA5R1C55KA000004',
      });

      const res = await request(app)
        .post(`/api/vehicles/${vehicle._id}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 2.5 });

      expect(res.status).toBe(400);
      const updated = await Vehicle.findById(vehicle._id);
      expect(updated!.quantity).toBe(2);
    });

    it('should return 404 Not Found when restocking a nonexistent vehicle', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .post(`/api/vehicles/${nonExistentId}/restock`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 3 });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Vehicle not found');
    });

    it('should return 400 Bad Request for an invalid vehicle ID on restock', async () => {
      const res = await request(app)
        .post('/api/vehicles/invalid-id/restock')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 5 });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/Invalid vehicle ID/i);
    });
  });

  describe('Service Direct Unit Tests', () => {
    it('purchaseVehicle service should throw 400 for invalid ID', async () => {
      await expect(purchaseVehicle('not-valid-id')).rejects.toMatchObject({
        statusCode: 400,
        message: 'Invalid vehicle ID',
      });
    });

    it('purchaseVehicle service should throw 404 for nonexistent vehicle', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(purchaseVehicle(nonExistentId)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Vehicle not found',
      });
    });

    it('purchaseVehicle service should throw 409 when out of stock', async () => {
      const vehicle = await Vehicle.create({
        make: 'Kia',
        model: 'EV6',
        category: 'Crossover',
        price: 48000,
        quantity: 0,
        vin: 'KNDCC3LG8N5000001',
      });

      await expect(purchaseVehicle(vehicle._id.toString())).rejects.toMatchObject({
        statusCode: 409,
        message: 'Vehicle out of stock',
      });
    });

    it('restockVehicle service should throw 400 for invalid ID', async () => {
      await expect(restockVehicle('not-valid-id', 5)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Invalid vehicle ID',
      });
    });

    it('restockVehicle service should throw 400 for zero, negative or fractional quantity', async () => {
      const dummyId = new mongoose.Types.ObjectId().toString();
      await expect(restockVehicle(dummyId, 0)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Restock quantity must be a positive integer',
      });
      await expect(restockVehicle(dummyId, -2)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Restock quantity must be a positive integer',
      });
      await expect(restockVehicle(dummyId, 2.5)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Restock quantity must be a positive integer',
      });
    });

    it('restockVehicle service should throw 404 for nonexistent vehicle', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();
      await expect(restockVehicle(nonExistentId, 5)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Vehicle not found',
      });
    });
  });
});
