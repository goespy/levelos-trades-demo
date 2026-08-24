import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { generateContractDefaults, mergeKnownContractFields, normalizeContractData, publicContractProjection } from "./contract-document";
import { documentHash } from "./contract-hash.server";
describe("contract document", () => {
  it("generates six named payments and stable hashes", () => {
    const doc = generateContractDefaults({ proposal: { total: 100000, discount: 10000 } });
    assert.deepEqual(doc.fields.payment1Name, "Permits & Plans");
    assert.equal(documentHash(doc), documentHash(doc));
    assert.equal(doc.fields.contractPrice, 90000);
    assert.equal([1,2,3,4,5,6].reduce((sum, n) => sum + Number(doc.fields[`payment${n}Amount`]), 0), 90000);
  });
  it("does not project signature audit evidence", () => {
    const result = publicContractProjection({ id: "x", status: "SIGNED", contractData: "{}", signedByClient: "A", signedDate: null, signatureData: JSON.stringify({ signerEmail: "private@example.com", signerIp: "192.0.2.1", signerUserAgent: "secret", auditTrail: ["private"], documentHash: "sha256-x" }) });
    assert.equal("signatureData" in result, false);
    assert.equal(JSON.stringify(result).includes("private@example.com"), false);
    assert.equal(JSON.stringify(result).includes("192.0.2.1"), false);
  });
  it("redacts arbitrary internal financial keys from public data and creation merges", () => {
    const result = publicContractProjection({ id: "x", status: "SENT", contractData: JSON.stringify({ fields: { purchasedBy: "Customer", totalCOGS: 1, grossProfit: 2, marginPct: 3, unitCost: 4, internalNote: "no", secrets: "no" } }), signedByClient: null, signedDate: null });
    const publicText = JSON.stringify(result);
    for (const key of ["totalCOGS", "grossProfit", "marginPct", "unitCost", "internalNote", "secrets"]) assert.equal(publicText.includes(key), false);
    const merged = mergeKnownContractFields(generateContractDefaults({}).fields, { purchasedBy: "Customer", internalNote: "no", totalCOGS: 1 });
    assert.equal(merged.purchasedBy, "Customer");
    assert.equal("internalNote" in merged, false);
  });
  it("keeps an absent optional cage milestone at zero without inflating the total", () => {
    const doc = generateContractDefaults({ proposal: { total: 100000, milestones: JSON.stringify([{ name: "Permits & Plans", percentage: 2, amount: 2000 }, { name: "Pool Shell", percentage: 30, amount: 30000 }, { name: "Tile & Coping", percentage: 28, amount: 28000 }, { name: "Deck & Pumps", percentage: 25, amount: 25000 }, { name: "Pool Finish", percentage: 15, amount: 15000 }]) } });
    assert.equal(doc.fields.payment5Amount, 0);
    assert.equal(doc.fields.payment5Percentage, 0);
    assert.equal([1,2,3,4,5,6].reduce((sum, n) => sum + Number(doc.fields[`payment${n}Amount`]), 0), 100000);
  });
  it("maps build toggles and uses neutral contractor field names", () => {
    const doc = generateContractDefaults({ date: "2026-01-02", build: { hasSpa: true, hasHeat: true, hasAutomation: true, isSalt: true, hasCage: true, hasSod: true, hasTreeRemoval: true, hasInteriorUpgrade: true, poolLength: 30, poolWidth: 15, deckMaterial: "TRAVERTINE" } });
    assert.equal(doc.fields.contractDate, "2026-01-02");
    assert.equal(doc.fields.saltSystemYes, true);
    assert.equal(doc.fields.sodContractor, true);
    assert.equal(doc.fields.additionalFillContractor, false);
    assert.equal("additionalFillPB" in doc.fields, false);
    assert.equal("sprinklersContractor" in doc.fields, true);
    assert.equal("meshBarrierContractor" in doc.fields, true);
  });
  it("round-trips persisted acknowledgements without reconstructing them", () => {
    const envelope = generateContractDefaults({});
    envelope.acknowledgements = envelope.acknowledgements.map((item) => ({ ...item, customerInitials: "RH" }));
    const restored = normalizeContractData(JSON.parse(JSON.stringify(envelope)));
    assert.equal(restored.acknowledgements.every((item) => item.customerInitials === "RH"), true);
  });
});
