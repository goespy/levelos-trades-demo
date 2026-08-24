import assert from "node:assert/strict";
import test from "node:test";

import { analyzeMargin, calculateBuild, type BuildInput } from "./build-calculator";

const baseInput: BuildInput = {
  poolLength: 30,
  poolWidth: 15,
  deckLength: 40,
  deckWidth: 25,
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
  deckMaterial: "PAVER",
  equipment: "BASE",
  spaCost: 0,
  heatCost: 0,
  sodCost: 0,
  cageCost: 0,
  waterfallCost: 0,
  treeRemovalCost: 0,
  fireFeaturesCost: 0,
  interiorUpgradeCost: 0,
};

test("build calculator creates a positive, internally consistent estimate", () => {
  const result = calculateBuild(baseInput);
  const itemTotal = result.lineItems.reduce((sum, item) => sum + item.total, 0);
  const phaseTotal = Object.values(result.phaseSubtotals).reduce((sum, value) => sum + value, 0);

  assert.ok(result.lineItems.length > 20);
  assert.ok(result.totalCOGS > 0);
  assert.equal(result.totalCOGS, itemTotal);
  assert.equal(result.totalCOGS, phaseTotal);
});

test("deck override controls the material quantity", () => {
  const result = calculateBuild({ ...baseInput, deckAreaOverride: 725 });
  const pavers = result.lineItems.find((item) => item.label === "Paver Material");

  assert.equal(pavers?.quantity, 725);
});

test("custom spa pricing replaces the default spa surcharges", () => {
  const result = calculateBuild({ ...baseInput, hasSpa: true, spaCost: 12_500 });

  assert.equal(result.lineItems.find((item) => item.label === "Spa")?.total, 12_500);
  assert.equal(result.lineItems.some((item) => item.label === "Spa Gunite Surcharge"), false);
  assert.equal(result.lineItems.some((item) => item.label === "Spillway Install"), false);
});

test("margin analysis assigns levels and recommends the configured green margin", () => {
  assert.deepEqual(analyzeMargin(70_000, 100_000), {
    totalCOGS: 70_000,
    salePrice: 100_000,
    grossProfit: 30_000,
    marginPct: 30,
    level: "green",
    recommendedPrice: 97_222,
  });
  assert.equal(analyzeMargin(75_000, 100_000).level, "yellow");
  assert.equal(analyzeMargin(80_000, 100_000).level, "red");
});
