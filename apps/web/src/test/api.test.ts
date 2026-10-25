import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { apiRequest, normalizeVehicle, registerUser, loginUser, listVehicles, searchVehicles, purchaseVehicle, createVehicle, updateVehicle, deleteVehicle, restockVehicle } from "../lib/api";

const vehicleResponse = {
  id: "vehicle-1",
  make: "Toyota",
  model: "Camry",
  category: "Sedan",
  price: 2500000,
  quantity: 5,
  year: 2024,
};

function mockResponse(
  body: unknown,
  status = 200,
  statusText = "OK"
) {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText,
    json: vi.fn().mockResolvedValue(body),
  } as unknown as Response;
}

describe("API client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("normalizes a vehicle with an id field", () => {
    expect(normalizeVehicle(vehicleResponse)).toEqual(vehicleResponse);
  });

  it("normalizes MongoDB _id into a string id", () => {
    const normalized = normalizeVehicle({
      _id: "mongo-id",
      make: "Honda",
      model: "City",
      category: "Sedan",
      price: 1200000,
      quantity: 2,
    });

    expect(normalized.id).toBe("mongo-id");
    expect(normalized.make).toBe("Honda");
  });

  it("sends JSON headers and a bearer token", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({ message: "OK" })
    );

    await apiRequest("/vehicles", {}, "sample-token");

    expect(fetch).toHaveBeenCalledWith(
      "/api/vehicles",
      expect.objectContaining({
        headers: expect.objectContaining({
          "Content-Type": "application/json",
          Authorization: "Bearer sample-token",
        }),
        cache: "no-store",
      })
    );
  });

  it("does not send an authorization header without a token", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse([]));

    await apiRequest("/vehicles");

    const options = vi.mocked(fetch).mock.calls[0][1] as RequestInit;

    expect(options.headers).not.toHaveProperty("Authorization");
  });

  it("handles HTTP 204 responses", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse(null, 204, "No Content")
    );

    await expect(apiRequest("/vehicles/vehicle-1", {
      method: "DELETE",
    })).resolves.toEqual({});
  });

  it("throws the API error message for unsuccessful requests", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({ message: "Vehicle not found" }, 404, "Not Found")
    );

    await expect(apiRequest("/vehicles/missing"))
      .rejects.toThrow("Vehicle not found");
  });

  it("uses a fallback message when the server returns no message", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({}, 500, "Internal Server Error")
    );

    await expect(apiRequest("/vehicles"))
      .rejects.toThrow("Request failed: 500");
  });

  it("registers a user using POST", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({ message: "Registered", user: { id: "u1" } })
    );

    await registerUser({
      name: "Test User",
      email: "test@example.com",
      password: "Password123",
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/register",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          name: "Test User",
          email: "test@example.com",
          password: "Password123",
        }),
      })
    );
  });

  it("logs in a user using POST", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({
        token: "jwt-token",
        user: { id: "u1", email: "test@example.com", role: "user" },
      })
    );

    const result = await loginUser({
      email: "test@example.com",
      password: "Password123",
    });

    expect(result.token).toBe("jwt-token");
    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/login",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("lists vehicles using the authentication token", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse([vehicleResponse])
    );

    const result = await listVehicles("jwt-token");

    expect(result).toHaveLength(1);
    expect(result[0].make).toBe("Toyota");

    expect(fetch).toHaveBeenCalledWith(
      "/api/vehicles",
      expect.objectContaining({
        headers: expect.objectContaining({
          Authorization: "Bearer jwt-token",
        }),
      })
    );
  });

  it("searches vehicles with encoded filter query parameters", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse([vehicleResponse])
    );

    await searchVehicles("jwt-token", {
      make: "Toyota",
      category: "Sedan",
      minPrice: 1000000,
      maxPrice: 3000000,
    });

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/vehicles/search?"),
      expect.any(Object)
    );

    const calledUrl = vi.mocked(fetch).mock.calls[0][0] as string;
    const query = new URL(
      calledUrl,
      "http://localhost"
    ).searchParams;

    expect(query.get("make")).toBe("Toyota");
    expect(query.get("category")).toBe("Sedan");
    expect(query.get("minPrice")).toBe("1000000");
    expect(query.get("maxPrice")).toBe("3000000");
  });

  it("uses the vehicle list endpoint when no search filters are provided", async () => {
    vi.mocked(fetch).mockResolvedValue(mockResponse([]));

    await searchVehicles("jwt-token", {});

    expect(fetch).toHaveBeenCalledWith(
      "/api/vehicles",
      expect.any(Object)
    );
  });

  it("purchases a vehicle using POST", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({ vehicle: { ...vehicleResponse, quantity: 4 } })
    );

    const result = await purchaseVehicle("jwt-token", "vehicle-1");

    expect(result.quantity).toBe(4);
    expect(fetch).toHaveBeenCalledWith(
      "/api/vehicles/vehicle-1/purchase",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("creates a vehicle using POST", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({ vehicle: vehicleResponse })
    );

    await createVehicle("jwt-token", {
      make: "Toyota",
      model: "Camry",
      category: "Sedan",
      price: 2500000,
      quantity: 5,
    });

    expect(fetch).toHaveBeenCalledWith(
      "/api/vehicles",
      expect.objectContaining({ method: "POST" })
    );
  });

  it("updates a vehicle using PUT", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({ vehicle: { ...vehicleResponse, price: 2600000 } })
    );

    const result = await updateVehicle("jwt-token", "vehicle-1", {
      price: 2600000,
    });

    expect(result.price).toBe(2600000);
    expect(fetch).toHaveBeenCalledWith(
      "/api/vehicles/vehicle-1",
      expect.objectContaining({ method: "PUT" })
    );
  });

  it("deletes a vehicle using DELETE", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({ message: "Vehicle deleted" })
    );

    await deleteVehicle("jwt-token", "vehicle-1");

    expect(fetch).toHaveBeenCalledWith(
      "/api/vehicles/vehicle-1",
      expect.objectContaining({ method: "DELETE" })
    );
  });

  it("restocks a vehicle using POST with the requested quantity", async () => {
    vi.mocked(fetch).mockResolvedValue(
      mockResponse({ vehicle: { ...vehicleResponse, quantity: 10 } })
    );

    const result = await restockVehicle("jwt-token", "vehicle-1", 5);

    expect(result.quantity).toBe(10);
    expect(fetch).toHaveBeenCalledWith(
      "/api/vehicles/vehicle-1/restock",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ quantity: 5 }),
      })
    );
  });
});