"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { PageHeader } from "@/components/layout/page-header";
import {
  BUILD_STATUSES,
  BUILD_STATUS_LABELS,
  BUILD_STATUS_COLORS,
  COST_PHASE_LABELS,
  MARGIN_THRESHOLDS,
  DEFAULT_ADDITION_COSTS,
  EQUIPMENT_PACKAGES,
} from "@/lib/pool-costs";
import { calculateBuild, analyzeMargin, type BuildInput } from "@/lib/build-calculator";
import { ArrowLeft, FileText, Loader2, Save, Trash2 } from "lucide-react";
import Link from "next/link";

interface BuildLineItem {
  id: string;
  phase: string;
  label: string;
  quantity: number;
  unit: string;
  unitCost: number;
  total: number;
  isOverride: boolean;
  sortOrder: number;
}

interface BuildDetail {
  id: string;
  name: string;
  status: string;
  clientId: string | null;
  poolLength: number;
  poolWidth: number;
  deckLength: number;
  deckWidth: number;
  hasSpa: boolean;
  hasHeat: boolean;
  hasAutomation: boolean;
  isSalt: boolean;
  hasCage: boolean;
  hasWaterfall: boolean;
  hasSod: boolean;
  hasTreeRemoval: boolean;
  hasFireFeatures: boolean;
  hasInteriorUpgrade: boolean;
  deckMaterial: string;
  equipment: string;
  spaCost: number;
  heatCost: number;
  sodCost: number;
  cageCost: number;
  waterfallCost: number;
  treeRemovalCost: number;
  fireFeaturesCost: number;
  interiorUpgradeCost: number;
  deckAreaOverride: number | null;
  deckVertices: string | null;
  totalCOGS: number;
  salePrice: number;
  grossProfit: number;
  marginPct: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  lineItems: BuildLineItem[];
}

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
}

function fmtPrecise(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v);
}

function marginBadge(pct: number) {
  if (pct >= MARGIN_THRESHOLDS.green) return "bg-green-500/15 text-green-400";
  if (pct >= MARGIN_THRESHOLDS.yellow) return "bg-yellow-500/15 text-yellow-400";
  return "bg-red-500/15 text-red-400";
}

// Inline editable cell — click to edit, Enter/blur to save
function EditableCell({
  value,
  format,
  onSave,
  align = "right",
  type = "number",
}: {
  value: number | string;
  format?: (v: number) => string;
  onSave: (v: number | string) => void;
  align?: "left" | "right";
  type?: "number" | "text";
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(value));

  const commit = () => {
    setEditing(false);
    const parsed = type === "number" ? parseFloat(draft) || 0 : draft;
    if (parsed !== value) onSave(parsed);
  };

  if (editing) {
    return (
      <input
        autoFocus
        type={type}
        step={type === "number" ? "any" : undefined}
        className={`w-full bg-transparent border-b border-primary outline-none text-sm tabular-nums py-0 px-0 ${align === "right" ? "text-right" : "text-left"}`}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") commit();
          if (e.key === "Escape") { setDraft(String(value)); setEditing(false); }
        }}
      />
    );
  }

  const display = format && typeof value === "number" ? format(value) : String(value);

  return (
    <span
      className={`cursor-pointer hover:text-primary hover:underline underline-offset-2 transition-colors select-all ${align === "right" ? "text-right" : "text-left"}`}
      onClick={() => { setDraft(String(value)); setEditing(true); }}
      title="Click to edit"
    >
      {display}
    </span>
  );
}

export default function BuildDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [build, setBuild] = useState<BuildDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [clientName, setClientName] = useState<string | null>(null);

  // All editable fields in one object to reduce noise
  const [edit, setEdit] = useState({
    poolLength: 0, poolWidth: 0, deckLength: 0, deckWidth: 0,
    salePrice: 0, status: "DRAFT", notes: "",
    hasSpa: false, hasHeat: false, hasAutomation: false, isSalt: false,
    hasCage: false, hasWaterfall: false, hasSod: false,
    hasTreeRemoval: false, hasFireFeatures: false, hasInteriorUpgrade: false,
    deckMaterial: "PAVER", equipment: "BASE",
    spaCost: 0, heatCost: 0, sodCost: 0,
    cageCost: 0, waterfallCost: 0,
    treeRemovalCost: 0, fireFeaturesCost: 0, interiorUpgradeCost: 0,
    deckAreaOverride: null as number | null,
  });

  const upd = (field: string, value: unknown) =>
    setEdit((prev) => ({ ...prev, [field]: value }));

  const fetchBuild = useCallback(async () => {
    const res = await fetch(`/api/builds/${id}`);
    if (!res.ok) { router.push("/builds"); return; }
    const data: BuildDetail = await res.json();
    setBuild(data);
    // Fetch client name if linked
    if (data.clientId) {
      fetch(`/api/clients/${data.clientId}`).then((r) => r.ok ? r.json() : null).then((c) => {
        if (c) setClientName(c.name);
      }).catch(() => {});
    }
    setEdit({
      poolLength: data.poolLength, poolWidth: data.poolWidth,
      deckLength: data.deckLength, deckWidth: data.deckWidth,
      salePrice: data.salePrice, status: data.status, notes: data.notes || "",
      hasSpa: data.hasSpa, hasHeat: data.hasHeat, hasAutomation: data.hasAutomation,
      isSalt: data.isSalt, hasCage: data.hasCage, hasWaterfall: data.hasWaterfall,
      hasSod: data.hasSod, hasTreeRemoval: data.hasTreeRemoval,
      hasFireFeatures: data.hasFireFeatures, hasInteriorUpgrade: data.hasInteriorUpgrade,
      deckMaterial: data.deckMaterial, equipment: data.equipment,
      spaCost: data.spaCost, heatCost: data.heatCost, sodCost: data.sodCost,
      cageCost: data.cageCost, waterfallCost: data.waterfallCost,
      treeRemovalCost: data.treeRemovalCost, fireFeaturesCost: data.fireFeaturesCost,
      interiorUpgradeCost: data.interiorUpgradeCost,
      deckAreaOverride: data.deckAreaOverride ?? null,
    });
    setLoading(false);
  }, [id, router]);

  useEffect(() => { fetchBuild(); }, [fetchBuild]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/builds/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...edit, notes: edit.notes || null }),
    });
    setSaving(false);
    fetchBuild();
  };

  const handleDelete = async () => {
    if (!confirm("Delete this build and all line items?")) return;
    await fetch(`/api/builds/${id}`, { method: "DELETE" });
    router.push("/builds");
  };

  const handleLineItemEdit = async (itemId: string, field: string, value: number | string) => {
    await fetch(`/api/line-items/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [field]: value }),
    });
    fetchBuild();
  };

  // Auto-fill default cost when toggling an addition ON
  const handleAdditionToggle = (toggleKey: string, costKey: string, defaultCost: number, checked: boolean) => {
    upd(toggleKey, checked);
    if (checked && !edit[costKey as keyof typeof edit]) {
      upd(costKey, defaultCost);
    }
    if (!checked) {
      upd(costKey, 0);
    }
    // Spa requires heat + automation (FULL equipment includes heat pump)
    if (toggleKey === "hasSpa" && checked) {
      upd("hasHeat", true);
      upd("hasAutomation", true);
      upd("equipment", "FULL");
      upd("heatCost", 0); // heat pump included in FULL package
    }
  };

  // Live preview: recalculate costs whenever edit state changes
  type PreviewItem = { id?: string; phase: string; label: string; quantity: number; unit: string; unitCost: number; total: number; isOverride: boolean; sortOrder: number };

  const preview = useMemo(() => {
    const input: BuildInput = {
      poolLength: edit.poolLength, poolWidth: edit.poolWidth,
      deckLength: edit.deckLength, deckWidth: edit.deckWidth,
      hasSpa: edit.hasSpa, hasHeat: edit.hasHeat, hasAutomation: edit.hasAutomation,
      isSalt: edit.isSalt, hasCage: edit.hasCage, hasWaterfall: edit.hasWaterfall,
      hasSod: edit.hasSod, hasTreeRemoval: edit.hasTreeRemoval,
      hasFireFeatures: edit.hasFireFeatures, hasInteriorUpgrade: edit.hasInteriorUpgrade,
      deckMaterial: edit.deckMaterial as "PAVER" | "TRAVERTINE",
      equipment: edit.equipment as "FULL" | "BASE",
      deckAreaOverride: edit.deckAreaOverride,
      spaCost: edit.spaCost, heatCost: edit.heatCost, sodCost: edit.sodCost,
      cageCost: edit.cageCost, waterfallCost: edit.waterfallCost,
      treeRemovalCost: edit.treeRemovalCost, fireFeaturesCost: edit.fireFeaturesCost,
      interiorUpgradeCost: edit.interiorUpgradeCost,
    };

    const breakdown = calculateBuild(input);

    // Start with calculated items, then merge in DB override line items
    const items: PreviewItem[] = breakdown.lineItems.map((li) => ({ ...li, isOverride: false }));

    if (build) {
      const overrides = build.lineItems.filter((li) => li.isOverride);
      for (const override of overrides) {
        const idx = items.findIndex((i) => i.phase === override.phase && i.label === override.label);
        if (idx >= 0) {
          items[idx] = { ...override };
        } else {
          items.push({ ...override });
        }
      }
      // Match calculated items to DB counterparts so inline editing still works
      for (const item of items) {
        if (!item.id) {
          const dbMatch = build.lineItems.find((db) => db.phase === item.phase && db.label === item.label);
          if (dbMatch) item.id = dbMatch.id;
        }
      }
    }

    // Phase groups + subtotals
    const groups: Record<string, PreviewItem[]> = {};
    for (const item of items) {
      if (!groups[item.phase]) groups[item.phase] = [];
      groups[item.phase].push(item);
    }
    const subtotals: Record<string, number> = {};
    for (const [phase, phaseItems] of Object.entries(groups)) {
      subtotals[phase] = phaseItems.reduce((sum, li) => sum + li.total, 0);
    }
    const totalCOGS = Math.round(items.reduce((sum, item) => sum + item.total, 0) * 100) / 100;
    const margin = analyzeMargin(totalCOGS, edit.salePrice);

    return { items, groups, subtotals, totalCOGS, margin };
  }, [edit, build]);

  if (loading || !build) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const phases = Object.keys(preview.groups);
  const cogsDelta = preview.totalCOGS - build.totalCOGS;
  const profitDelta = edit.salePrice > 0 ? preview.margin.grossProfit - build.grossProfit : 0;

  // Additions config: toggle key, cost key, label, default cost
  const additions: { toggleKey: string; costKey: string; label: string; defaultCost: number }[] = [
    { toggleKey: "hasSpa", costKey: "spaCost", label: "Spa", defaultCost: DEFAULT_ADDITION_COSTS.spa },
    { toggleKey: "hasHeat", costKey: "heatCost", label: "Heat", defaultCost: DEFAULT_ADDITION_COSTS.heat },
    { toggleKey: "hasSod", costKey: "sodCost", label: "Sod", defaultCost: DEFAULT_ADDITION_COSTS.sod },
    { toggleKey: "hasCage", costKey: "cageCost", label: "Cage", defaultCost: DEFAULT_ADDITION_COSTS.cage },
    { toggleKey: "hasWaterfall", costKey: "waterfallCost", label: "Waterfall", defaultCost: DEFAULT_ADDITION_COSTS.waterfall },
    { toggleKey: "hasTreeRemoval", costKey: "treeRemovalCost", label: "Tree Removal", defaultCost: DEFAULT_ADDITION_COSTS.treeRemoval },
    { toggleKey: "hasFireFeatures", costKey: "fireFeaturesCost", label: "Fire Features", defaultCost: DEFAULT_ADDITION_COSTS.fireFeatures },
    { toggleKey: "hasInteriorUpgrade", costKey: "interiorUpgradeCost", label: "Interior Upgrade", defaultCost: DEFAULT_ADDITION_COSTS.interiorUpgrade },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />Back
        </Button>
      </div>

      <PageHeader
        title={build.name}
        description={
          <span>
            Created {new Date(build.createdAt).toLocaleDateString()}
            {clientName && (
              <> &middot; Client: <Link href={`/clients/${build.clientId}`} className="text-primary hover:underline">{clientName}</Link></>
            )}
          </span>
        }
        action={
          <div className="flex gap-2">
            {build.clientId && (
              <Link href={`/proposals/new?clientId=${build.clientId}&buildId=${build.id}`}>
                <Button size="sm" variant="outline">
                  <FileText className="h-4 w-4 mr-1" />
                  Generate Proposal
                </Button>
              </Link>
            )}
            <Button size="sm" onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Save
            </Button>
            <Button size="sm" variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      {/* Money strip — live preview from edit state */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">COGS</p>
          <p className="text-lg font-bold mt-0.5">{fmt(preview.totalCOGS)}</p>
          {Math.abs(cogsDelta) >= 1 && (
            <p className={`text-xs font-medium ${cogsDelta > 0 ? "text-red-400" : "text-green-400"}`}>
              {cogsDelta > 0 ? "+" : ""}{fmt(cogsDelta)}
            </p>
          )}
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Sale Price</p>
          <p className="text-lg font-bold mt-0.5">{edit.salePrice > 0 ? fmt(edit.salePrice) : "—"}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Profit</p>
          <p className="text-lg font-bold mt-0.5">{edit.salePrice > 0 ? fmt(preview.margin.grossProfit) : "—"}</p>
          {edit.salePrice > 0 && Math.abs(profitDelta) >= 1 && (
            <p className={`text-xs font-medium ${profitDelta > 0 ? "text-green-400" : "text-red-400"}`}>
              {profitDelta > 0 ? "+" : ""}{fmt(profitDelta)}
            </p>
          )}
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Margin</p>
          <div className="mt-0.5">
            {edit.salePrice > 0 ? (
              <Badge variant="secondary" className={`text-base px-2 ${marginBadge(preview.margin.marginPct)}`}>
                {preview.margin.marginPct.toFixed(1)}%
              </Badge>
            ) : <span className="text-lg font-bold">—</span>}
          </div>
        </div>
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Rec. (20%)</p>
          <p className="text-lg font-bold mt-0.5">{fmt(preview.margin.recommendedPrice)}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left — Config sidebar */}
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {/* Status + Sale Price — the two things you edit most */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Status</Label>
                  <Select value={edit.status} onValueChange={(v) => upd("status", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BUILD_STATUSES.map((s) => (
                        <SelectItem key={s} value={s}>{BUILD_STATUS_LABELS[s]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Sale Price ($)</Label>
                  <Input type="number" value={edit.salePrice || ""} onChange={(e) => upd("salePrice", parseFloat(e.target.value) || 0)} placeholder="0" />
                </div>
              </div>

              {/* Pool dims */}
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Pool</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Length</Label>
                  <Input type="number" value={edit.poolLength || ""} onChange={(e) => upd("poolLength", parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <Label className="text-xs">Width</Label>
                  <Input type="number" value={edit.poolWidth || ""} onChange={(e) => upd("poolWidth", parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground -mt-2">
                {(edit.poolLength * edit.poolWidth).toLocaleString()} sf &bull; {2 * (edit.poolLength + edit.poolWidth)} LF
              </p>

              {/* Deck dims */}
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Deck</p>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Pad L</Label>
                  <Input type="number" value={edit.deckLength || ""} onChange={(e) => upd("deckLength", parseFloat(e.target.value) || 0)} />
                </div>
                <div>
                  <Label className="text-xs">Pad W</Label>
                  <Input type="number" value={edit.deckWidth || ""} onChange={(e) => upd("deckWidth", parseFloat(e.target.value) || 0)} />
                </div>
              </div>
              <div>
                <Label className="text-xs">Deck Sq Ft Override</Label>
                <Input
                  type="number"
                  placeholder={`Auto: ${Math.round(edit.deckLength * edit.deckWidth - edit.poolLength * edit.poolWidth)} sq ft`}
                  value={edit.deckAreaOverride ?? ""}
                  onChange={(e) => upd("deckAreaOverride", e.target.value ? parseFloat(e.target.value) : null)}
                />
                <p className="text-[10px] text-muted-foreground mt-0.5">Leave blank to auto-calculate from pad dimensions</p>
              </div>

              {/* Config toggles (no cost) */}
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Config</p>
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input type="checkbox" checked={edit.isSalt} onChange={(e) => upd("isSalt", e.target.checked)} className="rounded" />
                  <span className="text-sm">Salt</span>
                </label>
              </div>

              {/* Materials */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-xs">Decking</Label>
                  <Select value={edit.deckMaterial} onValueChange={(v) => upd("deckMaterial", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PAVER">Pavers</SelectItem>
                      <SelectItem value="TRAVERTINE">Travertine</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Equipment</Label>
                  <Select value={edit.equipment} onValueChange={(v) => upd("equipment", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BASE">Base — {fmt(EQUIPMENT_PACKAGES.BASE.cost)}</SelectItem>
                      <SelectItem value="FULL">Full — {fmt(EQUIPMENT_PACKAGES.FULL.cost)}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Equipment included */}
              {(() => {
                const pkg = edit.equipment === "FULL" ? EQUIPMENT_PACKAGES.FULL : EQUIPMENT_PACKAGES.BASE;
                return (
                  <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                    <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                      {pkg.label} — {fmt(pkg.cost)}
                    </p>
                    {pkg.items.map((item, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span>{item.name}</span>
                        <span className="tabular-nums text-muted-foreground">{fmt(item.price)}</span>
                      </div>
                    ))}
                  </div>
                );
              })()}

              {/* Additions — each with checkbox + price */}
              <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">Additions</p>
              <div className="space-y-2">
                {additions.map(({ toggleKey, costKey, label, defaultCost }) => {
                  const isOn = edit[toggleKey as keyof typeof edit] as boolean;
                  const cost = edit[costKey as keyof typeof edit] as number;
                  return (
                    <div key={toggleKey} className="flex items-center gap-2">
                      <label className="flex items-center gap-1.5 cursor-pointer min-w-[90px]">
                        <input
                          type="checkbox"
                          checked={isOn}
                          onChange={(e) => handleAdditionToggle(toggleKey, costKey, defaultCost, e.target.checked)}
                          className="rounded"
                        />
                        <span className="text-sm">{label}</span>
                      </label>
                      {isOn && (
                        <Input
                          type="number"
                          value={cost || ""}
                          onChange={(e) => upd(costKey, parseFloat(e.target.value) || 0)}
                          placeholder="$"
                          className="h-8 text-sm"
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Notes */}
              <div>
                <Label className="text-xs">Notes</Label>
                <Textarea value={edit.notes} onChange={(e) => upd("notes", e.target.value)} rows={2} placeholder="Build notes..." />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right — Cost breakdown + summary */}
        <div className="md:col-span-2 space-y-4">
          {/* Cost Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Cost Breakdown
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-normal">Click any value to edit</span>
                  <Badge variant="secondary" className={BUILD_STATUS_COLORS[build.status]}>
                    {BUILD_STATUS_LABELS[build.status]}
                  </Badge>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {phases.length > 0 ? (
                <Tabs defaultValue={phases[0]}>
                  <TabsList className="mb-4 flex-wrap h-auto gap-1">
                    {phases.map((phase) => (
                      <TabsTrigger key={phase} value={phase} className="text-xs">
                        {COST_PHASE_LABELS[phase] || phase}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  {phases.map((phase) => (
                    <TabsContent key={phase} value={phase}>
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
                          {preview.groups[phase].map((item) => {
                            const key = item.id || `preview-${item.phase}-${item.sortOrder}`;
                            const editable = !!item.id;
                            return (
                              <TableRow key={key}>
                                <TableCell>
                                  {editable ? (
                                    <EditableCell value={item.label} type="text" align="left" onSave={(v) => handleLineItemEdit(item.id!, "label", v)} />
                                  ) : (
                                    <span>{item.label}</span>
                                  )}
                                  {item.isOverride && <span className="ml-1 text-xs text-yellow-400">(edited)</span>}
                                </TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {editable ? (
                                    <EditableCell value={item.quantity} format={(v) => v.toLocaleString()} onSave={(v) => handleLineItemEdit(item.id!, "quantity", v)} />
                                  ) : (
                                    <span>{item.quantity.toLocaleString()}</span>
                                  )}
                                </TableCell>
                                <TableCell>{item.unit}</TableCell>
                                <TableCell className="text-right tabular-nums">
                                  {editable ? (
                                    <EditableCell value={item.unitCost} format={fmtPrecise} onSave={(v) => handleLineItemEdit(item.id!, "unitCost", v)} />
                                  ) : (
                                    <span>{fmtPrecise(item.unitCost)}</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-right font-medium tabular-nums">
                                  {fmtPrecise(item.total)}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                        <TableFooter>
                          <TableRow>
                            <TableCell colSpan={4} className="font-medium">{COST_PHASE_LABELS[phase] || phase} Subtotal</TableCell>
                            <TableCell className="text-right font-bold tabular-nums">{fmt(preview.subtotals[phase])}</TableCell>
                          </TableRow>
                        </TableFooter>
                      </Table>
                    </TabsContent>
                  ))}
                </Tabs>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No line items</p>
              )}
            </CardContent>
          </Card>

          {/* Summary — compact phase list */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {phases.map((phase) => (
                <div key={phase} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{COST_PHASE_LABELS[phase] || phase}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground tabular-nums w-10 text-right">
                      {preview.totalCOGS > 0 ? ((preview.subtotals[phase] / preview.totalCOGS) * 100).toFixed(0) : 0}%
                    </span>
                    <span className="font-medium tabular-nums w-20 text-right">{fmt(preview.subtotals[phase])}</span>
                  </div>
                </div>
              ))}
              <div className="flex items-center justify-between text-sm pt-2 border-t font-bold">
                <span>Total COGS</span>
                <span className="tabular-nums">{fmt(preview.totalCOGS)}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
