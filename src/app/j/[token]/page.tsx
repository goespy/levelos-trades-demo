"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  Check,
  Circle,
  Loader2,
  AlertCircle,
  Phone,
  Mail,
  MessageSquare,
  Waves,
} from "lucide-react";
import { DEMO_PROPOSAL_RENDER_IMAGES } from "@/lib/proposal-demo-assets";

interface PortalPhase {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  status: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  notes: string | null;
  photos: string | null;
}

interface PortalData {
  jobName: string;
  status: string;
  startDate: string | null;
  expectedEndDate: string | null;
  actualEndDate: string | null;
  clientName: string;
  clientCity: string | null;
  progress: { complete: number; total: number; percent: number };
  currentPhase: { name: string; status: string } | null;
  phases: PortalPhase[];
}

const FALLBACK_PHOTOS: Record<string, string[]> = {
  "Pool Shell": [
    DEMO_PROPOSAL_RENDER_IMAGES[0],
    DEMO_PROPOSAL_RENDER_IMAGES[1],
  ],
  "Tile & Coping": [DEMO_PROPOSAL_RENDER_IMAGES[1]],
  "Deck & Pumps": [DEMO_PROPOSAL_RENDER_IMAGES[0]],
  "Pool Finish": [DEMO_PROPOSAL_RENDER_IMAGES[2]],
};

function PhaseIcon({ status }: { status: string }) {
  if (status === "COMPLETE") {
    return (
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 ring-4 ring-emerald-50">
        <Check className="w-5 h-5" strokeWidth={2.5} />
      </div>
    );
  }
  if (status === "IN_PROGRESS") {
    return (
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-sky-500 text-white ring-4 ring-sky-100 animate-pulse">
        <Loader2 className="w-5 h-5 animate-spin" strokeWidth={2.5} />
      </div>
    );
  }
  if (status === "BLOCKED") {
    return (
      <div className="flex items-center justify-center w-9 h-9 rounded-full bg-amber-100 text-amber-600 ring-4 ring-amber-50">
        <AlertCircle className="w-5 h-5" strokeWidth={2.5} />
      </div>
    );
  }
  return (
    <div className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 text-slate-400 ring-4 ring-slate-50">
      <Circle className="w-4 h-4" strokeWidth={2.5} />
    </div>
  );
}

function formatDate(s: string | null) {
  if (!s) return null;
  return new Date(s).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function parsePhotos(json: string | null, phaseName: string): string[] {
  if (json) {
    try {
      const parsed = JSON.parse(json);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      /* ignore */
    }
  }
  return FALLBACK_PHOTOS[phaseName] || [];
}

export default function CustomerPortalPage() {
  const params = useParams();
  const token = params.token as string;
  const [data, setData] = useState<PortalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/j/${token}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-50 via-white to-cyan-50">
        <div className="text-slate-500 flex items-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span>Loading your build…</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 via-white to-cyan-50 px-6 text-center">
        <Waves className="w-12 h-12 text-sky-300 mb-4" />
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">
          Portal not found
        </h1>
        <p className="text-slate-500 max-w-md">
          This link may have expired or is no longer valid. Please contact
          Persistent Pools if you need a new link.
        </p>
      </div>
    );
  }

  // Sort phases for upcoming
  const upcoming = data.phases.filter(
    (p) => p.status === "PENDING" || p.status === "BLOCKED"
  );
  const heroVerb =
    data.currentPhase?.status === "IN_PROGRESS"
      ? `is in ${data.currentPhase.name}`
      : data.progress.percent === 100
      ? "is complete"
      : data.currentPhase
      ? `up next: ${data.currentPhase.name}`
      : "in planning";

  // Collect all photos from completed/in-progress phases for gallery
  const galleryPhotos: { url: string; phase: string }[] = [];
  for (const p of data.phases) {
    if (p.status === "PENDING") continue;
    const photos = parsePhotos(p.photos, p.name);
    for (const url of photos) galleryPhotos.push({ url, phase: p.name });
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-cyan-50 text-slate-800">
      {/* Top bar */}
      <header className="border-b border-sky-100/80 bg-white/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-sky-500 to-cyan-500 flex items-center justify-center text-white font-bold shadow-sm">
              PP
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">Persistent Pools</p>
              <p className="text-[11px] text-slate-500 leading-tight">
                Pools &amp; Spas
              </p>
            </div>
          </div>
          <div className="text-xs text-slate-500 hidden sm:block">
            Customer Portal
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-12 pb-8">
        <div className="text-center space-y-3">
          <p className="text-sm uppercase tracking-[0.2em] text-sky-600 font-medium">
            {data.clientCity ? data.clientCity : "Your Build"}
          </p>
          <h1 className="text-4xl md:text-5xl font-light text-slate-800 leading-tight">
            <span className="font-semibold">{data.clientName}</span>,
            <br />
            your pool {heroVerb}.
          </h1>
          {data.expectedEndDate && data.progress.percent < 100 && (
            <p className="text-slate-500 text-sm md:text-base mt-4">
              Expected completion {formatDate(data.expectedEndDate)}
            </p>
          )}
        </div>

        {/* Progress card */}
        <div className="mt-8 bg-white border border-sky-100 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                Build Progress
              </p>
              <p className="text-2xl font-semibold text-slate-800 mt-1 tabular-nums">
                {data.progress.percent}%
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-medium">
                Phases Complete
              </p>
              <p className="text-2xl font-semibold text-slate-800 mt-1 tabular-nums">
                {data.progress.complete}{" "}
                <span className="text-slate-400 font-normal">
                  / {data.progress.total}
                </span>
              </p>
            </div>
          </div>
          <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-sky-400 to-cyan-400 rounded-full transition-all duration-700"
              style={{ width: `${data.progress.percent}%` }}
            />
          </div>
        </div>
      </section>

      {/* Photo Gallery */}
      {galleryPhotos.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-8">
          <h2 className="text-sm uppercase tracking-[0.2em] text-slate-500 font-medium mb-4">
            Build Photos
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {galleryPhotos.slice(0, 6).map((p, i) => (
              <div
                key={i}
                className="aspect-square rounded-xl overflow-hidden bg-slate-100 group relative"
              >
                <img
                  src={p.url}
                  alt={p.phase}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                  <p className="text-white text-xs font-medium">{p.phase}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Timeline */}
      <section className="max-w-5xl mx-auto px-6 py-8">
        <h2 className="text-sm uppercase tracking-[0.2em] text-slate-500 font-medium mb-6">
          Your Build Timeline
        </h2>
        <div className="bg-white border border-sky-100 rounded-2xl p-6 md:p-8 shadow-sm">
          <div className="relative">
            {/* Vertical line */}
            <div
              className="absolute left-[18px] top-2 bottom-2 w-px bg-gradient-to-b from-sky-200 via-sky-100 to-slate-100"
              aria-hidden
            />

            <ol className="space-y-6">
              {data.phases.map((p) => {
                const dateLabel =
                  p.status === "COMPLETE" && p.actualEnd
                    ? `Completed ${formatDate(p.actualEnd)}`
                    : p.status === "IN_PROGRESS"
                    ? p.actualStart
                      ? `Started ${formatDate(p.actualStart)}`
                      : "In progress"
                    : p.scheduledStart
                    ? `Scheduled ${formatDate(p.scheduledStart)}`
                    : null;

                return (
                  <li key={p.id} className="relative pl-14">
                    <div className="absolute left-0 top-0">
                      <PhaseIcon status={p.status} />
                    </div>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-base md:text-lg font-medium ${
                            p.status === "COMPLETE"
                              ? "text-slate-700"
                              : p.status === "IN_PROGRESS"
                              ? "text-sky-600"
                              : "text-slate-500"
                          }`}
                        >
                          {p.name}
                        </h3>
                        {dateLabel && (
                          <p className="text-xs text-slate-400 mt-0.5">
                            {dateLabel}
                          </p>
                        )}
                        {p.notes && p.status !== "PENDING" && (
                          <p className="text-sm text-slate-500 mt-1.5 italic">
                            {p.notes}
                          </p>
                        )}
                      </div>
                      {p.status === "IN_PROGRESS" && (
                        <span className="text-[11px] font-medium uppercase tracking-wider text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full ring-1 ring-sky-100 shrink-0">
                          In Progress
                        </span>
                      )}
                      {p.status === "COMPLETE" && (
                        <span className="text-[11px] font-medium uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full ring-1 ring-emerald-100 shrink-0">
                          Complete
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* What's next */}
      {upcoming.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-8">
          <h2 className="text-sm uppercase tracking-[0.2em] text-slate-500 font-medium mb-4">
            What&rsquo;s Next
          </h2>
          <div className="bg-white border border-sky-100 rounded-2xl p-6 shadow-sm">
            <div className="space-y-3">
              {upcoming.slice(0, 3).map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0"
                >
                  <div className="text-xs font-semibold text-sky-600 bg-sky-50 rounded-full w-6 h-6 flex items-center justify-center shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700 text-sm">
                      {p.name}
                    </p>
                    {p.scheduledStart && (
                      <p className="text-xs text-slate-400 mt-0.5">
                        Scheduled {formatDate(p.scheduledStart)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Questions CTA */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-gradient-to-br from-sky-500 to-cyan-500 rounded-2xl p-8 md:p-10 text-white shadow-lg">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-2xl font-semibold mb-2">Questions?</h2>
              <p className="text-sky-50 text-sm md:text-base max-w-md">
                We&rsquo;re here every step of the way. Reach out anytime — your
                project manager will respond within one business day.
              </p>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              <a
                href="tel:+19415551234"
                className="bg-white text-sky-600 hover:bg-sky-50 transition-colors px-5 py-3 rounded-lg font-medium text-sm flex items-center gap-2 shadow-sm"
              >
                <Phone className="w-4 h-4" />
                (941) 555-POOL
              </a>
              <a
                href="mailto:portfolio@example.com"
                className="bg-sky-600/30 hover:bg-sky-600/40 transition-colors px-5 py-3 rounded-lg font-medium text-sm flex items-center gap-2 ring-1 ring-white/30"
              >
                <Mail className="w-4 h-4" />
                portfolio@example.com
              </a>
              <a
                href="sms:+19415551234"
                className="bg-sky-600/30 hover:bg-sky-600/40 transition-colors px-5 py-3 rounded-lg font-medium text-sm flex items-center gap-2 ring-1 ring-white/30"
              >
                <MessageSquare className="w-4 h-4" />
                Text us
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-sky-100/80 mt-8">
        <div className="max-w-5xl mx-auto px-6 py-8 text-center">
          <p className="text-xs text-slate-400">
            Persistent Pools &middot; Southwest Florida
          </p>
        </div>
      </footer>
    </div>
  );
}
