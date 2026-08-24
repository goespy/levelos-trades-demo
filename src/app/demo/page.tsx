"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Check,
  Database,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

const workflow = [
  "Lead qualification and design intake",
  "Build estimating and proposal generation",
  "Contracts, job phases, and accounting",
  "Customer portal and field operations",
];

const tourStops = [
  "Open a populated client workspace",
  "Configure a build and review its margin",
  "Turn the estimate into a visual proposal",
  "Follow the project into job operations",
];

export default function DemoPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/demo", { method: "POST" });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Unable to start the demo");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("The demo is temporarily unavailable.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#071318] px-4 py-10 text-slate-100 sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(15,167,180,0.18),transparent_34%),radial-gradient(circle_at_85%_80%,rgba(214,169,91,0.12),transparent_30%)]" />
      <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl overflow-hidden rounded-3xl border border-white/10 bg-[#0b1b21]/90 shadow-2xl shadow-black/30 backdrop-blur lg:grid-cols-[1.15fr_0.85fr]">
        <section className="order-2 flex flex-col justify-between border-t border-white/10 p-8 sm:p-12 lg:order-1 lg:border-r lg:border-t-0 lg:p-16">
          <div>
            <div className="mb-12 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/8 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-200">
              <Sparkles className="h-3.5 w-3.5" />
              Portfolio edition
            </div>
            <p className="mb-3 text-sm font-medium uppercase tracking-[0.24em] text-amber-200/80">
              LEVELos for the Trades
            </p>
            <h1 className="max-w-2xl text-4xl font-semibold tracking-tight text-white sm:text-5xl">
              One operating system from first lead to finished pool.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              A polished workflow for estimating, selling,
              building, and supporting custom pool projects.
            </p>

            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {workflow.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.025] p-3 text-sm text-slate-300"
                >
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-cyan-300" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-10 flex flex-wrap gap-4 text-xs text-slate-400">
            <span className="inline-flex items-center gap-1.5">
              <Database className="h-3.5 w-3.5" /> Synthetic data
            </span>
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5" /> External actions disabled
            </span>
          </div>
        </section>

        <section className="order-1 flex items-center p-8 sm:p-12 lg:order-2 lg:p-14">
          <div className="w-full">
            <div className="mb-8 flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-300 text-sm font-bold text-[#071318]">
                LO
              </div>
              <div>
                <h2 className="font-semibold text-white">Explore the workflow</h2>
                <p className="text-sm text-slate-400">No account or setup required.</p>
              </div>
            </div>

            <p className="text-sm leading-6 text-slate-300">
              Enter a fully populated workspace built from fictional clients,
              projects, pricing, and documents.
            </p>

            <ul className="my-8 space-y-4">
              {tourStops.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-slate-300">
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-300/10 text-cyan-200">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  {item}
                </li>
              ))}
            </ul>

            {error && (
              <p
                role="alert"
                className="mb-4 rounded-lg border border-red-400/20 bg-red-400/8 px-3 py-2 text-sm text-red-200"
              >
                {error}
              </p>
            )}

            <button
              type="button"
              onClick={handleStart}
              disabled={loading}
              className="group flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-300 px-4 py-3 text-sm font-semibold text-[#071318] transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Opening workspace…" : "Start demo"}
              {!loading && (
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              )}
            </button>

            <p className="mt-6 text-center text-xs leading-5 text-slate-500">
              Visitor changes are temporary. All names, addresses, pricing,
              signatures, and documents are fictional or illustrative.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
