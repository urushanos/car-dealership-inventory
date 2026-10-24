import { Schema, model } from 'mongoose';

export interface IVehicle {
  make: string;
  model: string;
  category: string;
  year: number;
  price: number;
  quantity: number;
  vin: string;
  status: 'available' | 'sold' | 'reserved';
  createdAt?: Date;
  updatedAt?: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true, default: 'Sedan' },
    year: { type: Number, required: true, min: 1900, default: () => new Date().getFullYear() },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 0, default: 1 },
    vin: { type: String, required: true, unique: true, uppercase: true, trim: true },
    status: { type: String, enum: ['available', 'sold', 'reserved'], default: 'available' },
  },
  { timestamps: true }
);

VehicleSchema.index({ make: 1, model: 1 });
VehicleSchema.index({ category: 1 });
VehicleSchema.index({ price: 1 });

export const Vehicle = model<IVehicle>('Vehicle', VehicleSchema);
