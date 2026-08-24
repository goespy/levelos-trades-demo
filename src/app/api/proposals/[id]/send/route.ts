import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { Resend } from "resend";
import { randomUUID } from "crypto";
import { isPublicDemo, PUBLIC_DEMO_MESSAGE } from "@/lib/public-demo";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (isPublicDemo()) {
    return NextResponse.json({ error: PUBLIC_DEMO_MESSAGE }, { status: 403 });
  }

  const { id } = await params;

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json(
      { error: "Email not configured. Add RESEND_API_KEY to .env" },
      { status: 500 }
    );
  }

  const proposal = await prisma.proposal.findUnique({ where: { id } });
  if (!proposal) {
    return NextResponse.json({ error: "Proposal not found" }, { status: 404 });
  }

  const client = await prisma.client.findUnique({
    where: { id: proposal.clientId },
    select: { name: true, email: true },
  });

  if (!client?.email) {
    return NextResponse.json(
      { error: "Client has no email address on file" },
      { status: 400 }
    );
  }

  // Ensure share token exists
  const shareToken = proposal.shareToken || randomUUID();
  if (!proposal.shareToken) {
    await prisma.proposal.update({
      where: { id },
      data: {
        shareToken,
        sharedAt: new Date(),
        status: proposal.status === "DRAFT" ? "SENT" : proposal.status,
      },
    });
  }

  // Build the proposal URL
  const origin = request.headers.get("origin") || request.headers.get("referer")?.replace(/\/[^/]*$/, "") || "http://localhost:3000";
  const proposalUrl = `${origin}/p/${shareToken}`;

  const firstName = client.name.split(" ")[0];
  const total = proposal.total - proposal.discount;
  const formattedTotal = "$" + total.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Persistent Pools Portfolio Demo <demo@example.com>",
      to: client.email,
      subject: `Your Pool & Spa Proposal — ${formattedTotal}`,
      html: buildEmailHtml({ firstName, proposalUrl, formattedTotal }),
    });

    // Update status to SENT if still draft
    if (proposal.status === "DRAFT") {
      await prisma.proposal.update({
        where: { id },
        data: { status: "SENT" },
      });
    }

    return NextResponse.json({ success: true, sentTo: client.email });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function buildEmailHtml({ firstName, proposalUrl, formattedTotal }: {
  firstName: string;
  proposalUrl: string;
  formattedTotal: string;
}) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Pool Proposal</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f5;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:4px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">

          <!-- Header -->
          <tr>
            <td style="background-color:#0A2647;padding:40px 40px 30px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:22px;font-weight:700;letter-spacing:2px;">PERSISTENT POOLS</h1>
              <p style="margin:4px 0 0;color:#B4975A;font-size:10px;letter-spacing:4px;font-weight:600;">POOLS & SPAS</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px;">
              <p style="margin:0 0 20px;color:#1a1a1a;font-size:16px;line-height:1.6;">
                Hi ${firstName},
              </p>
              <p style="margin:0 0 20px;color:#4a4a4a;font-size:15px;line-height:1.7;">
                Thank you for your interest in Persistent Pools. We've put together a custom proposal for your new pool and outdoor living space.
              </p>
              <p style="margin:0 0 30px;color:#4a4a4a;font-size:15px;line-height:1.7;">
                Your proposal includes a full project breakdown, design renders, features, and a detailed payment schedule — all in one place.
              </p>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding:10px 0 30px;">
                    <a href="${proposalUrl}" target="_blank" style="display:inline-block;background-color:#B4975A;color:#ffffff;text-decoration:none;padding:16px 40px;font-size:14px;font-weight:600;letter-spacing:2px;text-transform:uppercase;border-radius:2px;">
                      View Your Proposal
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Total callout -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;border-bottom:1px solid #e5e7eb;">
                <tr>
                  <td style="padding:20px 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="color:#4a4a4a;font-size:14px;text-transform:uppercase;letter-spacing:1px;">Project Investment</td>
                        <td align="right" style="color:#0A2647;font-size:22px;font-weight:700;">${formattedTotal}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;color:#4a4a4a;font-size:14px;line-height:1.7;">
                You can review the full proposal, approve it, or request changes — all from the link above. If you have any questions, just reply to this email or give us a call.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color:#f9fafb;padding:24px 40px;border-top:1px solid #e5e7eb;">
              <p style="margin:0;color:#9ca3af;font-size:11px;text-align:center;letter-spacing:1px;">
                &copy; 2026 Persistent Pools &nbsp;|&nbsp; Portfolio demonstration · Powered by LEVELos
              </p>
              <p style="margin:6px 0 0;color:#9ca3af;font-size:11px;text-align:center;">
                Synthetic records only. External delivery is disabled in public-demo mode.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
