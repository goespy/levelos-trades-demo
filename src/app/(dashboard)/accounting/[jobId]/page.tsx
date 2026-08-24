"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { PageHeader } from "@/components/layout/page-header";
import {
  COST_CATEGORIES,
  COST_CATEGORY_LABELS,
  COST_CATEGORY_COLORS,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
} from "@/lib/constants";
import { ArrowLeft, Plus, Loader2, Trash2 } from "lucide-react";

interface CostEntry {
  id: string;
  jobId: string;
  category: string;
  vendor: string | null;
  description: string;
  amount: number;
  date: string;
  receiptUrl: string | null;
  notes: string | null;
}

interface InvoiceLite {
  id: string;
  number: string;
  phaseLabel: string;
  amount: number;
  status: string;
  paidAmount: number | null;
  paidAt: string | null;
  dueDate: string | null;
}

interface Bundle {
  job: { id: string; name: string; clientId: string } | null;
  clientName: string | null;
  build: { id: string; name: string; totalCOGS: number; salePrice: number } | null;
  invoices: InvoiceLite[];
  costEntries: CostEntry[];
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

export default function JobAccountingPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    category: "MATERIAL",
    vendor: "",
    description: "",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
    notes: "",
  });

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [jobRes, costsRes, invRes] = await Promise.all([
      fetch(`/api/jobs`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/cost-entries?jobId=${jobId}`).then((r) => (r.ok ? r.json() : [])),
      fetch(`/api/invoices?jobId=${jobId}`).then((r) => (r.ok ? r.json() : [])),
    ]);

    type JobLike = { id: string; name: string; clientId: string };
    const allJobs: JobLike[] = Array.isArray(jobRes) ? jobRes : [];
    const job = allJobs.find((j) => j.id === jobId) || null;

    let clientName: string | null = null;
    let build: Bundle["build"] = null;

    if (job) {
      const [c, builds] = await Promise.all([
        fetch(`/api/clients/${job.clientId}`)
          .then((r) => (r.ok ? r.json() : null))
          .catch(() => null),
        fetch(`/api/builds`)
          .then((r) => (r.ok ? r.json() : []))
          .catch(() => []),
      ]);
      clientName = c?.name || null;

      type BuildLike = {
        id: string;
        name: string;
        clientId: string | null;
        totalCOGS: number;
        salePrice: number;
      };
      const candidates: BuildLike[] = Array.isArray(builds) ? builds : [];
      const matched =
        candidates.find((b) => b.clientId === job.clientId && b.name === job.name) ||
        candidates.find((b) => b.clientId === job.clientId) ||
        null;
      if (matched) {
        build = {
          id: matched.id,
          name: matched.name,
          totalCOGS: matched.totalCOGS || 0,
          salePrice: matched.salePrice || 0,
        };
      }
    }

    setBundle({
      job,
      clientName,
      build,
      invoices: Array.isArray(invRes) ? invRes : [],
      costEntries: Array.isArray(costsRes) ? costsRes : [],
    });
    setLoading(false);
  }, [jobId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleAdd = async () => {
    if (!form.description || !form.amount) return;
    setCreating(true);
    await fetch("/api/cost-entries", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        category: form.category,
        vendor: form.vendor || null,
        description: form.description,
        amount: parseFloat(form.amount),
        date: form.date,
        notes: form.notes || null,
      }),
    });
    setCreating(false);
    setShowAdd(false);
    setForm({
      category: "MATERIAL",
      vendor: "",
      description: "",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    fetchAll();
  };

  const handleDeleteEntry = async (id: string) => {
    if (!confirm("Delete this cost entry?")) return;
    await fetch(`/api/cost-entries/${id}`, { method: "DELETE" });
    fetchAll();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!bundle?.job) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/accounting")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Accounting
        </Button>
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          Job not found.
        </div>
      </div>
    );
  }

  const { job, clientName, build, invoices, costEntries } = bundle;

  const invoicedTotal = invoices.reduce((s, i) => s + i.amount, 0);
  const collected = invoices
    .filter((i) => i.status === "PAID")
    .reduce((s, i) => s + (i.paidAmount ?? i.amount), 0);
  const spent = costEntries.reduce((s, c) => s + c.amount, 0);
  const salePrice = build?.salePrice || invoicedTotal;
  const totalCOGS = build?.totalCOGS || 0;
  const profit = collected - spent;
  const margin = collected > 0 ? (profit / collected) * 100 : 0;

  // Cost by category breakdown
  const costByCat: Record<string, number> = {};
  for (const c of COST_CATEGORIES) costByCat[c] = 0;
  for (const e of costEntries) {
    costByCat[e.category] = (costByCat[e.category] || 0) + e.amount;
  }
  const maxCat = Math.max(1, ...Object.values(costByCat));

  // Budget vs actual
  const budgetPct = totalCOGS > 0 ? (spent / totalCOGS) * 100 : 0;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/accounting")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Accounting
        </Button>
      </div>

      <PageHeader
        title={job.name}
        description={clientName ? `Client: ${clientName}` : undefined}
        action={
          <Button size="sm" onClick={() => setShowAdd(true)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Cost Entry
          </Button>
        }
      />

      {/* Money grid */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3 mb-6">
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Sale Price</p>
          <p className="text-lg font-bold mt-0.5 tabular-nums">{fmt0(salePrice)}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Invoiced</p>
          <p className="text-lg font-bold mt-0.5 tabular-nums">{fmt0(invoicedTotal)}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Collected</p>
          <p className="text-lg font-bold mt-0.5 tabular-nums text-green-400">{fmt0(collected)}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Spent</p>
          <p className="text-lg font-bold mt-0.5 tabular-nums text-red-400">{fmt0(spent)}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Profit-to-Date</p>
          <p
            className={`text-lg font-bold mt-0.5 tabular-nums ${
              profit >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {fmt0(profit)}
          </p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Margin</p>
          <p className="text-lg font-bold mt-0.5 tabular-nums">{margin.toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          {/* Cost entries */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span>Cost Entries</span>
                <span className="text-xs text-muted-foreground">{costEntries.length} items</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {costEntries.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">
                  No cost entries yet. Click &quot;Add Cost Entry&quot; to log one.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {costEntries.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="text-xs">{dateOnly(e.date)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={COST_CATEGORY_COLORS[e.category]}>
                            {COST_CATEGORY_LABELS[e.category] || e.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">{e.vendor || "—"}</TableCell>
                        <TableCell className="text-sm">{e.description}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums">
                          {fmt2(e.amount)}
                        </TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteEntry(e.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoices for this Job</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {invoices.length === 0 ? (
                <p className="p-6 text-sm text-muted-foreground text-center">No invoices yet.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Number</TableHead>
                      <TableHead>Phase</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Paid</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {invoices.map((inv) => (
                      <TableRow
                        key={inv.id}
                        className="cursor-pointer"
                        onClick={() => router.push(`/invoices/${inv.id}`)}
                      >
                        <TableCell className="font-mono text-xs">{inv.number}</TableCell>
                        <TableCell>{inv.phaseLabel}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt0(inv.amount)}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className={INVOICE_STATUS_COLORS[inv.status]}>
                            {INVOICE_STATUS_LABELS[inv.status]}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">{dateOnly(inv.paidAt)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          {/* Cost-vs-budget */}
          {totalCOGS > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Budget vs Actual</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Budget (COGS)</span>
                    <span className="tabular-nums">{fmt0(totalCOGS)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Spent</span>
                    <span className="tabular-nums">{fmt0(spent)}</span>
                  </div>
                  <div className="h-3 rounded-full bg-muted overflow-hidden">
                    <div
                      className={`h-full ${budgetPct > 100 ? "bg-red-500" : "bg-primary/60"}`}
                      style={{ width: `${Math.min(budgetPct, 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    {budgetPct.toFixed(0)}% of budget used
                  </p>
                </div>
                <div className="pt-2 border-t flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Variance</span>
                  <span
                    className={`font-semibold tabular-nums ${
                      spent > totalCOGS ? "text-red-400" : "text-green-400"
                    }`}
                  >
                    {spent > totalCOGS ? "+" : ""}
                    {fmt0(spent - totalCOGS)}
                  </span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Cost by category */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cost by Category</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {COST_CATEGORIES.map((cat) => {
                const total = costByCat[cat] || 0;
                const w = (total / maxCat) * 100;
                return (
                  <div key={cat} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <Badge variant="secondary" className={COST_CATEGORY_COLORS[cat]}>
                        {COST_CATEGORY_LABELS[cat]}
                      </Badge>
                      <span className="font-medium tabular-nums">{fmt0(total)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary/60" style={{ width: `${w}%` }} />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-2 text-sm">
              <Link href={`/jobs/${job.id}`}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  Open Job Page
                </Button>
              </Link>
              <Link href={`/invoices?jobId=${job.id}`}>
                <Button variant="outline" size="sm" className="w-full justify-start">
                  See All Invoices
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Cost Entry Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Cost Entry</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COST_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>
                        {COST_CATEGORY_LABELS[c]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Date</Label>
                <Input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Vendor</Label>
              <Input
                value={form.vendor}
                onChange={(e) => setForm({ ...form, vendor: e.target.value })}
                placeholder="Optional"
              />
            </div>

            <div>
              <Label className="text-xs">Description</Label>
              <Input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="What was this for?"
              />
            </div>

            <div>
              <Label className="text-xs">Amount ($)</Label>
              <Input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
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
            <Button variant="outline" onClick={() => setShowAdd(false)} disabled={creating}>
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              disabled={creating || !form.description || !form.amount}
            >
              {creating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Add Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
