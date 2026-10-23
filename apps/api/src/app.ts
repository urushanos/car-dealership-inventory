import express from 'express';
import type { Express, Request, Response } from 'express'; 
import cors from 'cors';
import { Vehicle } from './models/Vehicle.js';

const app: Express = express();

// Standard Operational Middlewares
app.use(cors());
app.use(express.json());

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
