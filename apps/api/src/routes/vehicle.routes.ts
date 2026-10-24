import { Router } from 'express';
import {
  getAllVehicles,
  searchVehiclesHandler,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
} from '../controllers/vehicle.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorizeAdmin } from '../middleware/authorizeAdmin.js';

const router = Router();

// Protected read endpoints (all authenticated users)
router.get('/', authenticate, getAllVehicles);
router.get('/search', authenticate, searchVehiclesHandler);
router.get('/:id', authenticate, getVehicleById);

// Protected mutation endpoints (admin-only)
router.post('/', authenticate, authorizeAdmin, createVehicle);
router.put('/:id', authenticate, authorizeAdmin, updateVehicle);
router.delete('/:id', authenticate, authorizeAdmin, deleteVehicle);

export default router;