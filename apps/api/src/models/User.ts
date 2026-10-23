import { Schema, model } from 'mongoose';
import type { Document } from 'mongoose'; 

export interface IUser extends Document {
  name: string;
  email: string;
  role: 'admin' | 'sales' | 'customer';
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    role: { type: String, enum: ['admin', 'sales', 'customer'], default: 'customer' },
  },
  { timestamps: true }
);

export const User = model<IUser>('User', UserSchema);
