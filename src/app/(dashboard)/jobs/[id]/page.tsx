"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import {
  ArrowLeft,
  Loader2,
  CheckCircle2,
  Circle,
  AlertOctagon,
  Clock,
  Phone,
  Copy,
  Check,
  HardHat,
  ExternalLink,
} from "lucide-react";

interface SubLite {
  id: string;
  name: string;
  trade: string;
  phone: string | null;
  email: string | null;
}

interface JobPhase {
  id: string;
  name: string;
  description: string | null;
  sortOrder: number;
  status: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  subcontractorId: string | null;
  subcontractor: SubLite | null;
  notes: string | null;
}

interface JobDetail {
  id: string;
  name: string;
  status: string;
  startDate: string | null;
  expectedEndDate: string | null;
  actualEndDate: string | null;
  portalToken: string | null;
  notes: string | null;
  phases: JobPhase[];
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    zip: string | null;
  } | null;
  progress: { complete: number; total: number; percent: number };
}

interface SubOption {
  id: string;
  name: string;
  trade: string;
  active: boolean;
}

const PHASE_STATUSES = ["PENDING", "IN_PROGRESS", "BLOCKED", "COMPLETE"] as const;

const PHASE_STATUS_LABELS: Record<string, string> = {
  PENDING: "Pending",
  IN_PROGRESS: "In Progress",
  BLOCKED: "Blocked",
  COMPLETE: "Complete",
};

const PHASE_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-blue-500/15 text-blue-400",
  BLOCKED: "bg-red-500/15 text-red-400",
  COMPLETE: "bg-green-500/15 text-green-400",
};

const JOB_STATUSES = ["ACTIVE", "ON_HOLD", "COMPLETE", "CANCELLED"] as const;
const JOB_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  ON_HOLD: "On Hold",
  COMPLETE: "Complete",
  CANCELLED: "Cancelled",
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function PhaseIcon({ status }: { status: string }) {
  if (status === "COMPLETE")
    return <CheckCircle2 className="h-5 w-5 text-green-400" />;
  if (status === "IN_PROGRESS")
    return <Clock className="h-5 w-5 text-blue-400" />;
  if (status === "BLOCKED")
    return <AlertOctagon className="h-5 w-5 text-red-400" />;
  return <Circle className="h-5 w-5 text-muted-foreground" />;
}

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [job, setJob] = useState<JobDetail | null>(null);
  const [subs, setSubs] = useState<SubOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingPhaseId, setSavingPhaseId] = useState<string | null>(null);
  const [phaseNotes, setPhaseNotes] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  const fetchJob = useCallback(async () => {
    const res = await fetch(`/api/jobs/${id}`);
    if (!res.ok) {
      router.push("/jobs");
      return;
    }
    const data: JobDetail = await res.json();
    setJob(data);
    const initialNotes: Record<string, string> = {};
    for (const p of data.phases) initialNotes[p.id] = p.notes || "";
    setPhaseNotes(initialNotes);
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchJob();
  }, [fetchJob]);

  useEffect(() => {
    fetch("/api/subs?active=true")
      .then((r) => r.json())
      .then((data) => setSubs(data))
      .catch(() => setSubs([]));
  }, []);

  const updatePhase = async (phaseId: string, body: Record<string, unknown>) => {
    setSavingPhaseId(phaseId);
    await fetch(`/api/jobs/${id}/phases/${phaseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSavingPhaseId(null);
    fetchJob();
  };

  const updateJobStatus = async (status: string) => {
    await fetch(`/api/jobs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    fetchJob();
  };

  const copyPortal = async () => {
    if (!job?.portalToken) return;
    const url = `${window.location.origin}/p/${job.portalToken}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-12 text-muted-foreground">Job not found</div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/jobs")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Jobs
        </Button>
      </div>

      <PageHeader
        title={job.name}
        description={
          <div className="flex items-center gap-2 flex-wrap">
            <span>
              {fmtDate(job.startDate)} → {fmtDate(job.expectedEndDate)}
            </span>
            <span>&bull;</span>
            <span>
              {job.progress.complete} / {job.progress.total} phases complete
            </span>
          </div>
        }
        action={
          <Select value={job.status} onValueChange={updateJobStatus}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {JOB_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {JOB_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        }
      />

      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Overall Progress</span>
            <span className="text-sm font-semibold tabular-nums">
              {job.progress.percent}%
            </span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all"
              style={{ width: `${job.progress.percent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">
            Phases
          </h2>
          {job.phases.map((phase, idx) => {
            const isSaving = savingPhaseId === phase.id;
            const isLast = idx === job.phases.length - 1;
            return (
              <div key={phase.id} className="flex gap-3">
                <div className="flex flex-col items-center pt-3">
                  <PhaseIcon status={phase.status} />
                  {!isLast && (
                    <div className="w-px flex-1 bg-border mt-1 min-h-[40px]" />
                  )}
                </div>
                <Card className="flex-1 mb-2">
                  <CardContent className="py-3 space-y-3">
                    <div className="flex items-start justify-between gap-2 flex-wrap">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">{phase.name}</p>
                          <Badge
                            variant="secondary"
                            className={PHASE_STATUS_COLORS[phase.status]}
                          >
                            {PHASE_STATUS_LABELS[phase.status]}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          Scheduled: {fmtDate(phase.scheduledStart)} →{" "}
                          {fmtDate(phase.scheduledEnd)}
                          {(phase.actualStart || phase.actualEnd) && (
                            <span className="ml-2">
                              | Actual: {fmtDate(phase.actualStart)} →{" "}
                              {fmtDate(phase.actualEnd)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {isSaving && (
                          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                        )}
                        <Select
                          value={phase.status}
                          onValueChange={(v) => updatePhase(phase.id, { status: v })}
                        >
                          <SelectTrigger className="w-[140px] h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {PHASE_STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {PHASE_STATUS_LABELS[s]}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Subcontractor
                        </label>
                        <Select
                          value={phase.subcontractorId || "NONE"}
                          onValueChange={(v) =>
                            updatePhase(phase.id, {
                              subcontractorId: v === "NONE" ? null : v,
                            })
                          }
                        >
                          <SelectTrigger className="w-full h-9 text-sm">
                            <SelectValue placeholder="Unassigned" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="NONE">Unassigned</SelectItem>
                            {subs.map((s) => (
                              <SelectItem key={s.id} value={s.id}>
                                {s.name} ({s.trade})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {phase.subcontractor?.phone && (
                          <a
                            href={`tel:${phase.subcontractor.phone}`}
                            className="text-xs text-blue-400 inline-flex items-center gap-1 mt-1 hover:underline"
                          >
                            <Phone className="h-3 w-3" />
                            {phase.subcontractor.phone}
                          </a>
                        )}
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Notes
                        </label>
                        <div className="flex gap-2">
                          <Textarea
                            value={phaseNotes[phase.id] ?? ""}
                            onChange={(e) =>
                              setPhaseNotes((p) => ({
                                ...p,
                                [phase.id]: e.target.value,
                              }))
                            }
                            placeholder="Add notes..."
                            className="text-sm min-h-[36px] flex-1"
                            rows={1}
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              updatePhase(phase.id, {
                                notes: phaseNotes[phase.id] || "",
                              })
                            }
                            disabled={
                              (phaseNotes[phase.id] || "") === (phase.notes || "")
                            }
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {job.client ? (
                <>
                  <p className="font-medium">{job.client.name}</p>
                  {job.client.phone && (
                    <a
                      href={`tel:${job.client.phone}`}
                      className="block text-blue-400 hover:underline text-xs"
                    >
                      {job.client.phone}
                    </a>
                  )}
                  {job.client.email && (
                    <a
                      href={`mailto:${job.client.email}`}
                      className="block text-blue-400 hover:underline text-xs"
                    >
                      {job.client.email}
                    </a>
                  )}
                  {(job.client.address || job.client.city) && (
                    <p className="text-xs text-muted-foreground">
                      {[job.client.address, job.client.city, job.client.zip]
                        .filter(Boolean)
                        .join(", ")}
                    </p>
                  )}
                  <Separator className="my-2" />
                  <Link
                    href={`/clients/${job.client.id}`}
                    className="text-xs text-blue-400 inline-flex items-center gap-1 hover:underline"
                  >
                    Open client record
                    <ExternalLink className="h-3 w-3" />
                  </Link>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">No client linked</p>
              )}
            </CardContent>
          </Card>

          {job.portalToken && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Customer Portal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  Share this link so the client can track their build.
                </p>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyPortal}
                  className="w-full"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4 mr-1" />
                      Copy Portal Link
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <HardHat className="h-4 w-4" />
                Job Notes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={job.notes || ""}
                onChange={(e) =>
                  setJob((prev) => (prev ? { ...prev, notes: e.target.value } : prev))
                }
                onBlur={async (e) => {
                  await fetch(`/api/jobs/${id}`, {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ notes: e.target.value }),
                  });
                }}
                placeholder="Internal notes about this job..."
                className="text-sm min-h-[100px]"
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
