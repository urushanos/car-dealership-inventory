import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import app from '../src/app.js';
import { User } from '../src/models/User.js';
import { seedAdmin } from '../scripts/seedAdmin.js';

describe('Phase 2 — Authentication & Authorization Tests', () => {
  let mongoServer: MongoMemoryServer;
  const JWT_SECRET = 'test-secret-key-12345';

  beforeAll(async () => {
    process.env.JWT_SECRET = JWT_SECRET;
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    process.env.MONGODB_URI = mongoUri;
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    if (mongoServer) {
      await mongoServer.stop();
    }
  });

  beforeEach(async () => {
    await User.deleteMany({});
  });

  describe('User Registration (POST /api/auth/register)', () => {
    it('should create a user with a hashed password on valid registration', async () => {
      const payload = {
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'SecurePassword123!',
      };

      const res = await request(app).post('/api/auth/register').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.name).toBe('Jane Doe');
      expect(res.body.user.email).toBe('jane@example.com');
      expect(res.body.user.role).toBe('user');
      expect(res.body.user.passwordHash).toBeUndefined();
      expect(res.body.user.password).toBeUndefined();

      // Verify directly in database
      const userInDb = await User.findOne({ email: 'jane@example.com' });
      expect(userInDb).not.toBeNull();
      expect(userInDb!.passwordHash).toBeDefined();
      expect(userInDb!.passwordHash).not.toBe('SecurePassword123!');
      const passwordMatches = await bcrypt.compare('SecurePassword123!', userInDb!.passwordHash);
      expect(passwordMatches).toBe(true);
    });

    it('should return 409 Conflict when registering with a duplicate email', async () => {
      const payload = {
        name: 'Jane Doe',
        email: 'duplicate@example.com',
        password: 'Password123!',
      };

      const firstRes = await request(app).post('/api/auth/register').send(payload);
      expect(firstRes.status).toBe(201);

      // Attempt duplicate registration (even with different casing)
      const duplicateRes = await request(app).post('/api/auth/register').send({
        name: 'Another User',
        email: 'DUPLICATE@example.com',
        password: 'Password456!',
      });

      expect(duplicateRes.status).toBe(409);
      expect(duplicateRes.body.message).toMatch(/already/i);
    });

    it('should return 400 Bad Request on invalid registration data', async () => {
      // Missing name
      const res1 = await request(app).post('/api/auth/register').send({
        email: 'invalid@example.com',
        password: 'Password123!',
      });
      expect(res1.status).toBe(400);

      // Invalid email
      const res2 = await request(app).post('/api/auth/register').send({
        name: 'Valid Name',
        email: 'not-an-email',
        password: 'Password123!',
      });
      expect(res2.status).toBe(400);

      // Short password (< 6 characters)
      const res3 = await request(app).post('/api/auth/register').send({
        name: 'Valid Name',
        email: 'valid@example.com',
        password: '123',
      });
      expect(res3.status).toBe(400);
    });

    it('should prevent public registration from granting administrator privileges', async () => {
      const payload = {
        name: 'Privilege Escalation Attempt',
        email: 'attacker@example.com',
        password: 'Password123!',
        role: 'admin',
      };

      const res = await request(app).post('/api/auth/register').send(payload);

      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe('user');

      // Check database to ensure role remains 'user'
      const userInDb = await User.findOne({ email: 'attacker@example.com' });
      expect(userInDb).not.toBeNull();
      expect(userInDb!.role).toBe('user');
    });
  });

  describe('User Login (POST /api/auth/login)', () => {
    beforeEach(async () => {
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash('CorrectPassword123!', salt);
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        passwordHash,
        role: 'user',
      });
    });

    it('should validate credentials and issue a usable JWT on valid login', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'existing@example.com',
        password: 'CorrectPassword123!',
      });

      expect(res.status).toBe(200);
      expect(res.body.token).toBeDefined();
      expect(typeof res.body.token).toBe('string');
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('existing@example.com');
      expect(res.body.user.role).toBe('user');

      // Verify the JWT payload
      const decoded = jwt.verify(res.body.token, JWT_SECRET) as any;
      expect(decoded.sub).toBeDefined();
      expect(decoded.role).toBe('user');
      expect(decoded.exp).toBeDefined();

      // Check that the token is usable on protected endpoint
      const meRes = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${res.body.token}`);
      expect(meRes.status).toBe(200);
      expect(meRes.body.user.email).toBe('existing@example.com');
    });

    it('should return a generic 401 Unauthorized for incorrect credentials', async () => {
      // Wrong password
      const resWrongPassword = await request(app).post('/api/auth/login').send({
        email: 'existing@example.com',
        password: 'WrongPassword!',
      });
      expect(resWrongPassword.status).toBe(401);
      expect(resWrongPassword.body.message).toMatch(/invalid|unauthorized/i);

      // Non-existent email
      const resNonExistent = await request(app).post('/api/auth/login').send({
        email: 'nonexistent@example.com',
        password: 'CorrectPassword123!',
      });
      expect(resNonExistent.status).toBe(401);
      expect(resNonExistent.body.message).toMatch(/invalid|unauthorized/i);
    });

    it('should return 400 Bad Request for malformed login input', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'not-an-email',
      });
      expect(res.status).toBe(400);
    });
  });

  describe('JWT Validation & Middleware (authenticate)', () => {
    it('should reject requests with missing token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Unauthorized');
    });

    it('should reject requests with invalid token format or bad signature', async () => {
      const resBadToken = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer totally-invalid-token');
      expect(resBadToken.status).toBe(401);
      expect(resBadToken.body.message).toBe('Invalid or expired token');

      // Bad signature (signed with different secret)
      const wrongSecretToken = jwt.sign({ sub: '12345', role: 'user' }, 'wrong-secret');
      const resWrongSecret = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${wrongSecretToken}`);
      expect(resWrongSecret.status).toBe(401);
      expect(resWrongSecret.body.message).toBe('Invalid or expired token');
    });

    it('should reject requests with expired tokens', async () => {
      // Create already expired token
      const expiredToken = jwt.sign(
        { sub: '12345', role: 'user' },
        JWT_SECRET,
        { expiresIn: '-1s' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${expiredToken}`);
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid or expired token');
    });

    it('should reject tokens with unrecognized role payload', async () => {
      const invalidRoleToken = jwt.sign(
        { sub: '12345', role: 'guest' },
        JWT_SECRET,
        { expiresIn: '30m' }
      );

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${invalidRoleToken}`);
      expect(res.status).toBe(401);
      expect(res.body.message).toBe('Invalid token');
    });
  });

  describe('Admin Authorization (authorizeAdmin)', () => {
    it('should forbid regular users from accessing admin-only operations', async () => {
      const userToken = jwt.sign(
        { sub: 'regular-user-id', role: 'user' },
        JWT_SECRET,
        { expiresIn: '30m' }
      );

      const res = await request(app)
        .get('/api/auth/admin-only')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.message).toBe('Admin access required');
    });

    it('should allow admin users to access admin-only operations', async () => {
      const adminToken = jwt.sign(
        { sub: 'admin-user-id', role: 'admin' },
        JWT_SECRET,
        { expiresIn: '30m' }
      );

      const res = await request(app)
        .get('/api/auth/admin-only')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Admin access granted');
    });
  });

  describe('Admin Seeding (scripts/seedAdmin.ts)', () => {
    it('should seed an admin user with hashed password and allow login', async () => {
      const adminEmail = 'testadmin@dealership.com';
      const adminPassword = 'AdminSecretPass123!';

      await seedAdmin({
        email: adminEmail,
        password: adminPassword,
        name: 'Initial Admin',
      });

      const adminUser = await User.findOne({ email: adminEmail });
      expect(adminUser).not.toBeNull();
      expect(adminUser!.role).toBe('admin');
      expect(adminUser!.name).toBe('Initial Admin');

      // Verify hashed password
      const passwordMatch = await bcrypt.compare(adminPassword, adminUser!.passwordHash);
      expect(passwordMatch).toBe(true);

      // Verify admin can login
      const loginRes = await request(app).post('/api/auth/login').send({
        email: adminEmail,
        password: adminPassword,
      });

      expect(loginRes.status).toBe(200);
      expect(loginRes.body.user.role).toBe('admin');

      // Verify admin token can access admin-only endpoint
      const adminRes = await request(app)
        .get('/api/auth/admin-only')
        .set('Authorization', `Bearer ${loginRes.body.token}`);
      expect(adminRes.status).toBe(200);

      // Re-running seedAdmin should not duplicate or error
      await seedAdmin({
        email: adminEmail,
        password: adminPassword,
        name: 'Initial Admin',
      });
      const count = await User.countDocuments({ email: adminEmail });
      expect(count).toBe(1);
    });
  });
});
