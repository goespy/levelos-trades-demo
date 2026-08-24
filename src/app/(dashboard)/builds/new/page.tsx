"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

import { PageHeader } from "@/components/layout/page-header";
import { COST_PHASE_LABELS, MARGIN_THRESHOLDS, DEFAULT_ADDITION_COSTS, EQUIPMENT_PACKAGES } from "@/lib/pool-costs";
import { calculateBuild, analyzeMargin } from "@/lib/build-calculator";
import type { BuildInput } from "@/lib/build-calculator";
import { Loader2 } from "lucide-react";

function fmt(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function marginClass(pct: number) {
  if (pct >= MARGIN_THRESHOLDS.green) return "text-green-400";
  if (pct >= MARGIN_THRESHOLDS.yellow) return "text-yellow-400";
  return "text-red-400";
}

function marginBadge(pct: number) {
  if (pct >= MARGIN_THRESHOLDS.green) return "bg-green-500/15 text-green-400";
  if (pct >= MARGIN_THRESHOLDS.yellow) return "bg-yellow-500/15 text-yellow-400";
  return "bg-red-500/15 text-red-400";
}

export default function NewBuildPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    poolLength: 24,
    poolWidth: 12,
    deckLength: 34,
    deckWidth: 22,
    hasSpa: false,
    hasHeat: false,
    hasAutomation: false,
    isSalt: false,
    hasCage: false,
    hasWaterfall: false,
    hasSod: false,
    hasTreeRemoval: false,
    hasFireFeatures: false,
    hasInteriorUpgrade: false,
    deckMaterial: "PAVER" as "PAVER" | "TRAVERTINE",
    equipment: "BASE" as "FULL" | "BASE",
    spaCost: 0,
    heatCost: 0,
    sodCost: 0,
    cageCost: 0,
    cageSalePrice: 0,
    waterfallCost: 0,
    treeRemovalCost: 0,
    fireFeaturesCost: 0,
    interiorUpgradeCost: 0,
    salePrice: 0,
  });

  const update = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleAdditionToggle = (toggleKey: string, costKey: string, defaultCost: number, checked: boolean) => {
    update(toggleKey, checked);
    if (checked && !form[costKey as keyof typeof form]) {
      update(costKey, defaultCost);
    }
    if (!checked) {
      update(costKey, 0);
    }
    // Spa requires heat + automation (FULL equipment includes heat pump)
    if (toggleKey === "hasSpa" && checked) {
      update("hasHeat", true);
      update("hasAutomation", true);
      update("equipment", "FULL");
      update("heatCost", 0); // heat pump included in FULL package
    }
  };

  const buildInput: BuildInput = useMemo(() => ({
    poolLength: form.poolLength,
    poolWidth: form.poolWidth,
    deckLength: form.deckLength,
    deckWidth: form.deckWidth,
    hasSpa: form.hasSpa,
    hasHeat: form.hasHeat,
    hasAutomation: form.hasAutomation,
    isSalt: form.isSalt,
    hasCage: form.hasCage,
    hasWaterfall: form.hasWaterfall,
    hasSod: form.hasSod,
    hasTreeRemoval: form.hasTreeRemoval,
    hasFireFeatures: form.hasFireFeatures,
    hasInteriorUpgrade: form.hasInteriorUpgrade,
    deckMaterial: form.deckMaterial,
    equipment: form.equipment,
    spaCost: form.spaCost,
    heatCost: form.heatCost,
    sodCost: form.sodCost,
    cageCost: form.cageCost,
    waterfallCost: form.waterfallCost,
    treeRemovalCost: form.treeRemovalCost,
    fireFeaturesCost: form.fireFeaturesCost,
    interiorUpgradeCost: form.interiorUpgradeCost,
  }), [form]);

  const preview = useMemo(() => {
    if (!form.poolLength || !form.poolWidth) return null;
    const breakdown = calculateBuild(buildInput);
    const margin = analyzeMargin(breakdown.totalCOGS, form.salePrice);
    return { breakdown, margin };
  }, [buildInput, form.salePrice, form.poolLength, form.poolWidth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/builds", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const build = await res.json();
      router.push(`/builds/${build.id}`);
    } catch {
      alert("Failed to save build");
      setSaving(false);
    }
  };

  const poolArea = form.poolLength * form.poolWidth;
  const poolPerimeter = 2 * (form.poolLength + form.poolWidth);
  const deckArea = form.deckLength * form.deckWidth - poolArea;

  return (
    <div>
      <PageHeader title="New Build Estimate" description="Configure and price a pool build" />

      <form onSubmit={handleSubmit}>
        <div className="grid md:grid-cols-5 gap-6">
          {/* LEFT — All inputs in one column */}
          <div className="md:col-span-3 space-y-6">
            {/* Name */}
            <Card>
              <CardContent className="pt-6">
                <Label htmlFor="name">Build Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="e.g. Smith 12x24 Pool + Spa"
                  required
                />
              </CardContent>
            </Card>

            {/* Dimensions — pool + deck together */}
            <Card>
              <CardHeader>
                <CardTitle>Dimensions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Pool</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Length (ft)</Label>
                      <Input type="number" value={form.poolLength || ""} onChange={(e) => update("poolLength", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                      <Label className="text-xs">Width (ft)</Label>
                      <Input type="number" value={form.poolWidth || ""} onChange={(e) => update("poolWidth", parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{poolArea.toLocaleString()} sf &bull; {poolPerimeter} LF perim</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Deck (overall pad)</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Length (ft)</Label>
                      <Input type="number" value={form.deckLength || ""} onChange={(e) => update("deckLength", parseFloat(e.target.value) || 0)} />
                    </div>
                    <div>
                      <Label className="text-xs">Width (ft)</Label>
                      <Input type="number" value={form.deckWidth || ""} onChange={(e) => update("deckWidth", parseFloat(e.target.value) || 0)} />
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{deckArea.toLocaleString()} sf deck surface</p>
                </div>
              </CardContent>
            </Card>

            {/* Features + Materials + Custom — one card */}
            <Card>
              <CardHeader>
                <CardTitle>Options</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Config toggles */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.isSalt}
                      onChange={(e) => update("isSalt", e.target.checked)}
                      className="rounded"
                    />
                    <span className="text-sm">Salt System</span>
                  </label>
                </div>

                {/* Deck Material toggle buttons */}
                <div>
                  <Label className="text-xs">Deck Material</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => update("deckMaterial", "PAVER")}
                      className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        form.deckMaterial === "PAVER"
                          ? "bg-blue-500/20 text-blue-400 ring-2 ring-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Pavers
                    </button>
                    <button
                      type="button"
                      onClick={() => update("deckMaterial", "TRAVERTINE")}
                      className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        form.deckMaterial === "TRAVERTINE"
                          ? "bg-blue-500/20 text-blue-400 ring-2 ring-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Travertine
                    </button>
                  </div>
                </div>

                {/* Equipment toggle buttons */}
                <div>
                  <Label className="text-xs">Equipment</Label>
                  <div className="grid grid-cols-2 gap-2 mt-1.5">
                    <button
                      type="button"
                      onClick={() => update("equipment", "BASE")}
                      className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        form.equipment === "BASE"
                          ? "bg-blue-500/20 text-blue-400 ring-2 ring-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Base — {fmt(EQUIPMENT_PACKAGES.BASE.cost)}
                    </button>
                    <button
                      type="button"
                      onClick={() => update("equipment", "FULL")}
                      className={`px-4 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                        form.equipment === "FULL"
                          ? "bg-blue-500/20 text-blue-400 ring-2 ring-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]"
                          : "bg-muted/50 text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      Full — {fmt(EQUIPMENT_PACKAGES.FULL.cost)}
                    </button>
                  </div>
                </div>

                {/* Equipment included — show all FULL items, highlight what's added vs BASE */}
                {(() => {
                  const baseNames = new Set<string>(EQUIPMENT_PACKAGES.BASE.items.map(i => i.name));
                  const fullNames = new Set<string>(EQUIPMENT_PACKAGES.FULL.items.map(i => i.name));
                  const isFull = form.equipment === "FULL";
                  const pkg = isFull ? EQUIPMENT_PACKAGES.FULL : EQUIPMENT_PACKAGES.BASE;

                  // Items only in FULL (upgrades)
                  const fullOnlyNames = new Set<string>(
                    EQUIPMENT_PACKAGES.FULL.items
                      .filter(i => !baseNames.has(i.name))
                      .map(i => i.name)
                  );
                  // Items only in BASE (replaced by FULL)
                  const baseOnlyNames = new Set<string>(
                    EQUIPMENT_PACKAGES.BASE.items
                      .filter(i => !fullNames.has(i.name))
                      .map(i => i.name)
                  );

                  return (
                    <div className="p-3 rounded-lg bg-muted/50 space-y-1">
                      <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide mb-1.5">
                        {pkg.label} — {fmt(pkg.cost)}
                      </p>
                      {pkg.items.map((item, i) => {
                        const isUpgrade = isFull && fullOnlyNames.has(item.name);
                        const isBaseOnly = !isFull && baseOnlyNames.has(item.name);
                        return (
                          <div
                            key={i}
                            className={`flex items-center justify-between text-xs px-2 py-1 rounded ${
                              isUpgrade
                                ? "bg-green-500/10 text-green-400"
                                : isBaseOnly
                                  ? "bg-yellow-500/10 text-yellow-400"
                                  : ""
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              {isUpgrade && <span className="text-[10px] font-bold text-green-500">+</span>}
                              {item.name}
                            </span>
                            <span className={`tabular-nums ${isUpgrade ? "text-green-400/70" : "text-muted-foreground"}`}>
                              {fmt(item.price)}
                            </span>
                          </div>
                        );
                      })}
                      {isFull && (
                        <p className="text-[10px] text-green-400/60 mt-2 pt-1.5 border-t border-green-500/10">
                          Highlighted items are added when upgrading from Base
                        </p>
                      )}
                      {!isFull && baseOnlyNames.size > 0 && (
                        <p className="text-[10px] text-yellow-400/60 mt-2 pt-1.5 border-t border-yellow-500/10">
                          Highlighted items are replaced by Full (OmniPL replaces Timer, etc.)
                        </p>
                      )}
                    </div>
                  );
                })()}

                {/* Spa — major upgrade, visually distinct */}
                <div className={`p-3 rounded-lg border-2 transition-all ${
                  form.hasSpa
                    ? "border-orange-500/50 bg-orange-500/5 shadow-[0_0_15px_rgba(249,115,22,0.15)]"
                    : "border-dashed border-muted-foreground/20 bg-muted/20"
                }`}>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer flex-1">
                      <input
                        type="checkbox"
                        checked={form.hasSpa}
                        onChange={(e) => handleAdditionToggle("hasSpa", "spaCost", DEFAULT_ADDITION_COSTS.spa, e.target.checked)}
                        className="rounded"
                      />
                      <span className={`text-sm font-bold ${form.hasSpa ? "text-orange-400" : "text-muted-foreground"}`}>
                        Add Spa
                      </span>
                    </label>
                    {form.hasSpa && (
                      <Input
                        type="number"
                        value={form.spaCost || ""}
                        onChange={(e) => update("spaCost", parseFloat(e.target.value) || 0)}
                        placeholder="Spa cost"
                        className="h-8 text-sm w-32 border-orange-500/20 focus:border-orange-500/40"
                      />
                    )}
                  </div>
                  {form.hasSpa && (
                    <p className="text-[10px] text-orange-400/50 mt-1.5 ml-5">
                      Auto-enables Heat + Full Automation + Spillway
                    </p>
                  )}
                </div>

                {/* Additions + Cage side by side */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Left — standard additions */}
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase mb-2">Additions</p>
                    <div className="space-y-2">
                      {([
                        { toggleKey: "hasHeat", costKey: "heatCost", label: "Heat", defaultCost: DEFAULT_ADDITION_COSTS.heat },
                        { toggleKey: "hasSod", costKey: "sodCost", label: "Sod / Landscaping", defaultCost: DEFAULT_ADDITION_COSTS.sod },
                        { toggleKey: "hasWaterfall", costKey: "waterfallCost", label: "Waterfall", defaultCost: DEFAULT_ADDITION_COSTS.waterfall },
                        { toggleKey: "hasTreeRemoval", costKey: "treeRemovalCost", label: "Tree Removal", defaultCost: DEFAULT_ADDITION_COSTS.treeRemoval },
                        { toggleKey: "hasFireFeatures", costKey: "fireFeaturesCost", label: "Fire Features", defaultCost: DEFAULT_ADDITION_COSTS.fireFeatures },
                        { toggleKey: "hasInteriorUpgrade", costKey: "interiorUpgradeCost", label: "Interior Upgrade", defaultCost: DEFAULT_ADDITION_COSTS.interiorUpgrade },
                      ] as const).map(({ toggleKey, costKey, label, defaultCost }) => {
                        const isOn = form[toggleKey as keyof typeof form] as boolean;
                        const cost = form[costKey as keyof typeof form] as number;
                        if (toggleKey === "hasHeat" && form.hasSpa) return null;
                        return (
                          <div key={toggleKey}>
                            <label className="flex items-center gap-1.5 cursor-pointer">
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
                                onChange={(e) => update(costKey, parseFloat(e.target.value) || 0)}
                                placeholder="Cost ($)"
                                className="h-7 text-xs mt-1 ml-5"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right — Screen Cage (separate profit center) */}
                  <div>
                    <p className="text-xs font-medium text-purple-400/70 uppercase mb-2">Screen Cage</p>
                    <div className={`p-3 rounded-lg border transition-all ${
                      form.hasCage
                        ? "border-purple-500/40 bg-purple-500/5"
                        : "border-dashed border-muted-foreground/20 bg-muted/20"
                    }`}>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.hasCage}
                          onChange={(e) => {
                            update("hasCage", e.target.checked);
                            if (!e.target.checked) {
                              update("cageCost", 0);
                              update("cageSalePrice", 0);
                            }
                          }}
                          className="rounded"
                        />
                        <span className={`text-sm font-semibold ${form.hasCage ? "text-purple-400" : "text-muted-foreground"}`}>
                          Include Cage
                        </span>
                        <span className="text-[9px] text-purple-400/50 ml-auto font-medium tracking-wide">OUR CO.</span>
                      </label>
                      {form.hasCage && (
                        <div className="space-y-2 mt-3">
                          <div>
                            <Label className="text-[10px] text-purple-400/70">Our Cost</Label>
                            <Input
                              type="number"
                              value={form.cageCost || ""}
                              onChange={(e) => update("cageCost", parseFloat(e.target.value) || 0)}
                              placeholder="Cost"
                              className="h-7 text-xs border-purple-500/20 focus:border-purple-500/40"
                            />
                          </div>
                          <div>
                            <Label className="text-[10px] text-purple-400/70">Charge Customer</Label>
                            <Input
                              type="number"
                              value={form.cageSalePrice || ""}
                              onChange={(e) => update("cageSalePrice", parseFloat(e.target.value) || 0)}
                              placeholder="Sale price"
                              className="h-7 text-xs border-purple-500/20 focus:border-purple-500/40"
                            />
                          </div>
                          {form.cageCost > 0 && form.cageSalePrice > 0 && (
                            <div className="flex items-center justify-between text-xs pt-1.5 border-t border-purple-500/10">
                              <span className="text-purple-400/70">Profit</span>
                              <span className={`font-bold ${
                                form.cageSalePrice - form.cageCost > 0 ? "text-purple-400" : "text-red-400"
                              }`}>
                                {fmt(form.cageSalePrice - form.cageCost)} ({((form.cageSalePrice - form.cageCost) / form.cageSalePrice * 100).toFixed(0)}%)
                              </span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
              <Button type="submit" disabled={saving || !form.name.trim()}>
                {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" />Saving...</> : "Save Build"}
              </Button>
            </div>
          </div>

          {/* RIGHT — Sticky cost preview */}
          <div className="md:col-span-2">
            <div className="md:sticky md:top-6 space-y-4">
              {/* Sale price + margin — the money card */}
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div>
                    <Label htmlFor="salePrice" className="text-xs">Pool Sale Price ($)</Label>
                    <Input
                      id="salePrice"
                      type="number"
                      value={form.salePrice || ""}
                      onChange={(e) => update("salePrice", parseFloat(e.target.value) || 0)}
                      placeholder="Enter sale price"
                    />
                    {preview && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Min @ 20% margin: {fmt(preview.margin.recommendedPrice)}
                      </p>
                    )}
                  </div>

                  {preview && (() => {
                    const poolCOGS = preview.breakdown.totalCOGS;
                    const poolProfit = form.salePrice - poolCOGS;
                    const poolMarginPct = form.salePrice > 0 ? (poolProfit / form.salePrice) * 100 : 0;

                    const cageProfit = form.hasCage && form.cageSalePrice > 0 && form.cageCost > 0
                      ? form.cageSalePrice - form.cageCost : 0;
                    const cageMarginPct = form.cageSalePrice > 0
                      ? (cageProfit / form.cageSalePrice) * 100 : 0;

                    const totalBill = form.salePrice + (form.hasCage ? form.cageSalePrice : 0);
                    const totalCOGS = poolCOGS + (form.hasCage ? form.cageCost : 0);
                    const totalProfit = poolProfit + cageProfit;
                    const totalMarginPct = totalBill > 0 ? (totalProfit / totalBill) * 100 : 0;

                    return (
                      <div className="space-y-3">
                        {/* Pool profit */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Pool COGS</p>
                            <p className="text-lg font-bold mt-0.5">{fmt(poolCOGS)}</p>
                          </div>
                          <div className="p-3 rounded-lg bg-muted/50">
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Pool Profit</p>
                            <p className={`text-lg font-bold mt-0.5 ${form.salePrice > 0 ? marginClass(poolMarginPct) : ""}`}>
                              {form.salePrice > 0 ? fmt(poolProfit) : "—"}
                            </p>
                          </div>
                          {form.salePrice > 0 && (
                            <div className="col-span-2 flex items-center justify-between p-3 rounded-lg bg-muted/50">
                              <span className="text-sm font-medium">Pool Margin</span>
                              <Badge variant="secondary" className={marginBadge(poolMarginPct)}>
                                {poolMarginPct.toFixed(1)}%
                              </Badge>
                            </div>
                          )}
                        </div>

                        {/* Cage profit — purple accent */}
                        {form.hasCage && form.cageSalePrice > 0 && (
                          <div className="grid grid-cols-2 gap-3">
                            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                              <p className="text-[11px] text-purple-400/70 uppercase tracking-wide">Cage COGS</p>
                              <p className="text-lg font-bold mt-0.5 text-purple-400">{fmt(form.cageCost)}</p>
                            </div>
                            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                              <p className="text-[11px] text-purple-400/70 uppercase tracking-wide">Cage Profit</p>
                              <p className={`text-lg font-bold mt-0.5 ${cageProfit > 0 ? "text-purple-400" : "text-red-400"}`}>
                                {fmt(cageProfit)}
                              </p>
                            </div>
                            <div className="col-span-2 flex items-center justify-between p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
                              <span className="text-sm font-medium text-purple-400">Cage Margin</span>
                              <Badge variant="secondary" className="bg-purple-500/15 text-purple-400">
                                {cageMarginPct.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                        )}

                        {/* Combined total — only show when cage is active */}
                        {form.hasCage && form.cageSalePrice > 0 && form.salePrice > 0 && (
                          <div className="p-3 rounded-lg bg-muted/50 border border-border space-y-2">
                            <p className="text-[11px] text-muted-foreground uppercase tracking-wide font-semibold">Combined Total</p>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Customer Bill</span>
                              <span className="font-bold tabular-nums">{fmt(totalBill)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Total COGS</span>
                              <span className="font-bold tabular-nums">{fmt(totalCOGS)}</span>
                            </div>
                            <div className="flex justify-between text-sm pt-1.5 border-t">
                              <span className="font-semibold">Total Profit</span>
                              <span className={`font-bold tabular-nums ${marginClass(totalMarginPct)}`}>{fmt(totalProfit)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-muted-foreground">Blended Margin</span>
                              <Badge variant="secondary" className={marginBadge(totalMarginPct)}>
                                {totalMarginPct.toFixed(1)}%
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* Phase breakdown */}
              {preview && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Cost by Phase</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-1.5">
                    {Object.entries(preview.breakdown.phaseSubtotals).map(([phase, total]) => (
                      <div key={phase} className="flex justify-between text-sm">
                        <span className="text-muted-foreground">{COST_PHASE_LABELS[phase] || phase}</span>
                        <span className="font-medium tabular-nums">{fmt(total)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between text-sm pt-2 border-t font-bold">
                      <span>Total</span>
                      <span className="tabular-nums">{fmt(preview.breakdown.totalCOGS)}</span>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
