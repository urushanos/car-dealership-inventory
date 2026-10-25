import type { FormEvent } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import type { VehicleFilters as Filters } from "../types/vehicle";

export const CATEGORIES = ["Sedan", "SUV", "Hatchback", "Coupe", "Truck", "Van", "Convertible"];

interface Props {
  value: {
    make: string;
    model: string;
    category: string;
    minPrice: string;
    maxPrice: string;
  };
  onChange: (next: Props["value"]) => void;
  onApply: (filters: Filters) => void;
}

export default function VehicleFilters({ value, onChange, onApply }: Props) {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onApply(toFilters(value));
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="mb-4 flex items-center gap-2 text-slate-800">
        <SlidersHorizontal className="h-4 w-4" />
        <h2 className="font-semibold">Search & filters</h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-5">
        <input
          placeholder="Make"
          value={value.make}
          onChange={(event) => onChange({ ...value, make: event.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
        <input
          placeholder="Model"
          value={value.model}
          onChange={(event) => onChange({ ...value, model: event.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
        <select
          value={value.category}
          onChange={(event) => onChange({ ...value, category: event.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        >
          <option value="">All categories</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
        <input
          type="number"
          min={0}
          placeholder="Min price (INR)"
          value={value.minPrice}
          onChange={(event) => onChange({ ...value, minPrice: event.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
        <input
          type="number"
          min={0}
          placeholder="Max price (INR)"
          value={value.maxPrice}
          onChange={(event) => onChange({ ...value, maxPrice: event.target.value })}
          className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-emerald-500"
        />
      </div>
      <div className="mt-4 flex justify-end">
        <button
          type="submit"
          className="inline-flex items-center rounded-lg bg-[#0b1b33] px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          <Search className="mr-2 h-4 w-4" />
          Apply filters
        </button>
      </div>
    </form>
  );
}

export function toFilters(value: Props["value"]): Filters {
  return {
    make: value.make.trim() || undefined,
    model: value.model.trim() || undefined,
    category: value.category || undefined,
    minPrice: value.minPrice ? Number(value.minPrice) : undefined,
    maxPrice: value.maxPrice ? Number(value.maxPrice) : undefined,
  };
}
