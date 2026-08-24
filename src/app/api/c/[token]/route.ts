import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCredentials, addCommentToCard } from "@/lib/trello";
import { normalizeContractData, publicContractProjection } from "@/lib/contract-document";
import { documentHash } from "@/lib/contract-hash.server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const contract = await prisma.contract.findUnique({
    where: { shareToken: token },
    include: { proposal: true },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const client = await prisma.client.findUnique({
    where: { id: contract.proposal.clientId },
    select: { name: true, address: true, city: true, zip: true },
  });

  return NextResponse.json({
    ...publicContractProjection(contract),
    proposalTotal: contract.proposal.total,
    clientName: client?.name || null,
    clientAddress: client
      ? [client.address, client.city, client.zip].filter(Boolean).join(", ")
      : null,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const body = await request.json();

  const contract = await prisma.contract.findUnique({
    where: { shareToken: token },
    include: { proposal: true },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  if (contract.status !== "SENT") {
    return NextResponse.json(
      { error: contract.status === "SIGNED" ? "Contract already signed" : "Contract not available for signing" },
      { status: 400 }
    );
  }

  const { signerName, signerEmail, typedSignature, initialsData, consent } = body;

  const completeInitials = initialsData && Array.from({ length: 16 }, (_, index) => initialsData[`initials${index + 1}b`]).every((value) => typeof value === "string" && value.trim().length > 0);
  if (!signerName || !signerEmail || !typedSignature || !completeInitials || consent !== true) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Capture metadata
  const signerIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";
  const signerUserAgent = request.headers.get("user-agent") || "unknown";
  const signedTimestamp = new Date().toISOString();

  // Merge client initials into contract data
  const existingData = normalizeContractData(contract.contractData ? JSON.parse(contract.contractData) : {});
  const mergedData = { ...existingData, fields: { ...existingData.fields, ...initialsData }, acknowledgements: existingData.acknowledgements.map((a) => ({ ...a, customerInitials: initialsData[`initials${a.number}b`] || a.customerInitials })) };

  // Compute document hash for tamper evidence
  const hash = documentHash(mergedData);

  // Build signature data blob
  const signatureDataObj = {
    signerName,
    signerEmail,
    signerIp,
    signerUserAgent,
    typedSignature,
    consent: true,
    documentHash: hash,
    consentTimestamp: signedTimestamp,
    signedTimestamp,
    auditTrail: [
      { event: "consent-captured", actor: "customer", at: signedTimestamp },
      { event: "typed-signature-applied", actor: "customer", at: signedTimestamp },
    ],
  };

  // Update contract
  await prisma.contract.update({
    where: { id: contract.id },
    data: {
      status: "SIGNED",
      signedDate: new Date(),
      signedByClient: signerName,
      contractData: JSON.stringify(mergedData),
      signatureData: JSON.stringify(signatureDataObj),
    },
  });

  // Trello notification
  const client = await prisma.client.findUnique({
    where: { id: contract.proposal.clientId },
    select: { name: true, trelloCardId: true },
  });

  const total = contract.proposal.total;
  const fmtTotal = "$" + total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const creds = getCredentials();
  if (creds && client?.trelloCardId) {
    try {
      await addCommentToCard(
        creds,
        client.trelloCardId,
        `📝 CONTRACT SIGNED\n\n${client.name} signed their ${fmtTotal} contract.\n\nSigned by: ${signerName}\nEmail: ${signerEmail}\nIP: ${signerIp}\nHash: ${hash}`
      );
    } catch {
      // Don't fail if Trello notification fails
    }
  }

  return NextResponse.json({ success: true, status: "SIGNED" });
}
