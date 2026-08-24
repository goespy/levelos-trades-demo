"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Phone, Clock, Loader2 } from "lucide-react";

interface FieldPhase {
  id: string;
  name: string;
  status: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  actualStart: string | null;
  jobId: string;
  jobName: string;
  clientName: string | null;
  subcontractor: {
    id: string;
    name: string;
    trade: string;
    phone: string | null;
  } | null;
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function FieldActiveCards() {
  const [phases, setPhases] = useState<FieldPhase[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/jobs?status=ACTIVE");
    const jobs = await res.json();
    const flat: FieldPhase[] = [];
    for (const job of jobs) {
      for (const p of job.phases) {
        if (p.status === "IN_PROGRESS" || p.status === "BLOCKED") {
          flat.push({
            id: p.id,
            name: p.name,
            status: p.status,
            scheduledStart: p.scheduledStart,
            scheduledEnd: p.scheduledEnd,
            actualStart: p.actualStart,
            jobId: job.id,
            jobName: job.name,
            clientName: job.client?.name || null,
            subcontractor: p.subcontractor || null,
          });
        }
      }
    }
    setPhases(flat);
    setLoading(false);
  }, []);

  // Pre-existing data-loading pattern preserved from original field/page.tsx.
  useEffect(() => {
    void load();
  }, [load]);

  const markComplete = async (phase: FieldPhase) => {
    setCompleting(phase.id);
    await fetch(`/api/jobs/${phase.jobId}/phases/${phase.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "COMPLETE" }),
    });
    setCompleting(null);
    load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (phases.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center space-y-3">
          <CheckCircle2 className="h-12 w-12 text-green-400 mx-auto" />
          <p className="text-muted-foreground">
            All quiet. No phases currently in progress.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      {/* Today's Focus line */}
      <div className="mb-3 flex items-baseline gap-2">
        <span className="text-2xl font-bold tabular-nums">{phases.length}</span>
        <span className="text-sm text-muted-foreground">
          phase{phases.length === 1 ? "" : "s"} need attention today
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {phases.map((phase) => {
          const isBlocked = phase.status === "BLOCKED";
          const isCompleting = completing === phase.id;
          return (
            <Card
              key={phase.id}
              className={
                isBlocked ? "border-red-500/40" : "border-blue-500/30"
              }
            >
              <CardContent className="py-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <Link
                    href={`/jobs/${phase.jobId}`}
                    className="min-w-0 flex-1 block"
                  >
                    <p className="text-xs text-muted-foreground truncate">
                      {phase.jobName}
                      {phase.clientName &&
                        phase.clientName !== phase.jobName && (
                          <span className="ml-1">
                            &bull; {phase.clientName}
                          </span>
                        )}
                    </p>
                    <h3 className="font-semibold text-base mt-0.5 truncate">
                      {phase.name}
                    </h3>
                  </Link>
                  <Badge
                    variant="secondary"
                    className={
                      isBlocked
                        ? "bg-red-500/15 text-red-400"
                        : "bg-blue-500/15 text-blue-400"
                    }
                  >
                    {phase.status === "IN_PROGRESS" ? "Active" : "Blocked"}
                  </Badge>
                </div>

                <div className="text-xs flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {fmtDate(phase.scheduledStart)} →{" "}
                    {fmtDate(phase.scheduledEnd)}
                  </span>
                </div>

                {phase.subcontractor && (
                  <div className="bg-muted/40 rounded-md px-3 py-2 text-sm">
                    <p className="font-medium truncate">
                      {phase.subcontractor.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {phase.subcontractor.trade}
                    </p>
                    {phase.subcontractor.phone && (
                      <a
                        href={`tel:${phase.subcontractor.phone}`}
                        className="text-blue-400 inline-flex items-center gap-1 hover:underline text-xs mt-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Phone className="h-3 w-3" />
                        {phase.subcontractor.phone}
                      </a>
                    )}
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => markComplete(phase)}
                    disabled={isCompleting}
                  >
                    {isCompleting ? (
                      <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-1" />
                    )}
                    Mark Complete
                  </Button>
                  <Link href={`/jobs/${phase.jobId}`} className="shrink-0">
                    <Button size="sm" variant="outline">
                      Open Job
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
