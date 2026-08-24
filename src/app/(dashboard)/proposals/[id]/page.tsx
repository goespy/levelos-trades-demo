"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/page-header";
import {
  PROPOSAL_STATUSES,
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUS_COLORS,
} from "@/lib/constants";
import { COST_PHASE_LABELS } from "@/lib/pool-costs";
import {
  ArrowLeft,
  Loader2,
  Save,
  Trash2,
  FileSignature,
  Pencil,
  Share2,
  Copy,
  Check,
  CheckCircle,
  MessageSquare,
} from "lucide-react";
import Link from "next/link";

interface LineItem {
  phase: string;
  label: string;
  quantity: number;
  unit: string;
  unitCost: number;
  total: number;
}

interface ProposalDetail {
  id: string;
  clientId: string;
  buildId: string;
  status: string;
  total: number;
  discount: number;
  poolLength: number | null;
  poolWidth: number | null;
  deckMaterial: string | null;
  lineItems: string | null;
  timeline: string | null;
  exclusions: string | null;
  notes: string | null;
  renderImages: string | null;
  shareToken: string | null;
  sharedAt: string | null;
  clientRespondedAt: string | null;
  clientMessage: string | null;
  createdAt: string;
  updatedAt: string;
  contracts: { id: string; status: string }[];
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    city: string | null;
    zip: string | null;
  } | null;
  build: {
    id: string;
    name: string;
    totalCOGS: number;
    salePrice: number;
    marginPct: number;
  } | null;
}

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

function fmtPrecise(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(v);
}

export default function ProposalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [proposal, setProposal] = useState<ProposalDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [creatingContract, setCreatingContract] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const [edit, setEdit] = useState({
    status: "DRAFT",
    total: 0,
    discount: 0,
    exclusions: "",
    notes: "",
  });

  const upd = (field: string, value: unknown) =>
    setEdit((prev) => ({ ...prev, [field]: value }));

  const fetchProposal = useCallback(async () => {
    try {
      const res = await fetch(`/api/proposals/${id}`);
      const body = await res.text();
      if (!res.ok) {
        let errMsg = body;
        try {
          const parsed = JSON.parse(body);
          errMsg = parsed.error || body;
        } catch {}
        setLoadError(`Load failed (${res.status}) for id "${id}": ${errMsg || "no body"}`);
        setLoading(false);
        console.error("Proposal load failed", { id, status: res.status, body });
        return;
      }
      const data: ProposalDetail = JSON.parse(body);
      setProposal(data);
      setEdit({
        status: data.status,
        total: data.total,
        discount: data.discount,
        exclusions: data.exclusions || "",
        notes: data.notes || "",
      });
      setLoading(false);
    } catch (err) {
      setLoadError(`Network error: ${err instanceof Error ? err.message : String(err)}`);
      setLoading(false);
      console.error("Proposal load threw", err);
    }
  }, [id]);

  useEffect(() => {
    fetchProposal();
  }, [fetchProposal]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/proposals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...edit,
        exclusions: edit.exclusions || null,
        notes: edit.notes || null,
      }),
    });
    setSaving(false);
    fetchProposal();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this proposal?")) return;
    await fetch(`/api/proposals/${id}`, { method: "DELETE" });
    router.push("/proposals");
  };

  const handleCreateContract = async () => {
    setCreatingContract(true);
    const res = await fetch("/api/contracts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ proposalId: id }),
    });
    const contract = await res.json();
    setCreatingContract(false);
    router.push(`/contracts/${contract.id}`);
  };

  const handleShare = async () => {
    setSharing(true);
    const res = await fetch(`/api/proposals/${id}/share`, { method: "POST" });
    const data = await res.json();
    setSharing(false);
    if (data.url) {
      const fullUrl = window.location.origin + data.url;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      fetchProposal();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (loadError || !proposal) {
    return (
      <div className="max-w-2xl mx-auto py-8 space-y-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/proposals")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Proposals
        </Button>
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 whitespace-pre-wrap">
          <p className="font-medium mb-1">Could not open proposal</p>
          <p>{loadError || "Proposal not found"}</p>
        </div>
      </div>
    );
  }

  const lineItems: LineItem[] = proposal.lineItems
    ? JSON.parse(proposal.lineItems)
    : [];

  // Group line items by phase
  const phaseGroups: Record<string, LineItem[]> = {};
  for (const item of lineItems) {
    if (!phaseGroups[item.phase]) phaseGroups[item.phase] = [];
    phaseGroups[item.phase].push(item);
  }

  const phases = Object.keys(phaseGroups);
  const phaseSubtotals: Record<string, number> = {};
  for (const [phase, items] of Object.entries(phaseGroups)) {
    phaseSubtotals[phase] = items.reduce((sum, li) => sum + li.total, 0);
  }

  const subtotal = lineItems.reduce((sum, li) => sum + li.total, 0);
  const finalTotal = edit.total - edit.discount;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 print:hidden">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <PageHeader
        title={`Proposal for ${proposal.client?.name || "Unknown"}`}
        description={`Build: ${proposal.build?.name || "Unknown"} | Created ${new Date(proposal.createdAt).toLocaleDateString()}`}
        action={
          <div className="flex gap-2 print:hidden flex-wrap">
            <Button size="sm" onClick={handleShare} disabled={sharing}>
              {copied ? (
                <Check className="h-4 w-4 mr-1" />
              ) : sharing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Share2 className="h-4 w-4 mr-1" />
              )}
              {copied ? "Link Copied!" : proposal.shareToken ? "Copy Client Link" : "Send to Client"}
            </Button>
            <Link href={`/proposals/${id}/template`}>
              <Button size="sm" variant="outline">
                <Pencil className="h-4 w-4 mr-1" />
                Edit Template
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCreateContract}
              disabled={creatingContract}
            >
              {creatingContract ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <FileSignature className="h-4 w-4 mr-1" />
              )}
              Contract
            </Button>
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
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Subtotal</p>
          <p className="text-lg font-bold mt-0.5">{fmt(subtotal)}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Discount</p>
          <p className="text-lg font-bold mt-0.5">{edit.discount > 0 ? `-${fmt(edit.discount)}` : "—"}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total</p>
          <p className="text-lg font-bold mt-0.5 text-primary">{fmt(finalTotal)}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Status</p>
          <div className="mt-0.5">
            <Badge variant="secondary" className={PROPOSAL_STATUS_COLORS[proposal.status]}>
              {PROPOSAL_STATUS_LABELS[proposal.status]}
            </Badge>
          </div>
        </div>
      </div>

      {/* Share link */}
      {proposal.shareToken && (
        <div className="mb-4 p-4 rounded-lg border border-blue-500/20 bg-blue-500/5 flex items-center gap-3 text-sm print:hidden">
          <Share2 className="h-5 w-5 text-blue-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-blue-400 mb-0.5">Client Link — send this to the customer</p>
            <code className="text-xs text-muted-foreground truncate block">
              {typeof window !== "undefined"
                ? `${window.location.origin}/p/${proposal.shareToken}`
                : `/p/${proposal.shareToken}`}
            </code>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="flex-shrink-0"
            onClick={async () => {
              await navigator.clipboard.writeText(
                `${window.location.origin}/p/${proposal.shareToken}`
              );
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <><Check className="h-3 w-3 mr-1" /> Copied</> : <><Copy className="h-3 w-3 mr-1" /> Copy</>}
          </Button>
        </div>
      )}

      {/* Client response status */}
      {(proposal.status === "ACCEPTED" || proposal.clientMessage) && (
        <div className="mb-4 print:hidden">
          {proposal.status === "ACCEPTED" && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-green-400">Client Approved</p>
                {proposal.clientRespondedAt && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {new Date(proposal.clientRespondedAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          )}
          {proposal.clientMessage && (
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 flex items-start gap-2 mt-2">
              <MessageSquare className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-400">Client Requested Changes</p>
                <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{proposal.clientMessage}</p>
                {proposal.clientRespondedAt && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(proposal.clientRespondedAt).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
                    })}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left — Edit sidebar */}
        <div className="space-y-4 print:hidden">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={edit.status} onValueChange={(v) => upd("status", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PROPOSAL_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {PROPOSAL_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Total ($)</Label>
                  <Input
                    type="number"
                    value={edit.total || ""}
                    onChange={(e) => upd("total", parseFloat(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label className="text-xs">Discount ($)</Label>
                  <Input
                    type="number"
                    value={edit.discount || ""}
                    onChange={(e) => upd("discount", parseFloat(e.target.value) || 0)}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs">Exclusions</Label>
                <Textarea
                  value={edit.exclusions}
                  onChange={(e) => upd("exclusions", e.target.value)}
                  rows={3}
                  placeholder="Items NOT included..."
                />
              </div>

              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea
                  value={edit.notes}
                  onChange={(e) => upd("notes", e.target.value)}
                  rows={3}
                  placeholder="Additional notes..."
                />
              </div>
            </CardContent>
          </Card>

          {/* Client info */}
          {proposal.client && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Client</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                <p className="font-medium">{proposal.client.name}</p>
                {proposal.client.phone && <p className="text-muted-foreground">{proposal.client.phone}</p>}
                {proposal.client.email && <p className="text-muted-foreground">{proposal.client.email}</p>}
                {proposal.client.address && (
                  <p className="text-muted-foreground">
                    {[proposal.client.address, proposal.client.city, proposal.client.zip]
                      .filter(Boolean)
                      .join(", ")}
                  </p>
                )}
                <Link href={`/clients/${proposal.client.id}`}>
                  <Button variant="link" size="sm" className="px-0 h-auto">
                    View Client
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Contracts */}
          {proposal.contracts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Contracts ({proposal.contracts.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {proposal.contracts.map((c) => (
                  <Link key={c.id} href={`/contracts/${c.id}`}>
                    <div className="flex items-center justify-between p-2 rounded hover:bg-accent text-sm">
                      <span className="truncate font-mono text-xs">{c.id.slice(0, 8)}...</span>
                      <Badge variant="secondary" className="text-xs">
                        {c.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right — Cost breakdown */}
        <div className="md:col-span-2 space-y-4">
          {/* Pool info */}
          {(proposal.poolLength || proposal.poolWidth) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Pool Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Length</p>
                    <p className="font-medium">{proposal.poolLength} ft</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Width</p>
                    <p className="font-medium">{proposal.poolWidth} ft</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Deck Material</p>
                    <p className="font-medium">{proposal.deckMaterial || "—"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Line items by phase */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Cost Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              {phases.length > 0 ? (
                <div className="space-y-6">
                  {phases.map((phase) => (
                    <div key={phase}>
                      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                        {COST_PHASE_LABELS[phase] || phase}
                      </h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Item</TableHead>
                            <TableHead className="text-right">Qty</TableHead>
                            <TableHead>Unit</TableHead>
                            <TableHead className="text-right">Unit Cost</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {phaseGroups[phase].map((item, i) => (
                            <TableRow key={i}>
                              <TableCell>{item.label}</TableCell>
                              <TableCell className="text-right tabular-nums">{item.quantity.toLocaleString()}</TableCell>
                              <TableCell>{item.unit}</TableCell>
                              <TableCell className="text-right tabular-nums">{fmtPrecise(item.unitCost)}</TableCell>
                              <TableCell className="text-right font-medium tabular-nums">{fmtPrecise(item.total)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                        <TableFooter>
                          <TableRow>
                            <TableCell colSpan={4} className="font-medium">
                              {COST_PHASE_LABELS[phase] || phase} Subtotal
                            </TableCell>
                            <TableCell className="text-right font-bold tabular-nums">
                              {fmt(phaseSubtotals[phase])}
                            </TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </div>
                  ))}

                  <Separator />

                  {/* Grand totals */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="font-medium tabular-nums">{fmt(subtotal)}</span>
                    </div>
                    {edit.discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Discount</span>
                        <span className="font-medium tabular-nums text-red-400">-{fmt(edit.discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold pt-2 border-t">
                      <span>Total</span>
                      <span className="tabular-nums">{fmt(finalTotal)}</span>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No line items</p>
              )}
            </CardContent>
          </Card>

          {/* Exclusions & Notes (print view) */}
          {(edit.exclusions || edit.notes) && (
            <Card>
              <CardContent className="pt-6 space-y-4">
                {edit.exclusions && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Exclusions
                    </h4>
                    <p className="text-sm whitespace-pre-wrap">{edit.exclusions}</p>
                  </div>
                )}
                {edit.notes && (
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Notes
                    </h4>
                    <p className="text-sm whitespace-pre-wrap">{edit.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
