import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, PackagePlus } from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";
import VehicleForm from "../components/VehicleForm";
import { formatInr } from "../components/VehicleCard";
import { useAuth } from "../context/AuthContext";
import {
  createVehicle,
  deleteVehicle,
  listVehicles,
  restockVehicle,
  updateVehicle,
} from "../lib/api";
import type { Vehicle, VehiclePayload } from "../types/vehicle";

export default function Admin() {
  const { token } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState<Vehicle | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [restockAmounts, setRestockAmounts] = useState<Record<string, string>>({});

  const refresh = async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      setVehicles(await listVehicles(token));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load inventory");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, [token]);

  const handleSubmit = async (payload: VehiclePayload) => {
    if (!token) return;
    setSaving(true);
    setFormError("");
    try {
      if (editing) {
        const updated = await updateVehicle(token, editing.id, payload);
        setVehicles((current) => current.map((item) => (item.id === updated.id ? updated : item)));
      } else {
        const created = await createVehicle(token, payload);
        setVehicles((current) => [created, ...current]);
      }
      setFormOpen(false);
      setEditing(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !pendingDelete) return;
    setDeleting(true);
    try {
      await deleteVehicle(token, pendingDelete.id);
      setVehicles((current) => current.filter((item) => item.id !== pendingDelete.id));
      setPendingDelete(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setDeleting(false);
    }
  };

  const handleRestock = async (vehicle: Vehicle) => {
    if (!token) return;
    const amount = Number(restockAmounts[vehicle.id] ?? "1");
    if (!Number.isInteger(amount) || amount < 1) {
      setError("Restock quantity must be a positive integer");
      return;
    }
    try {
      const updated = await restockVehicle(token, vehicle.id, amount);
      setVehicles((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Restock failed");
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Admin inventory</h1>
          <p className="mt-1 text-slate-500">Add, edit, restock, and remove vehicles.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setFormError("");
            setFormOpen(true);
          }}
          className="inline-flex items-center rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add vehicle
        </button>
      </div>

      {formOpen && (
        <div className="mb-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">
            {editing ? `Edit ${editing.make} ${editing.model}` : "New vehicle"}
          </h2>
          <VehicleForm
            initial={editing}
            submitting={saving}
            error={formError}
            onSubmit={handleSubmit}
            onCancel={() => {
              setFormOpen(false);
              setEditing(null);
            }}
          />
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {loading && <p className="text-slate-500">Loading inventory...</p>}

      {!loading && vehicles.length === 0 && (
        <p className="text-slate-500">No vehicles yet. Add the first listing.</p>
      )}

      {!loading && vehicles.length > 0 && (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">Vehicle</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Price</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Restock</th>
                <th className="px-4 py-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => (
                <tr key={vehicle.id} className="border-t border-slate-100">
                  <td className="px-4 py-3 font-medium text-slate-900">
                    {vehicle.make} {vehicle.model}
                    {vehicle.year ? ` (${vehicle.year})` : ""}
                  </td>
                  <td className="px-4 py-3">{vehicle.category}</td>
                  <td className="px-4 py-3">{formatInr(vehicle.price)}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        vehicle.quantity === 0
                          ? "font-semibold text-red-600"
                          : "font-semibold text-emerald-700"
                      }
                    >
                      {vehicle.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min={1}
                        value={restockAmounts[vehicle.id] ?? "1"}
                        onChange={(event) =>
                          setRestockAmounts((current) => ({
                            ...current,
                            [vehicle.id]: event.target.value,
                          }))
                        }
                        className="w-20 rounded-md border border-slate-300 px-2 py-1"
                      />
                      <button
                        type="button"
                        onClick={() => void handleRestock(vehicle)}
                        className="inline-flex items-center rounded-md bg-slate-800 px-2 py-1 text-xs text-white hover:bg-slate-700"
                      >
                        <PackagePlus className="mr-1 h-3.5 w-3.5" />
                        Restock
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditing(vehicle);
                          setFormError("");
                          setFormOpen(true);
                        }}
                        className="rounded-md border border-slate-300 p-1.5 hover:bg-slate-50"
                        aria-label={`Edit ${vehicle.make} ${vehicle.model}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPendingDelete(vehicle)}
                        className="rounded-md border border-red-200 p-1.5 text-red-600 hover:bg-red-50"
                        aria-label={`Delete ${vehicle.make} ${vehicle.model}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete vehicle"
        message={
          pendingDelete
            ? `Remove ${pendingDelete.make} ${pendingDelete.model} from inventory? This cannot be undone.`
            : ""
        }
        loading={deleting}
        onCancel={() => setPendingDelete(null)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  );
}
