"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import {
  UserPlus,
  Plus,
  Mail,
  Phone,
  ChevronRight,
  ChevronLeft,
  DollarSign,
  Trash2,
} from "lucide-react";

type ReferralStatus =
  | "PENDING"
  | "CONTACTED"
  | "QUALIFIED"
  | "BUILT"
  | "EXPIRED";

const STATUS_FLOW: ReferralStatus[] = [
  "PENDING",
  "CONTACTED",
  "QUALIFIED",
  "BUILT",
  "EXPIRED",
];

const STATUS_LABELS: Record<ReferralStatus, string> = {
  PENDING: "Pending",
  CONTACTED: "Contacted",
  QUALIFIED: "Qualified",
  BUILT: "Built",
  EXPIRED: "Expired",
};

const STATUS_COLORS: Record<ReferralStatus, string> = {
  PENDING: "bg-muted text-muted-foreground",
  CONTACTED: "bg-blue-500/15 text-blue-400",
  QUALIFIED: "bg-purple-500/15 text-purple-400",
  BUILT: "bg-green-500/15 text-green-400",
  EXPIRED: "bg-red-500/15 text-red-400",
};

interface ReferralItem {
  id: string;
  referrerClientId: string;
  referrerName: string;
  referredName: string;
  referredPhone: string | null;
  referredEmail: string | null;
  status: string;
  rewardAmount: number | null;
  rewardPaidAt: string | null;
  notes: string | null;
  createdAt: string;
}

interface ClientOption {
  id: string;
  name: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<ReferralItem[]>([]);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Add-form state
  const [referrerId, setReferrerId] = useState<string>("");
  const [referredName, setReferredName] = useState("");
  const [referredPhone, setReferredPhone] = useState("");
  const [referredEmail, setReferredEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadAll = async () => {
    const [rRes, cRes] = await Promise.all([
      fetch("/api/referrals"),
      fetch("/api/clients"),
    ]);
    const [rData, cData] = await Promise.all([rRes.json(), cRes.json()]);
    setReferrals(rData);
    setClients(
      cData.map((c: { id: string; name: string }) => ({
        id: c.id,
        name: c.name,
      }))
    );
    setLoading(false);
  };

  useEffect(() => {
    const run = async () => {
      const [rRes, cRes] = await Promise.all([
        fetch("/api/referrals"),
        fetch("/api/clients"),
      ]);
      const [rData, cData] = await Promise.all([rRes.json(), cRes.json()]);
      setReferrals(rData);
      setClients(
        cData.map((c: { id: string; name: string }) => ({
          id: c.id,
          name: c.name,
        }))
      );
      setLoading(false);
    };
    run();
  }, []);

  const handleStatusChange = async (id: string, newStatus: ReferralStatus) => {
    await fetch(`/api/referrals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    await loadAll();
  };

  const handleRewardChange = async (id: string, value: string) => {
    const amount = value ? parseFloat(value) : null;
    if (amount !== null && (isNaN(amount) || amount < 0)) return;
    await fetch(`/api/referrals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rewardAmount: amount }),
    });
    await loadAll();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this referral?")) return;
    await fetch(`/api/referrals/${id}`, { method: "DELETE" });
    await loadAll();
  };

  const handleAddReferral = async () => {
    if (!referrerId || !referredName.trim()) return;
    setSubmitting(true);
    await fetch("/api/referrals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        referrerClientId: referrerId,
        referredName: referredName.trim(),
        referredPhone: referredPhone.trim() || null,
        referredEmail: referredEmail.trim() || null,
        notes: notes.trim() || null,
      }),
    });
    setReferrerId("");
    setReferredName("");
    setReferredPhone("");
    setReferredEmail("");
    setNotes("");
    setSubmitting(false);
    setDialogOpen(false);
    await loadAll();
  };

  const groupedByStatus: Record<ReferralStatus, ReferralItem[]> = {
    PENDING: [],
    CONTACTED: [],
    QUALIFIED: [],
    BUILT: [],
    EXPIRED: [],
  };
  for (const r of referrals) {
    const s = (
      STATUS_FLOW.includes(r.status as ReferralStatus)
        ? r.status
        : "PENDING"
    ) as ReferralStatus;
    groupedByStatus[s].push(r);
  }

  const totalRewardsPaid = referrals
    .filter((r) => r.status === "BUILT" && r.rewardAmount)
    .reduce((sum, r) => sum + (r.rewardAmount || 0), 0);

  return (
    <div>
      <PageHeader
        title="Referrals"
        description={`${referrals.length} total • ${formatCurrency(
          totalRewardsPaid
        )} in rewards on built referrals`}
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Referral
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Referral</DialogTitle>
                <DialogDescription>
                  Log a new referral from an existing client.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium block mb-1.5">
                    Referrer (existing client)
                  </label>
                  <Select value={referrerId} onValueChange={setReferrerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pick a client..." />
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

                <div>
                  <label className="text-sm font-medium block mb-1.5">
                    Referred name
                  </label>
                  <Input
                    placeholder="Who did they refer?"
                    value={referredName}
                    onChange={(e) => setReferredName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium block mb-1.5">
                      Phone
                    </label>
                    <Input
                      placeholder="(941) 555-0000"
                      value={referredPhone}
                      onChange={(e) => setReferredPhone(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium block mb-1.5">
                      Email
                    </label>
                    <Input
                      type="email"
                      placeholder="email@example.com"
                      value={referredEmail}
                      onChange={(e) => setReferredEmail(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5">
                    Notes
                  </label>
                  <Textarea
                    placeholder="What does the referrer say about them?"
                    rows={3}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={submitting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddReferral}
                  disabled={!referrerId || !referredName.trim() || submitting}
                >
                  {submitting ? "Saving..." : "Save Referral"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : referrals.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <UserPlus className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">
              No referrals yet. Track who&rsquo;s sending you new business.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Add Your First Referral
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {STATUS_FLOW.map((status) => {
            const items = groupedByStatus[status];
            return (
              <div key={status} className="flex flex-col">
                <div className="flex items-center justify-between mb-2 px-1">
                  <div className="flex items-center gap-1.5">
                    <Badge
                      variant="secondary"
                      className={STATUS_COLORS[status]}
                    >
                      {STATUS_LABELS[status]}
                    </Badge>
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {items.length}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 bg-muted/30 rounded-lg p-2 min-h-32">
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-4">
                      Empty
                    </p>
                  ) : (
                    items.map((r) => {
                      const idx = STATUS_FLOW.indexOf(
                        r.status as ReferralStatus
                      );
                      const prevStatus = idx > 0 ? STATUS_FLOW[idx - 1] : null;
                      const nextStatus =
                        idx < STATUS_FLOW.length - 1
                          ? STATUS_FLOW[idx + 1]
                          : null;

                      return (
                        <Card key={r.id} className="py-3 gap-2">
                          <CardContent className="space-y-2">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm leading-tight truncate">
                                  {r.referredName}
                                </p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  via {r.referrerName}
                                </p>
                              </div>
                              <button
                                className="text-muted-foreground/40 hover:text-destructive shrink-0"
                                onClick={() => handleDelete(r.id)}
                                aria-label="Delete referral"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>

                            {(r.referredPhone || r.referredEmail) && (
                              <div className="space-y-0.5 text-[11px] text-muted-foreground">
                                {r.referredPhone && (
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    <span className="truncate">
                                      {r.referredPhone}
                                    </span>
                                  </div>
                                )}
                                {r.referredEmail && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate">
                                      {r.referredEmail}
                                    </span>
                                  </div>
                                )}
                              </div>
                            )}

                            {r.notes && (
                              <p className="text-[11px] text-muted-foreground italic line-clamp-3">
                                {r.notes}
                              </p>
                            )}

                            {/* Reward field — visible always; only meaningful when QUALIFIED+ */}
                            <div className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3 text-muted-foreground" />
                              <Input
                                type="number"
                                placeholder="Reward $"
                                defaultValue={r.rewardAmount ?? ""}
                                onBlur={(e) =>
                                  handleRewardChange(r.id, e.target.value)
                                }
                                className="h-7 text-xs px-2"
                              />
                            </div>

                            {/* Status nav */}
                            <div className="flex items-center justify-between gap-1 pt-1">
                              <Button
                                variant="ghost"
                                size="xs"
                                disabled={!prevStatus}
                                onClick={() =>
                                  prevStatus &&
                                  handleStatusChange(r.id, prevStatus)
                                }
                              >
                                <ChevronLeft className="h-3 w-3" />
                              </Button>
                              <span className="text-[10px] text-muted-foreground tabular-nums">
                                {idx + 1} / {STATUS_FLOW.length}
                              </span>
                              <Button
                                variant="ghost"
                                size="xs"
                                disabled={!nextStatus}
                                onClick={() =>
                                  nextStatus &&
                                  handleStatusChange(r.id, nextStatus)
                                }
                              >
                                <ChevronRight className="h-3 w-3" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
