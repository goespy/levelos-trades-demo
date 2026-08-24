"use client";

import {
  normalizeContractData,
  type ContractEnvelope,
  type ContractFields,
} from "@/lib/contract-document";

type SignatureEvidence = {
  signerName?: string;
  signerEmail?: string;
  signerIp?: string;
  signedTimestamp?: string;
  consentTimestamp?: string;
  consent?: boolean;
  auditTrail?: unknown[];
  documentHash?: string;
};

type ContractDocumentProps = {
  data: unknown;
  editable?: boolean;
  onChange?: (fields: ContractFields) => void;
  signature?: SignatureEvidence | null;
};

const sections = [
  {
    title: "Project and site",
    keys: [
      "billingAddress",
      "legalDescr",
      "subdivision",
      "fax",
      "others",
    ],
  },
  {
    title: "Earthwork and site responsibility",
    keys: [
      "earthRemovalYes",
      "earthRemovalNo",
      "additionalFillContractor",
      "additionalFillBuyer",
      "shuttleDigYes",
      "shuttleDigNo",
      "spotSurveyYes",
      "spotSurveyNo",
      "safetyCode",
    ],
  },
  {
    title: "Pool structure",
    keys: [
      "poolShape",
      "poolSize",
      "dimensionsLength",
      "dimensionsWidth",
      "sqFt",
      "minDepth",
      "maxDepth",
    ],
  },
  {
    title: "Interior, coping, and tile",
    keys: [
      "interiorQuartz",
      "interiorPebble",
      "interiorColor",
      "interiorOther",
      "copingBNBR",
      "copingPrecast",
      "copingTrav",
      "copingCantil",
      "tileAllowance",
    ],
  },
  {
    title: "Plumbing and filtration",
    keys: [
      "vacLineYes",
      "vacLineNo",
      "skimmerCount",
      "filterSize",
      "filterCartridge",
      "filterDE",
      "pumpHP",
      "addlPumpHP",
    ],
  },
  {
    title: "Lighting and cleaning",
    keys: [
      "ledLightYes",
      "ledLightNo",
      "ledLightCount",
      "light100w",
      "light300w",
      "cleaningEquipment",
      "testKit",
      "maintenanceFree",
    ],
  },
  {
    title: "Water treatment",
    keys: [
      "chlorinatorYes",
      "chlorinatorNo",
      "saltSystemYes",
      "saltSystemNo",
      "infloorCleanYes",
      "infloorCleanNo",
    ],
  },
  {
    title: "Pool features",
    keys: [
      "benchDeepEnd",
      "benchShallow",
      "sunShelf",
      "handRailYes",
      "handRailNo",
      "ladderYes",
      "ladderNo",
    ],
  },
  {
    title: "Automation and autofill",
    keys: [
      "automation",
      "timeClock",
      "controlsJandy",
      "controlsAqualogic",
      "autoFillMech",
      "autoFillElectronic",
    ],
  },
  {
    title: "Engineering and pilings",
    keys: [
      "pilingsConcrete",
      "pilingsHelicalYes",
      "pilingsHelicalNo",
      "pilingsDrivenBy",
      "pilingsCappedBy",
      "engineering",
    ],
  },
  {
    title: "Heating",
    keys: [
      "heaterHeatPump",
      "heaterHeatPumpSize",
      "heaterGas",
      "heaterGasSize",
      "heaterTankHookup",
      "heaterSolar",
    ],
  },
  {
    title: "Spa",
    keys: [
      "spaDim",
      "spaElev",
      "spaLight",
      "jets",
      "airBlowerHP",
      "spaCoping",
    ],
  },
  {
    title: "Decking and wiring",
    keys: [
      "deckMaterial",
      "deckType",
      "deckColor",
      "deckPattern",
      "deckLanai",
      "deckSkimcoat",
      "poolWiringYes",
      "poolWiringNo",
    ],
  },
  {
    title: "Screen enclosure",
    keys: [
      "screenType",
      "screenColor",
      "screenDoors",
      "screenGutters",
      "screenPanroof",
      "screenRailing",
      "screenFence",
    ],
  },
  {
    title: "Restoration and allowances",
    keys: [
      "sprinklersContractor",
      "sprinklersBuyer",
      "sodContractor",
      "sodBuyer",
      "spotSurveyBuyer",
      "alarms",
    ],
  },
  {
    title: "Safety and included services",
    keys: [
      "meshBarrierContractor",
      "meshBarrierBuyer",
      "item38",
      "item39",
      "item40",
      "proposedBy",
    ],
  },
] as const;

const fieldLabels: Record<string, string> = {
  addlPumpHP: "Additional pump",
  additionalFillBuyer: "Additional fill — customer",
  additionalFillContractor: "Additional fill — contractor",
  airBlowerHP: "Spa air blower",
  autoFillElectronic: "Electronic autofill",
  autoFillMech: "Mechanical autofill",
  controlsAqualogic: "Selected automation controls",
  controlsJandy: "Alternate controls",
  copingBNBR: "Bullnose brick coping",
  copingCantil: "Cantilever coping",
  copingPrecast: "Precast coping",
  copingTrav: "Travertine coping",
  earthRemovalNo: "Earth/tree removal — no",
  earthRemovalYes: "Earth/tree removal — yes",
  filterDE: "D.E. filter",
  handRailNo: "Handrail — no",
  handRailYes: "Handrail — yes",
  heaterHeatPump: "Heat pump included",
  heaterHeatPumpSize: "Heat-pump size",
  infloorCleanNo: "In-floor cleaning — no",
  infloorCleanYes: "In-floor cleaning — yes",
  interiorPebble: "Pebble finish selected",
  jobPhone: "Project phone",
  ladderNo: "Ladder — no",
  ladderYes: "Ladder — yes",
  ledLightNo: "LED lighting — no",
  ledLightYes: "LED lighting — yes",
  light100w: "100W light",
  light300w: "300W light",
  meshBarrierBuyer: "Mesh barrier — customer",
  meshBarrierContractor: "Mesh barrier — contractor",
  pilingsHelicalNo: "Helical pilings — no",
  pilingsHelicalYes: "Helical pilings — yes",
  poolWiringNo: "Pool wiring — no",
  poolWiringYes: "Pool wiring — yes",
  saltSystemNo: "Salt system — no",
  saltSystemYes: "Salt system — yes",
  shuttleDigNo: "Shuttle excavation — no",
  shuttleDigYes: "Shuttle excavation — yes",
  sodBuyer: "Sod restoration — customer",
  sodContractor: "Sod restoration — contractor",
  spotSurveyBuyer: "Spot survey — customer",
  spotSurveyNo: "Spot survey — no",
  spotSurveyYes: "Spot survey — yes",
  sprinklersBuyer: "Irrigation repair — customer",
  sprinklersContractor: "Irrigation repair — contractor",
  vacLineNo: "Vacuum line — no",
  vacLineYes: "Vacuum line — yes",
};

function money(value: unknown): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function fieldLabel(key: string): string {
  return (
    fieldLabels[key] ??
    key.replace(/([A-Z])/g, " $1").replace(/^./, (character) =>
      character.toUpperCase(),
    )
  );
}

function displayValue(value: ContractFields[string]): string {
  if (value === null || value === undefined || value === "") {
    return "Not applicable";
  }
  return String(value);
}

export function ContractDocument({
  data,
  editable = false,
  onChange,
  signature,
}: ContractDocumentProps) {
  const document: ContractEnvelope = normalizeContractData(
    typeof data === "string" ? JSON.parse(data) : data,
  );
  const fields = document.fields;
  const set = (key: string, value: string | boolean) =>
    onChange?.({ ...fields, [key]: value });

  const renderField = (key: string) => {
    const value = fields[key];
    const label = fieldLabel(key);

    if (typeof value === "boolean") {
      return (
        <div key={key} className="flex items-center justify-between gap-3 py-1.5">
          <span className="text-sm text-slate-700">{label}</span>
          {editable ? (
            <input
              aria-label={label}
              type="checkbox"
              checked={value}
              onChange={(event) => set(key, event.target.checked)}
              className="size-4 accent-cyan-800"
            />
          ) : (
            <span
              aria-label={`${label}: ${value ? "selected" : "not selected"}`}
              className={`inline-flex size-5 items-center justify-center rounded border text-xs font-bold ${
                value
                  ? "border-cyan-800 bg-cyan-800 text-white"
                  : "border-slate-300 bg-white text-transparent"
              }`}
            >
              ✓
            </span>
          )}
        </div>
      );
    }

    return (
      <label
        key={key}
        className="grid gap-1 border-b border-slate-100 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500"
      >
        {label}
        {editable ? (
          <input
            value={String(value ?? "")}
            onChange={(event) => set(key, event.target.value)}
            className="w-full rounded border border-slate-300 bg-white px-2 py-1.5 text-sm font-normal normal-case tracking-normal text-slate-900"
          />
        ) : (
          <span className="text-sm font-medium normal-case tracking-normal text-slate-900">
            {displayValue(value)}
          </span>
        )}
      </label>
    );
  };

  return (
    <article className="contract-document mx-auto max-w-4xl bg-white p-6 text-slate-900 shadow-sm print:max-w-none print:p-0">
      <header className="border-b-4 border-cyan-800 pb-5">
        <p className="text-xs font-semibold uppercase tracking-[.2em] text-cyan-800">
          Persistent Pools, LLC · Contractor
        </p>
        <h1 className="mt-1 text-3xl font-bold">Construction Contract</h1>
        <p className="mt-2 text-xs text-slate-600">
          Fictional portfolio demonstration. Compliance-ready presentation
          only; not a binding agreement or legal advice.
        </p>
      </header>

      <section className="grid gap-3 py-5 sm:grid-cols-2">
        {[
          "contractDate",
          "purchasedBy",
          "installationAddress",
          "jobPhone",
          "poolSize",
          "contractPrice",
        ].map((key) => (
          <label
            key={key}
            className="text-xs font-semibold uppercase tracking-wide text-slate-500"
          >
            {fieldLabel(key)}
            {editable ? (
              <input
                value={String(fields[key] ?? "")}
                onChange={(event) => set(key, event.target.value)}
                className="mt-1 w-full border-b border-slate-300 p-1 text-base font-normal normal-case text-slate-900"
              />
            ) : (
              <span className="mt-1 block text-base font-normal normal-case text-slate-900">
                {key === "contractPrice"
                  ? money(fields[key])
                  : displayValue(fields[key])}
              </span>
            )}
          </label>
        ))}
      </section>

      <section className="grid gap-4 border-y py-5 sm:grid-cols-2">
        {sections.map(({ keys, title }) => (
          <div
            key={title}
            className="break-inside-avoid rounded-lg border border-slate-200 p-4"
          >
            <h2 className="border-b border-slate-200 pb-2 font-semibold text-slate-950">
              {title}
            </h2>
            <div className="mt-1">{keys.map(renderField)}</div>
          </div>
        ))}
      </section>

      <section className="break-inside-avoid py-5">
        <h2 className="text-lg font-semibold">Six milestone payments</h2>
        <div className="mt-2 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left">
                <th className="p-2">Milestone</th>
                <th className="p-2 text-right">Percent</th>
                <th className="p-2 text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4, 5, 6].map((number) => (
                <tr key={number} className="border-b">
                  <td className="p-2">
                    {String(fields[`payment${number}Name`] ?? "")}
                  </td>
                  <td className="p-2 text-right">
                    {String(fields[`payment${number}Percentage`] ?? 0)}%
                  </td>
                  <td className="p-2 text-right">
                    {money(fields[`payment${number}Amount`])}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-semibold">
                <td className="p-2" colSpan={2}>
                  Contract total
                </td>
                <td className="p-2 text-right">
                  {money(fields.contractPrice)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </section>

      <section className="break-inside-avoid py-5">
        <h2 className="text-lg font-semibold">Terms and conditions</h2>
        {document.terms.map((term) => (
          <div key={term.title} className="mt-3">
            <h3 className="font-medium">{term.title}</h3>
            <p className="text-sm leading-6 text-slate-700">{term.body}</p>
          </div>
        ))}
      </section>

      <section className="break-inside-avoid py-5">
        <h2 className="text-lg font-semibold">Acknowledgements</h2>
        {document.acknowledgements.map((acknowledgement) => (
          <div
            key={acknowledgement.number}
            className="mt-2 grid gap-2 border-b py-2 text-xs sm:grid-cols-[1fr_auto_auto]"
          >
            <span>
              <b>
                {acknowledgement.number}. {acknowledgement.title}
              </b>{" "}
              — {acknowledgement.text}
            </span>
            <span>
              Contractor: {acknowledgement.contractorInitials || "—"}
            </span>
            <span>
              Customer: {acknowledgement.customerInitials || "—"}
            </span>
          </div>
        ))}
      </section>

      <footer className="grid gap-5 border-t pt-5 sm:grid-cols-2">
        <div>
          <p className="text-xs text-slate-500">Contractor signature</p>
          <p className="mt-5 border-b pb-1">
            {String(
              fields.contractorSignature ??
                "Persistent Pools, LLC — Authorized Representative",
            )}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Date: {displayValue(fields.contractorDate)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500">Customer signature</p>
          <p className="mt-5 border-b pb-1">
            {signature?.signerName ??
              displayValue(fields.buyerSignature1)}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Date: {displayValue(fields.buyerDate1)}
          </p>
        </div>
        {signature && (
          <div className="col-span-full rounded border border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
            <p className="font-semibold text-slate-800">
              Electronic-signature evidence
            </p>
            <p className="mt-1">
              Signed {signature.signedTimestamp} · {signature.signerEmail} · IP{" "}
              {signature.signerIp}
            </p>
            <p className="mt-1">
              Consent {signature.consent ? "captured" : "not captured"} ·{" "}
              {signature.auditTrail?.length ?? 0} audit events
            </p>
            <p className="mt-1 break-all">
              Document hash: {signature.documentHash}
            </p>
          </div>
        )}
      </footer>
    </article>
  );
}
