"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
const cormorant = { variable: "" };
const montserrat = { variable: "" };

interface PayData {
  number: string;
  phaseLabel: string;
  description: string | null;
  amount: number;
  status: string;
  sentAt: string | null;
  dueDate: string | null;
  paidAt: string | null;
  paidAmount: number | null;
  paymentMethod: string | null;
  clientName: string | null;
  clientAddress: string | null;
  jobName: string | null;
}

function fmt(v: number) {
  return "$" + v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

const PB_NAVY = "#0A2647";
const PB_GOLD = "#C9A24E";
const PB_TEXT = "#4A4A4A";
const PB_BG = "#fdfdfd";
const PB_SOFT = "#f5f3ee";

export default function PublicPayPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<PayData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`/api/pay/${token}`)
      .then((res) => {
        if (!res.ok) {
          return res.json().then((b: { error?: string }) => {
            throw new Error(b.error || "Not found");
          });
        }
        return res.json() as Promise<PayData>;
      })
      .then((d) => {
        setData(d);
        if (d.status === "PAID") setSuccess(true);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Could not load invoice");
        setLoading(false);
      });
  }, [token]);

  const handlePay = async () => {
    if (!data || paying) return;
    setPaying(true);
    // Brief simulation delay so the spinner reads as "checkout"
    await new Promise((r) => setTimeout(r, 900));
    const res = await fetch(`/api/pay/${token}`, { method: "POST" });
    if (res.ok) {
      const result = await res.json();
      setData((prev) =>
        prev
          ? {
              ...prev,
              status: "PAID",
              paidAt: result.paidAt,
              paidAmount: result.paidAmount,
              paymentMethod: "STRIPE",
            }
          : prev
      );
      setSuccess(true);
    } else {
      const err = await res.json().catch(() => ({}));
      setError(err.error || "Payment failed. Please try again.");
    }
    setPaying(false);
  };

  if (loading) {
    return (
      <div
        className={`${cormorant.variable} ${montserrat.variable}`}
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: PB_BG,
          color: PB_TEXT,
          fontFamily: "var(--font-montserrat), sans-serif",
        }}
      >
        Loading invoice...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        className={`${cormorant.variable} ${montserrat.variable}`}
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: PB_BG,
          color: PB_NAVY,
          fontFamily: "var(--font-montserrat), sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1
          style={{
            fontSize: "2rem",
            marginBottom: "1rem",
            fontFamily: "var(--font-cormorant), serif",
          }}
        >
          Invoice Not Available
        </h1>
        <p style={{ color: PB_TEXT }}>{error || "This link may have expired."}</p>
      </div>
    );
  }

  const finalAmount = data.paidAmount ?? data.amount;

  return (
    <div
      className={`${cormorant.variable} ${montserrat.variable}`}
      style={{
        minHeight: "100vh",
        background: PB_BG,
        color: PB_TEXT,
        fontFamily: "var(--font-montserrat), sans-serif",
      }}
    >
      {/* Header */}
      <header
        style={{
          background: PB_NAVY,
          color: "white",
          padding: "1.5rem 1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 8,
              background: PB_GOLD,
              color: PB_NAVY,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 800,
              letterSpacing: "0.5px",
            }}
          >
            PP
          </div>
          <div>
            <div
              style={{
                fontSize: "1.05rem",
                fontWeight: 600,
                letterSpacing: "0.5px",
              }}
            >
              Persistent Pools
            </div>
            <div style={{ fontSize: "0.7rem", opacity: 0.75, letterSpacing: "1px" }}>
              POOLS & SPAS
            </div>
          </div>
        </div>
        <div style={{ fontSize: "0.75rem", opacity: 0.7 }}>
          Portfolio payment simulator
        </div>
      </header>

      <main
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "2.5rem 1.25rem 4rem",
        }}
      >
        {/* Hero */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <p
            style={{
              fontSize: "0.7rem",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: PB_GOLD,
              fontWeight: 600,
              marginBottom: "0.5rem",
            }}
          >
            Invoice {data.number}
          </p>
          <h1
            style={{
              fontFamily: "var(--font-cormorant), serif",
              fontSize: "2.5rem",
              color: PB_NAVY,
              margin: 0,
              fontWeight: 600,
            }}
          >
            {success ? "Payment Simulation Complete" : "Invoice Payment Simulation"}
          </h1>
          {!success && data.clientName && (
            <p style={{ marginTop: "0.5rem", color: PB_TEXT }}>
              Explore the demo payment flow for{" "}
              <span style={{ color: PB_NAVY, fontWeight: 600 }}>{data.clientName}</span>.
            </p>
          )}
        </div>

        {/* Success state */}
        {success && (
          <div
            style={{
              background: "white",
              borderRadius: 12,
              border: "1px solid #e5e1d5",
              padding: "2rem",
              textAlign: "center",
              boxShadow: "0 1px 3px rgba(10,38,71,0.05)",
              marginBottom: "1.5rem",
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#10b981",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 1rem",
              }}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <h2
              style={{
                fontFamily: "var(--font-cormorant), serif",
                fontSize: "1.75rem",
                color: PB_NAVY,
                margin: "0 0 0.25rem",
                fontWeight: 600,
              }}
            >
              Thank you!
            </h2>
            <p style={{ color: PB_TEXT, margin: "0 0 1rem" }}>
              Your payment of{" "}
              <span style={{ fontWeight: 700, color: PB_NAVY }}>{fmt(finalAmount)}</span>{" "}
              has been processed.
            </p>
            <p
              style={{
                fontSize: "0.8rem",
                color: PB_TEXT,
                opacity: 0.7,
                marginBottom: 0,
              }}
            >
              {data.paidAt
                ? `Confirmed ${fmtDate(data.paidAt)}.`
                : "Confirmation has been recorded."}{" "}
              A receipt is on the way to your email.
            </p>
          </div>
        )}

        {/* Invoice card */}
        <div
          style={{
            background: "white",
            borderRadius: 12,
            border: "1px solid #e5e1d5",
            overflow: "hidden",
            boxShadow: "0 1px 3px rgba(10,38,71,0.05)",
          }}
        >
          {/* Top — line item */}
          <div style={{ padding: "1.5rem 1.5rem 1rem" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "1rem",
                flexWrap: "wrap",
              }}
            >
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: "0.7rem",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    color: PB_GOLD,
                    fontWeight: 600,
                  }}
                >
                  {data.phaseLabel}
                </div>
                <div
                  style={{
                    fontSize: "1.05rem",
                    fontWeight: 600,
                    color: PB_NAVY,
                    marginTop: 4,
                  }}
                >
                  {data.jobName || "Pool Construction Project"}
                </div>
                {data.description && (
                  <p
                    style={{
                      fontSize: "0.85rem",
                      color: PB_TEXT,
                      margin: "0.5rem 0 0",
                      lineHeight: 1.5,
                    }}
                  >
                    {data.description}
                  </p>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <div
                  style={{
                    fontSize: "0.7rem",
                    letterSpacing: "1.5px",
                    textTransform: "uppercase",
                    color: PB_TEXT,
                    opacity: 0.7,
                  }}
                >
                  Amount Due
                </div>
                <div
                  style={{
                    fontFamily: "var(--font-cormorant), serif",
                    fontSize: "2.25rem",
                    fontWeight: 700,
                    color: PB_NAVY,
                    lineHeight: 1.1,
                  }}
                >
                  {fmt(finalAmount)}
                </div>
              </div>
            </div>
          </div>

          {/* Meta strip */}
          <div
            style={{
              background: PB_SOFT,
              borderTop: "1px solid #e5e1d5",
              borderBottom: "1px solid #e5e1d5",
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "1rem",
              padding: "1rem 1.5rem",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: "0.65rem",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: PB_TEXT,
                  opacity: 0.6,
                }}
              >
                Invoice
              </div>
              <div
                style={{
                  fontFamily: "var(--font-mono), ui-monospace, monospace",
                  fontSize: "0.85rem",
                  color: PB_NAVY,
                  fontWeight: 600,
                  marginTop: 2,
                }}
              >
                {data.number}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.65rem",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: PB_TEXT,
                  opacity: 0.6,
                }}
              >
                Sent
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: PB_NAVY,
                  fontWeight: 500,
                  marginTop: 2,
                }}
              >
                {fmtDate(data.sentAt)}
              </div>
            </div>
            <div>
              <div
                style={{
                  fontSize: "0.65rem",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: PB_TEXT,
                  opacity: 0.6,
                }}
              >
                Due
              </div>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: PB_NAVY,
                  fontWeight: 500,
                  marginTop: 2,
                }}
              >
                {fmtDate(data.dueDate)}
              </div>
            </div>
          </div>

          {/* Bill to */}
          {(data.clientName || data.clientAddress) && (
            <div style={{ padding: "1.25rem 1.5rem", borderBottom: "1px solid #e5e1d5" }}>
              <div
                style={{
                  fontSize: "0.65rem",
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: PB_TEXT,
                  opacity: 0.6,
                  marginBottom: 4,
                }}
              >
                Bill To
              </div>
              {data.clientName && (
                <div
                  style={{ fontSize: "0.95rem", color: PB_NAVY, fontWeight: 600 }}
                >
                  {data.clientName}
                </div>
              )}
              {data.clientAddress && (
                <div style={{ fontSize: "0.85rem", color: PB_TEXT, marginTop: 2 }}>
                  {data.clientAddress}
                </div>
              )}
            </div>
          )}

          {/* CTA */}
          {!success && (
            <div style={{ padding: "1.5rem" }}>
              <button
                onClick={handlePay}
                disabled={paying}
                style={{
                  width: "100%",
                  background: paying ? "#7a8aa3" : PB_NAVY,
                  color: "white",
                  border: "none",
                  borderRadius: 10,
                  padding: "1rem 1.25rem",
                  fontSize: "1.05rem",
                  fontWeight: 600,
                  letterSpacing: "0.3px",
                  cursor: paying ? "wait" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  transition: "background 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  if (!paying) e.currentTarget.style.background = "#0F3461";
                }}
                onMouseLeave={(e) => {
                  if (!paying) e.currentTarget.style.background = PB_NAVY;
                }}
              >
                {paying ? (
                  <>
                    <span
                      className="animate-spin"
                      style={{
                        width: 16,
                        height: 16,
                        border: "2px solid rgba(255,255,255,0.3)",
                        borderTopColor: "white",
                        borderRadius: "50%",
                        display: "inline-block",
                      }}
                    />
                    Processing...
                  </>
                ) : (
                  <>
                    <svg
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <rect x="3" y="11" width="18" height="11" rx="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                    Simulate {fmt(finalAmount)} Payment
                  </>
                )}
              </button>

              <div
                style={{
                  marginTop: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  fontSize: "0.75rem",
                  color: PB_TEXT,
                  opacity: 0.7,
                }}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                Portfolio demo only — no payment data is collected or transmitted.
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            marginTop: "2rem",
            fontSize: "0.75rem",
            color: PB_TEXT,
            opacity: 0.7,
          }}
        >
          Questions about this invoice? Reply to the email this came in or call your
          project manager directly.
        </div>
      </main>

    </div>
  );
}
