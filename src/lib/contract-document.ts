export const CONTRACT_DATA_VERSION = 1;

export const ACKNOWLEDGEMENTS = [
  "Pool access",
  "Natural finish variation",
  "Roof and drainage",
  "Decking variation",
  "Startup kit",
  "Filter care",
  "Active construction site",
  "Change coordination",
  "Pool school",
  "Estimated schedule",
  "Site access",
  "Permitting",
  "Change orders",
  "Service requests",
  "Payment methods",
  "Water service",
] as const;

const termBodies = [
  "The project is a fictional portfolio sample and is not a binding agreement.",
  "Scope is limited to the listed project summary and selected specifications.",
  "Permits and inspections follow the applicable fictional project schedule.",
  "The customer keeps reasonable access to the work area available.",
  "Material colors and natural finishes may vary from samples.",
  "Changes are recorded before work proceeds.",
  "Payment is due according to the milestone schedule.",
  "Construction timing is an estimate, not a guarantee.",
  "Site conditions can require documented adjustments.",
  "The customer maintains utilities needed for installation.",
  "Safety barriers and code items are identified in the project record.",
  "Equipment selections are those shown in this document.",
  "Warranty information is illustrative and must be confirmed separately.",
  "Electronic signatures create the audit evidence shown below.",
  "A signed document is immutable in this demo.",
  "This compliance-ready presentation is not legal advice or certification.",
];

export type ContractFields = Record<
  string,
  string | number | boolean | null | undefined
>;

export type ContractEnvelope = {
  version: typeof CONTRACT_DATA_VERSION;
  fields: ContractFields;
  acknowledgements: {
    number: number;
    title: string;
    contractorInitials: string;
    customerInitials: string;
    text: string;
  }[];
  terms: { title: string; body: string }[];
};

type ContractSource = Record<string, unknown> | null | undefined;

const paymentNames = [
  "Permits & Plans",
  "Pool Shell",
  "Tile & Coping",
  "Deck & Pumps",
  "Screen Cage",
  "Pool Finish",
];
const paymentPercentages = [2, 27, 25, 26, 11, 9];

function toMilestones(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw !== "string") return [];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function numberValue(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function textValue(value: unknown, fallback = ""): string {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return fallback;
}

function titleCaseMaterial(value: unknown): string {
  const material = textValue(value, "PAVER").toUpperCase();
  return material === "TRAVERTINE" ? "Travertine" : "Concrete paver";
}

function inferPoolShape(buildName: string): string {
  if (/lagoon/i.test(buildName)) return "Freeform lagoon";
  if (/kidney/i.test(buildName)) return "Kidney";
  if (/infinity/i.test(buildName)) return "Geometric infinity edge";
  return "Modern geometric rectangle";
}

export function generateContractDefaults(input: {
  client?: ContractSource;
  build?: ContractSource;
  proposal?: ContractSource;
  date?: string;
}): ContractEnvelope {
  const client = input.client ?? {};
  const build = input.build ?? {};
  const proposal = input.proposal ?? {};
  const contractDate = input.date ?? new Date().toISOString().slice(0, 10);
  const total =
    numberValue(proposal.total ?? build.salePrice) -
    numberValue(proposal.discount);
  const milestones = toMilestones(proposal.milestones);
  const buildName = textValue(build.name);
  const poolLength = numberValue(build.poolLength ?? proposal.poolLength);
  const poolWidth = numberValue(build.poolWidth ?? proposal.poolWidth);
  const poolSquareFeet = Math.round(poolLength * poolWidth);
  const deckMaterial = titleCaseMaterial(
    build.deckMaterial ?? proposal.deckMaterial,
  );
  const hasSpa = Boolean(build.hasSpa);
  const hasHeat = Boolean(build.hasHeat);
  const hasAutomation = Boolean(build.hasAutomation);
  const hasSalt = Boolean(build.isSalt);
  const hasCage = Boolean(build.hasCage);
  const hasSod = Boolean(build.hasSod);
  const hasTreeRemoval = Boolean(build.hasTreeRemoval);
  const hasInteriorUpgrade =
    Boolean(build.hasInteriorUpgrade) || /pebble/i.test(textValue(proposal.lineItems));
  const fullEquipment = textValue(build.equipment).toUpperCase() === "FULL";
  const isTravertine = deckMaterial === "Travertine";
  const clientAddress = [client.address, client.city, client.zip]
    .filter(Boolean)
    .join(", ");

  const fields: ContractFields = {
    contractDate,
    purchasedBy: textValue(client.name),
    installationAddress: clientAddress,
    billingAddress: clientAddress,
    jobPhone: textValue(client.phone, "Not provided"),
    fax: "Not applicable",
    others: "Accepted proposal and approved project specifications",
    legalDescr: "Per attached synthetic property survey",
    subdivision: client.city
      ? `${textValue(client.city)} residential project`
      : "Sample residential project",

    earthRemovalYes: hasTreeRemoval,
    earthRemovalNo: !hasTreeRemoval,
    additionalFillBuyer: false,
    additionalFillContractor: true,
    shuttleDigYes: false,
    shuttleDigNo: true,

    poolShape: inferPoolShape(buildName),
    poolSize:
      poolLength && poolWidth
        ? `${poolLength}' × ${poolWidth}'`
        : "Per accepted proposal",
    dimensionsLength: poolLength ? `${poolLength} ft` : "Per approved plan",
    dimensionsWidth: poolWidth ? `${poolWidth} ft` : "Per approved plan",
    poolLength: poolLength ? `${poolLength} ft` : "Per approved plan",
    poolWidth: poolWidth ? `${poolWidth} ft` : "Per approved plan",
    sqFt: poolSquareFeet ? `${poolSquareFeet} sq ft footprint` : "Per plan",
    minDepth: "3 ft 6 in",
    maxDepth: "6 ft",

    interiorQuartz: hasInteriorUpgrade
      ? "Not selected"
      : "Standard quartz finish",
    interiorPebble: hasInteriorUpgrade,
    interiorColor: hasInteriorUpgrade
      ? "Aqua Blue pebble finish"
      : "Coastal Blue quartz finish",
    interiorOther: "30-day startup service included",
    copingBNBR: false,
    copingPrecast: !isTravertine,
    copingTrav: isTravertine,
    copingCantil: false,
    tileAllowance: "$3,000 material allowance",

    vacLineYes: true,
    vacLineNo: false,
    skimmerCount: poolLength >= 32 ? "2" : "1",
    filterSize: fullEquipment ? "425 sq ft" : "200 sq ft",
    filterCartridge: "Cartridge filter",
    filterDE: "Not selected",
    pumpHP: fullEquipment
      ? "2.7 HP variable-speed pump"
      : "1.85 HP variable-speed pump",
    addlPumpHP: hasSpa ? "1.5 HP spa jet pump" : "Not applicable",

    light100w: false,
    light300w: false,
    ledLightCount: hasSpa ? "3 — pool and spa" : "2 — pool",
    ledLightYes: true,
    ledLightNo: false,
    cleaningEquipment: "Robotic pool cleaner",
    testKit: "Startup water-test kit included",
    maintenanceFree: "30-day startup and orientation included",

    chlorinatorYes: true,
    chlorinatorNo: false,
    saltSystemYes: hasSalt,
    saltSystemNo: !hasSalt,
    infloorCleanYes: false,
    infloorCleanNo: true,

    benchDeepEnd: "Deep-end swim-out bench",
    benchShallow: "Entry steps and shallow bench",
    sunShelf: "Tanning ledge included per accepted design",
    handRailYes: false,
    handRailNo: true,
    ladderYes: false,
    ladderNo: true,

    timeClock: hasAutomation
      ? "App-based scheduling"
      : "Equipment timer included",
    automation: hasAutomation,
    controlsJandy: "Not selected",
    controlsAqualogic: hasAutomation
      ? "Whole-system automation included"
      : "Standard equipment controls",
    autoFillMech: "Mechanical autofill included",
    autoFillElectronic: "Not selected",

    pilingsConcrete: "Not required in sample scope",
    pilingsHelicalYes: false,
    pilingsHelicalNo: true,
    pilingsDrivenBy: "Not applicable",
    pilingsCappedBy: "Not applicable",
    engineering: "Structural and hydraulic permit plans included",

    heaterHeatPump: hasHeat,
    heaterHeatPumpSize: hasHeat ? "140,000 BTU heat pump" : "Not included",
    heaterGas: "Not selected",
    heaterGasSize: "Not applicable",
    heaterTankHookup: "Not applicable",
    heaterSolar: "Not selected",

    spaDim: hasSpa ? "7 ft × 7 ft" : "Not included",
    spaElev: hasSpa ? "12 in raised spillover" : "Not applicable",
    spaLight: hasSpa ? "Dedicated LED light" : "Not applicable",
    jets: hasSpa ? "6 therapy jets" : "Not applicable",
    airBlowerHP: hasSpa ? "1.5 HP" : "Not applicable",
    spaCoping: hasSpa ? deckMaterial : "Not applicable",

    deckMaterial,
    deckType: `${deckMaterial} deck`,
    deckColor: isTravertine ? "Ivory blend" : "Coastal sand blend",
    deckPattern: isTravertine ? "French pattern" : "Running bond",
    deckLanai: "Tie-in at existing lanai included",
    deckSkimcoat: "Not included",
    poolWiringYes: true,
    poolWiringNo: false,

    screenType: hasCage
      ? "Aluminum screen enclosure"
      : "Not included in project scope",
    screenColor: hasCage ? "Bronze" : "Not applicable",
    screenDoors: hasCage ? "2 self-closing doors" : "Not applicable",
    screenGutters: hasCage ? "Super-gutter tie-in" : "Not applicable",
    screenPanroof: hasCage ? "As required by approved plan" : "Not applicable",
    screenRailing: hasCage
      ? "Integrated code-compliant railing"
      : "Not applicable",
    screenFence: hasCage
      ? "Enclosure serves as pool barrier"
      : "Separate barrier required",

    sprinklersContractor: true,
    sprinklersBuyer: false,
    sodContractor: hasSod,
    sodBuyer: !hasSod,
    spotSurveyYes: true,
    spotSurveyNo: false,
    spotSurveyBuyer: false,
    safetyCode: "Residential pool-barrier requirements — demonstration",
    alarms: "Door and window alarms included where required",
    meshBarrierContractor: !hasCage,
    meshBarrierBuyer: false,

    item38: "Permits and standard inspections included",
    item39: "One pool-school orientation included",
    item40: "Final cleanup and startup included",
    contractPrice: total,
    contractPriceDollars: total,
    depositAmount: 0,
    roughShellAmount: 0,
    tileRoughPlumbingAmount: 0,
    deckEquipmentAmount: 0,
    enclosureAmount: 0,
    poolPrepInteriorAmount: 0,
    buyerSignature1: "",
    buyerDate1: "",
    proposedBy: "Persistent Pools, LLC — Authorized Representative",
    buyerSignature2: "",
    buyerDate2: "",
    contractorSignature: "Persistent Pools, LLC — Authorized Representative",
    contractorDate: contractDate,
  };

  let allocated = 0;
  paymentNames.forEach((name, index) => {
    const milestone = milestones.find(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        (item as { name?: string }).name === name,
    ) as { amount?: number; percentage?: number } | undefined;
    const optionalMissing =
      name === "Screen Cage" && milestones.length > 0 && !milestone;
    const percentage = optionalMissing
      ? 0
      : numberValue(milestone?.percentage ?? paymentPercentages[index]);
    const amount = optionalMissing
      ? 0
      : numberValue(
          milestone?.amount ??
            (index === paymentNames.length - 1
              ? total - allocated
              : Math.round((total * percentage) / 100)),
        );

    allocated += amount;
    fields[`payment${index + 1}Name`] = name;
    fields[`payment${index + 1}Amount`] = amount;
    fields[`payment${index + 1}Percentage`] = percentage;
  });

  fields.depositAmount = fields.payment1Amount;
  fields.roughShellAmount = fields.payment2Amount;
  fields.tileRoughPlumbingAmount = fields.payment3Amount;
  fields.deckEquipmentAmount = fields.payment4Amount;
  fields.enclosureAmount = fields.payment5Amount;
  fields.poolPrepInteriorAmount = fields.payment6Amount;

  return {
    version: CONTRACT_DATA_VERSION,
    fields,
    acknowledgements: ACKNOWLEDGEMENTS.map((title, index) => ({
      number: index + 1,
      title,
      contractorInitials: "PP",
      customerInitials: "",
      text: `${title}: ${termBodies[index]}`,
    })),
    terms: termBodies.map((body, index) => ({
      title: `${index + 1}. ${ACKNOWLEDGEMENTS[index]}`,
      body,
    })),
  };
}

export function normalizeContractData(raw: unknown): ContractEnvelope {
  const base = generateContractDefaults({});
  if (!raw || typeof raw !== "object") return base;

  const record = raw as Partial<ContractEnvelope>;
  return {
    version: CONTRACT_DATA_VERSION,
    fields: {
      ...base.fields,
      ...(record.fields ?? (raw as ContractFields)),
    },
    acknowledgements: (
      record.acknowledgements?.length === ACKNOWLEDGEMENTS.length
        ? record.acknowledgements
        : base.acknowledgements
    ).map((item, index) => ({
      ...base.acknowledgements[index],
      ...item,
      title: item.title ?? ACKNOWLEDGEMENTS[index],
    })),
    terms:
      record.terms?.length === ACKNOWLEDGEMENTS.length
        ? record.terms
        : base.terms,
  };
}

export const KNOWN_CONTRACT_FIELD_KEYS = new Set(
  Object.keys(generateContractDefaults({ date: "2000-01-01" }).fields),
);

export function mergeKnownContractFields(
  fields: ContractFields,
  updates: unknown,
): ContractFields {
  if (!updates || typeof updates !== "object") return fields;

  const clean: ContractFields = { ...fields };
  for (const [key, value] of Object.entries(
    updates as Record<string, unknown>,
  )) {
    if (
      KNOWN_CONTRACT_FIELD_KEYS.has(key) &&
      ["string", "number", "boolean"].includes(typeof value)
    ) {
      clean[key] = value as string | number | boolean;
    }
  }
  return clean;
}

export function publicContractProjection(contract: {
  id: string;
  status: string;
  contractData: string | null;
  signedByClient: string | null;
  signedDate: Date | string | null;
  signatureData?: string | null;
}) {
  let parsedContractData: unknown = {};
  try {
    parsedContractData = contract.contractData
      ? JSON.parse(contract.contractData)
      : {};
  } catch {
    parsedContractData = {};
  }

  const normalized = normalizeContractData(parsedContractData);
  const data = {
    ...normalized,
    fields: mergeKnownContractFields({}, normalized.fields),
  };
  let signatureEvidence: {
    signerName?: string;
    signedTimestamp?: string;
    documentHash?: string;
  } | null = null;

  try {
    const signature = contract.signatureData
      ? JSON.parse(contract.signatureData)
      : null;
    if (signature) {
      signatureEvidence = {
        signerName: signature.signerName,
        signedTimestamp: signature.signedTimestamp,
        documentHash: signature.documentHash,
      };
    }
  } catch {
    signatureEvidence = null;
  }

  return {
    id: contract.id,
    status: contract.status,
    contractData: JSON.stringify(data),
    signedByClient: contract.signedByClient,
    signedDate: contract.signedDate,
    signatureEvidence,
  };
}
