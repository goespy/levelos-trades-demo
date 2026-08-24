// Types + smart default generation for proposal templates

export interface FeatureCard {
  title: string;
  description: string;
}

export interface Milestone {
  name: string;
  description: string;
  percentage: number;
  amount: number;
}

export interface ProposalDefaults {
  heroHeadline: string;
  heroSubheadline: string;
  approachText: string;
  featureCards: FeatureCard[];
  milestones: Milestone[];
  validUntil: string;
}

interface BuildData {
  poolLength: number;
  poolWidth: number;
  hasSpa: boolean;
  hasHeat: boolean;
  hasAutomation: boolean;
  isSalt: boolean;
  hasCage: boolean;
  hasWaterfall: boolean;
  hasFireFeatures: boolean;
  deckMaterial: string;
  equipment: string;
  salePrice: number;
  totalCOGS: number;
}

interface LineItemData {
  phase: string;
  label: string;
  total: number;
}

// LineItemData kept for API compatibility — milestones use fixed percentages

const FEATURE_CARD_MAP: Record<string, FeatureCard> = {
  spa: {
    title: "Integrated Spa",
    description:
      "A seamless spa with spillover edge, dedicated jets, and independent temperature control for year-round relaxation.",
  },
  heat: {
    title: "Energy-Efficient Heating",
    description:
      "A whisper-quiet, high-efficiency heat pump ensures your spa is always at the perfect temperature — effortless luxury at the touch of a button.",
  },
  automation: {
    title: "Smart Automation",
    description:
      "OmniPL control system with smartphone app — manage lighting, heating, pumps, and water features from anywhere.",
  },
  waterfall: {
    title: "Custom Waterfall",
    description:
      "Natural stone waterfall feature that creates a tranquil ambiance with the soothing sound of cascading water.",
  },
  fire: {
    title: "Fire Features",
    description:
      "Dramatic fire bowls or fire pit elements that add warmth and elegance to your outdoor living space after sunset.",
  },
  salt: {
    title: "Saltwater System",
    description:
      "Crystal-clear saltwater sanitation that's gentle on skin and eyes — no harsh chlorine handling required.",
  },
  travertine: {
    title: "Travertine Decking",
    description:
      "Premium travertine stone decking that stays cool underfoot, won't fade in the Florida sun, and adds timeless beauty.",
  },
  paver: {
    title: "Paver Decking",
    description:
      "Durable interlocking paver decking with a wide range of patterns and colors to complement your home's architecture.",
  },
  cage: {
    title: "Screen Enclosure",
    description:
      "Full-coverage screen cage that keeps debris and insects out while preserving your view and increasing usable space.",
  },
};

// Fixed milestone percentages matching the standard proposal template
const MILESTONE_DEFS = [
  {
    name: "Permits & Plans",
    description: "Investment installment following engineering & permit submission",
    percentage: 2,
  },
  {
    name: "Pool Shell",
    description: "Excavation, structural steel cage, and gunite",
    percentage: 27,
  },
  {
    name: "Tile & Coping",
    description: "Waterline tile, stone coping, and rough plumbing",
    percentage: 25,
  },
  {
    name: "Deck & Pumps",
    description: "Deck installation and pool equipment setup",
    percentage: 26,
  },
  {
    name: "Screen Cage",
    description: "Pool enclosure construction and electrical",
    percentage: 11,
    requiresCage: true,
  },
  {
    name: "Pool Finish",
    description: "Interior finish, water fill, and Pool School",
    percentage: 9,
  },
];

function pickTopFeatures(build: BuildData): FeatureCard[] {
  const cards: FeatureCard[] = [];

  // Priority order for feature cards
  if (build.hasSpa) cards.push(FEATURE_CARD_MAP.spa);
  if (build.hasWaterfall) cards.push(FEATURE_CARD_MAP.waterfall);
  if (build.hasFireFeatures) cards.push(FEATURE_CARD_MAP.fire);
  if (build.hasAutomation) cards.push(FEATURE_CARD_MAP.automation);
  if (build.hasHeat) cards.push(FEATURE_CARD_MAP.heat);
  if (build.isSalt) cards.push(FEATURE_CARD_MAP.salt);
  if (build.hasCage) cards.push(FEATURE_CARD_MAP.cage);

  // Deck material as a feature if we need more
  if (build.deckMaterial === "TRAVERTINE") {
    cards.push(FEATURE_CARD_MAP.travertine);
  } else {
    cards.push(FEATURE_CARD_MAP.paver);
  }

  return cards.slice(0, 3);
}

function computeMilestones(
  build: BuildData,
  _lineItems: LineItemData[]
): Milestone[] {
  void _lineItems;
  const salePrice = build.salePrice || 0;

  // Filter out milestones that don't apply (e.g. no cage)
  const applicable = MILESTONE_DEFS.filter((def) => {
    if ("requiresCage" in def && def.requiresCage && !build.hasCage) return false;
    return true;
  });

  // Redistribute to flat whole-number percentages that sum to exactly 100
  const rawTotal = applicable.reduce((s, d) => s + d.percentage, 0);
  const rawPcts = applicable.map((d) => (d.percentage / rawTotal) * 100);
  const floored = rawPcts.map((p) => Math.floor(p));
  const remainder = 100 - floored.reduce((s, v) => s + v, 0);

  // Distribute remainder 1% at a time to items with largest fractional parts
  const fractions = rawPcts.map((p, i) => ({ i, frac: p - floored[i] }));
  fractions.sort((a, b) => b.frac - a.frac);
  for (let k = 0; k < remainder; k++) {
    floored[fractions[k].i] += 1;
  }

  // Compute amounts from percentages, then adjust last milestone so sum === salePrice
  const deckLabel = build.deckMaterial === "TRAVERTINE" ? "Travertine" : "Paver";
  const milestones: Milestone[] = applicable.map((def, i) => ({
    name: def.name,
    description:
      def.name === "Deck & Pumps"
        ? `${deckLabel} deck installation and pool equipment setup`
        : def.description,
    percentage: floored[i],
    amount: Math.round((floored[i] / 100) * salePrice),
  }));

  const amountSum = milestones.reduce((s, m) => s + m.amount, 0);
  if (milestones.length > 0 && amountSum !== salePrice) {
    milestones[milestones.length - 1].amount += salePrice - amountSum;
  }

  return milestones;
}

export function generateProposalDefaults(
  build: BuildData,
  lineItems: LineItemData[]
): ProposalDefaults {
  const poolSize = `${build.poolLength}×${build.poolWidth}`;
  const features: string[] = [];
  if (build.hasSpa) features.push("spa");
  if (build.hasHeat) features.push("heating");
  if (build.hasAutomation) features.push("smart automation");
  if (build.hasWaterfall) features.push("waterfall");
  if (build.hasFireFeatures) features.push("fire features");

  const featurePhrase =
    features.length > 0 ? ` with ${features.join(", ")}` : "";

  // Valid for 30 days from now
  const validDate = new Date();
  validDate.setDate(validDate.getDate() + 30);
  const validUntil = validDate.toISOString().split("T")[0];

  return {
    heroHeadline: "Your Dream Pool Awaits",
    heroSubheadline: `A custom ${poolSize} ft pool${featurePhrase} — designed exclusively for your home.`,
    approachText:
      "At Persistent Pools, we focus on high-quality builds for Florida homes. Your new pool is more than just a place to swim; it's a major part of your home and your daily life. We make sure the engineering and the design work together perfectly.",
    featureCards: pickTopFeatures(build),
    milestones: computeMilestones(build, lineItems),
    validUntil,
  };
}
