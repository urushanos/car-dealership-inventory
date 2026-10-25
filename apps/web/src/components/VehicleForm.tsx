import { useEffect, useState, type FormEvent } from "react";
import type { Vehicle, VehiclePayload } from "../types/vehicle";
import { CATEGORIES } from "./VehicleFilters";

interface Props {
  initial?: Vehicle | null;
  submitting: boolean;
  error: string;
  onSubmit: (payload: VehiclePayload) => Promise<void> | void;
  onCancel: () => void;
}

export default function VehicleForm({
  initial,
  submitting,
  error,
  onSubmit,
  onCancel,
}: Props) {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [category, setCategory] = useState("Sedan");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [vin, setVin] = useState("");

  useEffect(() => {
    setMake(initial?.make ?? "");
    setModel(initial?.model ?? "");
    setCategory(initial?.category ?? "Sedan");
    setPrice(initial ? String(initial.price) : "");
    setQuantity(initial ? String(initial.quantity) : "1");
    setYear(String(initial?.year ?? new Date().getFullYear()));
    setVin(initial?.vin ?? "");
  }, [initial]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const payload: VehiclePayload = {
      make: make.trim(),
      model: model.trim(),
      category,
      price: Number(price),
      quantity: Number(quantity),
      year: Number(year),
    };
    if (vin.trim()) payload.vin = vin.trim();
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Make" value={make} onChange={setMake} required />
        <Field label="Model" value={model} onChange={setModel} required />
        <label className="block text-sm font-medium text-slate-700">
          Category
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {CATEGORIES.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <Field label="Price (INR)" value={price} onChange={setPrice} type="number" required />
        <Field label="Quantity" value={quantity} onChange={setQuantity} type="number" required />
        <Field label="Year" value={year} onChange={setYear} type="number" required />
        <div className="sm:col-span-2">
          <Field
            label="VIN (optional)"
            value={vin}
            onChange={setVin}
            placeholder="Leave blank to auto-generate"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-60"
        >
          {submitting ? "Saving..." : initial ? "Save changes" : "Add vehicle"}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm font-medium text-slate-700">
      {label}
      <input
        type={type}
        min={type === "number" ? 0 : undefined}
        required={required}
        value={value}
        placeholder={placeholder}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2"
      />
    </label>
  );
}
