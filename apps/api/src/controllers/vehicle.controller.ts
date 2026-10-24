import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import {
  createVehicleSchema,
  updateVehicleSchema,
  searchVehicleSchema,
} from '../schemas/vehicle.schema.js';
import {
  vehicleService,
  DuplicateVinError,
} from '../services/vehicle.service.js';

export async function getAllVehicles(req: Request, res: Response) {
  try {
    const vehicles = await vehicleService.getAllVehicles();
    return res.status(200).json(vehicles);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function searchVehiclesHandler(req: Request, res: Response) {
  const parsed = searchVehicleSchema.safeParse(req.query);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: parsed.error.issues,
    });
  }

  try {
    const vehicles = await vehicleService.searchVehicles(parsed.data);
    return res.status(200).json(vehicles);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function getVehicleById(req: Request, res: Response) {
  const id = req.params.id;

  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid vehicle ID format' });
  }

  try {
    const vehicle = await vehicleService.getVehicleById(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    return res.status(200).json(vehicle);
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export async function createVehicle(req: Request, res: Response) {
  const parsed = createVehicleSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: parsed.error.issues,
    });
  }

  try {
    const vehicle = await vehicleService.createVehicle(parsed.data);
    return res.status(201).json({
      message: 'Vehicle created successfully',
      vehicle,
    });
  } catch (error: any) {
    if (error instanceof DuplicateVinError || error?.code === 11000) {
      return res.status(409).json({
        message: 'A vehicle with this VIN already exists',
      });
    }

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}

export async function updateVehicle(req: Request, res: Response) {
  const id = req.params.id;

  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid vehicle ID format' });
  }

  const parsed = updateVehicleSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: 'Validation failed',
      errors: parsed.error.issues,
    });
  }

  try {
    const vehicle = await vehicleService.updateVehicle(id, parsed.data);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    return res.status(200).json({
      message: 'Vehicle updated successfully',
      vehicle,
    });
  } catch (error: any) {
    if (error instanceof DuplicateVinError || error?.code === 11000) {
      return res.status(409).json({
        message: 'A vehicle with this VIN already exists',
      });
    }

    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}

export async function deleteVehicle(req: Request, res: Response) {
  const id = req.params.id;

  if (!id || typeof id !== 'string' || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'Invalid vehicle ID format' });
  }

  try {
    const vehicle = await vehicleService.deleteVehicle(id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    return res.status(200).json({
      message: 'Vehicle deleted successfully',
      vehicle,
    });
  } catch (error) {
    return res.status(500).json({
      message: 'Internal server error',
    });
  }
}
