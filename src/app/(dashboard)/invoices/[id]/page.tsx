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
import { PageHeader } from "@/components/layout/page-header";
import {
  INVOICE_STATUSES,
  INVOICE_STATUS_LABELS,
  INVOICE_STATUS_COLORS,
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
} from "@/lib/constants";
import {
  ArrowLeft,
  Loader2,
  Save,
  Trash2,
  Send,
  CheckCircle,
  Ban,
  Copy,
  Check,
  ExternalLink,
  Receipt,
} from "lucide-react";

interface InvoiceDetail {
  id: string;
  number: string;
  jobId: string;
  clientId: string;
  phaseLabel: string;
  amount: number;
  description: string | null;
  status: string;
  sentAt: string | null;
  dueDate: string | null;
  paidAt: string | null;
  paidAmount: number | null;
  paymentMethod: string | null;
  payToken: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    zip: string | null;
  } | null;
  job: {
    id: string;
    name: string;
    status: string;
  } | null;
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
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function dateInputValue(d: string | null) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [marking, setMarking] = useState(false);
  const [voiding, setVoiding] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showPay, setShowPay] = useState(false);
  const [payMethod, setPayMethod] = useState("CHECK");

  const [edit, setEdit] = useState({
    amount: 0,
    dueDate: "",
    description: "",
    notes: "",
    status: "DRAFT",
  });

  const upd = (k: string, v: unknown) => setEdit((p) => ({ ...p, [k]: v }));

  const fetchInvoice = useCallback(async () => {
    const res = await fetch(`/api/invoices/${id}`);
    if (!res.ok) {
      setLoading(false);
      return;
    }
    const data: InvoiceDetail = await res.json();
    setInvoice(data);
    setEdit({
      amount: data.amount,
      dueDate: dateInputValue(data.dueDate),
      description: data.description || "",
      notes: data.notes || "",
      status: data.status,
    });
    setLoading(false);
  }, [id]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        amount: edit.amount,
        dueDate: edit.dueDate || null,
        description: edit.description || null,
        notes: edit.notes || null,
        status: edit.status,
      }),
    });
    setSaving(false);
    fetchInvoice();
  };

  const handleSend = async () => {
    setSending(true);
    await fetch(`/api/invoices/${id}/send`, { method: "POST" });
    setSending(false);
    fetchInvoice();
  };

  const handleMarkPaid = async () => {
    setMarking(true);
    await fetch(`/api/invoices/${id}/mark-paid`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentMethod: payMethod }),
    });
    setMarking(false);
    setShowPay(false);
    fetchInvoice();
  };

  const handleVoid = async () => {
    if (!confirm("Mark this invoice as VOID?")) return;
    setVoiding(true);
    await fetch(`/api/invoices/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "VOID" }),
    });
    setVoiding(false);
    fetchInvoice();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this invoice? This cannot be undone.")) return;
    await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    router.push("/invoices");
  };

  const handleCopyLink = async () => {
    if (!invoice?.payToken) return;
    const url = `${window.location.origin}/pay/${invoice.payToken}`;
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

  if (!invoice) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/invoices")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Invoices
        </Button>
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400">
          Invoice not found.
        </div>
      </div>
    );
  }

  const isPaid = invoice.status === "PAID";
  const isVoid = invoice.status === "VOID";
  const payUrl =
    invoice.payToken && typeof window !== "undefined"
      ? `${window.location.origin}/pay/${invoice.payToken}`
      : invoice.payToken
      ? `/pay/${invoice.payToken}`
      : "";

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <PageHeader
        title={`Invoice ${invoice.number}`}
        description={
          <span className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className={INVOICE_STATUS_COLORS[invoice.status]}>
              {INVOICE_STATUS_LABELS[invoice.status]}
            </Badge>
            <span>·</span>
            <span>{invoice.client?.name || "Unknown"}</span>
            {invoice.job && (
              <>
                <span>·</span>
                <Link
                  href={`/jobs/${invoice.job.id}`}
                  className="text-primary hover:underline"
                >
                  {invoice.job.name}
                </Link>
              </>
            )}
          </span>
        }
        action={
          <div className="flex flex-wrap gap-2">
            {!isPaid && !isVoid && (
              <>
                {invoice.status === "DRAFT" && (
                  <Button size="sm" onClick={handleSend} disabled={sending}>
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-1" />
                    ) : (
                      <Send className="h-4 w-4 mr-1" />
                    )}
                    Send Invoice
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowPay(true)}
                  disabled={marking}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Mark Paid
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleVoid}
                  disabled={voiding}
                >
                  <Ban className="h-4 w-4 mr-1" />
                  Void
                </Button>
              </>
            )}
            <Button size="sm" variant="outline" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Money strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Amount</p>
          <p className="text-lg font-bold mt-0.5 tabular-nums">{fmt2(invoice.amount)}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Sent</p>
          <p className="text-sm font-semibold mt-0.5">{dateOnly(invoice.sentAt)}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Due</p>
          <p className="text-sm font-semibold mt-0.5">{dateOnly(invoice.dueDate)}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Paid</p>
          <p className="text-sm font-semibold mt-0.5">
            {invoice.paidAt ? (
              <span className="text-green-400">{dateOnly(invoice.paidAt)}</span>
            ) : (
              "—"
            )}
          </p>
        </div>
      </div>

      {/* Pay link */}
      {invoice.payToken && !isVoid && (
        <div className="mb-4 p-4 rounded-lg border border-blue-500/20 bg-blue-500/5 flex items-center gap-3 text-sm">
          <Receipt className="h-5 w-5 text-blue-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-blue-400 mb-0.5">
              Payment Link — share with the client
            </p>
            <code className="text-xs text-muted-foreground truncate block">{payUrl}</code>
          </div>
          <Button size="sm" variant="outline" onClick={handleCopyLink}>
            {copied ? (
              <>
                <Check className="h-3 w-3 mr-1" />
                Copied
              </>
            ) : (
              <>
                <Copy className="h-3 w-3 mr-1" />
                Copy
              </>
            )}
          </Button>
          <a href={payUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="outline">
              <ExternalLink className="h-3 w-3 mr-1" />
              Open
            </Button>
          </a>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Edit fields */}
        <div className="md:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Invoice Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs">Phase Label</Label>
                <p className="font-medium text-sm">{invoice.phaseLabel}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs">Amount ($)</Label>
                  <Input
                    type="number"
                    value={edit.amount || ""}
                    onChange={(e) => upd("amount", parseFloat(e.target.value) || 0)}
                    disabled={isPaid || isVoid}
                  />
                </div>
                <div>
                  <Label className="text-xs">Due Date</Label>
                  <Input
                    type="date"
                    value={edit.dueDate}
                    onChange={(e) => upd("dueDate", e.target.value)}
                    disabled={isPaid || isVoid}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Status</Label>
                <Select value={edit.status} onValueChange={(v) => upd("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {INVOICE_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {INVOICE_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs">Description</Label>
                <Input
                  value={edit.description}
                  onChange={(e) => upd("description", e.target.value)}
                />
              </div>

              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea
                  rows={3}
                  value={edit.notes}
                  onChange={(e) => upd("notes", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Status history */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status History</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-2 text-sm">
                <li className="flex items-center justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="text-xs">{dateOnly(invoice.createdAt)}</span>
                </li>
                {invoice.sentAt && (
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Sent to client</span>
                    <span className="text-xs">{dateOnly(invoice.sentAt)}</span>
                  </li>
                )}
                {invoice.paidAt && (
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">
                      Paid via {invoice.paymentMethod || "—"}
                    </span>
                    <span className="text-xs text-green-400">{dateOnly(invoice.paidAt)}</span>
                  </li>
                )}
                {isVoid && (
                  <li className="flex items-center justify-between">
                    <span className="text-muted-foreground">Voided</span>
                    <span className="text-xs text-red-400">{dateOnly(invoice.updatedAt)}</span>
                  </li>
                )}
              </ol>
            </CardContent>
          </Card>
        </div>

        {/* Right column — client + payment info */}
        <div className="space-y-4">
          {invoice.client && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Bill To</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-medium">{invoice.client.name}</p>
                {invoice.client.phone && (
                  <p className="text-muted-foreground">{invoice.client.phone}</p>
                )}
                {invoice.client.email && (
                  <p className="text-muted-foreground">{invoice.client.email}</p>
                )}
                {invoice.client.address && (
                  <p className="text-muted-foreground">
                    {[invoice.client.address, invoice.client.city, invoice.client.zip]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                <Link href={`/clients/${invoice.client.id}`}>
                  <Button variant="link" size="sm" className="px-0 h-auto">
                    View Client
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {isPaid && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Payment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Method</span>
                  <span>
                    {invoice.paymentMethod
                      ? PAYMENT_METHOD_LABELS[invoice.paymentMethod] || invoice.paymentMethod
                      : "—"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid</span>
                  <span className="font-semibold tabular-nums">
                    {fmt2(invoice.paidAmount ?? invoice.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date</span>
                  <span>{dateOnly(invoice.paidAt)}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {invoice.job && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Related Job</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/jobs/${invoice.job.id}`}>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    {invoice.job.name}
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Mark Paid Dialog */}
      <Dialog open={showPay} onOpenChange={setShowPay}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mark Invoice as Paid</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Recording {fmt2(invoice.amount)} for {invoice.number}.
            </p>
            <div>
              <Label className="text-xs">Payment Method</Label>
              <Select value={payMethod} onValueChange={setPayMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {PAYMENT_METHOD_LABELS[m]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPay(false)} disabled={marking}>
              Cancel
            </Button>
            <Button onClick={handleMarkPaid} disabled={marking}>
              {marking ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-1" />
              )}
              Mark Paid
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
