/**
 * Illustrative portfolio-demo inputs.
 *
 * These values are deliberately rounded and are not production vendor rates,
 * historical invoices, or production estimating inputs. They exist only to
 * exercise the deterministic estimating workflow.
 */

export const UNIT_RATES = {
  gunite: 32,
  copingLabor: 12,
  tileLabor: 14,
  paverInstallLabor: 4.25,
  paverMaterial: 4,
  travertineMaterial: 9.5,
  travertineInstallLabor: 4.75,
  concreteFooters: 40,
  tileMaterial: 11,
  copingMaterial: 3,
  grout: 24,
} as const;

export const FIXED_COSTS = {
  engineeringDrawings: 400,
  engineeringSealed: 900,
  digAndForm: 5500,
  shotcreteBase: 8200,
  electricPoolOnly: 1800,
  electricPoolSpa: 2600,
  plumbingRough: 1200,
  plumbingSet: 1200,
  interiorLabor: 2300,
  interiorMaterial: 2000,
  heatPump: 3300,
  skimmerCementSteel: 150,
  copingCuts: 150,
  deckDirtExtra: 300,
} as const;

export const ALLOWANCES = {
  permits: 1800,
  steelRebar: 1500,
  dirtHaulOff: 1800,
  preGradeTermite: 300,
  plumbingMaterials: 1800,
  deckBase: 1200,
  babyFenceAlarms: 800,
  dumpsters: 1200,
  startupChemsSalt: 400,
  startupChemsChlor: 200,
} as const;

export const EQUIPMENT_ITEMS = {
  variableSpeedPump: 2100,
  automationController: 2400,
  heatPump: 3300,
  colorLed: 500,
  blower: 200,
  poolAlarm: 250,
  transformer: 175,
  filter: 450,
  timer: 125,
  chlorinator: 250,
  valvesFittings: 150,
} as const;

export const EQUIPMENT_PACKAGES = {
  FULL: {
    label: "Full Automation",
    cost: 11250,
    items: [
      { name: "Variable-speed pump", price: EQUIPMENT_ITEMS.variableSpeedPump },
      { name: "Automation controller", price: EQUIPMENT_ITEMS.automationController },
      { name: "Heat pump", price: EQUIPMENT_ITEMS.heatPump },
      { name: "Pool LED", price: EQUIPMENT_ITEMS.colorLed },
      { name: "Spa LED", price: EQUIPMENT_ITEMS.colorLed },
      { name: "Cartridge filter", price: EQUIPMENT_ITEMS.filter },
      { name: "Transformer", price: EQUIPMENT_ITEMS.transformer },
      { name: "Air blower", price: EQUIPMENT_ITEMS.blower },
      { name: "Pool alarm", price: EQUIPMENT_ITEMS.poolAlarm },
      { name: "Valves and fittings", price: EQUIPMENT_ITEMS.valvesFittings },
    ],
  },
  BASE: {
    label: "Base Manual",
    cost: 3900,
    items: [
      { name: "Variable-speed pump", price: EQUIPMENT_ITEMS.variableSpeedPump },
      { name: "Cartridge filter", price: EQUIPMENT_ITEMS.filter },
      { name: "Pool LED", price: EQUIPMENT_ITEMS.colorLed },
      { name: "Transformer", price: EQUIPMENT_ITEMS.transformer },
      { name: "Timer", price: EQUIPMENT_ITEMS.timer },
      { name: "Chlorinator", price: EQUIPMENT_ITEMS.chlorinator },
    ],
  },
} as const;

export const ADD_ONS = {
  sodLandscaping: 3000,
} as const;

export const SPA_SURCHARGES = {
  gunite: 1800,
  doubleCopingCuts: 250,
  spillwayInstall: 125,
} as const;

export const BUILD_STATUSES = [
  "DRAFT",
  "QUOTED",
  "SOLD",
  "IN_PROGRESS",
  "COMPLETE",
] as const;

export const BUILD_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  QUOTED: "Quoted",
  SOLD: "Sold",
  IN_PROGRESS: "In Progress",
  COMPLETE: "Complete",
};

export const BUILD_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  QUOTED: "bg-blue-500/15 text-blue-400",
  SOLD: "bg-green-500/15 text-green-400",
  IN_PROGRESS: "bg-purple-500/15 text-purple-400",
  COMPLETE: "bg-emerald-500/15 text-emerald-400",
};

export const DECK_MATERIALS = {
  PAVER: {
    label: "Pavers",
    rate: UNIT_RATES.paverMaterial + UNIT_RATES.paverInstallLabor,
  },
  TRAVERTINE: {
    label: "Travertine",
    rate:
      UNIT_RATES.travertineMaterial + UNIT_RATES.travertineInstallLabor,
  },
} as const;

export const MARGIN_THRESHOLDS = {
  green: 28,
  yellow: 22,
} as const;

export const DEFAULT_ADDITION_COSTS = {
  spa:
    SPA_SURCHARGES.gunite +
    (SPA_SURCHARGES.doubleCopingCuts - FIXED_COSTS.copingCuts) +
    SPA_SURCHARGES.spillwayInstall +
    (FIXED_COSTS.electricPoolSpa - FIXED_COSTS.electricPoolOnly),
  heat: FIXED_COSTS.heatPump,
  sod: ADD_ONS.sodLandscaping,
  cage: 0,
  waterfall: 0,
  treeRemoval: 0,
  fireFeatures: 0,
  interiorUpgrade: 0,
} as const;

export const COST_PHASE_LABELS: Record<string, string> = {
  STRUCTURE: "Structure",
  ENGINEERING: "Engineering",
  PLUMBING: "Plumbing",
  ELECTRICAL: "Electrical",
  INTERIOR: "Interior Finish",
  DECK: "Decking & Coping",
  EQUIPMENT: "Equipment",
  ALLOWANCES: "Allowances",
  CUSTOM: "Custom Costs",
};
