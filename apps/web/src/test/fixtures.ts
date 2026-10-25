import type { User, Vehicle } from '../types/vehicle';

export const vehicle: Vehicle = {
  id: 'vehicle-1', make: 'Toyota', model: 'Corolla', category: 'Sedan',
  price: 1250000, quantity: 3, year: 2024, vin: 'VIN123', status: 'available',
};
export const outOfStockVehicle: Vehicle = { ...vehicle, id: 'vehicle-2', quantity: 0 };
export const user: User = { id: 'user-1', name: 'Test User', email: 'user@example.com', role: 'user' };
export const admin: User = { ...user, id: 'admin-1', role: 'admin' };
