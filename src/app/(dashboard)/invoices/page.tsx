"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import {
  INVOICE_STATUSES,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
} from "@/lib/constants";
import { Plus, Receipt, Loader2 } from "lucide-react";

interface InvoiceListItem {
  id: string;
  number: string;
  jobId: string;
  jobName: string;
  clientId: string;
  clientName: string;
  phaseLabel: string;
  amount: number;
  status: string;
  sentAt: string | null;
  dueDate: string | null;
  paidAt: string | null;
}

interface JobOption {
  id: string;
  name: string;
}

function fmt0(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function fmt2(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

function dateOnly(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "2-digit" });
}

export default function InvoicesPage() {
  const router = useRouter();
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("");
  const [jobId, setJobId] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [jobs, setJobs] = useState<JobOption[]>([]);

  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({
    jobId: "",
    phaseLabel: "",
    amount: "",
    description: "",
    dueDate: "",
    notes: "",
  });

  useEffect(() => {
    fetch("/api/jobs")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => {
        if (Array.isArray(data)) {
          setJobs(data.map((j: { id: string; name: string }) => ({ id: j.id, name: j.name })));
        }
      })
      .catch(() => setJobs([]));
  }, []);

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      if (jobId) params.set("jobId", jobId);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      const res = await fetch(`/api/invoices?${params}`);
      const data = await res.json();
      setInvoices(data);
      setLoading(false);
    };
    fetchInvoices();
  }, [status, jobId, dateFrom, dateTo]);

  // Money strip metrics
  const stats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    let outstanding = 0;
    let paidThisMonth = 0;
    let overdueCount = 0;

    for (const inv of invoices) {
      if (inv.status === "SENT" || inv.status === "OVERDUE") {
        outstanding += inv.amount;
      }
      if (inv.status === "PAID" && inv.paidAt && new Date(inv.paidAt) >= startOfMonth) {
        paidThisMonth += inv.amount;
      }
      const isOverdue =
        inv.status === "OVERDUE" ||
        (inv.status === "SENT" && inv.dueDate && new Date(inv.dueDate) < now);
      if (isOverdue) overdueCount += 1;
    }

    return { outstanding, paidThisMonth, overdueCount };
  }, [invoices]);

  const handleCreate = async () => {
    if (!form.jobId || !form.phaseLabel || !form.amount) return;
    setCreating(true);
    const res = await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: form.jobId,
        phaseLabel: form.phaseLabel,
        amount: parseFloat(form.amount),
        description: form.description || null,
        dueDate: form.dueDate || null,
        notes: form.notes || null,
      }),
    });
    setCreating(false);
    if (res.ok) {
      const inv = await res.json();
      router.push(`/invoices/${inv.id}`);
    }
  };

  return (
    <div>
      <PageHeader
        title="Invoices"
        description={`${invoices.length} total`}
        action={
          <Button size="sm" onClick={() => setShowNew(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Invoice
          </Button>
        }
      />

      {/* Money strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
        <div className="p-4 rounded-lg bg-muted/50">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Outstanding</p>
          <p className="text-2xl font-bold mt-1 tabular-nums">{fmt0(stats.outstanding)}</p>
        </div>
        <div className="p-4 rounded-lg bg-muted/50">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Paid This Month</p>
          <p className="text-2xl font-bold mt-1 tabular-nums text-green-400">
            {fmt0(stats.paidThisMonth)}
          </p>
        </div>
        <div className="p-4 rounded-lg bg-muted/50">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Overdue</p>
          <p
            className={`text-2xl font-bold mt-1 tabular-nums ${
              stats.overdueCount > 0 ? "text-red-400" : ""
            }`}
          >
            {stats.overdueCount}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-4">
        <Select value={status} onValueChange={(v) => setStatus(v === "ALL" ? "" : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {INVOICE_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {INVOICE_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={jobId} onValueChange={(v) => setJobId(v === "ALL" ? "" : v)}>
          <SelectTrigger className="w-[220px]">
            <SelectValue placeholder="All Jobs" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Jobs</SelectItem>
            {jobs.map((j) => (
              <SelectItem key={j.id} value={j.id}>
                {j.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="w-[160px]"
          placeholder="From"
        />
        <Input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="w-[160px]"
          placeholder="To"
        />
        {(status || jobId || dateFrom || dateTo) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatus("");
              setJobId("");
              setDateFrom("");
              setDateTo("");
            }}
          >
            Clear
          </Button>
        )}
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin mx-auto" />
        </div>
      ) : invoices.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <Receipt className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No invoices match your filters.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Job</TableHead>
                  <TableHead>Phase</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Due</TableHead>
                  <TableHead>Paid</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((inv) => {
                  const isOverdue =
                    inv.status === "SENT" &&
                    inv.dueDate &&
                    new Date(inv.dueDate) < new Date();
                  const displayStatus = isOverdue ? "OVERDUE" : inv.status;
                  return (
                    <TableRow
                      key={inv.id}
                      className="cursor-pointer"
                      onClick={() => router.push(`/invoices/${inv.id}`)}
                    >
                      <TableCell className="font-mono text-xs">{inv.number}</TableCell>
                      <TableCell className="font-medium">{inv.clientName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{inv.jobName}</TableCell>
                      <TableCell>{inv.phaseLabel}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {fmt2(inv.amount)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={INVOICE_STATUS_COLORS[displayStatus]}>
                          {INVOICE_STATUS_LABELS[displayStatus]}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs">{dateOnly(inv.sentAt)}</TableCell>
                      <TableCell className="text-xs">{dateOnly(inv.dueDate)}</TableCell>
                      <TableCell className="text-xs">{dateOnly(inv.paidAt)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* New Invoice modal */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Invoice</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div>
              <Label className="text-xs">Job</Label>
              <Select
                value={form.jobId}
                onValueChange={(v) => setForm({ ...form, jobId: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a job" />
                </SelectTrigger>
                <SelectContent>
                  {jobs.map((j) => (
                    <SelectItem key={j.id} value={j.id}>
                      {j.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Phase Label</Label>
              <Input
                value={form.phaseLabel}
                onChange={(e) => setForm({ ...form, phaseLabel: e.target.value })}
                placeholder="e.g., Pool Shell"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Amount ($)</Label>
                <Input
                  type="number"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  placeholder="0"
                />
              </div>
              <div>
                <Label className="text-xs">Due Date</Label>
                <Input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional"
              />
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
              disabled={creating || !form.jobId || !form.phaseLabel || !form.amount}
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
