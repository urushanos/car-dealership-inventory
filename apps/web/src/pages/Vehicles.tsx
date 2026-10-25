import { useEffect, useState } from "react";
import { AlertCircle, Car } from "lucide-react";
import VehicleCard from "../components/VehicleCard";
import VehicleFilters from "../components/VehicleFilters";
import { useAuth } from "../context/AuthContext";
import { listVehicles, searchVehicles } from "../lib/api";
import type { Vehicle, VehicleFilters as Filters } from "../types/vehicle";

const emptyForm = {
  make: "",
  model: "",
  category: "",
  minPrice: "",
  maxPrice: "",
};

export default function Vehicles() {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [filters, setFilters] = useState(emptyForm);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async (next?: Filters) => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const data = next ? await searchVehicles(token, next) : await listVehicles(token);
      setVehicles(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [token]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900">Vehicle inventory</h1>
        <p className="mt-1 text-slate-500">Search, filter, and purchase vehicles currently in stock.</p>
      </div>

      <VehicleFilters
        value={filters}
        onChange={setFilters}
        onApply={(next) => void load(next)}
      />

      {loading && (
        <p className="mt-10 text-center text-slate-500">Loading inventory...</p>
      )}

      {!loading && error && (
        <div className="mt-10 flex items-center justify-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          {error}
        </div>
      )}

      {!loading && !error && vehicles.length === 0 && (
        <div className="mt-16 flex flex-col items-center text-slate-500">
          <Car className="mb-3 h-10 w-10" />
          <p>No vehicles match these filters.</p>
        </div>
      )}

      {!loading && !error && vehicles.length > 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              vehicle={vehicle}
              token={token!}
              onPurchased={(updated) =>
                setVehicles((current) =>
                  current.map((item) => (item.id === updated.id ? updated : item))
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
