"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import {
  MAINTENANCE_TYPES,
  MAINTENANCE_CADENCES,
  MAINTENANCE_STATUS_LABELS,
  MAINTENANCE_STATUS_COLORS,
} from "@/lib/constants";
import {
  Plus,
  CalendarClock,
  Loader2,
  CheckCircle,
  PauseCircle,
  Trash2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

interface Plan {
  id: string;
  clientId: string;
  jobId: string | null;
  type: string;
  cadence: string;
  nextDue: string;
  amount: number | null;
  status: string;
  notes: string | null;
  clientName: string;
  jobName: string | null;
}

interface ClientLite {
  id: string;
  name: string;
}

interface JobLite {
  id: string;
  name: string;
  clientId: string;
}

function fmt0(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function dateOnly(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function daysUntil(d: string) {
  const ms = new Date(d).getTime() - new Date().getTime();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export default function MaintenancePage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [clients, setClients] = useState<ClientLite[]>([]);
  const [jobs, setJobs] = useState<JobLite[]>([]);
  const [showInactive, setShowInactive] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    clientId: "",
    jobId: "",
    type: "Spring Open",
    cadence: "Annual",
    nextDue: "",
    amount: "",
    notes: "",
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [plansRes, clientsRes, jobsRes] = await Promise.all([
      fetch("/api/maintenance").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/clients").then((r) => (r.ok ? r.json() : [])),
      fetch("/api/jobs").then((r) => (r.ok ? r.json() : [])),
    ]);
    setPlans(Array.isArray(plansRes) ? plansRes : []);
    setClients(
      (Array.isArray(clientsRes) ? clientsRes : []).map((c: ClientLite) => ({
        id: c.id,
        name: c.name,
      }))
    );
    setJobs(
      (Array.isArray(jobsRes) ? jobsRes : []).map((j: JobLite) => ({
        id: j.id,
        name: j.name,
        clientId: j.clientId,
      }))
    );
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Reset jobId when client changes — only show jobs for selected client
  const filteredJobs = form.clientId
    ? jobs.filter((j) => j.clientId === form.clientId)
    : [];

  const handleCreate = async () => {
    if (!form.clientId || !form.type || !form.cadence || !form.nextDue) return;
    setCreating(true);
    const res = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clientId: form.clientId,
        jobId: form.jobId || null,
        type: form.type,
        cadence: form.cadence,
        nextDue: form.nextDue,
        amount: form.amount ? parseFloat(form.amount) : null,
        notes: form.notes || null,
      }),
    });
    setCreating(false);
    if (res.ok) {
      setShowNew(false);
      setForm({
        clientId: "",
        jobId: "",
        type: "Spring Open",
        cadence: "Annual",
        nextDue: "",
        amount: "",
        notes: "",
      });
      fetchAll();
    }
  };

  const handleDoneReschedule = async (id: string) => {
    setActingId(id);
    await fetch(`/api/maintenance/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "complete_and_reschedule" }),
    });
    setActingId(null);
    fetchAll();
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    await fetch(`/api/maintenance/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this maintenance plan?")) return;
    await fetch(`/api/maintenance/${id}`, { method: "DELETE" });
    fetchAll();
  };

  // Categorize plans
  const now = new Date();
  const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const dueSoon = plans
    .filter(
      (p) =>
        p.status === "ACTIVE" &&
        new Date(p.nextDue) >= now &&
        new Date(p.nextDue) <= in30Days
    )
    .concat(
      plans.filter(
        (p) => p.status === "ACTIVE" && new Date(p.nextDue) < now
      )
    );

  const dueSoonIds = new Set(dueSoon.map((p) => p.id));
  const active = plans.filter((p) => p.status === "ACTIVE" && !dueSoonIds.has(p.id));
  const inactive = plans.filter((p) => p.status !== "ACTIVE");

  return (
    <div>
      <PageHeader
        title="Maintenance Plans"
        description={`${plans.length} total plan${plans.length === 1 ? "" : "s"}`}
        action={
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Plan
          </Button>
        }
      />

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Due Soon */}
          <section>
            <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-yellow-400" />
              Due Soon
              <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-400">
                {dueSoon.length}
              </Badge>
            </h2>
            {dueSoon.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                  Nothing coming up in the next 30 days.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {dueSoon.map((p) => {
                  const days = daysUntil(p.nextDue);
                  const isOverdue = days < 0;
                  return (
                    <Card key={p.id}>
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{p.clientName}</span>
                              <Badge
                                variant="secondary"
                                className="bg-muted text-muted-foreground text-[11px]"
                              >
                                {p.type}
                              </Badge>
                              <Badge
                                variant="secondary"
                                className={
                                  isOverdue
                                    ? "bg-red-500/15 text-red-400 text-[11px]"
                                    : "bg-yellow-500/15 text-yellow-400 text-[11px]"
                                }
                              >
                                {isOverdue
                                  ? `${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} overdue`
                                  : days === 0
                                  ? "Due today"
                                  : `${days} day${days === 1 ? "" : "s"}`}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 flex gap-2 flex-wrap">
                              <span>{dateOnly(p.nextDue)}</span>
                              {p.jobName && (
                                <>
                                  <span>·</span>
                                  <span>{p.jobName}</span>
                                </>
                              )}
                              <span>·</span>
                              <span>{p.cadence}</span>
                              {typeof p.amount === "number" && (
                                <>
                                  <span>·</span>
                                  <span className="tabular-nums">{fmt0(p.amount)}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleDoneReschedule(p.id)}
                              disabled={actingId === p.id}
                            >
                              {actingId === p.id ? (
                                <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              ) : (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              )}
                              Mark Done & Reschedule
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleStatusChange(p.id, "PAUSED")}
                            >
                              <PauseCircle className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </section>

          {/* Active */}
          <section>
            <h2 className="text-sm font-semibold mb-2 flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-green-400" />
              Active Plans
              <Badge variant="secondary" className="bg-green-500/15 text-green-400">
                {active.length}
              </Badge>
            </h2>
            {active.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-sm text-muted-foreground">
                  No other active plans.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {active.map((p) => (
                  <Card key={p.id}>
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium">{p.clientName}</span>
                            <Badge
                              variant="secondary"
                              className="bg-muted text-muted-foreground text-[11px]"
                            >
                              {p.type}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground mt-1 flex gap-2 flex-wrap">
                            <span>Due {dateOnly(p.nextDue)}</span>
                            <span>·</span>
                            <span>{p.cadence}</span>
                            {typeof p.amount === "number" && (
                              <>
                                <span>·</span>
                                <span className="tabular-nums">{fmt0(p.amount)}</span>
                              </>
                            )}
                            {p.jobName && (
                              <>
                                <span>·</span>
                                <span>{p.jobName}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDoneReschedule(p.id)}
                            disabled={actingId === p.id}
                          >
                            {actingId === p.id ? (
                              <Loader2 className="h-3 w-3 animate-spin mr-1" />
                            ) : (
                              <CheckCircle className="h-3 w-3 mr-1" />
                            )}
                            Mark Done
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStatusChange(p.id, "PAUSED")}
                          >
                            <PauseCircle className="h-3 w-3" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)}>
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>

          {/* Paused / Cancelled / Completed */}
          {inactive.length > 0 && (
            <section>
              <button
                type="button"
                onClick={() => setShowInactive((v) => !v)}
                className="flex items-center gap-2 text-sm font-semibold mb-2 hover:text-foreground/80"
              >
                {showInactive ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
                Paused / Cancelled / Completed
                <Badge variant="secondary" className="bg-muted text-muted-foreground">
                  {inactive.length}
                </Badge>
              </button>
              {showInactive && (
                <div className="space-y-2">
                  {inactive.map((p) => (
                    <Card key={p.id}>
                      <CardContent className="py-3">
                        <div className="flex items-center justify-between gap-4 flex-wrap">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium">{p.clientName}</span>
                              <Badge
                                variant="secondary"
                                className={MAINTENANCE_STATUS_COLORS[p.status]}
                              >
                                {MAINTENANCE_STATUS_LABELS[p.status]}
                              </Badge>
                              <span className="text-xs text-muted-foreground">{p.type}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            {p.status !== "ACTIVE" && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleStatusChange(p.id, "ACTIVE")}
                              >
                                Reactivate
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => handleDelete(p.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* New Plan Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Maintenance Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Client</Label>
              <Select
                value={form.clientId}
                onValueChange={(v) => setForm({ ...form, clientId: v, jobId: "" })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pick a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {filteredJobs.length > 0 && (
              <div>
                <Label className="text-xs">Job (optional)</Label>
                <Select
                  value={form.jobId || "NONE"}
                  onValueChange={(v) => setForm({ ...form, jobId: v === "NONE" ? "" : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="NONE">No specific job</SelectItem>
                    {filteredJobs.map((j) => (
                      <SelectItem key={j.id} value={j.id}>
                        {j.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Type</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm({ ...form, type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MAINTENANCE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Cadence</Label>
                <Select
                  value={form.cadence}
                  onValueChange={(v) => setForm({ ...form, cadence: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MAINTENANCE_CADENCES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Next Due</Label>
                <Input
                  type="date"
                  value={form.nextDue}
                  onChange={(e) => setForm({ ...form, nextDue: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Amount ($)</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="Optional"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)} disabled={creating}>
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={creating || !form.clientId || !form.type || !form.cadence || !form.nextDue}
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Create Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
