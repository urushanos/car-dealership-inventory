import { Schema, model } from 'mongoose';

export interface IVehicle {
  make: string;
  model: string;
  year: number;
  price: number;
  vin: string;
  status: 'available' | 'sold' | 'reserved';
  createdAt: Date;
}

const VehicleSchema = new Schema<IVehicle>(
  {
    make: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    year: { type: Number, required: true, min: 1900 },
    price: { type: Number, required: true, min: 0 },
    vin: { type: String, required: true, unique: true, uppercase: true, trim: true },
    status: { type: String, enum: ['available', 'sold', 'reserved'], default: 'available' },
  },
  { timestamps: true }
);

export const Vehicle = model<IVehicle>('Vehicle', VehicleSchema);
