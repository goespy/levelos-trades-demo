import {
  UNIT_RATES,
  FIXED_COSTS,
  ALLOWANCES,
  ADD_ONS,
  EQUIPMENT_PACKAGES,
  SPA_SURCHARGES,
  MARGIN_THRESHOLDS,
} from "./pool-costs";

export interface BuildInput {
  poolLength: number; // ft
  poolWidth: number; // ft
  deckLength: number; // ft (overall pad footprint)
  deckWidth: number; // ft (overall pad footprint)
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
  deckMaterial: "PAVER" | "TRAVERTINE";
  equipment: "FULL" | "BASE";
  deckAreaOverride?: number | null;
  spaCost: number;
  heatCost: number;
  sodCost: number;
  cageCost: number;
  waterfallCost: number;
  treeRemovalCost: number;
  fireFeaturesCost: number;
  interiorUpgradeCost: number;
}

export interface LineItem {
  phase: string;
  label: string;
  quantity: number;
  unit: string;
  unitCost: number;
  total: number;
  sortOrder: number;
}

export interface BuildBreakdown {
  lineItems: LineItem[];
  phaseSubtotals: Record<string, number>;
  totalCOGS: number;
}

export interface MarginAnalysis {
  totalCOGS: number;
  salePrice: number;
  grossProfit: number;
  marginPct: number;
  level: "green" | "yellow" | "red";
  recommendedPrice: number; // price at the configured green margin
}

function line(
  phase: string,
  label: string,
  quantity: number,
  unit: string,
  unitCost: number,
  sortOrder: number
): LineItem {
  return {
    phase,
    label,
    quantity,
    unit,
    unitCost,
    total: Math.round(quantity * unitCost * 100) / 100,
    sortOrder,
  };
}

export function calculateBuild(input: BuildInput): BuildBreakdown {
  const items: LineItem[] = [];
  let order = 0;

  // Derived dimensions
  const waterArea = input.poolLength * input.poolWidth;
  const perimeter = 2 * (input.poolLength + input.poolWidth);
  const deckArea = input.deckAreaOverride
    ? input.deckAreaOverride
    : input.deckLength * input.deckWidth - waterArea;
  const deckPerimeter = 2 * (input.deckLength + input.deckWidth);

  // === STRUCTURE ===
  items.push(
    line("STRUCTURE", "Gunite / Shotcrete", waterArea, "sq ft", UNIT_RATES.gunite, ++order)
  );
  items.push(line("STRUCTURE", "Dig & Form", 1, "ea", FIXED_COSTS.digAndForm, ++order));
  if (input.hasSpa && !input.spaCost) {
    items.push(line("STRUCTURE", "Spa Gunite Surcharge", 1, "ea", SPA_SURCHARGES.gunite, ++order));
  }

  // === ENGINEERING ===
  items.push(line("ENGINEERING", "Engineering Drawings", 1, "ea", FIXED_COSTS.engineeringDrawings, ++order));
  items.push(line("ENGINEERING", "Engineering Sealed", 1, "ea", FIXED_COSTS.engineeringSealed, ++order));

  // === PLUMBING ===
  items.push(line("PLUMBING", "Plumbing Rough", 1, "ea", FIXED_COSTS.plumbingRough, ++order));
  items.push(line("PLUMBING", "Plumbing Set", 1, "ea", FIXED_COSTS.plumbingSet, ++order));

  // === ELECTRICAL ===
  // When spa has a custom cost, use base electric (spa cost includes the diff)
  const electricCost = (input.hasSpa && !input.spaCost)
    ? FIXED_COSTS.electricPoolSpa
    : FIXED_COSTS.electricPoolOnly;
  items.push(
    line("ELECTRICAL", input.hasSpa ? "Electric (Pool + Spa)" : "Electric (Pool Only)", 1, "ea", electricCost, ++order)
  );

  // === INTERIOR ===
  items.push(line("INTERIOR", "Interior Labor", 1, "ea", FIXED_COSTS.interiorLabor, ++order));
  items.push(line("INTERIOR", "Interior Material", 1, "ea", FIXED_COSTS.interiorMaterial, ++order));

  // === DECK ===
  items.push(line("DECK", "Coping Labor", perimeter, "LF", UNIT_RATES.copingLabor, ++order));
  items.push(line("DECK", "Tile Labor", perimeter, "LF", UNIT_RATES.tileLabor, ++order));
  items.push(
    line("DECK", "Tile Material", perimeter, "LF", UNIT_RATES.tileMaterial, ++order)
  );
  items.push(
    line("DECK", "Coping Material", perimeter, "ea", UNIT_RATES.copingMaterial, ++order)
  );
  items.push(
    line("DECK", "Concrete Footers", deckPerimeter, "LF", UNIT_RATES.concreteFooters, ++order)
  );

  if (input.deckMaterial === "TRAVERTINE") {
    items.push(line("DECK", "Travertine Material", deckArea, "sq ft", UNIT_RATES.travertineMaterial, ++order));
    items.push(line("DECK", "Travertine Install Labor", deckArea, "sq ft", UNIT_RATES.travertineInstallLabor, ++order));
  } else {
    items.push(line("DECK", "Paver Material", deckArea, "sq ft", UNIT_RATES.paverMaterial, ++order));
    items.push(line("DECK", "Paver Install Labor", deckArea, "sq ft", UNIT_RATES.paverInstallLabor, ++order));
  }

  // Illustrative deck-base allowance.
  items.push(line("DECK", "Extra Dirt for Deck", 1, "ea", FIXED_COSTS.deckDirtExtra, ++order));

  // Illustrative skimmer reinforcement allowance.
  items.push(line("DECK", "Cement & Steel Around Skimmer", 1, "ea", FIXED_COSTS.skimmerCementSteel, ++order));

  // Demonstrates a quantity rule: 4 bags without a spa, 5 with a spa.
  const groutBags = input.hasSpa ? 5 : 4;
  items.push(line("DECK", "Grout", groutBags, "bag", UNIT_RATES.grout, ++order));

  // A custom spa amount covers the upgrade delta, while the base coping
  // allowance remains part of the pool estimate.
  if (input.hasSpa && !input.spaCost) {
    items.push(
      line("DECK", "Spa Double Coping Cuts", 1, "ea", SPA_SURCHARGES.doubleCopingCuts, ++order)
    );
    items.push(
      line("DECK", "Spillway Install", 1, "ea", SPA_SURCHARGES.spillwayInstall, ++order)
    );
  } else if (input.hasSpa && input.spaCost > 0) {
    // Custom spa cost includes the upgrade delta, but base coping remains.
    items.push(line("DECK", "Pool Coping Cuts", 1, "ea", FIXED_COSTS.copingCuts, ++order));
  } else {
    items.push(line("DECK", "Pool Coping Cuts", 1, "ea", FIXED_COSTS.copingCuts, ++order));
  }

  // === EQUIPMENT ===
  const pkg = input.equipment === "FULL" ? EQUIPMENT_PACKAGES.FULL : EQUIPMENT_PACKAGES.BASE;
  items.push(line("EQUIPMENT", pkg.label + " Package", 1, "ea", pkg.cost, ++order));
  // Heat pump is included in FULL; add separately for BASE (skip if custom heatCost used)
  if (input.hasHeat && input.equipment === "BASE" && !input.heatCost) {
    items.push(line("EQUIPMENT", "Heat Pump Upgrade", 1, "ea", FIXED_COSTS.heatPump, ++order));
  }

  // === ALLOWANCES ===
  items.push(line("ALLOWANCES", "Permits", 1, "ea", ALLOWANCES.permits, ++order));
  items.push(line("ALLOWANCES", "Steel / Rebar", 1, "ea", ALLOWANCES.steelRebar, ++order));
  items.push(line("ALLOWANCES", "Dirt Haul-Off", 1, "ea", ALLOWANCES.dirtHaulOff, ++order));
  items.push(line("ALLOWANCES", "Pre-Grade / Termite", 1, "ea", ALLOWANCES.preGradeTermite, ++order));
  items.push(line("ALLOWANCES", "Plumbing Materials", 1, "ea", ALLOWANCES.plumbingMaterials, ++order));
  items.push(line("ALLOWANCES", "Deck Base Prep", 1, "ea", ALLOWANCES.deckBase, ++order));
  items.push(line("ALLOWANCES", "Baby Fence / Alarms", 1, "ea", ALLOWANCES.babyFenceAlarms, ++order));
  items.push(line("ALLOWANCES", "Dumpsters", 1, "ea", ALLOWANCES.dumpsters, ++order));

  if (input.hasSod && !input.sodCost) {
    items.push(line("ALLOWANCES", "Sod / Landscaping", 1, "ea", ADD_ONS.sodLandscaping, ++order));
  }

  const startupCost = input.isSalt
    ? ALLOWANCES.startupChemsSalt
    : ALLOWANCES.startupChemsChlor;
  items.push(
    line(
      "ALLOWANCES",
      input.isSalt ? "Startup Chemicals (Salt)" : "Startup Chemicals (Chlorine)",
      1,
      "ea",
      startupCost,
      ++order
    )
  );

  // === CUSTOM ===
  if (input.hasSpa && input.spaCost > 0) {
    items.push(line("CUSTOM", "Spa", 1, "ea", input.spaCost, ++order));
  }
  // Only add custom heat cost for BASE — FULL package already includes heat pump
  if (input.hasHeat && input.heatCost > 0 && input.equipment !== "FULL") {
    items.push(line("CUSTOM", "Heat", 1, "ea", input.heatCost, ++order));
  }
  if (input.hasSod && input.sodCost > 0) {
    items.push(line("CUSTOM", "Sod / Landscaping", 1, "ea", input.sodCost, ++order));
  }
  if (input.hasCage && input.cageCost > 0) {
    items.push(line("CUSTOM", "Screen Cage", 1, "ea", input.cageCost, ++order));
  }
  if (input.hasWaterfall && input.waterfallCost > 0) {
    items.push(line("CUSTOM", "Waterfall", 1, "ea", input.waterfallCost, ++order));
  }
  if (input.hasTreeRemoval && input.treeRemovalCost > 0) {
    items.push(line("CUSTOM", "Tree Removal", 1, "ea", input.treeRemovalCost, ++order));
  }
  if (input.hasFireFeatures && input.fireFeaturesCost > 0) {
    items.push(line("CUSTOM", "Fire Features", 1, "ea", input.fireFeaturesCost, ++order));
  }
  if (input.hasInteriorUpgrade && input.interiorUpgradeCost > 0) {
    items.push(line("CUSTOM", "Interior Finish Upgrade", 1, "ea", input.interiorUpgradeCost, ++order));
  }

  // Compute phase subtotals
  const phaseSubtotals: Record<string, number> = {};
  for (const item of items) {
    phaseSubtotals[item.phase] = (phaseSubtotals[item.phase] || 0) + item.total;
  }

  const totalCOGS = items.reduce((sum, item) => sum + item.total, 0);

  return {
    lineItems: items,
    phaseSubtotals,
    totalCOGS: Math.round(totalCOGS * 100) / 100,
  };
}

export function analyzeMargin(
  totalCOGS: number,
  salePrice: number
): MarginAnalysis {
  const grossProfit = salePrice - totalCOGS;
  const marginPct = salePrice > 0 ? (grossProfit / salePrice) * 100 : 0;

  let level: MarginAnalysis["level"] = "red";
  if (marginPct >= MARGIN_THRESHOLDS.green) level = "green";
  else if (marginPct >= MARGIN_THRESHOLDS.yellow) level = "yellow";

  const greenMargin = MARGIN_THRESHOLDS.green / 100;
  const recommendedPrice = Math.round(totalCOGS / (1 - greenMargin));

  return {
    totalCOGS,
    salePrice,
    grossProfit: Math.round(grossProfit * 100) / 100,
    marginPct: Math.round(marginPct * 10) / 10,
    level,
    recommendedPrice,
  };
}
