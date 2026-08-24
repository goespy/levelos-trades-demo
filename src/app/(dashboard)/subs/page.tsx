"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { Plus, Wrench, Star, AlertTriangle } from "lucide-react";

interface SubItem {
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
  active: boolean;
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

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function daysUntil(d: string | null) {
  if (!d) return null;
  const ms = new Date(d).getTime() - Date.now();
  return Math.floor(ms / (1000 * 60 * 60 * 24));
}

function Stars({ rating }: { rating: number | null }) {
  if (!rating) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <div className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={
            i <= rating
              ? "h-3.5 w-3.5 fill-yellow-400 text-yellow-400"
              : "h-3.5 w-3.5 text-muted-foreground"
          }
        />
      ))}
    </div>
  );
}

export default function SubsPage() {
  const router = useRouter();
  const [subs, setSubs] = useState<SubItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [tradeFilter, setTradeFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: "",
    trade: "Excavation",
    phone: "",
    email: "",
    contact: "",
    licenseNumber: "",
    insuranceExpires: "",
    hourlyRate: "",
    rating: "",
    notes: "",
  });

  const load = async () => {
    const params = new URLSearchParams();
    if (tradeFilter) params.set("trade", tradeFilter);
    const res = await fetch(`/api/subs?${params}`);
    const data = await res.json();
    setSubs(data);
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tradeFilter]);

  const handleCreate = async () => {
    setCreating(true);
    const res = await fetch("/api/subs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        trade: form.trade,
        phone: form.phone || null,
        email: form.email || null,
        contact: form.contact || null,
        licenseNumber: form.licenseNumber || null,
        insuranceExpires: form.insuranceExpires || null,
        hourlyRate: form.hourlyRate ? Number(form.hourlyRate) : null,
        rating: form.rating ? Number(form.rating) : null,
        notes: form.notes || null,
      }),
    });
    setCreating(false);
    if (res.ok) {
      setDialogOpen(false);
      setForm({
        name: "",
        trade: "Excavation",
        phone: "",
        email: "",
        contact: "",
        licenseNumber: "",
        insuranceExpires: "",
        hourlyRate: "",
        rating: "",
        notes: "",
      });
      load();
    }
  };

  return (
    <div>
      <PageHeader
        title="Subcontractors"
        description={`${subs.length} ${tradeFilter ? `${tradeFilter} ` : ""}subs in directory`}
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Subcontractor
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>New Subcontractor</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="trade">Trade *</Label>
                  <Select
                    value={form.trade}
                    onValueChange={(v) => setForm({ ...form, trade: v })}
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
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="contact">Contact Person</Label>
                  <Input
                    id="contact"
                    value={form.contact}
                    onChange={(e) => setForm({ ...form, contact: e.target.value })}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="licenseNumber">License #</Label>
                    <Input
                      id="licenseNumber"
                      value={form.licenseNumber}
                      onChange={(e) =>
                        setForm({ ...form, licenseNumber: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="insuranceExpires">Insurance Expires</Label>
                    <Input
                      id="insuranceExpires"
                      type="date"
                      value={form.insuranceExpires}
                      onChange={(e) =>
                        setForm({ ...form, insuranceExpires: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="hourlyRate">Hourly Rate</Label>
                    <Input
                      id="hourlyRate"
                      type="number"
                      value={form.hourlyRate}
                      onChange={(e) =>
                        setForm({ ...form, hourlyRate: e.target.value })
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
                      value={form.rating}
                      onChange={(e) => setForm({ ...form, rating: e.target.value })}
                    />
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreate} disabled={!form.name || creating}>
                  {creating ? "Creating..." : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="flex gap-2 mb-4">
        <Select
          value={tradeFilter || "ALL"}
          onValueChange={(v) => setTradeFilter(v === "ALL" ? "" : v)}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Trades" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Trades</SelectItem>
            {TRADES.map((t) => (
              <SelectItem key={t} value={t}>
                {t}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : subs.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <Wrench className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">
              {tradeFilter
                ? `No ${tradeFilter} subs found.`
                : "No subcontractors yet. Add your first one."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Trade</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>License</TableHead>
                <TableHead>Insurance Expires</TableHead>
                <TableHead>Rating</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subs.map((sub) => {
                const days = daysUntil(sub.insuranceExpires);
                const insuranceWarn = days !== null && days < 30;
                return (
                  <TableRow
                    key={sub.id}
                    className="cursor-pointer hover:bg-accent/50"
                    onClick={() => router.push(`/subs/${sub.id}`)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Link
                          href={`/subs/${sub.id}`}
                          className="font-medium hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {sub.name}
                        </Link>
                        {!sub.active && (
                          <Badge variant="outline" className="text-xs">
                            Inactive
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{sub.trade}</Badge>
                    </TableCell>
                    <TableCell className="text-sm">
                      {sub.phone ? (
                        <a
                          href={`tel:${sub.phone}`}
                          className="text-blue-400 hover:underline"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {sub.phone}
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-sm font-mono text-muted-foreground">
                      {sub.licenseNumber || "—"}
                    </TableCell>
                    <TableCell className="text-sm">
                      {sub.insuranceExpires ? (
                        <span
                          className={
                            insuranceWarn
                              ? "inline-flex items-center gap-1 text-red-400 font-medium"
                              : "text-muted-foreground"
                          }
                        >
                          {insuranceWarn && <AlertTriangle className="h-3 w-3" />}
                          {fmtDate(sub.insuranceExpires)}
                          {insuranceWarn && days !== null && (
                            <span className="text-[10px]">
                              ({days < 0 ? "expired" : `${days}d`})
                            </span>
                          )}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Stars rating={sub.rating} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
