export type VehicleStatus = "available" | "sold" | "reserved";

export interface Vehicle {
  id: string;
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
  year?: number;
  vin?: string;
  status?: VehicleStatus;
}

export interface VehiclePayload {
  make: string;
  model: string;
  category: string;
  price: number;
  quantity?: number;
  year?: number;
  vin?: string;
  status?: VehicleStatus;
}

export interface VehicleFilters {
  make?: string;
  model?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface User {
  id: string;
  name?: string;
  email: string;
  role: "admin" | "user";
}

export interface AuthResponse {
  message?: string;
  token: string;
  user: User;
}
