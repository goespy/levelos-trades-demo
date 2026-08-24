"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
  Save,
  Trash2,
  Loader2,
  Wrench,
  Star,
  AlertTriangle,
} from "lucide-react";

interface JobPhaseLite {
  id: string;
  name: string;
  status: string;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  actualStart: string | null;
  actualEnd: string | null;
  job: { id: string; name: string; status: string } | null;
}

interface SubDetail {
  id: string;
  name: string;
  trade: string;
  contact: string | null;
  email: string | null;
  phone: string | null;
  licenseNumber: string | null;
  insuranceExpires: string | null;
  hourlyRate: number | null;
  rating: number | null;
  notes: string | null;
  active: boolean;
  jobPhases: JobPhaseLite[];
}

const TRADES = [
  "Excavation",
  "Gunite",
  "Tile",
  "Plumbing",
  "Electrical",
  "Screen",
  "Deck",
  "Other",
];

const PHASE_STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-muted text-muted-foreground",
  IN_PROGRESS: "bg-blue-500/15 text-blue-400",
  BLOCKED: "bg-red-500/15 text-red-400",
  COMPLETE: "bg-green-500/15 text-green-400",
};

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function toDateInput(d: string | null) {
  if (!d) return "";
  return new Date(d).toISOString().split("T")[0];
}

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs text-muted-foreground">No rating</span>;
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={
            i <= rating
              ? "h-4 w-4 fill-yellow-400 text-yellow-400"
              : "h-4 w-4 text-muted-foreground"
          }
        />
      ))}
    </div>
  );
}

export default function SubDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [sub, setSub] = useState<SubDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [edit, setEdit] = useState({
    name: "",
    trade: "Excavation",
    contact: "",
    email: "",
    phone: "",
    licenseNumber: "",
    insuranceExpires: "",
    hourlyRate: "",
    rating: "",
    notes: "",
    active: true,
  });

  const fetchSub = useCallback(async () => {
    const res = await fetch(`/api/subs/${id}`);
    if (!res.ok) {
      router.push("/subs");
      return;
    }
    const data: SubDetail = await res.json();
    setSub(data);
    setEdit({
      name: data.name,
      trade: data.trade,
      contact: data.contact || "",
      email: data.email || "",
      phone: data.phone || "",
      licenseNumber: data.licenseNumber || "",
      insuranceExpires: toDateInput(data.insuranceExpires),
      hourlyRate: data.hourlyRate != null ? String(data.hourlyRate) : "",
      rating: data.rating != null ? String(data.rating) : "",
      notes: data.notes || "",
      active: data.active,
    });
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchSub();
  }, [fetchSub]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/subs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: edit.name,
        trade: edit.trade,
        contact: edit.contact || null,
        email: edit.email || null,
        phone: edit.phone || null,
        licenseNumber: edit.licenseNumber || null,
        insuranceExpires: edit.insuranceExpires || null,
        hourlyRate: edit.hourlyRate ? Number(edit.hourlyRate) : null,
        rating: edit.rating ? Number(edit.rating) : null,
        notes: edit.notes || null,
        active: edit.active,
      }),
    });
    setSaving(false);
    fetchSub();
  };

  const handleDelete = async () => {
    if (!confirm(`Delete subcontractor "${sub?.name}"?`)) return;
    await fetch(`/api/subs/${id}`, { method: "DELETE" });
    router.push("/subs");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!sub) return null;

  const insuranceDays = edit.insuranceExpires
    ? Math.floor(
        (new Date(edit.insuranceExpires).getTime() - Date.now()) /
          (1000 * 60 * 60 * 24)
      )
    : null;
  const insuranceWarn = insuranceDays !== null && insuranceDays < 30;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.push("/subs")}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Subs
        </Button>
      </div>

      <PageHeader
        title={sub.name}
        description={
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary">{sub.trade}</Badge>
            <Stars rating={sub.rating} />
            {!sub.active && <Badge variant="outline">Inactive</Badge>}
          </div>
        }
        action={
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={edit.name}
                    onChange={(e) => setEdit({ ...edit, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="trade">Trade</Label>
                  <Select
                    value={edit.trade}
                    onValueChange={(v) => setEdit({ ...edit, trade: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TRADES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={edit.phone}
                    onChange={(e) => setEdit({ ...edit, phone: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={edit.email}
                    onChange={(e) => setEdit({ ...edit, email: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="contact">Contact Person</Label>
                <Input
                  id="contact"
                  value={edit.contact}
                  onChange={(e) => setEdit({ ...edit, contact: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="licenseNumber">License Number</Label>
                  <Input
                    id="licenseNumber"
                    value={edit.licenseNumber}
                    onChange={(e) =>
                      setEdit({ ...edit, licenseNumber: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="insuranceExpires">
                    Insurance Expires{" "}
                    {insuranceWarn && (
                      <span className="text-red-400 text-xs ml-1 inline-flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" />
                        {insuranceDays !== null && insuranceDays < 0
                          ? "Expired"
                          : `${insuranceDays}d`}
                      </span>
                    )}
                  </Label>
                  <Input
                    id="insuranceExpires"
                    type="date"
                    value={edit.insuranceExpires}
                    onChange={(e) =>
                      setEdit({ ...edit, insuranceExpires: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="hourlyRate">Hourly Rate ($)</Label>
                  <Input
                    id="hourlyRate"
                    type="number"
                    value={edit.hourlyRate}
                    onChange={(e) =>
                      setEdit({ ...edit, hourlyRate: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="rating">Rating (1-5)</Label>
                  <Input
                    id="rating"
                    type="number"
                    min="1"
                    max="5"
                    value={edit.rating}
                    onChange={(e) => setEdit({ ...edit, rating: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={edit.notes}
                  onChange={(e) => setEdit({ ...edit, notes: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="active"
                  type="checkbox"
                  checked={edit.active}
                  onChange={(e) => setEdit({ ...edit, active: e.target.checked })}
                  className="h-4 w-4"
                />
                <Label htmlFor="active" className="cursor-pointer">
                  Active (available for new assignments)
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                Recent Job Phases ({sub.jobPhases.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sub.jobPhases.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No phases assigned to this sub yet.
                </p>
              ) : (
                <div className="space-y-2">
                  {sub.jobPhases.map((p) => (
                    <Link
                      key={p.id}
                      href={p.job ? `/jobs/${p.job.id}` : "#"}
                      className="block"
                    >
                      <div className="border rounded-md p-2 hover:bg-accent/50 transition-colors">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-medium truncate">
                            {p.name}
                          </p>
                          <Badge
                            variant="secondary"
                            className={`${PHASE_STATUS_COLORS[p.status]} text-[10px]`}
                          >
                            {p.status}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {p.job?.name || "Unknown job"}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {fmtDate(p.scheduledStart)} → {fmtDate(p.scheduledEnd)}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
