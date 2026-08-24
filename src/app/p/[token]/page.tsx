"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  ProposalTemplate,
  type ProposalTemplateData,
  type TemplateFeatureCard,
  type TemplateMilestone,
} from "@/components/proposal-template";

interface PublicProposalData {
  id: string;
  status: string;
  total: number;
  discount: number;
  heroHeadline: string | null;
  heroSubheadline: string | null;
  approachText: string | null;
  featureCards: string | null;
  milestones: string | null;
  renderImages: string | null;
  validUntil: string | null;
  clientRespondedAt: string | null;
  clientMessage: string | null;
  clientName: string | null;
  clientAddress: string | null;
}

export default function PublicProposalPage() {
  const params = useParams();
  const token = params.token as string;

  const [data, setData] = useState<PublicProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetch(`/api/p/${token}`)
      .then((res) => {
        if (!res.ok) throw new Error("Not found");
        return res.json();
      })
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setError(true);
        setLoading(false);
      });
  }, [token]);

  const handleApprove = async () => {
    const res = await fetch(`/api/p/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approve" }),
    });
    if (res.ok) {
      setData((prev) =>
        prev
          ? { ...prev, status: "ACCEPTED", clientRespondedAt: new Date().toISOString() }
          : prev
      );
    }
  };

  const handleRequestChanges = async (message: string) => {
    const res = await fetch(`/api/p/${token}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "request_changes", message }),
    });
    if (res.ok) {
      setData((prev) =>
        prev
          ? { ...prev, status: "REJECTED", clientRespondedAt: new Date().toISOString() }
          : prev
      );
    }
  };

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#fdfdfd",
          color: "#4A4A4A",
          fontFamily: "'Montserrat', sans-serif",
        }}
      >
        Loading proposal...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fdfdfd",
          color: "#0A2647",
          fontFamily: "'Montserrat', sans-serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <h1 style={{ fontSize: "2rem", marginBottom: "1rem", fontFamily: "'Cormorant Garamond', serif" }}>
          Proposal Not Found
        </h1>
        <p style={{ color: "#4A4A4A" }}>
          This link may have expired or is no longer valid.
        </p>
      </div>
    );
  }

  const featureCards: TemplateFeatureCard[] = data.featureCards
    ? JSON.parse(data.featureCards)
    : [];
  const milestones: TemplateMilestone[] = data.milestones
    ? JSON.parse(data.milestones)
    : [];
  const renderImages: string[] = data.renderImages
    ? JSON.parse(data.renderImages)
    : [];

  const templateData: ProposalTemplateData = {
    clientName: data.clientName || "",
    clientAddress: data.clientAddress || undefined,
    heroHeadline: data.heroHeadline || "Your Pool Proposal",
    heroSubheadline: data.heroSubheadline || "",
    approachText: data.approachText || "",
    featureCards,
    milestones,
    renderImages,
    total: data.total,
    discount: data.discount,
    validUntil: data.validUntil || "",
    status: data.status,
  };

  return (
    <ProposalTemplate
      data={templateData}
      readonly={true}
      onApprove={handleApprove}
      onRequestChanges={handleRequestChanges}
    />
  );
}
