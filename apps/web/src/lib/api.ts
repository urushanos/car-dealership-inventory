import type {
  AuthResponse,
  User,
  Vehicle,
  VehicleFilters,
  VehiclePayload,
} from "../types/vehicle";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:5000/api";

type ApiEnvelope = {
  message?: string;
  user?: User;
  token?: string;
  vehicle?: RawVehicle;
  errors?: unknown;
};

type RawVehicle = {
  id?: string;
  _id?: string;
  make: string;
  model: string;
  category: string;
  price: number;
  quantity: number;
  year?: number;
  vin?: string;
  status?: Vehicle["status"];
};

export function normalizeVehicle(raw: RawVehicle): Vehicle {
  return {
    id: String(raw.id ?? raw._id),
    make: raw.make,
    model: raw.model,
    category: raw.category,
    price: raw.price,
    quantity: raw.quantity,
    year: raw.year,
    vin: raw.vin,
    status: raw.status,
  };
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  if (!API_URL) {
    throw new Error("VITE_API_URL is not configured");
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    cache: "no-store",
  });

  if (response.status === 204) {
    return {} as T;
  }

  const body = (await response.json().catch(() => ({}))) as ApiEnvelope;

  if (!response.ok) {
    throw new Error(body.message ?? `Request failed: ${response.status}`);
  }

  return body as T;
}

export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}) {
  return apiRequest<{ message: string; user: User }>("/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function loginUser(input: { email: string; password: string }) {
  return apiRequest<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function listVehicles(token: string) {
  const vehicles = await apiRequest<RawVehicle[]>("/vehicles", {}, token);
  return vehicles.map(normalizeVehicle);
}

export async function searchVehicles(token: string, filters: VehicleFilters) {
  const params = new URLSearchParams();
  if (filters.make) params.set("make", filters.make);
  if (filters.model) params.set("model", filters.model);
  if (filters.category) params.set("category", filters.category);
  if (filters.minPrice !== undefined) params.set("minPrice", String(filters.minPrice));
  if (filters.maxPrice !== undefined) params.set("maxPrice", String(filters.maxPrice));

  const query = params.toString();
  const path = query ? `/vehicles/search?${query}` : "/vehicles";
  const vehicles = await apiRequest<RawVehicle[]>(path, {}, token);
  return vehicles.map(normalizeVehicle);
}

export async function purchaseVehicle(token: string, id: string) {
  const body = await apiRequest<RawVehicle & { vehicle?: RawVehicle }>(
    `/vehicles/${id}/purchase`,
    { method: "POST" },
    token
  );
  return normalizeVehicle(body.vehicle ?? body);
}

export async function createVehicle(token: string, payload: VehiclePayload) {
  const body = await apiRequest<{ vehicle: RawVehicle }>(
    "/vehicles",
    { method: "POST", body: JSON.stringify(payload) },
    token
  );
  return normalizeVehicle(body.vehicle);
}

export async function updateVehicle(
  token: string,
  id: string,
  payload: Partial<VehiclePayload>
) {
  const body = await apiRequest<{ vehicle: RawVehicle }>(
    `/vehicles/${id}`,
    { method: "PUT", body: JSON.stringify(payload) },
    token
  );
  return normalizeVehicle(body.vehicle);
}

export async function deleteVehicle(token: string, id: string) {
  return apiRequest<{ message: string }>(`/vehicles/${id}`, { method: "DELETE" }, token);
}

export async function restockVehicle(token: string, id: string, quantity: number) {
  const body = await apiRequest<RawVehicle & { vehicle?: RawVehicle }>(
    `/vehicles/${id}/restock`,
    { method: "POST", body: JSON.stringify({ quantity }) },
    token
  );
  return normalizeVehicle(body.vehicle ?? body);
}
