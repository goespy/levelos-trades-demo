// Seed the demo dev.db with rich, believable sample data.
// Every person, address, vendor, license, project, and price is fictional or
// illustrative. Do not replace these values with production exports.
// Run: npx tsx scripts/seed-demo.ts
// Idempotent — wipes then reseeds.

import {
  PrismaClient,
  type PoolBuild,
} from "../src/generated/prisma/client";
import { PrismaLibSql } from "@prisma/adapter-libsql";
import { randomUUID } from "node:crypto";
import { generateProposalDefaults } from "../src/lib/proposal-defaults";
import { generateContractDefaults } from "../src/lib/contract-document";
import { documentHash } from "../src/lib/contract-hash.server";
import { DEMO_PROPOSAL_RENDER_IMAGES } from "../src/lib/proposal-demo-assets";
import { DEMO_FIXTURES } from "../src/lib/demo-fixtures";

const adapter = new PrismaLibSql({
  url: process.env.SEED_DATABASE_URL?.trim() || "file:dev.db",
});
const prisma = new PrismaClient({ adapter });

const DAYS = (n: number): Date => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
};

// Use only the bundled, visually verified pool renders. Remote stock-image IDs
// are intentionally avoided because their subjects can change or be unrelated.
const POOL_PHOTOS = DEMO_PROPOSAL_RENDER_IMAGES;

function seededContractFields(proposal: Record<string, unknown>, clientName: string) {
  const envelope = generateContractDefaults({ proposal, client: { name: clientName } });
  const initials = clientName.split(/\s+/).filter((part) => /^[A-Za-z]/.test(part)).map((part) => part[0]).join("").toUpperCase();
  envelope.fields = { ...envelope.fields, purchasedBy: clientName, ...Object.fromEntries(Array.from({ length: 16 }, (_, index) => [`initials${index + 1}b`, initials])) };
  envelope.acknowledgements = envelope.acknowledgements.map((item) => ({ ...item, customerInitials: initials }));
  if (!envelope.acknowledgements.every((item) => item.customerInitials === initials)) throw new Error("Signed fixture acknowledgement initials are incomplete");
  const contractData = JSON.stringify(envelope);
  const signedTimestamp = "2026-08-01T15:00:00.000Z";
  return { contractData, signatureData: JSON.stringify({ signerName: clientName, signerEmail: `${clientName.toLowerCase().replace(/\s+/g, ".")}@example.com`, signerIp: "192.0.2.44", signerUserAgent: "LEVELos demo fixture", typedSignature: clientName, consent: true, consentTimestamp: signedTimestamp, signedTimestamp, auditTrail: [{ event: "consent-captured", actor: "customer", at: signedTimestamp }, { event: "typed-signature-applied", actor: "customer", at: signedTimestamp }], documentHash: documentHash(envelope) }) };
}

async function main() {
  console.log("Wiping existing data...");
  await prisma.maintenancePlan.deleteMany();
  await prisma.jobCostEntry.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.referral.deleteMany();
  await prisma.review.deleteMany();
  await prisma.jobPhase.deleteMany();
  await prisma.job.deleteMany();
  await prisma.subcontractor.deleteMany();
  await prisma.contract.deleteMany();
  await prisma.proposal.deleteMany();
  await prisma.buildLineItem.deleteMany();
  await prisma.poolBuild.deleteMany();
  await prisma.renderJob.deleteMany();
  await prisma.clientFile.deleteMany();
  await prisma.designProject.deleteMany();
  await prisma.weeklyMetric.deleteMany();
  await prisma.client.deleteMany();

  // ============================================================
  // CLIENTS — 12 total: 5 active sales, 4 past customers, 3 leads
  // ============================================================
  console.log("\n=== CLIENTS ===");
  const clients = await Promise.all([
    // === ACTIVE SALES (have signed contracts → active jobs) ===
    prisma.client.create({
      data: {
        id: DEMO_FIXTURES.haywardClientId,
        name: "Robert & Lisa Hayward",
        email: "haywards@example.com",
        phone: "(941) 555-0142",
        address: "1284 Coral Ridge Way",
        city: "Sarasota",
        zip: "34232",
        source: "FB Ad",
        leadScore: 9,
        timeline: "ASAP",
        homeownerConfirmed: true,
        hasSpecificFeatures: true,
        financingInterested: true,
        notes: "Hot lead. Modern geometric. Spa, LED, automation, sun shelf. Build active.",
      },
    }),
    prisma.client.create({
      data: {
        name: "Marcus & Diane Chen",
        email: "chen.family@example.com",
        phone: "(941) 555-0167",
        address: "445 Mangrove Drive",
        city: "Venice",
        zip: "34293",
        source: "Google Ad",
        leadScore: 8,
        timeline: "ASAP",
        homeownerConfirmed: true,
        hasSpecificFeatures: true,
        notes: "Rectangular pool with infinity edge. Premium build.",
      },
    }),
    prisma.client.create({
      data: {
        name: "Tim & Jessica Kowalski",
        email: "kowalski.tj@example.com",
        phone: "(941) 555-0203",
        address: "8821 Lakeshore Court",
        city: "North Port",
        zip: "34289",
        source: "Referral",
        leadScore: 8,
        timeline: "ASAP",
        homeownerConfirmed: true,
        hasSpecificFeatures: true,
        notes: "Referred by Brad Sullivan. Compact modern build. Just signed.",
      },
    }),
    prisma.client.create({
      data: {
        name: "Jose & Ana Mendez",
        email: "mendez.familia@example.com",
        phone: "(239) 555-0287",
        address: "2905 Coral Reef Lane",
        city: "Cape Coral",
        zip: "33914",
        source: "FB Ad",
        leadScore: 7,
        timeline: "3-6 months",
        homeownerConfirmed: true,
        hasSpecificFeatures: true,
        notes: "Lagoon style with waterfall. Job currently on hold — insurance claim dispute on neighboring property survey.",
      },
    }),
    prisma.client.create({
      data: {
        name: "James Whitfield",
        email: "jwhitfield@example.com",
        phone: "(941) 555-0118",
        address: "9012 Palmetto Cove",
        city: "Bradenton",
        zip: "34211",
        source: "Referral",
        leadScore: 6,
        timeline: "3-6 months",
        homeownerConfirmed: true,
        notes: "Backyard renovation. Kidney shape. Mid-tier equipment. Proposal sent, awaiting response.",
      },
    }),
    // === PAST CUSTOMERS (completed jobs) ===
    prisma.client.create({
      data: {
        name: "Brad & Karen Sullivan",
        email: "sullivans@example.com",
        phone: "(941) 555-0344",
        address: "664 Bayview Drive",
        city: "Punta Gorda",
        zip: "33950",
        source: "FB Ad",
        leadScore: 9,
        timeline: "Completed",
        homeownerConfirmed: true,
        notes: "Completed Aug 2025. Family splash pool. 5-star Google review. Has referred 2 leads.",
      },
    }),
    prisma.client.create({
      data: {
        name: "Tom & Susan Anderson",
        email: "anderson.t@example.com",
        phone: "(941) 555-0411",
        address: "1144 Heron Bay",
        city: "Sarasota",
        zip: "34238",
        source: "Walk-in",
        leadScore: 8,
        timeline: "Completed",
        homeownerConfirmed: true,
        notes: "Modern geometric. Completed March 2025. 5-star Yelp review.",
      },
    }),
    prisma.client.create({
      data: {
        name: "Marshall Family",
        email: "marshall.fam@example.com",
        phone: "(941) 555-0488",
        address: "76 Sandpiper Cove",
        city: "Bradenton",
        zip: "34209",
        source: "FB Ad",
        leadScore: 7,
        timeline: "Completed",
        homeownerConfirmed: true,
        notes: "Family pool. Completed Feb 2025. Declined review request — busy.",
      },
    }),
    prisma.client.create({
      data: {
        name: "Frank & Maria Rossi",
        email: "rossi.fm@example.com",
        phone: "(941) 555-0224",
        address: "2210 Bayshore Lane",
        city: "Sarasota",
        zip: "34239",
        source: "Walk-in",
        leadScore: 5,
        timeline: "3-6 months",
        homeownerConfirmed: true,
        notes: "Wants spa with spillover. Modern style. Build draft in progress.",
      },
    }),
    // === LEADS (no proposal yet or early stage) ===
    prisma.client.create({
      data: {
        name: "Susan & David Park",
        email: "parks.dsd@example.com",
        phone: "(941) 555-0555",
        address: "5500 Magnolia Way",
        city: "Sarasota",
        zip: "34243",
        source: "Referral",
        leadScore: 5,
        timeline: "Just exploring",
        homeownerConfirmed: true,
        notes: "Marcus Chen's neighbor. Saw build progress. Exploring custom geometric.",
      },
    }),
    prisma.client.create({
      data: {
        name: "Patricia Donovan",
        email: "pat.d@example.com",
        phone: "(941) 555-0199",
        source: "FB Ad",
        leadScore: 4,
        timeline: "Just exploring",
        notes: "Early lead. Needs design consultation.",
      },
    }),
    prisma.client.create({
      data: {
        name: "Veronica Liu",
        email: "v.liu@example.com",
        phone: "(941) 555-0612",
        city: "Venice",
        zip: "34293",
        source: "Walk-in",
        leadScore: 3,
        timeline: "Just exploring",
        homeownerConfirmed: false,
        notes: "Walk-in. Cold lead. Wants more info on financing options.",
      },
    }),
  ]);
  const [hayward, chen, kowalski, mendez, whitfield, sullivan, anderson, marshall, rossi, park] = clients;
  console.log(`Created ${clients.length} clients`);

  // ============================================================
  // DESIGN PROJECTS + FILES + RENDERS — 6 design projects with renders
  // ============================================================
  console.log("\n=== DESIGN PROJECTS + RENDERS ===");
  const designProjects = await Promise.all([
    prisma.designProject.create({
      data: {
        clientId: hayward.id,
        status: "COMPLETE",
        templateUsed: "Modern Geometric",
        lotWidth: 80,
        lotDepth: 120,
        setbackFront: 25,
        setbackSide: 7.5,
        setbackRear: 10,
        poolStyle: "Modern Geometric",
        poolFeatures: ["spa","spillover","sun_shelf","LED","automation","saltwater"],
        estimatedSize: "30x14",
        zoning: "RSF-2",
        surveyReceived: true,
        photosReceived: true,
        surveyDate: DAYS(-25),
        photosDate: DAYS(-23),
        designStarted: DAYS(-22),
        designCompleted: DAYS(-18),
        rendersCompleted: DAYS(-15),
        notes: "Premium build. Owner highly engaged.",
      },
    }),
    prisma.designProject.create({
      data: {
        clientId: chen.id,
        status: "COMPLETE",
        templateUsed: "Minimalist Luxury",
        lotWidth: 100,
        lotDepth: 150,
        poolStyle: "Infinity Edge",
        poolFeatures: ["infinity_edge","spa","heat","automation","saltwater"],
        estimatedSize: "36x16",
        surveyReceived: true,
        photosReceived: true,
        designStarted: DAYS(-50),
        designCompleted: DAYS(-42),
        rendersCompleted: DAYS(-38),
      },
    }),
    prisma.designProject.create({
      data: {
        clientId: mendez.id,
        status: "COMPLETE",
        templateUsed: "Tropical Lagoon",
        poolStyle: "Tropical Lagoon",
        poolFeatures: ["waterfall","sun_shelf","LED"],
        estimatedSize: "30x18 freeform",
        surveyReceived: true,
        photosReceived: true,
        designStarted: DAYS(-40),
        designCompleted: DAYS(-32),
        rendersCompleted: DAYS(-28),
      },
    }),
    prisma.designProject.create({
      data: {
        clientId: whitfield.id,
        status: "RENDERING",
        templateUsed: "Family Standard",
        poolStyle: "Kidney Classic",
        poolFeatures: ["heat","tile_water_line"],
        estimatedSize: "24x12",
        surveyReceived: true,
        photosReceived: true,
        designStarted: DAYS(-7),
        designCompleted: DAYS(-3),
        notes: "Awaiting final render selections.",
      },
    }),
    prisma.designProject.create({
      data: {
        clientId: rossi.id,
        status: "IN_PROGRESS",
        templateUsed: "Modern Geometric",
        poolStyle: "Modern w/ Spillover Spa",
        poolFeatures: ["spa","spillover","heat","LED"],
        surveyReceived: true,
        photosReceived: false,
        designStarted: DAYS(-2),
        notes: "Need backyard photos from client.",
      },
    }),
    prisma.designProject.create({
      data: {
        clientId: park.id,
        status: "WAITING_INFO",
        notes: "Awaiting initial qualifying call.",
      },
    }),
  ]);
  console.log(`Created ${designProjects.length} design projects`);

  // Render job + output files for first 3 (the polished ones)
  for (const [idx, dp] of designProjects.slice(0, 3).entries()) {
    // Source screenshot
    const screenshot = await prisma.clientFile.create({
      data: {
        clientId: dp.clientId,
        designProjectId: dp.id,
        filename: `vip3d-screenshot-${idx + 1}.png`,
        storagePath: POOL_PHOTOS[(idx * 2) % POOL_PHOTOS.length],
        fileType: "image/png",
        fileSize: 1245680,
        category: "VIP3D_SCREENSHOT",
        description: "VIP3D aerial view",
      },
    });
    // Render outputs (3 per design project)
    const outputs = await Promise.all([0, 1, 2].map((i) =>
      prisma.clientFile.create({
        data: {
          clientId: dp.clientId,
          designProjectId: dp.id,
          filename: `render-${idx + 1}-${i + 1}.jpg`,
          storagePath: DEMO_PROPOSAL_RENDER_IMAGES[i],
          fileType: "image/jpeg",
          fileSize: 980000 + i * 50000,
          category: "GEMINI_RENDER",
          description: ["Golden hour aerial","Eye-level dusk","Mid-day overhead"][i],
        },
      })
    ));
    await prisma.renderJob.create({
      data: {
        designProjectId: dp.id,
        promptUsed: "Photorealistic aerial render of a custom pool, golden hour, premium materials, [BUILD_DETAILS]",
        sourceScreenshotId: screenshot.id,
        timeOfDay: "golden_hour",
        cameraAngle: "aerial",
        rating: 5,
        selected: true,
        notes: "Final selected for proposal.",
        outputFiles: { connect: outputs.map((f) => ({ id: f.id })) },
      },
    });
  }

  // Backyard photos for a few clients
  for (const c of [hayward, chen, mendez, whitfield, rossi]) {
    for (const angle of ["BACK_DOOR", "LEFT", "RIGHT"]) {
      await prisma.clientFile.create({
        data: {
          clientId: c.id,
          filename: `backyard-${angle.toLowerCase()}.jpg`,
          storagePath: POOL_PHOTOS[Math.floor(Math.random() * POOL_PHOTOS.length)],
          fileType: "image/jpeg",
          fileSize: 2400000,
          category: "BACKYARD_PHOTO",
          angle,
        },
      });
    }
  }
  console.log("Created render jobs + backyard photos");

  // ============================================================
  // POOL BUILDS — 8 (5 SOLD, 1 QUOTED, 2 DRAFT)
  // ============================================================
  console.log("\n=== POOL BUILDS ===");
  const haywardBuild = await prisma.poolBuild.create({
    data: {
      name: "Hayward — Modern Geometric",
      status: "SOLD",
      clientId: hayward.id,
      poolLength: 30, poolWidth: 14,
      deckLength: 50, deckWidth: 30,
      hasSpa: true, hasHeat: true, hasAutomation: true, isSalt: true, hasCage: true,
      deckMaterial: "TRAVERTINE", equipment: "FULL",
      totalCOGS: 78500, salePrice: 110000, grossProfit: 31500, marginPct: 28.6,
    },
  });
  const chenBuild = await prisma.poolBuild.create({
    data: {
      name: "Chen — Infinity Edge",
      status: "SOLD",
      clientId: chen.id,
      poolLength: 36, poolWidth: 16,
      deckLength: 60, deckWidth: 35,
      hasSpa: true, hasHeat: true, hasAutomation: true, isSalt: true,
      deckMaterial: "TRAVERTINE", equipment: "FULL",
      totalCOGS: 95000, salePrice: 145000, grossProfit: 50000, marginPct: 34.5,
    },
  });
  const sullivanBuild = await prisma.poolBuild.create({
    data: {
      name: "Sullivan — Family Splash",
      status: "COMPLETE",
      clientId: sullivan.id,
      poolLength: 28, poolWidth: 14,
      deckLength: 42, deckWidth: 28,
      hasSpa: false, hasHeat: true, hasAutomation: true, hasCage: true,
      deckMaterial: "PAVER", equipment: "BASE",
      totalCOGS: 60000, salePrice: 85000, grossProfit: 25000, marginPct: 29.4,
    },
  });
  const mendezBuild = await prisma.poolBuild.create({
    data: {
      name: "Mendez — Tropical Lagoon",
      status: "SOLD",
      clientId: mendez.id,
      poolLength: 30, poolWidth: 18,
      deckLength: 48, deckWidth: 32,
      hasWaterfall: true, hasHeat: true, hasAutomation: true,
      deckMaterial: "PAVER", equipment: "FULL",
      totalCOGS: 82000, salePrice: 120000, grossProfit: 38000, marginPct: 31.7,
    },
  });
  const kowalskiBuild = await prisma.poolBuild.create({
    data: {
      name: "Kowalski — Compact Modern",
      status: "SOLD",
      clientId: kowalski.id,
      poolLength: 24, poolWidth: 12,
      deckLength: 36, deckWidth: 22,
      hasSpa: true, hasHeat: true, isSalt: true,
      deckMaterial: "TRAVERTINE", equipment: "BASE",
      totalCOGS: 48500, salePrice: 65000, grossProfit: 16500, marginPct: 25.4,
    },
  });
  const whitfieldBuild = await prisma.poolBuild.create({
    data: {
      name: "Whitfield — Kidney Classic",
      status: "QUOTED",
      clientId: whitfield.id,
      poolLength: 24, poolWidth: 12,
      deckLength: 38, deckWidth: 25,
      hasHeat: true,
      deckMaterial: "PAVER", equipment: "BASE",
      totalCOGS: 52000, salePrice: 72000, grossProfit: 20000, marginPct: 27.8,
    },
  });
  await prisma.poolBuild.create({
    data: {
      name: "Rossi — Modern w/ Spa",
      status: "DRAFT",
      clientId: rossi.id,
      poolLength: 28, poolWidth: 14,
      deckLength: 42, deckWidth: 28,
      hasSpa: true, hasHeat: true,
      deckMaterial: "TRAVERTINE", equipment: "BASE",
      totalCOGS: 65000, salePrice: 95000, grossProfit: 30000, marginPct: 31.6,
    },
  });
  await prisma.poolBuild.create({
    data: {
      name: "Park — Custom Geometric",
      status: "DRAFT",
      clientId: park.id,
      poolLength: 30, poolWidth: 15,
      deckLength: 44, deckWidth: 28,
      hasSpa: true, hasAutomation: true,
      deckMaterial: "TRAVERTINE", equipment: "BASE",
      totalCOGS: 64000, salePrice: 90000, grossProfit: 26000, marginPct: 28.9,
    },
  });
  console.log("Created 8 pool builds");

  // ============================================================
  // PROPOSALS + CONTRACTS
  // ============================================================
  console.log("\n=== PROPOSALS + CONTRACTS ===");
  const sampleLineItemData = [
    { phase: "STRUCTURE", label: "Gunite", quantity: 420, unit: "sq ft", unitCost: 29.08, total: 12213.6 },
    { phase: "STRUCTURE", label: "Steel cage", quantity: 1, unit: "ea", unitCost: 4500, total: 4500 },
    { phase: "INTERIOR", label: "Pebble Sheen", quantity: 1, unit: "ea", unitCost: 4500, total: 4500 },
    { phase: "DECK", label: "Travertine deck", quantity: 1500, unit: "sq ft", unitCost: 10.5, total: 15750 },
  ];
  const sampleLineItems = JSON.stringify(sampleLineItemData);
  const syntheticRenderImages = JSON.stringify(DEMO_PROPOSAL_RENDER_IMAGES);

  const proposalTemplateFields = (build: PoolBuild) => {
    const defaults = generateProposalDefaults(build, sampleLineItemData);

    return {
      heroHeadline: defaults.heroHeadline,
      heroSubheadline: defaults.heroSubheadline,
      approachText: defaults.approachText,
      featureCards: JSON.stringify(defaults.featureCards),
      milestones: JSON.stringify(defaults.milestones),
      renderImages: syntheticRenderImages,
      validUntil: defaults.validUntil,
    };
  };

  const haywardProp = await prisma.proposal.create({
    data: {
      clientId: hayward.id, buildId: haywardBuild.id, status: "ACCEPTED",
      total: 110000, poolLength: 30, poolWidth: 14, deckMaterial: "TRAVERTINE",
      lineItems: sampleLineItems,
      ...proposalTemplateFields(haywardBuild),
      shareToken: randomUUID(), sharedAt: DAYS(-15), clientRespondedAt: DAYS(-10),
    },
  });
  const chenProp = await prisma.proposal.create({
    data: {
      clientId: chen.id, buildId: chenBuild.id, status: "ACCEPTED",
      total: 145000, poolLength: 36, poolWidth: 16, deckMaterial: "TRAVERTINE",
      lineItems: sampleLineItems,
      ...proposalTemplateFields(chenBuild),
      shareToken: randomUUID(), sharedAt: DAYS(-30), clientRespondedAt: DAYS(-25),
    },
  });
  const sullivanProp = await prisma.proposal.create({
    data: {
      clientId: sullivan.id, buildId: sullivanBuild.id, status: "ACCEPTED",
      total: 85000, poolLength: 28, poolWidth: 14, deckMaterial: "PAVER",
      lineItems: sampleLineItems,
      ...proposalTemplateFields(sullivanBuild),
      shareToken: randomUUID(), sharedAt: DAYS(-180), clientRespondedAt: DAYS(-175),
    },
  });
  const mendezProp = await prisma.proposal.create({
    data: {
      clientId: mendez.id, buildId: mendezBuild.id, status: "ACCEPTED",
      total: 120000, poolLength: 30, poolWidth: 18, deckMaterial: "PAVER",
      lineItems: sampleLineItems,
      ...proposalTemplateFields(mendezBuild),
      shareToken: randomUUID(), sharedAt: DAYS(-45), clientRespondedAt: DAYS(-40),
    },
  });
  const kowalskiProp = await prisma.proposal.create({
    data: {
      clientId: kowalski.id, buildId: kowalskiBuild.id, status: "ACCEPTED",
      total: 65000, poolLength: 24, poolWidth: 12, deckMaterial: "TRAVERTINE",
      lineItems: sampleLineItems,
      ...proposalTemplateFields(kowalskiBuild),
      shareToken: randomUUID(), sharedAt: DAYS(-7), clientRespondedAt: DAYS(-3),
    },
  });
  await prisma.proposal.create({
    data: {
      clientId: whitfield.id, buildId: whitfieldBuild.id, status: "SENT",
      total: 72000, poolLength: 24, poolWidth: 12, deckMaterial: "PAVER",
      lineItems: sampleLineItems,
      ...proposalTemplateFields(whitfieldBuild),
      shareToken: randomUUID(), sharedAt: DAYS(-3),
    },
  });
  // Find Rossi's draft build to attach
  const rossiBuild = await prisma.poolBuild.findFirst({ where: { clientId: rossi.id } });
  if (rossiBuild) {
    await prisma.proposal.create({
      data: {
        clientId: rossi.id, buildId: rossiBuild.id, status: "DRAFT",
        total: 95000, poolLength: 28, poolWidth: 14, deckMaterial: "TRAVERTINE",
        lineItems: sampleLineItems,
        ...proposalTemplateFields(rossiBuild),
        notes: "Awaiting client backyard photos to finalize.",
      },
    });
  }
  // Park — proposal sent then rejected with changes requested
  const parkBuild = await prisma.poolBuild.findFirst({ where: { clientId: park.id } });
  if (parkBuild) {
    await prisma.proposal.create({
      data: {
        clientId: park.id, buildId: parkBuild.id, status: "REJECTED",
        total: 90000, poolLength: 30, poolWidth: 15, deckMaterial: "TRAVERTINE",
        lineItems: sampleLineItems,
        ...proposalTemplateFields(parkBuild),
        shareToken: randomUUID(), sharedAt: DAYS(-12), clientRespondedAt: DAYS(-8),
        clientMessage: "Love the design but want to add a sun shelf and a heat pump. Can we revise?",
      },
    });
  }
  console.log("Created 8 proposals");

  const haywardContract = await prisma.contract.create({
    data: { proposalId: haywardProp.id, status: "SIGNED",
      signedDate: DAYS(-8), signedByClient: "Robert Hayward", signedByOwner: "Portfolio Demo Owner",
      shareToken: randomUUID(), ...seededContractFields(haywardProp as unknown as Record<string, unknown>, "Robert Hayward") },
  });
  const chenContract = await prisma.contract.create({
    data: { proposalId: chenProp.id, status: "SIGNED",
      signedDate: DAYS(-22), signedByClient: "Marcus Chen", signedByOwner: "Portfolio Demo Owner",
      shareToken: randomUUID(), ...seededContractFields(chenProp as unknown as Record<string, unknown>, "Marcus Chen") },
  });
  const sullivanContract = await prisma.contract.create({
    data: { proposalId: sullivanProp.id, status: "SIGNED",
      signedDate: DAYS(-170), signedByClient: "Brad Sullivan", signedByOwner: "Portfolio Demo Owner",
      shareToken: randomUUID(), ...seededContractFields(sullivanProp as unknown as Record<string, unknown>, "Brad Sullivan") },
  });
  const mendezContract = await prisma.contract.create({
    data: { proposalId: mendezProp.id, status: "SIGNED",
      signedDate: DAYS(-38), signedByClient: "Jose Mendez", signedByOwner: "Portfolio Demo Owner",
      shareToken: randomUUID(), ...seededContractFields(mendezProp as unknown as Record<string, unknown>, "Jose Mendez") },
  });
  const kowalskiContract = await prisma.contract.create({
    data: { proposalId: kowalskiProp.id, status: "SIGNED",
      signedDate: DAYS(-2), signedByClient: "Tim Kowalski", signedByOwner: "Portfolio Demo Owner",
      shareToken: randomUUID(), ...seededContractFields(kowalskiProp as unknown as Record<string, unknown>, "Tim Kowalski") },
  });
  console.log("Created 5 contracts (all SIGNED)");

  // Anderson + Marshall historical jobs (no contracts in seed but need jobs)
  // We'll fake it with synthetic contracts to allow Job records
  // Simpler: create fake proposals + contracts for Anderson & Marshall
  const andersonBuild = await prisma.poolBuild.create({
    data: {
      name: "Anderson — Modern (Past)",
      status: "COMPLETE", clientId: anderson.id,
      poolLength: 30, poolWidth: 14, deckLength: 48, deckWidth: 30,
      hasSpa: true, hasHeat: true, isSalt: true,
      deckMaterial: "TRAVERTINE", equipment: "FULL",
      totalCOGS: 72000, salePrice: 105000, grossProfit: 33000, marginPct: 31.4,
    },
  });
  const andersonProp = await prisma.proposal.create({
    data: {
      clientId: anderson.id, buildId: andersonBuild.id, status: "ACCEPTED",
      total: 105000, poolLength: 30, poolWidth: 14, deckMaterial: "TRAVERTINE",
      lineItems: sampleLineItems,
      ...proposalTemplateFields(andersonBuild),
      shareToken: randomUUID(), sharedAt: DAYS(-330), clientRespondedAt: DAYS(-325),
    },
  });
  const andersonContract = await prisma.contract.create({
    data: { proposalId: andersonProp.id, status: "SIGNED",
      signedDate: DAYS(-320), signedByClient: "Tom Anderson", signedByOwner: "Portfolio Demo Owner", ...seededContractFields(andersonProp as unknown as Record<string, unknown>, "Tom Anderson") },
  });

  const marshallBuild = await prisma.poolBuild.create({
    data: {
      name: "Marshall — Family Pool (Past)",
      status: "COMPLETE", clientId: marshall.id,
      poolLength: 26, poolWidth: 13, deckLength: 40, deckWidth: 26,
      hasHeat: true,
      deckMaterial: "PAVER", equipment: "BASE",
      totalCOGS: 55000, salePrice: 78000, grossProfit: 23000, marginPct: 29.5,
    },
  });
  const marshallProp = await prisma.proposal.create({
    data: {
      clientId: marshall.id, buildId: marshallBuild.id, status: "ACCEPTED",
      total: 78000, poolLength: 26, poolWidth: 13, deckMaterial: "PAVER",
      lineItems: sampleLineItems,
      ...proposalTemplateFields(marshallBuild),
      shareToken: randomUUID(), sharedAt: DAYS(-380), clientRespondedAt: DAYS(-375),
    },
  });
  const marshallContract = await prisma.contract.create({
    data: { proposalId: marshallProp.id, status: "SIGNED",
      signedDate: DAYS(-370), signedByClient: "Daniel Marshall", signedByOwner: "Portfolio Demo Owner", ...seededContractFields(marshallProp as unknown as Record<string, unknown>, "Daniel Marshall") },
  });
  console.log("Created 2 historical contracts (Anderson, Marshall)");

  // ============================================================
  // SUBCONTRACTORS — 8
  // ============================================================
  console.log("\n=== SUBCONTRACTORS ===");
  const subs = await Promise.all([
    prisma.subcontractor.create({ data: {
      name: "Diaz Excavation Services", trade: "Excavation",
      contact: "Carlos Diaz", phone: "(941) 555-0301", email: "diaz.excav@example.com",
      licenseNumber: "FL-EX-22341", insuranceExpires: DAYS(120), hourlyRate: 95,
      rating: 5, notes: "Reliable. Fast turnaround. Best in SW Florida.",
    }}),
    prisma.subcontractor.create({ data: {
      name: "Atlas Gunite Co.", trade: "Gunite",
      contact: "Tom Atlas", phone: "(941) 555-0312",
      licenseNumber: "FL-GU-98712", insuranceExpires: DAYS(45),
      rating: 4, notes: "High quality but books out 3-4 weeks ahead.",
    }}),
    prisma.subcontractor.create({ data: {
      name: "BluePool Plumbing", trade: "Plumbing",
      contact: "Sandra Reyes", phone: "(941) 555-0388",
      licenseNumber: "FL-PL-11023", insuranceExpires: DAYS(180), hourlyRate: 110, rating: 5,
    }}),
    prisma.subcontractor.create({ data: {
      name: "Coastal Tile & Stone", trade: "Tile",
      contact: "Mike Vella", phone: "(941) 555-0411",
      rating: 4, notes: "Premium tile work. Slightly higher cost but worth it.",
    }}),
    prisma.subcontractor.create({ data: {
      name: "Sunshine Electrical", trade: "Electrical",
      contact: "Greg Hassell", phone: "(941) 555-0455",
      licenseNumber: "FL-EL-44291", insuranceExpires: DAYS(15), rating: 4,
      notes: "Insurance expiring soon — get update.",
    }}),
    prisma.subcontractor.create({ data: {
      name: "Aluma-Screen Pros", trade: "Screen",
      contact: "Dan Trujillo", phone: "(941) 555-0492",
      rating: 3, notes: "OK quality. Use only when others booked.",
    }}),
    prisma.subcontractor.create({ data: {
      name: "Vega Heat & Cool", trade: "HVAC",
      contact: "Luis Vega", phone: "(941) 555-0533", email: "vega.heat@example.com",
      licenseNumber: "FL-HV-22118", insuranceExpires: DAYS(220), hourlyRate: 125, rating: 5,
      notes: "Best heat pump installer in the region.",
    }}),
    prisma.subcontractor.create({ data: {
      name: "Reef Pavers", trade: "Pavers",
      contact: "Henry Boudreaux", phone: "(941) 555-0578",
      licenseNumber: "FL-PA-77891", insuranceExpires: DAYS(90), rating: 4,
      notes: "Specialist in travertine.",
    }}),
  ]);
  console.log(`Created ${subs.length} subcontractors`);

  // ============================================================
  // JOBS + JOB PHASES — 5 active in different states + 2 historical
  // ============================================================
  console.log("\n=== JOBS + PHASES ===");
  const phaseDefs = [
    "Permits & Plans","Pool Shell","Tile & Coping","Deck & Pumps","Screen Cage","Pool Finish",
  ];
  const subForPhase: Record<string, string | null> = {
    "Permits & Plans": null,
    "Pool Shell": subs[1].id, // Atlas Gunite
    "Tile & Coping": subs[3].id, // Coastal Tile
    "Deck & Pumps": subs[2].id, // BluePool Plumbing
    "Screen Cage": subs[5].id, // Aluma-Screen
    "Pool Finish": null,
  };

  async function createJob(opts: {
    contract: { id: string };
    client: { id: string };
    proposal: { id: string };
    name: string;
    status: string;
    startDate: Date | null;
    expectedEndDate: Date | null;
    actualEndDate?: Date | null;
    completedThroughIdx: number; // 0-6, which phases are COMPLETE
    inProgressIdx?: number | null; // which phase is IN_PROGRESS (-1 for none)
    blockedIdx?: number | null;
  }) {
    const job = await prisma.job.create({
      data: {
        contractId: opts.contract.id,
        clientId: opts.client.id,
        proposalId: opts.proposal.id,
        name: opts.name,
        status: opts.status,
        startDate: opts.startDate,
        expectedEndDate: opts.expectedEndDate,
        actualEndDate: opts.actualEndDate ?? null,
        portalToken: randomUUID(),
      },
    });
    for (const [idx, name] of phaseDefs.entries()) {
      let status = "PENDING";
      if (idx < opts.completedThroughIdx) status = "COMPLETE";
      else if (idx === opts.inProgressIdx) status = "IN_PROGRESS";
      else if (idx === opts.blockedIdx) status = "BLOCKED";

      const baseDay = (opts.startDate?.getTime() ?? Date.now()) / 86400000 - new Date().getTime() / 86400000;
      const phaseStart = Math.round(baseDay + idx * 8);
      const phaseEnd = phaseStart + 7;
      const photos = idx < opts.completedThroughIdx
        ? JSON.stringify([POOL_PHOTOS[idx % POOL_PHOTOS.length]])
        : null;

      await prisma.jobPhase.create({
        data: {
          jobId: job.id,
          name, sortOrder: idx, status,
          scheduledStart: DAYS(phaseStart),
          scheduledEnd: DAYS(phaseEnd),
          actualStart: status !== "PENDING" ? DAYS(phaseStart) : null,
          actualEnd: status === "COMPLETE" ? DAYS(phaseEnd - 1) : null,
          subcontractorId: subForPhase[name],
          notes: status === "COMPLETE" ? "Completed on schedule." : null,
          photos,
        },
      });
    }
    return job;
  }

  const haywardJob = await createJob({
    contract: haywardContract, client: hayward, proposal: haywardProp,
    name: "Hayward — Modern Geometric",
    status: "ACTIVE",
    startDate: DAYS(-7), expectedEndDate: DAYS(56),
    completedThroughIdx: 2, inProgressIdx: 2,
  });
  const chenJob = await createJob({
    contract: chenContract, client: chen, proposal: chenProp,
    name: "Chen — Infinity Edge",
    status: "ACTIVE",
    startDate: DAYS(-21), expectedEndDate: DAYS(28),
    completedThroughIdx: 4, inProgressIdx: 4,
  });
  const sullivanJob = await createJob({
    contract: sullivanContract, client: sullivan, proposal: sullivanProp,
    name: "Sullivan — Family Splash",
    status: "COMPLETE",
    startDate: DAYS(-160), expectedEndDate: DAYS(-100), actualEndDate: DAYS(-90),
    completedThroughIdx: 6, inProgressIdx: -1,
  });
  const mendezJob = await createJob({
    contract: mendezContract, client: mendez, proposal: mendezProp,
    name: "Mendez — Tropical Lagoon",
    status: "ON_HOLD",
    startDate: DAYS(-30), expectedEndDate: DAYS(45),
    completedThroughIdx: 2, inProgressIdx: null, blockedIdx: 2,
  });
  const kowalskiJob = await createJob({
    contract: kowalskiContract, client: kowalski, proposal: kowalskiProp,
    name: "Kowalski — Compact Modern",
    status: "ACTIVE",
    startDate: DAYS(0), expectedEndDate: DAYS(75),
    completedThroughIdx: 1, inProgressIdx: 1,
  });
  // Historical (just for review/referral data)
  const andersonJob = await createJob({
    contract: andersonContract, client: anderson, proposal: andersonProp,
    name: "Anderson — Modern (Past)",
    status: "COMPLETE",
    startDate: DAYS(-310), expectedEndDate: DAYS(-260), actualEndDate: DAYS(-250),
    completedThroughIdx: 6, inProgressIdx: -1,
  });
  const marshallJob = await createJob({
    contract: marshallContract, client: marshall, proposal: marshallProp,
    name: "Marshall — Family Pool (Past)",
    status: "COMPLETE",
    startDate: DAYS(-360), expectedEndDate: DAYS(-310), actualEndDate: DAYS(-300),
    completedThroughIdx: 6, inProgressIdx: -1,
  });
  console.log("Created 7 jobs (3 ACTIVE, 1 ON_HOLD, 3 COMPLETE)");

  // ============================================================
  // INVOICES — ~25 across active jobs + completed historical
  // ============================================================
  console.log("\n=== INVOICES ===");
  type InvDef = {
    job: { id: string };
    client: { id: string };
    number: string;
    phaseLabel: string;
    amount: number;
    status: string;
    sentDay?: number;
    dueDay?: number;
    paidDay?: number;
    paymentMethod?: string;
  };
  const invDefs: InvDef[] = [
    // Hayward — 2 PAID, 1 SENT, 1 DRAFT for the rest
    { job: haywardJob, client: hayward, number: "INV-2026-0001", phaseLabel: "Permits & Plans", amount: 2200, status: "PAID", sentDay: -7, dueDay: 0, paidDay: -3, paymentMethod: "STRIPE" },
    { job: haywardJob, client: hayward, number: "INV-2026-0002", phaseLabel: "Pool Shell", amount: 29700, status: "PAID", sentDay: -2, dueDay: 5, paidDay: 0, paymentMethod: "ACH" },
    { job: haywardJob, client: hayward, number: "INV-2026-0003", phaseLabel: "Tile & Coping", amount: 27500, status: "SENT", sentDay: 0, dueDay: 7 },
    { job: haywardJob, client: hayward, number: "INV-2026-0004", phaseLabel: "Deck & Pumps", amount: 28600, status: "DRAFT" },
    // Chen — most paid, last in flight
    { job: chenJob, client: chen, number: "INV-2026-0010", phaseLabel: "Permits & Plans", amount: 2900, status: "PAID", sentDay: -25, dueDay: -18, paidDay: -22, paymentMethod: "STRIPE" },
    { job: chenJob, client: chen, number: "INV-2026-0011", phaseLabel: "Pool Shell", amount: 39150, status: "PAID", sentDay: -20, dueDay: -13, paidDay: -17, paymentMethod: "ACH" },
    { job: chenJob, client: chen, number: "INV-2026-0012", phaseLabel: "Tile & Coping", amount: 36250, status: "PAID", sentDay: -15, dueDay: -8, paidDay: -12, paymentMethod: "STRIPE" },
    { job: chenJob, client: chen, number: "INV-2026-0013", phaseLabel: "Deck & Pumps", amount: 37700, status: "PAID", sentDay: -10, dueDay: -3, paidDay: -7, paymentMethod: "WIRE" },
    { job: chenJob, client: chen, number: "INV-2026-0014", phaseLabel: "Screen Cage", amount: 15950, status: "SENT", sentDay: -2, dueDay: 5 },
    // Sullivan — historical, all paid
    { job: sullivanJob, client: sullivan, number: "INV-2025-0050", phaseLabel: "Permits & Plans", amount: 1700, status: "PAID", sentDay: -160, dueDay: -153, paidDay: -157, paymentMethod: "STRIPE" },
    { job: sullivanJob, client: sullivan, number: "INV-2025-0051", phaseLabel: "Pool Shell", amount: 22950, status: "PAID", sentDay: -150, dueDay: -143, paidDay: -147, paymentMethod: "ACH" },
    { job: sullivanJob, client: sullivan, number: "INV-2025-0052", phaseLabel: "Tile & Coping", amount: 21250, status: "PAID", sentDay: -135, dueDay: -128, paidDay: -132, paymentMethod: "ACH" },
    { job: sullivanJob, client: sullivan, number: "INV-2025-0053", phaseLabel: "Deck & Pumps", amount: 22100, status: "PAID", sentDay: -120, dueDay: -113, paidDay: -118, paymentMethod: "STRIPE" },
    { job: sullivanJob, client: sullivan, number: "INV-2025-0054", phaseLabel: "Screen Cage", amount: 9350, status: "PAID", sentDay: -105, dueDay: -98, paidDay: -101, paymentMethod: "CHECK" },
    { job: sullivanJob, client: sullivan, number: "INV-2025-0055", phaseLabel: "Pool Finish", amount: 7650, status: "PAID", sentDay: -95, dueDay: -88, paidDay: -90, paymentMethod: "ACH" },
    // Mendez — first 2 paid, 3rd OVERDUE (job blocked)
    { job: mendezJob, client: mendez, number: "INV-2026-0020", phaseLabel: "Permits & Plans", amount: 2400, status: "PAID", sentDay: -38, dueDay: -31, paidDay: -35, paymentMethod: "STRIPE" },
    { job: mendezJob, client: mendez, number: "INV-2026-0021", phaseLabel: "Pool Shell", amount: 32400, status: "PAID", sentDay: -28, dueDay: -21, paidDay: -25, paymentMethod: "ACH" },
    { job: mendezJob, client: mendez, number: "INV-2026-0022", phaseLabel: "Tile & Coping", amount: 30000, status: "OVERDUE", sentDay: -20, dueDay: -13 },
    // Kowalski — just permits paid
    { job: kowalskiJob, client: kowalski, number: "INV-2026-0030", phaseLabel: "Permits & Plans", amount: 1300, status: "PAID", sentDay: -2, dueDay: 5, paidDay: 0, paymentMethod: "STRIPE" },
    // Anderson historical — all paid
    { job: andersonJob, client: anderson, number: "INV-2025-0001", phaseLabel: "Permits & Plans", amount: 2100, status: "PAID", sentDay: -310, dueDay: -303, paidDay: -307, paymentMethod: "STRIPE" },
    { job: andersonJob, client: anderson, number: "INV-2025-0002", phaseLabel: "Pool Shell", amount: 28350, status: "PAID", sentDay: -295, dueDay: -288, paidDay: -290, paymentMethod: "ACH" },
    { job: andersonJob, client: anderson, number: "INV-2025-0003", phaseLabel: "Tile & Coping", amount: 26250, status: "PAID", sentDay: -280, dueDay: -273, paidDay: -275, paymentMethod: "STRIPE" },
    { job: andersonJob, client: anderson, number: "INV-2025-0004", phaseLabel: "Deck & Pumps", amount: 27300, status: "PAID", sentDay: -265, dueDay: -258, paidDay: -260, paymentMethod: "WIRE" },
    { job: andersonJob, client: anderson, number: "INV-2025-0005", phaseLabel: "Screen Cage", amount: 11550, status: "PAID", sentDay: -255, dueDay: -248, paidDay: -250, paymentMethod: "STRIPE" },
    { job: andersonJob, client: anderson, number: "INV-2025-0006", phaseLabel: "Pool Finish", amount: 9450, status: "PAID", sentDay: -250, dueDay: -243, paidDay: -245, paymentMethod: "ACH" },
    // Marshall historical — all paid
    { job: marshallJob, client: marshall, number: "INV-2024-0070", phaseLabel: "Permits & Plans", amount: 1560, status: "PAID", sentDay: -360, dueDay: -353, paidDay: -355, paymentMethod: "STRIPE" },
    { job: marshallJob, client: marshall, number: "INV-2024-0071", phaseLabel: "Pool Shell", amount: 21060, status: "PAID", sentDay: -345, dueDay: -338, paidDay: -340, paymentMethod: "ACH" },
    { job: marshallJob, client: marshall, number: "INV-2024-0072", phaseLabel: "Pool Finish", amount: 7020, status: "PAID", sentDay: -310, dueDay: -303, paidDay: -305, paymentMethod: "STRIPE" },
  ];
  for (const i of invDefs) {
    await prisma.invoice.create({
      data: {
        jobId: i.job.id, clientId: i.client.id,
        number: i.number, phaseLabel: i.phaseLabel, amount: i.amount,
        status: i.status,
        sentAt: i.sentDay !== undefined ? DAYS(i.sentDay) : null,
        dueDate: i.dueDay !== undefined ? DAYS(i.dueDay) : null,
        paidAt: i.paidDay !== undefined ? DAYS(i.paidDay) : null,
        paidAmount: i.paidDay !== undefined ? i.amount : null,
        paymentMethod: i.paymentMethod ?? null,
        payToken: randomUUID(),
      },
    });
  }
  console.log(`Created ${invDefs.length} invoices`);

  // ============================================================
  // JOB COST ENTRIES — varied across all jobs
  // ============================================================
  console.log("\n=== JOB COST ENTRIES ===");
  type CostDef = { jobId: string; category: string; vendor: string; description: string; amount: number; days: number };
  const cost = (jobId: string, category: string, vendor: string, description: string, amount: number, days: number): CostDef => ({ jobId, category, vendor, description, amount, days });

  const costs: CostDef[] = [
    // Hayward
    cost(haywardJob.id, "PERMIT", "Sarasota County", "Building permit", 1500, -10),
    cost(haywardJob.id, "MATERIAL", "Pool360", "Steel rebar package", 1247, -8),
    cost(haywardJob.id, "SUBCONTRACTOR", "Diaz Excavation Services", "Pool excavation", 4800, -7),
    cost(haywardJob.id, "SUBCONTRACTOR", "Atlas Gunite Co.", "Gunite shoot", 11200, -2),
    cost(haywardJob.id, "MATERIAL", "Pool360", "Plumbing rough materials", 1450, -1),
    cost(haywardJob.id, "MATERIAL", "Coastal Tile & Stone", "Waterline tile (deposit)", 850, 0),
    // Chen
    cost(chenJob.id, "PERMIT", "Sarasota County", "Building permit", 1900, -28),
    cost(chenJob.id, "MATERIAL", "Pool360", "Steel rebar + setup", 2100, -25),
    cost(chenJob.id, "SUBCONTRACTOR", "Diaz Excavation", "Pool excavation + spoil haul", 6800, -23),
    cost(chenJob.id, "SUBCONTRACTOR", "Atlas Gunite Co.", "Gunite shoot", 14500, -19),
    cost(chenJob.id, "SUBCONTRACTOR", "BluePool Plumbing", "Plumbing rough", 3500, -17),
    cost(chenJob.id, "MATERIAL", "Coastal Tile", "Premium glass waterline tile", 4200, -14),
    cost(chenJob.id, "SUBCONTRACTOR", "Coastal Tile", "Tile install labor", 4900, -12),
    cost(chenJob.id, "MATERIAL", "Pool360", "Travertine pavers (full deck)", 8900, -8),
    cost(chenJob.id, "SUBCONTRACTOR", "Sunshine Electrical", "Pool electric + bonding", 2200, -5),
    cost(chenJob.id, "SUBCONTRACTOR", "Aluma-Screen Pros", "Screen cage frame", 6800, -2),
    // Sullivan
    cost(sullivanJob.id, "PERMIT", "Charlotte County", "Building permit", 1450, -160),
    cost(sullivanJob.id, "SUBCONTRACTOR", "Diaz Excavation", "Excavation", 4500, -158),
    cost(sullivanJob.id, "SUBCONTRACTOR", "Atlas Gunite Co.", "Gunite", 10500, -150),
    cost(sullivanJob.id, "MATERIAL", "Pool360", "Plumbing materials", 1300, -148),
    cost(sullivanJob.id, "SUBCONTRACTOR", "BluePool Plumbing", "Plumbing rough + set", 3200, -140),
    cost(sullivanJob.id, "MATERIAL", "Coastal Tile", "Tile material", 1200, -135),
    cost(sullivanJob.id, "SUBCONTRACTOR", "Coastal Tile", "Tile labor", 2400, -130),
    cost(sullivanJob.id, "MATERIAL", "Reef Pavers", "Paver material", 5400, -120),
    cost(sullivanJob.id, "SUBCONTRACTOR", "Reef Pavers", "Paver install", 3700, -118),
    cost(sullivanJob.id, "EQUIPMENT", "Pool360", "Equipment package (BASE)", 5800, -110),
    cost(sullivanJob.id, "SUBCONTRACTOR", "Sunshine Electrical", "Electric + bonding", 1900, -105),
    cost(sullivanJob.id, "SUBCONTRACTOR", "Aluma-Screen Pros", "Screen cage", 6500, -100),
    cost(sullivanJob.id, "MATERIAL", "Pool360", "Pebble Sheen finish", 4400, -95),
    cost(sullivanJob.id, "OTHER", "Various", "Misc materials + finish", 850, -92),
    // Mendez
    cost(mendezJob.id, "PERMIT", "Cape Coral", "Permit + impact fees", 2200, -38),
    cost(mendezJob.id, "MATERIAL", "Pool360", "Steel + materials", 2400, -35),
    cost(mendezJob.id, "SUBCONTRACTOR", "Diaz Excavation", "Excavation (lagoon shape)", 6200, -33),
    cost(mendezJob.id, "SUBCONTRACTOR", "Atlas Gunite Co.", "Gunite shoot (freeform)", 13800, -28),
    cost(mendezJob.id, "MATERIAL", "Pool360", "Waterfall feature stone (held)", 3200, -22),
    cost(mendezJob.id, "OTHER", "Survey Update", "Re-survey for setback dispute", 850, -10),
    // Kowalski
    cost(kowalskiJob.id, "PERMIT", "Sarasota County", "Building permit", 1300, -2),
    cost(kowalskiJob.id, "MATERIAL", "Pool360", "Initial steel order", 1100, 0),
    // Anderson historical
    cost(andersonJob.id, "PERMIT", "Sarasota County", "Building permit", 1850, -310),
    cost(andersonJob.id, "SUBCONTRACTOR", "Diaz Excavation", "Excavation", 5200, -305),
    cost(andersonJob.id, "SUBCONTRACTOR", "Atlas Gunite Co.", "Gunite shoot", 12100, -295),
    cost(andersonJob.id, "MATERIAL", "Coastal Tile", "Premium tile", 3400, -280),
    cost(andersonJob.id, "SUBCONTRACTOR", "BluePool Plumbing", "Plumbing", 3300, -275),
    cost(andersonJob.id, "MATERIAL", "Pool360", "Travertine pavers", 7800, -265),
    cost(andersonJob.id, "EQUIPMENT", "Pool360", "Equipment + heat pump", 9200, -260),
    cost(andersonJob.id, "SUBCONTRACTOR", "Vega Heat & Cool", "Heat pump install", 1800, -255),
    cost(andersonJob.id, "SUBCONTRACTOR", "Sunshine Electrical", "Electric + bonding", 2100, -250),
    // Marshall historical
    cost(marshallJob.id, "PERMIT", "Manatee County", "Permit", 1400, -360),
    cost(marshallJob.id, "SUBCONTRACTOR", "Diaz Excavation", "Excavation", 4200, -355),
    cost(marshallJob.id, "SUBCONTRACTOR", "Atlas Gunite Co.", "Gunite", 9800, -345),
    cost(marshallJob.id, "MATERIAL", "Pool360", "Materials package", 2400, -335),
    cost(marshallJob.id, "SUBCONTRACTOR", "Reef Pavers", "Paver install", 3500, -320),
    cost(marshallJob.id, "EQUIPMENT", "Pool360", "Equipment (BASE)", 5600, -315),
    cost(marshallJob.id, "SUBCONTRACTOR", "Sunshine Electrical", "Electric", 1750, -310),
    cost(marshallJob.id, "OTHER", "Misc", "Finish + cleanup", 1200, -305),
  ];
  for (const c of costs) {
    await prisma.jobCostEntry.create({
      data: { jobId: c.jobId, category: c.category, vendor: c.vendor, description: c.description, amount: c.amount, date: DAYS(c.days) },
    });
  }
  console.log(`Created ${costs.length} job cost entries`);

  // ============================================================
  // REVIEWS — 6 (1 REQUESTED, 4 COMPLETED, 1 DECLINED)
  // ============================================================
  console.log("\n=== REVIEWS ===");
  await prisma.review.create({
    data: {
      jobId: chenJob.id, clientId: chen.id,
      status: "REQUESTED", requestSentAt: DAYS(-2),
      platform: "Google", requestToken: randomUUID(),
    },
  });
  await prisma.review.create({
    data: {
      jobId: haywardJob.id, clientId: hayward.id,
      status: "REQUESTED", requestSentAt: DAYS(-1),
      platform: "Google", requestToken: randomUUID(),
    },
  });
  await prisma.review.create({
    data: {
      jobId: sullivanJob.id, clientId: sullivan.id,
      status: "COMPLETED", requestSentAt: DAYS(-85), completedAt: DAYS(-82),
      rating: 5, platform: "Google",
      text: "Mike and the Persistent Pools team were absolutely fantastic. The build came in on time and they communicated every step. Our family has been enjoying the pool every weekend since.",
      publicReviewUrl: "https://google.com/sample-review-1",
    },
  });
  await prisma.review.create({
    data: {
      jobId: andersonJob.id, clientId: anderson.id,
      status: "COMPLETED", requestSentAt: DAYS(-245), completedAt: DAYS(-242),
      rating: 5, platform: "Yelp",
      text: "Beautiful work. The design process and clear project updates made this a different kind of pool-builder experience.",
      publicReviewUrl: "https://yelp.com/sample-review-2",
    },
  });
  await prisma.review.create({
    data: {
      jobId: andersonJob.id, clientId: anderson.id,
      status: "COMPLETED", requestSentAt: DAYS(-240), completedAt: DAYS(-238),
      rating: 5, platform: "Google",
      text: "Tom posted on Google too — same content, second platform.",
      publicReviewUrl: "https://google.com/sample-review-3",
    },
  });
  await prisma.review.create({
    data: {
      jobId: marshallJob.id, clientId: marshall.id,
      status: "DECLINED", requestSentAt: DAYS(-295),
    },
  });
  console.log("Created 6 reviews (2 REQUESTED, 3 COMPLETED, 1 DECLINED)");

  // ============================================================
  // REFERRALS — 6 covering all kanban statuses
  // ============================================================
  console.log("\n=== REFERRALS ===");
  await prisma.referral.create({
    data: {
      referrerClientId: hayward.id,
      referredName: "Karen Hayward (Robert's sister)",
      referredPhone: "(941) 555-0512",
      status: "QUALIFIED",
      notes: "Robert sent her our way. Wants spa-only renovation.",
    },
  });
  await prisma.referral.create({
    data: {
      referrerClientId: chen.id,
      referredName: "David Park",
      referredEmail: "dpark@example.com",
      status: "CONTACTED",
      notes: "Marcus Chen's neighbor — saw the build progress.",
    },
  });
  await prisma.referral.create({
    data: {
      referrerClientId: sullivan.id,
      referredName: "Tim Kowalski",
      referredPhone: "(941) 555-0203",
      status: "BUILT",
      rewardAmount: 500, rewardPaidAt: DAYS(-2),
      notes: "Built! Brad's referral closed. Reward paid via check.",
    },
  });
  await prisma.referral.create({
    data: {
      referrerClientId: anderson.id,
      referredName: "Marcus Chen",
      referredEmail: "chen.family@example.com",
      status: "BUILT",
      rewardAmount: 500, rewardPaidAt: DAYS(-25),
      notes: "Anderson referral that built Chen's pool. Reward paid.",
    },
  });
  await prisma.referral.create({
    data: {
      referrerClientId: marshall.id,
      referredName: "Veronica Liu",
      referredPhone: "(941) 555-0612",
      status: "PENDING",
      notes: "Marshall mentioned us at a neighborhood event. Hasn't been contacted yet.",
    },
  });
  await prisma.referral.create({
    data: {
      referrerClientId: hayward.id,
      referredName: "Will Mansfield",
      referredEmail: "wmansfield@example.com",
      status: "EXPIRED",
      notes: "Lead went cold after 60 days. Closing.",
    },
  });
  console.log("Created 6 referrals (1 PENDING, 1 CONTACTED, 1 QUALIFIED, 2 BUILT, 1 EXPIRED)");

  // ============================================================
  // MAINTENANCE PLANS — 6 with mix of due dates
  // ============================================================
  console.log("\n=== MAINTENANCE PLANS ===");
  await prisma.maintenancePlan.create({
    data: { clientId: hayward.id, jobId: haywardJob.id,
      type: "Spring Open", cadence: "Annual", nextDue: DAYS(180), amount: 350, status: "ACTIVE",
    },
  });
  await prisma.maintenancePlan.create({
    data: { clientId: chen.id, jobId: chenJob.id,
      type: "Equipment Service", cadence: "Semi-Annual", nextDue: DAYS(45), amount: 285, status: "ACTIVE",
    },
  });
  await prisma.maintenancePlan.create({
    data: { clientId: sullivan.id, jobId: sullivanJob.id,
      type: "Annual Service Visit", cadence: "Annual", nextDue: DAYS(15), amount: 295, status: "ACTIVE",
      notes: "Due soon — schedule call with Brad next week.",
    },
  });
  await prisma.maintenancePlan.create({
    data: { clientId: anderson.id, jobId: andersonJob.id,
      type: "Spring Open", cadence: "Annual", nextDue: DAYS(120), amount: 350, status: "ACTIVE",
    },
  });
  await prisma.maintenancePlan.create({
    data: { clientId: marshall.id, jobId: marshallJob.id,
      type: "Winter Close", cadence: "Annual", nextDue: DAYS(220), amount: 250, status: "ACTIVE",
    },
  });
  await prisma.maintenancePlan.create({
    data: { clientId: mendez.id, jobId: mendezJob.id,
      type: "Custom Lighting Service", cadence: "Quarterly", nextDue: DAYS(80), amount: 180, status: "PAUSED",
      notes: "Paused while build is on hold.",
    },
  });
  console.log("Created 6 maintenance plans");

  // ============================================================
  // WEEKLY METRICS — 8 weeks of trend data
  // ============================================================
  console.log("\n=== WEEKLY METRICS ===");
  for (let i = 0; i < 8; i++) {
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
    weekStart.setHours(0,0,0,0);
    await prisma.weeklyMetric.create({
      data: {
        weekStartDate: weekStart,
        newLeads: Math.round(8 + Math.random() * 6),
        formsCompleted: Math.round(4 + Math.random() * 4),
        qualifyingCalls: Math.round(3 + Math.random() * 3),
        designsStarted: Math.round(1 + Math.random() * 2),
        appointmentsSet: Math.round(2 + Math.random() * 2),
        proposalsSent: Math.round(1 + Math.random() * 2),
        dealsClosed: i === 0 ? 1 : Math.random() > 0.6 ? 1 : 0,
      },
    });
  }
  console.log("Created 8 weeks of metrics");

  // ============================================================
  // SUMMARY
  // ============================================================
  console.log("\n✅ Demo seed complete.");
  console.log(`   Clients:           ${clients.length}`);
  console.log(`   Design Projects:   ${designProjects.length}`);
  console.log(`   Builds:            8`);
  console.log(`   Proposals:         8`);
  console.log(`   Contracts:         5 (signed) + 2 historical`);
  console.log(`   Subcontractors:    ${subs.length}`);
  console.log(`   Jobs:              7 (3 ACTIVE, 1 ON_HOLD, 3 COMPLETE)`);
  console.log(`   Invoices:          ${invDefs.length}`);
  console.log(`   Cost entries:      ${costs.length}`);
  console.log(`   Reviews:           6`);
  console.log(`   Referrals:         6`);
  console.log(`   Maintenance:       6`);
  console.log(`   Weekly metrics:    8`);
  console.log(`\n   Hayward portal:    /j/${haywardJob.portalToken}`);
  console.log(`   Chen portal:       /j/${chenJob.portalToken}`);
  console.log(`   Sullivan portal:   /j/${sullivanJob.portalToken}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
