import express from 'express';
import type { Express, Request, Response } from 'express'; 
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app: Express = express();

// Standard Operational Middlewares
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Mount authentication and authorization routes
app.use('/api/auth', authRoutes);

// Mount vehicle inventory routes
app.use('/api/vehicles', vehicleRoutes);

// API Status / Health Assessment Endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// Common error handler middleware
app.use(errorHandler);

// Export the setup context safely for integration testing frameworks (Supertest)
export default app;
