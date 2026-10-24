import { Vehicle, type IVehicle } from '../models/Vehicle.js';
import type {
  CreateVehicleInput,
  UpdateVehicleInput,
} from '../schemas/vehicle.schema.js';

export class DuplicateVinError extends Error {
  constructor(message: string = 'A vehicle with this VIN already exists') {
    super(message);
    this.name = 'DuplicateVinError';
  }
}

export type SearchFilters = {
  make?: string | undefined;
  model?: string | undefined;
  category?: string | undefined;
  minPrice?: number | undefined;
  maxPrice?: number | undefined;
};

function generateUniqueVin(): string {
  const chars = '0123456789ABCDEFGHJKLMNPRSTUVWXYZ';
  let vin = '1HG';
  for (let i = 0; i < 14; i++) {
    vin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return vin;
}

export async function searchVehicles(filters: SearchFilters): Promise<IVehicle[]> {
  const query: Record<string, unknown> = {};

  for (const key of ['make', 'model', 'category'] as const) {
    const value = filters[key];
    if (value) {
      query[key] = {
        $regex: value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        $options: 'i',
      };
    }
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    const price: Record<string, number> = {};

    if (filters.minPrice !== undefined) price.$gte = filters.minPrice;
    if (filters.maxPrice !== undefined) price.$lte = filters.maxPrice;

    query.price = price;
  }

  return Vehicle.find(query).sort({ make: 1, model: 1 }).limit(100);
}

export async function getAllVehicles(): Promise<IVehicle[]> {
  return Vehicle.find({}).sort({ make: 1, model: 1 });
}

export async function getVehicleById(id: string): Promise<IVehicle | null> {
  return Vehicle.findById(id);
}

export async function createVehicle(input: CreateVehicleInput): Promise<IVehicle> {
  const vin = input.vin ? input.vin.trim().toUpperCase() : generateUniqueVin();

  try {
    const vehicle = await Vehicle.create({
      make: input.make.trim(),
      model: input.model.trim(),
      category: input.category.trim(),
      price: input.price,
      quantity: input.quantity ?? 1,
      year: input.year ?? new Date().getFullYear(),
      vin,
      status: input.status ?? 'available',
    });

    return vehicle;
  } catch (error: any) {
    if (error?.code === 11000) {
      throw new DuplicateVinError();
    }
    throw error;
  }
}

export async function updateVehicle(
  id: string,
  input: UpdateVehicleInput
): Promise<IVehicle | null> {
  const updateData: Partial<IVehicle> = {};

  if (input.make !== undefined) updateData.make = input.make.trim();
  if (input.model !== undefined) updateData.model = input.model.trim();
  if (input.category !== undefined) updateData.category = input.category.trim();
  if (input.price !== undefined) updateData.price = input.price;
  if (input.quantity !== undefined) updateData.quantity = input.quantity;
  if (input.year !== undefined) updateData.year = input.year;
  if (input.status !== undefined) updateData.status = input.status;
  if (input.vin !== undefined) updateData.vin = input.vin.trim().toUpperCase();

  try {
    const updated = await Vehicle.findByIdAndUpdate(
      id,
      { $set: updateData },
      { returnDocument: 'after', runValidators: true }
    );

    return updated;
  } catch (error: any) {
    if (error?.code === 11000) {
      throw new DuplicateVinError();
    }
    throw error;
  }
}

export async function deleteVehicle(id: string): Promise<IVehicle | null> {
  return Vehicle.findByIdAndDelete(id);
}

export const vehicleService = {
  searchVehicles,
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle
};