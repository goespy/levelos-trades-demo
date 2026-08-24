import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const trade = searchParams.get("trade") || "";
  const active = searchParams.get("active");

  const where: Record<string, unknown> = {};
  if (trade) where.trade = trade;
  if (active === "true") where.active = true;
  if (active === "false") where.active = false;

  const subs = await prisma.subcontractor.findMany({
    where,
    orderBy: [{ active: "desc" }, { trade: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(subs);
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  if (!body.name || !body.trade) {
    return NextResponse.json({ error: "name and trade are required" }, { status: 400 });
  }

  const sub = await prisma.subcontractor.create({
    data: {
      name: body.name,
      trade: body.trade,
      contact: body.contact || null,
      email: body.email || null,
      phone: body.phone || null,
      licenseNumber: body.licenseNumber || null,
      insuranceExpires: body.insuranceExpires ? new Date(body.insuranceExpires) : null,
      hourlyRate: body.hourlyRate != null ? Number(body.hourlyRate) : null,
      rating: body.rating != null ? Number(body.rating) : null,
      notes: body.notes || null,
      active: body.active !== false,
    },
  });

  return NextResponse.json(sub, { status: 201 });
}
