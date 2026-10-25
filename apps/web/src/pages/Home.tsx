import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Car, Gauge, ShieldCheck } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="mx-auto flex max-w-6xl flex-col px-4 py-16 sm:px-6 lg:px-8">
      <section className="rounded-3xl bg-[#0b1b33] px-6 py-16 text-white sm:px-12">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">
          TurnoverTechnologies
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-extrabold tracking-tight sm:text-5xl">
          Bringing transparency to the automotive industry.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-slate-300">
          Browse live dealership inventory, purchase in-stock vehicles, and manage stock with
          a clean, admin-ready dashboard.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/vehicles"
            className="inline-flex items-center rounded-lg bg-emerald-600 px-5 py-3 font-medium hover:bg-emerald-500"
          >
            Browse inventory
            <ArrowRight className="ml-2 h-5 w-5" />
          </Link>
          {!user && (
            <Link
              to="/register"
              className="inline-flex items-center rounded-lg bg-white px-5 py-3 font-medium text-slate-900 hover:bg-slate-100"
            >
              Create an account
            </Link>
          )}
        </div>
      </section>

      <section className="mt-12 grid gap-6 md:grid-cols-3">
        <Feature
          icon={<Car className="h-6 w-6 text-emerald-700" />}
          title="Verified inventory"
          body="See make, model, category, and live quantity before you buy."
        />
        <Feature
          icon={<ShieldCheck className="h-6 w-6 text-emerald-700" />}
          title="Secure purchasing"
          body="Authenticated purchases decrement stock atomically on the server."
        />
        <Feature
          icon={<Gauge className="h-6 w-6 text-emerald-700" />}
          title="Admin control"
          body="Add, edit, restock, and remove vehicles from one dashboard."
        />
      </section>
    </div>
  );
}

function Feature({
  icon,
  title,
  body,
}: {
  icon: ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 w-fit rounded-full bg-emerald-100 p-3">{icon}</div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-500">{body}</p>
    </div>
  );
}
