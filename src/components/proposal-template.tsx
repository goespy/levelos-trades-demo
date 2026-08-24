"use client";

import { useState } from "react";
const cormorant = { variable: "" };
const montserrat = { variable: "" };

export interface TemplateFeatureCard {
  title: string;
  description: string;
}

export interface TemplateMilestone {
  name: string;
  description: string;
  percentage: number;
  amount: number;
}

export interface ProposalTemplateData {
  clientName: string;
  clientAddress?: string;
  heroHeadline: string;
  heroSubheadline: string;
  approachText: string;
  featureCards: TemplateFeatureCard[];
  milestones: TemplateMilestone[];
  renderImages: string[];
  total: number;
  discount: number;
  validUntil: string;
  status?: string;
}

interface ProposalTemplateProps {
  data: ProposalTemplateData;
  readonly: boolean;
  onApprove?: () => void;
  onRequestChanges?: (message: string) => void;
}

function fmt(v: number) {
  return "$" + v.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function ProposalTemplate({
  data,
  readonly,
  onApprove,
  onRequestChanges,
}: ProposalTemplateProps) {
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [changesMessage, setChangesMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const finalTotal = data.total - data.discount;
  const isResponded = data.status === "ACCEPTED" || data.status === "REJECTED";

  const handleApprove = async () => {
    if (!onApprove) return;
    setSubmitting(true);
    onApprove();
    setShowApprovalModal(true);
  };

  const handleRequestChanges = async () => {
    if (!onRequestChanges || !changesMessage.trim()) return;
    setSubmitting(true);
    onRequestChanges(changesMessage);
  };

  return (
    <div className={`${cormorant.variable} ${montserrat.variable}`}>
      <style>{`
        .pt-root {
          --primary: #0A2647;
          --accent: #B4975A;
          --soft-blue: #F0F4F8;
          --text-dark: #1A1A1A;
          --text-light: #4A4A4A;
          font-family: var(--font-montserrat), 'Montserrat', sans-serif !important;
          background-color: #fdfdfd;
          color: var(--text-dark);
          scroll-behavior: smooth;
        }

        .pt-root * {
          font-family: inherit !important;
        }

        .pt-root h1, .pt-root h2, .pt-root h3, .pt-root h4 {
          font-family: var(--font-cormorant), 'Cormorant Garamond', serif !important;
        }

        .pt-hero-gradient {
          background: linear-gradient(rgba(10, 38, 71, 0.8), rgba(10, 38, 71, 0.6)),
            url('/images/proposal-hero.avif');
          background-size: cover;
          background-position: center;
        }

        .pt-gold-border { border-left: 4px solid var(--accent); }
        .pt-card-shadow { box-shadow: 0 10px 30px rgba(0, 0, 0, 0.05); }

        .pt-btn-premium {
          background-color: var(--accent);
          color: white;
          transition: all 0.3s ease;
        }
        .pt-btn-premium:hover:not(:disabled) {
          background-color: #967D48;
          transform: translateY(-2px);
        }

        .pt-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(10, 38, 71, 0.9);
          backdrop-filter: blur(8px);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pt-modal-content {
          background: white;
          padding: 3rem;
          max-width: 500px;
          width: 90%;
          border-radius: 2px;
          position: relative;
        }

        @media print {
          /* ── GLOBAL PRINT SETUP ── */
          @page { margin: 0; size: letter; }

          .pt-no-print { display: none !important; }

          .pt-root {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .pt-root, .pt-root * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .pt-card-shadow {
            box-shadow: none !important;
          }

          /* Kill all hover transforms */
          .pt-root [class*="hover:"] {
            transform: none !important;
          }

          /* ── PAGE 1: HERO ── */
          .pt-root header video {
            display: none !important;
          }
          .pt-root header {
            height: 10.95in !important;
            max-height: 10.95in !important;
            background: linear-gradient(rgba(10, 38, 71, 0.8), rgba(10, 38, 71, 0.6)),
              url('/images/proposal-hero.avif') !important;
            background-size: cover !important;
            background-position: center !important;
            break-after: page;
          }

          /* ── PAGE 2: OUR APPROACH + RENDERS ── */
          .pt-root #vision {
            height: 10.95in !important;
            max-height: 10.95in !important;
            overflow: hidden !important;
            padding: 0.5in 0.5in !important;
            break-after: page;
            box-sizing: border-box;
          }
          /* 2-col grid fills the page */
          .pt-root #vision > div {
            height: 100% !important;
            max-height: 100% !important;
            gap: 0.3in !important;
            align-items: stretch !important;
          }
          /* Approach text — limit height so renders get room */
          .pt-root #vision > div > div:first-child {
            max-height: 100% !important;
            overflow: hidden !important;
          }
          .pt-root #vision > div > div:first-child h2 {
            font-size: 2rem !important;
            margin-bottom: 0.4rem !important;
          }
          .pt-root #vision > div > div:first-child .pt-gold-border {
            margin-bottom: 0.4rem !important;
            padding-left: 0.8rem !important;
          }
          .pt-root #vision > div > div:first-child .pt-gold-border p {
            font-size: 0.85rem !important;
          }
          .pt-root #vision > div > div:first-child > p {
            font-size: 0.7rem !important;
            line-height: 1.5 !important;
            margin-bottom: 0.25rem !important;
          }
          /* Renders wrapper — stretch to full height */
          .pt-root #vision .pt-renders-col {
            height: 100% !important;
            display: flex !important;
            flex-direction: column !important;
          }
          /* Renders grid — flex column filling wrapper */
          .pt-root #vision .pt-renders-col > .grid {
            display: flex !important;
            flex-direction: column !important;
            gap: 6px !important;
            flex: 1 !important;
            min-height: 0 !important;
          }
          /* Each render box — equal share of space */
          .pt-root .pt-render-box {
            aspect-ratio: auto !important;
            flex: 1 1 0% !important;
            min-height: 0 !important;
            max-height: 33.33% !important;
            overflow: hidden !important;
          }
          .pt-root .pt-render-box img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
          }
          /* Hide disclaimer text in print to save space */
          .pt-root #vision .pt-renders-col > p {
            display: none !important;
          }
          /* Hide the floating "Design Renders" label in print */
          .pt-root #vision .absolute {
            display: none !important;
          }

          /* ── PAGE 3: FEATURES ── */
          .pt-root #design {
            height: 10.95in !important;
            max-height: 10.95in !important;
            overflow: hidden !important;
            padding: 0.8in 0.5in !important;
            background-color: #F0F4F8 !important;
            break-after: page;
            box-sizing: border-box;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .pt-root #design .pt-card-shadow {
            border: 1px solid #e5e7eb;
          }

          /* ── PAGE 4: COST BREAKDOWN ── */
          .pt-root #investment {
            height: 10.95in !important;
            max-height: 10.95in !important;
            overflow: hidden !important;
            padding: 0.8in 0.5in !important;
            break-after: page;
            box-sizing: border-box;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }

          /* ── PAGE 5: PAYMENT + CTA + FOOTER ── */
          .pt-root #payment {
            padding: 0.5in 0.5in 0.3in !important;
            background-color: #F0F4F8 !important;
            box-sizing: border-box;
          }
          .pt-root #payment .mb-16 { margin-bottom: 0.3in !important; }
          .pt-root #payment .gap-y-16 { gap: 0.25in !important; }
          .pt-root #payment .mt-16 { margin-top: 0.2in !important; }
          /* Zero down badge */
          .pt-root #payment .inline-block {
            background-color: #000 !important;
            color: #fff !important;
          }

          /* CTA — compact on page 5 */
          .pt-root #payment ~ section {
            padding: 0.3in 0.5in !important;
          }
          /* Hide interactive buttons in CTA */
          .pt-root .pt-btn-premium { display: none !important; }
          .pt-root section button { display: none !important; }

          /* Footer — compact */
          .pt-root footer {
            padding: 0.3in 0.5in !important;
            background-color: #f3f4f6 !important;
          }

          /* ── FORCE COLORS ── */
          .pt-gold-border {
            border-left-color: #B4975A !important;
          }
          .pt-root [style*="background-color: var(--accent)"] {
            background-color: #B4975A !important;
          }
          .pt-root [style*="border-top-color: var(--accent)"] {
            border-top-color: #B4975A !important;
          }
          .pt-root [style*="color: var(--accent)"] {
            color: #B4975A !important;
          }
          .pt-root [style*="color: var(--primary)"] {
            color: #0A2647 !important;
          }
          .pt-root [style*="background-color: var(--soft-blue)"] {
            background-color: #F0F4F8 !important;
          }

          /* Nav is pt-no-print but force-hide just in case */
          .pt-root > nav {
            display: none !important;
          }
        }
      `}</style>

      <div className="pt-root">

        {/* ─── NAV ─── */}
        <nav className="pt-no-print sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-100 py-3 px-6 md:px-12 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex flex-col leading-none">
              <span className="font-bold tracking-tighter text-xl" style={{ color: "var(--primary)" }}>PERSISTENT POOLS</span>
              <span className="text-[8px] tracking-[0.3em] font-medium" style={{ color: "var(--accent)" }}>POOLS &amp; SPAS</span>
            </div>
            <div className="hidden sm:block border-l border-gray-200 h-8 mx-2" />
            <span className="text-lg font-semibold tracking-widest uppercase hidden sm:block" style={{ color: "var(--primary)", fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}>
              Pool &amp; Spa Proposal
            </span>
          </div>
          <div className="hidden lg:flex gap-8 text-xs uppercase tracking-widest font-medium" style={{ color: "var(--text-light)" }}>
            <a href="#vision" className="hover:opacity-70 transition">Our Approach</a>
            <a href="#design" className="hover:opacity-70 transition">Pool Features</a>
            <a href="#investment" className="hover:opacity-70 transition">Cost</a>
            <a href="#payment" className="hover:opacity-70 transition">Payment</a>
          </div>
          <button
            onClick={() => window.print()}
            className="text-[10px] border px-4 py-2 rounded uppercase tracking-widest font-bold transition hover:text-white"
            style={{ borderColor: "var(--accent)", color: "var(--accent)" }}
            onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--accent)"; e.currentTarget.style.color = "white"; }}
            onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--accent)"; }}
          >
            Download PDF
          </button>
        </nav>

        {/* ─── HERO ─── */}
        <header className="relative h-[80vh] flex items-center justify-center text-white overflow-hidden">
          {/* Video background */}
          <video
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
            poster="/images/proposal-hero.avif"
          >
            <source src="/images/proposal-hero.mp4" type="video/mp4" />
          </video>
          {/* Dark overlay */}
          <div className="absolute inset-0" style={{ background: "linear-gradient(rgba(10, 38, 71, 0.75), rgba(10, 38, 71, 0.55))" }} />
          <div className="relative z-10 text-center px-4 max-w-4xl">
            <h4 className="uppercase tracking-[0.4em] text-sm mb-4 opacity-90" style={{ fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}>
              {data.heroSubheadline || "Florida's Best Backyards"}
            </h4>
            <h1 className="text-5xl md:text-7xl lg:text-8xl mb-6">
              {data.heroHeadline || "Your Custom Oasis"}
            </h1>
            <p className="text-lg md:text-xl font-light max-w-2xl mx-auto italic" style={{ fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}>
              A detailed plan for your new pool and outdoor living space.
            </p>
            <div className="mt-8">
              <span
                className="inline-block uppercase tracking-[0.25em] text-xs px-5 py-2 rounded-full"
                style={{
                  fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif",
                  border: "1px solid rgba(183, 157, 94, 0.6)",
                  color: "var(--accent)",
                  letterSpacing: "0.25em",
                }}
              >
                Zero Down at Signing
              </span>
            </div>
          </div>
        </header>

        {/* ─── OUR APPROACH + 3 RENDERS ─── */}
        <section id="vision" className="py-24 px-6 md:px-12 bg-white">
          <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-start">
            <div>
              <h2 className="text-4xl md:text-5xl mb-8" style={{ color: "var(--primary)" }}>
                Our Approach
              </h2>
              <div className="pt-gold-border pl-6 mb-8">
                <p className="text-xl leading-relaxed font-light italic" style={{ color: "var(--text-light)", fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}>
                  &ldquo;We believe in building pools that look amazing and stay that way for a lifetime.&rdquo;
                </p>
              </div>
              {(data.approachText || "").split("\n\n").map((p, i) => (
                <p key={i} className="leading-loose mb-6" style={{ color: "var(--text-light)", fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}>
                  {p}
                </p>
              ))}
            </div>

            {/* Landscape Render Areas */}
            <div className="pt-renders-col relative space-y-4">
              <div className="grid gap-4">
                {data.renderImages.length > 0 ? (
                  data.renderImages.map((img, i) => (
                    <div key={i} className="pt-render-box aspect-[16/9] bg-gray-200 rounded-sm overflow-hidden shadow-md border border-gray-100 flex items-center justify-center text-gray-400">
                      <img
                        src={img}
                        alt={`Render ${i + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))
                ) : (
                  <div className="pt-render-box aspect-[16/9] bg-gray-200 rounded-sm overflow-hidden border border-gray-100 flex items-center justify-center text-gray-400">
                    <span className="text-xs uppercase tracking-widest">Renders Coming Soon</span>
                  </div>
                )}
              </div>
              {data.renderImages.length > 0 && (
                <p className="text-[10px] text-center italic opacity-50 mt-1" style={{ color: "var(--text-light)", fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}>
                  *Renders are for illustration purposes only. Final construction may vary in appearance.
                </p>
              )}
              <div className="absolute -bottom-6 -left-6 text-white p-6 hidden lg:block shadow-xl z-10" style={{ backgroundColor: "var(--primary)" }}>
                <p className="text-xl tracking-tight" style={{ fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>Design Renders</p>
                <p className="text-[10px] uppercase tracking-widest opacity-70 mt-1" style={{ fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}>Proposed Project Visuals</p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── FEATURES GRID ─── */}
        {data.featureCards.length > 0 && (
          <section id="design" className="py-24 px-6 md:px-12 text-center" style={{ backgroundColor: "var(--soft-blue)" }}>
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl mb-4" style={{ color: "var(--primary)" }}>Project Features</h2>
                <div className="w-24 h-1 mx-auto" style={{ backgroundColor: "var(--accent)" }} />
              </div>
              <div className="grid md:grid-cols-3 gap-8">
                {data.featureCards.map((card, i) => (
                  <div
                    key={i}
                    className="bg-white p-10 pt-card-shadow border-t-2 hover:-translate-y-2 transition duration-300"
                    style={{ borderTopColor: "var(--accent)" }}
                  >
                    <div className="mb-6 flex justify-center" style={{ color: "var(--accent)" }}>
                      {i === 0 && (
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                      )}
                      {i === 1 && (
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 3v1m0 16v1m9-9h-1M4 9h-1m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
                      )}
                      {i >= 2 && (
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                      )}
                    </div>
                    <h3 className="text-2xl mb-4" style={{ color: "var(--primary)" }}>{card.title}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: "var(--text-light)", fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}>{card.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ─── PROJECT COST BREAKDOWN ─── */}
        {data.milestones.length > 0 && (
          <section id="investment" className="py-24 px-6 md:px-12 bg-white">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-4xl text-center mb-16 italic" style={{ color: "var(--primary)" }}>
                Project Cost Breakdown
              </h2>
              <div className="space-y-6">
                {data.milestones.map((m, i) => (
                  <div key={i} className="flex justify-between items-end border-b border-gray-100 pb-4">
                    <div>
                      <h4 className="text-lg font-medium" style={{ color: "var(--primary)", fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}>
                        Milestone {i + 1}: {m.name}
                      </h4>
                      <p className="text-xs uppercase tracking-wider" style={{ color: "var(--text-light)", fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}>
                        {m.description} ({m.percentage}%)
                      </p>
                    </div>
                    <span className="text-xl font-light" style={{ color: "var(--accent)", fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}>
                      {fmt(m.amount)}
                    </span>
                  </div>
                ))}

                {/* Total */}
                <div className="flex justify-between items-center p-8 mt-12 rounded-sm shadow-xl" style={{ backgroundColor: "#0A2647" }}>
                  <div>
                    <h3 className="text-3xl text-white italic">Total Project Investment</h3>
                  </div>
                  <div className="text-right">
                    <span className="text-4xl" style={{ color: "var(--accent)" }}>{fmt(finalTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* ─── HOW YOU PAY ─── */}
        {data.milestones.length > 0 && (
          <section id="payment" className="py-24 px-6 md:px-12 border-y border-gray-100 text-center" style={{ backgroundColor: "var(--soft-blue)" }}>
            <div className="max-w-6xl mx-auto">
              <div className="text-center mb-16">
                <h2 className="text-4xl md:text-5xl mb-4" style={{ color: "var(--primary)" }}>How You Pay</h2>
                <p className="opacity-80 uppercase tracking-widest text-xs mb-4" style={{ color: "var(--text-light)", fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}>
                  Six milestones — you only pay when each phase is done
                </p>
                <div className="inline-block bg-black text-white px-8 py-3 text-base tracking-[0.2em] font-bold shadow-sm" style={{ fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}>
                  &#10022; ZERO DOWN AT SIGNING
                </div>
              </div>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16 text-left">
                {data.milestones.map((m, i) => (
                  <div key={i} className="flex flex-col p-6">
                    <div className="flex items-baseline gap-4 mb-4">
                      <span className="text-4xl italic opacity-40" style={{ color: "var(--accent)", fontFamily: "var(--font-cormorant), 'Cormorant Garamond', serif" }}>{i + 1}</span>
                      <h4 className="text-xl font-semibold" style={{ color: "var(--primary)", fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}>{m.name}</h4>
                    </div>
                    <p className="text-sm leading-relaxed mb-4 flex-grow" style={{ color: "var(--text-light)", fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}>
                      {m.description}
                    </p>
                    <div className="font-bold tracking-widest text-sm" style={{ color: "var(--accent)", fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}>
                      ~{m.percentage}% <span className="text-[10px] font-medium opacity-90 tracking-widest">OF CONTRACT</span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-16 text-center text-xs tracking-widest font-medium max-w-2xl mx-auto leading-relaxed border-t pt-8" style={{ color: "var(--primary)", borderColor: "rgba(180, 151, 90, 0.2)", fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}>
                Persistent Pools handles the entire construction process. Exact milestones and percentages are finalized in your contract.
              </p>
            </div>
          </section>
        )}

        {/* ─── CTA ─── */}
        <section className="py-24 px-6 text-center bg-white">
          {isResponded ? (
            <>
              <h2 className="text-4xl mb-8" style={{ color: "var(--primary)" }}>
                {data.status === "ACCEPTED" ? "Proposal Accepted" : "Changes Requested"}
              </h2>
              <div
                className="inline-block px-8 py-3 rounded-sm font-semibold text-sm uppercase tracking-widest"
                style={{
                  fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif",
                  background: data.status === "ACCEPTED" ? "#dcfce7" : "#fef3c7",
                  color: data.status === "ACCEPTED" ? "#166534" : "#92400e",
                }}
              >
                {data.status === "ACCEPTED" ? "Approved" : "Revision Requested"}
              </div>
            </>
          ) : (
            <>
              <h2 className="text-4xl mb-8" style={{ color: "var(--primary)" }}>Ready to get started?</h2>
              {readonly && (
                <div className="flex flex-col md:flex-row justify-center gap-6 pt-no-print">
                  <button
                    onClick={handleApprove}
                    disabled={submitting}
                    className="pt-btn-premium px-10 py-5 rounded-sm uppercase tracking-widest text-sm font-semibold shadow-lg border-0 cursor-pointer disabled:opacity-50"
                    style={{ fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}
                  >
                    {submitting ? "Submitting..." : "Approve Proposal"}
                  </button>
                  <button
                    onClick={() => setShowChangesModal(true)}
                    disabled={submitting}
                    className="border px-10 py-5 rounded-sm uppercase tracking-widest text-sm font-semibold cursor-pointer transition hover:text-white disabled:opacity-50"
                    style={{
                      borderColor: "var(--primary)",
                      color: "var(--primary)",
                      backgroundColor: "transparent",
                      fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--primary)"; e.currentTarget.style.color = "white"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "var(--primary)"; }}
                  >
                    Request Changes
                  </button>
                </div>
              )}
            </>
          )}
          <p className="mt-12 text-sm font-light max-w-lg mx-auto leading-relaxed" style={{ color: "var(--text-light)", fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}>
            {data.validUntil
              ? `Proposal valid until ${new Date(data.validUntil + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}.`
              : "Proposal valid for 30 days."}{" "}
            This portfolio proposal uses illustrative scope, pricing, milestones, and customer data.
          </p>
        </section>

        {/* ─── FOOTER ─── */}
        <footer className="bg-gray-100 py-12 px-6 border-t border-gray-200">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center text-xs uppercase tracking-[0.2em]" style={{ color: "var(--text-light)", fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}>
            <div className="mb-6 md:mb-0">&copy; 2026 Persistent Pools | Portfolio demo · Powered by LEVELos</div>
            <div className="flex gap-8">
              <span className="font-medium normal-case tracking-normal">Illustrative proposal — not an offer</span>
            </div>
            <div className="mt-6 md:mt-0 font-semibold" style={{ color: "var(--primary)" }}>Modern Pool Construction</div>
          </div>
        </footer>

        {/* ─── APPROVAL MODAL ─── */}
        {showApprovalModal && (
          <div className="pt-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowApprovalModal(false); }}>
            <div className="pt-modal-content text-center">
              <div className="mb-6 flex justify-center" style={{ color: "var(--accent)" }}>
                <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl mb-4" style={{ color: "var(--primary)" }}>Proposal Accepted</h2>
              <p className="mb-8" style={{ color: "var(--text-light)", fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}>
                Thanks for choosing Persistent Pools. Our team will contact you within 24 hours to schedule your site check and get started on the plans.
              </p>
              <button
                onClick={() => setShowApprovalModal(false)}
                className="pt-btn-premium px-8 py-3 w-full uppercase tracking-widest text-xs border-0 cursor-pointer"
                style={{ fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* ─── REQUEST CHANGES MODAL ─── */}
        {showChangesModal && (
          <div className="pt-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) setShowChangesModal(false); }}>
            <div className="pt-modal-content">
              <h2 className="text-3xl mb-2" style={{ color: "var(--primary)" }}>Request Changes</h2>
              <p className="text-sm mb-6" style={{ color: "var(--text-light)", fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}>
                Let us know what you&apos;d like adjusted. We&apos;ll revise the proposal and send you an updated version.
              </p>
              <textarea
                value={changesMessage}
                onChange={(e) => setChangesMessage(e.target.value)}
                placeholder="Describe the changes you'd like..."
                className="w-full min-h-[120px] border border-gray-200 rounded-sm p-4 text-sm resize-y outline-none focus:border-[#B4975A]"
                style={{ fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif", color: "var(--text-dark)" }}
              />
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setShowChangesModal(false)}
                  disabled={submitting}
                  className="border px-6 py-3 rounded-sm uppercase tracking-widest text-xs font-semibold cursor-pointer transition disabled:opacity-50"
                  style={{ borderColor: "var(--primary)", color: "var(--primary)", backgroundColor: "transparent", fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRequestChanges}
                  disabled={submitting || !changesMessage.trim()}
                  className="pt-btn-premium px-6 py-3 rounded-sm uppercase tracking-widest text-xs font-semibold border-0 cursor-pointer disabled:opacity-50"
                  style={{ fontFamily: "var(--font-montserrat), 'Montserrat', sans-serif" }}
                >
                  {submitting ? "Sending..." : "Send Request"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
