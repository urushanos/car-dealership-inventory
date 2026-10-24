import express from 'express';
import type { Express, Request, Response } from 'express'; 
import cors from 'cors';
import { Vehicle } from './models/Vehicle.js';
import authRoutes from './routes/auth.routes.js';

const app: Express = express();

// Standard Operational Middlewares
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Mount authentication and authorization routes
app.use('/api/auth', authRoutes);

// API Status / Health Assessment Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Sample Dynamic Endpoint showing model integration
app.get('/api/vehicles', async (req: Request, res: Response) => {
  try {
    const inventory = await Vehicle.find({});
    res.status(200).json(inventory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch inventory dataset.' });
  }
});

// Export the setup context safely for integration testing frameworks (Supertest)
export default app;
