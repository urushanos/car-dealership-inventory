import { useState } from "react";
import { Car, LoaderCircle } from "lucide-react";
import type { Vehicle } from "../types/vehicle";
import { purchaseVehicle } from "../lib/api";

export function formatInr(price: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(price);
}

interface Props {
  vehicle: Vehicle;
  token: string;
  onPurchased: (vehicle: Vehicle) => void;
}

export default function VehicleCard({ vehicle, token, onPurchased }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const outOfStock = vehicle.quantity === 0;

  const handlePurchase = async () => {
    setError("");
    setLoading(true);
    try {
      const updated = await purchaseVehicle(token, vehicle.id);
      onPurchased(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Purchase failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex h-36 items-center justify-center bg-gradient-to-br from-slate-800 to-[#0b1b33] text-white">
        <Car className="h-12 w-12 text-emerald-400" />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {vehicle.category}
          {vehicle.year ? ` · ${vehicle.year}` : ""}
        </p>
        <h3 className="mt-1 text-lg font-bold text-slate-900">
          {vehicle.make} {vehicle.model}
        </h3>
        <p className="mt-3 text-2xl font-extrabold text-[#0b1b33]">{formatInr(vehicle.price)}</p>
        <div className="mt-3">
          {outOfStock ? (
            <span className="rounded-full bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700">
              Out of stock
            </span>
          ) : (
            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
              {vehicle.quantity} in stock
            </span>
          )}
        </div>
        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
        <button
          type="button"
          disabled={outOfStock || loading}
          onClick={handlePurchase}
          className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 font-medium text-white hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {loading ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Purchasing...
            </>
          ) : (
            "Purchase"
          )}
        </button>
      </div>
    </article>
  );
}
