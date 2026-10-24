import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { Vehicle } from '../src/models/Vehicle.js';
import { User } from '../src/models/User.js';

describe('Phase 3 — Vehicle CRUD and Search API Tests', () => {
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
    await User.deleteMany({});
  });

  describe('Authentication & Authorization Guards', () => {
    it('should reject unauthenticated requests to protected endpoints with 401', async () => {
      const dummyId = new mongoose.Types.ObjectId().toString();

      const endpoints = [
        { method: 'get', path: '/api/vehicles' },
        { method: 'get', path: '/api/vehicles/search' },
        { method: 'get', path: `/api/vehicles/${dummyId}` },
        { method: 'post', path: '/api/vehicles', data: { make: 'Toyota' } },
        { method: 'put', path: `/api/vehicles/${dummyId}`, data: { price: 25000 } },
        { method: 'delete', path: `/api/vehicles/${dummyId}` },
      ];

      for (const ep of endpoints) {
        let req;
        if (ep.method === 'get') {
          req = request(app).get(ep.path);
        } else if (ep.method === 'post') {
          req = request(app).post(ep.path).send(ep.data);
        } else if (ep.method === 'put') {
          req = request(app).put(ep.path).send(ep.data);
        } else {
          req = request(app).delete(ep.path);
        }

        const res = await req;
        expect(res.status).toBe(401);
        expect(res.body.message).toMatch(/Unauthorized|Invalid/i);
      }
    });

    it('should forbid regular users from creating, updating, or deleting vehicles (403)', async () => {
      const vehicle = await Vehicle.create({
        make: 'Honda',
        model: 'Accord',
        category: 'Sedan',
        year: 2022,
        price: 28000,
        quantity: 3,
        vin: '1HGCR2F83HA000001',
        status: 'available',
      });

      // Regular user creation attempt
      const postRes = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          make: 'Ford',
          model: 'Mustang',
          category: 'Coupe',
          price: 45000,
        });
      expect(postRes.status).toBe(403);
      expect(postRes.body.message).toBe('Admin access required');

      // Regular user update attempt
      const putRes = await request(app)
        .put(`/api/vehicles/${vehicle._id}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ price: 26000 });
      expect(putRes.status).toBe(403);
      expect(putRes.body.message).toBe('Admin access required');

      // Regular user delete attempt
      const deleteRes = await request(app)
        .delete(`/api/vehicles/${vehicle._id}`)
        .set('Authorization', `Bearer ${userToken}`);
      expect(deleteRes.status).toBe(403);
      expect(deleteRes.body.message).toBe('Admin access required');
    });
  });

  describe('Vehicle Creation (POST /api/vehicles)', () => {
    it('should allow an admin to create a valid vehicle', async () => {
      const payload = {
        make: 'Toyota',
        model: 'Camry',
        category: 'Sedan',
        price: 26500,
        quantity: 5,
        year: 2024,
        vin: '4T1B11HK5RU123456',
        status: 'available',
      };

      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Vehicle created successfully');
      expect(res.body.vehicle).toBeDefined();
      expect(res.body.vehicle._id).toBeDefined();
      expect(res.body.vehicle.make).toBe('Toyota');
      expect(res.body.vehicle.model).toBe('Camry');
      expect(res.body.vehicle.category).toBe('Sedan');
      expect(res.body.vehicle.price).toBe(26500);
      expect(res.body.vehicle.quantity).toBe(5);
      expect(res.body.vehicle.year).toBe(2024);
      expect(res.body.vehicle.vin).toBe('4T1B11HK5RU123456');

      // Verify persistence in MongoDB
      const vehicleInDb = await Vehicle.findById(res.body.vehicle._id);
      expect(vehicleInDb).not.toBeNull();
      expect(vehicleInDb!.model).toBe('Camry');
    });

    it('should automatically generate a unique VIN if omitted by admin', async () => {
      const payload = {
        make: 'Hyundai',
        model: 'Tucson',
        category: 'SUV',
        price: 31000,
      };

      const res = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);

      expect(res.status).toBe(201);
      expect(res.body.vehicle.vin).toBeDefined();
      expect(res.body.vehicle.vin.length).toBeGreaterThanOrEqual(10);
      expect(res.body.vehicle.quantity).toBe(1); // Default quantity
    });

    it('should reject requests with missing make, model, or category with 400', async () => {
      // Missing make
      const res1 = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ model: 'Civic', category: 'Sedan', price: 22000 });
      expect(res1.status).toBe(400);
      expect(res1.body.message).toBe('Validation failed');

      // Missing model
      const res2 = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ make: 'Honda', category: 'Sedan', price: 22000 });
      expect(res2.status).toBe(400);

      // Missing category
      const res3 = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ make: 'Honda', model: 'Civic', price: 22000 });
      expect(res3.status).toBe(400);

      // Empty string values
      const res4 = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ make: '   ', model: 'Civic', category: 'Sedan', price: 22000 });
      expect(res4.status).toBe(400);
    });

    it('should reject negative price and negative/fractional quantity with 400', async () => {
      // Negative price
      const resNegativePrice = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          make: 'Toyota',
          model: 'Corolla',
          category: 'Sedan',
          price: -500,
          quantity: 2,
        });
      expect(resNegativePrice.status).toBe(400);

      // Negative quantity
      const resNegativeQuantity = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          make: 'Toyota',
          model: 'Corolla',
          category: 'Sedan',
          price: 20000,
          quantity: -3,
        });
      expect(resNegativeQuantity.status).toBe(400);

      // Fractional quantity
      const resFractionalQuantity = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          make: 'Toyota',
          model: 'Corolla',
          category: 'Sedan',
          price: 20000,
          quantity: 2.75,
        });
      expect(resFractionalQuantity.status).toBe(400);
    });

    it('should reject creation with a duplicate VIN with 409 Conflict', async () => {
      const payload = {
        make: 'Mazda',
        model: 'CX-5',
        category: 'SUV',
        price: 32000,
        vin: 'JM3KE4DY1G0000001',
      };

      const firstRes = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      expect(firstRes.status).toBe(201);

      const duplicateRes = await request(app)
        .post('/api/vehicles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(payload);
      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.message).toMatch(/already exists/i);
    });
  });

  describe('Vehicle Listing (GET /api/vehicles)', () => {
    it('should return all stored vehicles to an authenticated user', async () => {
      await Vehicle.create([
        {
          make: 'BMW',
          model: '330i',
          category: 'Sedan',
          year: 2023,
          price: 44000,
          quantity: 2,
          vin: 'WBA5R1C55KA000001',
          status: 'available',
        },
        {
          make: 'Audi',
          model: 'Q5',
          category: 'SUV',
          year: 2024,
          price: 48000,
          quantity: 1,
          vin: 'WA1BNAFY5P2000002',
          status: 'available',
        },
      ]);

      const res = await request(app)
        .get('/api/vehicles')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(res.body.map((v: any) => v.make)).toEqual(
        expect.arrayContaining(['Audi', 'BMW'])
      );
    });
  });

  describe('Vehicle Search (GET /api/vehicles/search)', () => {
    beforeEach(async () => {
      await Vehicle.create([
        {
          make: 'Toyota',
          model: 'Corolla',
          category: 'Sedan',
          year: 2022,
          price: 21000,
          quantity: 4,
          vin: '2T1BURHE7NC000001',
        },
        {
          make: 'Toyota',
          model: 'RAV4',
          category: 'SUV',
          year: 2023,
          price: 33000,
          quantity: 2,
          vin: 'JTMDFRFV6RD000002',
        },
        {
          make: 'Toyota',
          model: 'Highlander',
          category: 'SUV',
          year: 2024,
          price: 46000,
          quantity: 1,
          vin: '5TDZKRFH7RS000003',
        },
        {
          make: 'Honda',
          model: 'CR-V',
          category: 'SUV',
          year: 2023,
          price: 34000,
          quantity: 3,
          vin: '7FARW1H86PE000004',
        },
        {
          make: 'Tesla',
          model: 'Model 3 (Long Range)',
          category: 'Sedan',
          year: 2024,
          price: 47000,
          quantity: 2,
          vin: '5YJ3E1EB8RF000005',
        },
      ]);
    });

    it('should search vehicles by make case-insensitively', async () => {
      const res = await request(app)
        .get('/api/vehicles/search?make=toyota')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);
      expect(res.body.every((v: any) => v.make === 'Toyota')).toBe(true);
    });

    it('should search vehicles by model', async () => {
      const res = await request(app)
        .get('/api/vehicles/search?model=corolla')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].model).toBe('Corolla');
    });

    it('should search vehicles by category', async () => {
      const res = await request(app)
        .get('/api/vehicles/search?category=SUV')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3);
      expect(res.body.every((v: any) => v.category === 'SUV')).toBe(true);
    });

    it('should search vehicles combining make and category', async () => {
      const res = await request(app)
        .get('/api/vehicles/search?make=Toyota&category=Sedan')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].model).toBe('Corolla');
    });

    it('should support inclusive minPrice and maxPrice filtering', async () => {
      // Inclusive boundaries: 21000 and 34000 should both be included
      const res = await request(app)
        .get('/api/vehicles/search?minPrice=21000&maxPrice=34000')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(3); // Corolla (21k), RAV4 (33k), CR-V (34k)
      const prices = res.body.map((v: any) => v.price);
      expect(prices).toContain(21000);
      expect(prices).toContain(33000);
      expect(prices).toContain(34000);
    });

    it('should safely handle special regex characters in search parameters without error', async () => {
      const res = await request(app)
        .get('/api/vehicles/search?model=Model%203%20(Long%20Range)')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.length).toBe(1);
      expect(res.body[0].make).toBe('Tesla');

      // Wildcard regex injection characters should not crash
      const resSpecial = await request(app)
        .get('/api/vehicles/search?make=[.*+?^${}()|%5B%5D%5C%5D')
        .set('Authorization', `Bearer ${userToken}`);

      expect(resSpecial.status).toBe(200);
      expect(resSpecial.body.length).toBe(0);
    });

    it('should reject invalid search prices where minPrice > maxPrice or negative', async () => {
      const resMinGreater = await request(app)
        .get('/api/vehicles/search?minPrice=50000&maxPrice=20000')
        .set('Authorization', `Bearer ${userToken}`);

      expect(resMinGreater.status).toBe(400);
      expect(resMinGreater.body.message).toBe('Validation failed');

      const resNegative = await request(app)
        .get('/api/vehicles/search?minPrice=-100')
        .set('Authorization', `Bearer ${userToken}`);

      expect(resNegative.status).toBe(400);
    });
  });

  describe('Vehicle Updates (PUT /api/vehicles/:id)', () => {
    let testVehicleId: string;

    beforeEach(async () => {
      const vehicle = await Vehicle.create({
        make: 'Nissan',
        model: 'Altima',
        category: 'Sedan',
        year: 2021,
        price: 19500,
        quantity: 2,
        vin: '1N4AL3AP8MC000001',
        status: 'available',
      });
      testVehicleId = vehicle._id.toString();
    });

    it('should update a valid vehicle and change its fields', async () => {
      const res = await request(app)
        .put(`/api/vehicles/${testVehicleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          price: 21000,
          quantity: 5,
          status: 'reserved',
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Vehicle updated successfully');
      expect(res.body.vehicle.price).toBe(21000);
      expect(res.body.vehicle.quantity).toBe(5);
      expect(res.body.vehicle.status).toBe('reserved');

      // Verify directly in DB
      const updatedInDb = await Vehicle.findById(testVehicleId);
      expect(updatedInDb!.price).toBe(21000);
      expect(updatedInDb!.quantity).toBe(5);
      expect(updatedInDb!.status).toBe('reserved');
      expect(updatedInDb!.make).toBe('Nissan'); // Untouched field remains
    });

    it('should reject updates with negative price or fractional quantity with 400', async () => {
      const resNegativePrice = await request(app)
        .put(`/api/vehicles/${testVehicleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: -100 });
      expect(resNegativePrice.status).toBe(400);

      const resFractionalQuantity = await request(app)
        .put(`/api/vehicles/${testVehicleId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ quantity: 3.2 });
      expect(resFractionalQuantity.status).toBe(400);
    });

    it('should return 400 for an invalid MongoDB ID format on update', async () => {
      const res = await request(app)
        .put('/api/vehicles/invalid-mongo-id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 20000 });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid vehicle ID format');
    });

    it('should return 404 when updating a nonexistent vehicle', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .put(`/api/vehicles/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ price: 25000 });

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Vehicle not found');
    });
  });

  describe('Vehicle Deletion (DELETE /api/vehicles/:id)', () => {
    let vehicleToDeleteId: string;
    let vehicleToKeepId: string;

    beforeEach(async () => {
      const v1 = await Vehicle.create({
        make: 'Subaru',
        model: 'Outback',
        category: 'Wagon',
        year: 2022,
        price: 29000,
        quantity: 1,
        vin: '4S4BSANC6N3000001',
      });
      const v2 = await Vehicle.create({
        make: 'Subaru',
        model: 'Forester',
        category: 'SUV',
        year: 2023,
        price: 31000,
        quantity: 2,
        vin: 'JF2SKAHC7PH000002',
      });

      vehicleToDeleteId = v1._id.toString();
      vehicleToKeepId = v2._id.toString();
    });

    it('should return 403 when deleting as a regular user', async () => {
      const res = await request(app)
        .delete(`/api/vehicles/${vehicleToDeleteId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Admin access required');

      // Ensure vehicle is still in database
      const vehicle = await Vehicle.findById(vehicleToDeleteId);
      expect(vehicle).not.toBeNull();
    });

    it('should remove the correct vehicle when deleting as an admin', async () => {
      const res = await request(app)
        .delete(`/api/vehicles/${vehicleToDeleteId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Vehicle deleted successfully');

      // Verify vehicle was deleted
      const deletedInDb = await Vehicle.findById(vehicleToDeleteId);
      expect(deletedInDb).toBeNull();

      // Verify other vehicle still exists
      const keptInDb = await Vehicle.findById(vehicleToKeepId);
      expect(keptInDb).not.toBeNull();
      expect(keptInDb!.model).toBe('Forester');
    });

    it('should return 400 for an invalid MongoDB ID format on delete', async () => {
      const res = await request(app)
        .delete('/api/vehicles/not-a-valid-id')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid vehicle ID format');
    });

    it('should return 404 when deleting a nonexistent vehicle', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .delete(`/api/vehicles/${nonExistentId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Vehicle not found');
    });
  });

  describe('Get Single Vehicle (GET /api/vehicles/:id)', () => {
    it('should return a vehicle by its ID to an authenticated user', async () => {
      const vehicle = await Vehicle.create({
        make: 'Volvo',
        model: 'XC60',
        category: 'SUV',
        year: 2024,
        price: 52000,
        quantity: 1,
        vin: 'YV4A22PK6R1000001',
      });

      const res = await request(app)
        .get(`/api/vehicles/${vehicle._id}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body.model).toBe('XC60');
      expect(res.body.make).toBe('Volvo');
    });

    it('should return 400 for invalid MongoDB ID format', async () => {
      const res = await request(app)
        .get('/api/vehicles/bad-format-id')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('Invalid vehicle ID format');
    });

    it('should return 404 for nonexistent vehicle ID', async () => {
      const nonExistentId = new mongoose.Types.ObjectId().toString();

      const res = await request(app)
        .get(`/api/vehicles/${nonExistentId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('Vehicle not found');
    });
  });
});
