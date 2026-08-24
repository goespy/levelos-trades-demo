"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ProposalTemplate,
  type ProposalTemplateData,
  type TemplateFeatureCard,
  type TemplateMilestone,
} from "@/components/proposal-template";
import { ArrowLeft, Loader2, Save, Eye, EyeOff, Share2, Copy, Check, Upload, X, GripVertical } from "lucide-react";

interface ProposalRaw {
  id: string;
  clientId: string;
  buildId: string;
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
  shareToken: string | null;
  sharedAt: string | null;
  client: {
    name: string;
    address: string | null;
    city: string | null;
    zip: string | null;
  } | null;
}

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(v);
}

export default function TemplateEditorPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [proposal, setProposal] = useState<ProposalRaw | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Editable fields
  const [heroHeadline, setHeroHeadline] = useState("");
  const [heroSubheadline, setHeroSubheadline] = useState("");
  const [approachText, setApproachText] = useState("");
  const [featureCards, setFeatureCards] = useState<TemplateFeatureCard[]>([]);
  const [milestones, setMilestones] = useState<TemplateMilestone[]>([]);
  const [validUntil, setValidUntil] = useState("");
  const [renderImages, setRenderImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const fetchProposal = useCallback(async () => {
    const res = await fetch(`/api/proposals/${id}`);
    if (!res.ok) {
      router.push("/proposals");
      return;
    }
    const data: ProposalRaw = await res.json();
    setProposal(data);

    setHeroHeadline(data.heroHeadline || "Your Dream Pool Awaits");
    setHeroSubheadline(data.heroSubheadline || "");
    setApproachText(data.approachText || "");
    setValidUntil(data.validUntil || "");

    const cards: TemplateFeatureCard[] = data.featureCards
      ? JSON.parse(data.featureCards)
      : [];
    // Ensure we always have 3 cards
    while (cards.length < 3) cards.push({ title: "", description: "" });
    setFeatureCards(cards.slice(0, 3));

    const ms: TemplateMilestone[] = data.milestones
      ? JSON.parse(data.milestones)
      : [];
    setMilestones(ms);

    const imgs: string[] = data.renderImages
      ? JSON.parse(data.renderImages)
      : [];
    setRenderImages(imgs);

    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchProposal();
  }, [fetchProposal]);
  useEffect(() => { if (new URLSearchParams(window.location.search).get("tourPreview") === "1" && proposal) setPreviewing(true); }, [proposal]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/proposals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        heroHeadline,
        heroSubheadline,
        approachText,
        featureCards: JSON.stringify(featureCards.filter((c) => c.title)),
        milestones: JSON.stringify(milestones),
        validUntil: validUntil || null,
        renderImages: JSON.stringify(renderImages),
      }),
    });
    setSaving(false);
  };

  const handleShare = async () => {
    setSharing(true);
    const res = await fetch(`/api/proposals/${id}/share`, { method: "POST" });
    const data = await res.json();
    setSharing(false);

    if (data.url) {
      const fullUrl = window.location.origin + data.url;
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      // Refresh to get shareToken
      fetchProposal();
    }
  };

  const updateFeatureCard = (
    index: number,
    field: "title" | "description",
    value: string
  ) => {
    setFeatureCards((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const updateMilestone = (
    index: number,
    field: keyof TemplateMilestone,
    value: string | number
  ) => {
    setMilestones((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const recalcMilestoneAmounts = () => {
    if (!proposal) return;
    const total = proposal.total - proposal.discount;
    setMilestones((prev) => {
      return prev.map((m) => ({
        ...m,
        amount: Math.round((m.percentage / 100) * total),
      }));
    });
  };

  if (loading || !proposal) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const clientAddress = proposal.client
    ? [proposal.client.address, proposal.client.city, proposal.client.zip]
        .filter(Boolean)
        .join(", ")
    : "";

  const templateData: ProposalTemplateData = {
    clientName: proposal.client?.name || "Client",
    clientAddress,
    heroHeadline,
    heroSubheadline,
    approachText,
    featureCards: featureCards.filter((c) => c.title),
    milestones,
    renderImages,
    total: proposal.total,
    discount: proposal.discount,
    validUntil,
    status: proposal.status,
  };

  const milestoneSum = milestones.reduce((s, m) => s + m.amount, 0);
  const finalTotal = proposal.total - proposal.discount;

  if (previewing) {
    return (
      <div>
        <div className="fixed top-4 right-4 z-50 flex gap-2 print:hidden">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPreviewing(false)}
            className="bg-background"
          >
            <EyeOff className="h-4 w-4 mr-1" />
            Exit Preview
          </Button>
        </div>
        <div className="-m-4 md:-m-6">
          <ProposalTemplate data={templateData} readonly={false} />
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4 print:hidden">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/proposals/${id}`)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Proposal
        </Button>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={() => setPreviewing(true)}>
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button size="sm" variant="outline" onClick={handleShare} disabled={sharing}>
            {copied ? (
              <Check className="h-4 w-4 mr-1" />
            ) : sharing ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Share2 className="h-4 w-4 mr-1" />
            )}
            {copied ? "Copied!" : proposal.shareToken ? "Copy Link" : "Share"}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            Save
          </Button>
        </div>
      </div>

      {/* Share link display */}
      {proposal.shareToken && (
        <div className="mb-4 p-3 rounded-lg bg-muted/50 flex items-center gap-2 text-sm">
          <Share2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <code className="text-xs flex-1 truncate">
            {typeof window !== "undefined"
              ? `${window.location.origin}/p/${proposal.shareToken}`
              : `/p/${proposal.shareToken}`}
          </code>
          <Button
            size="sm"
            variant="ghost"
            onClick={async () => {
              await navigator.clipboard.writeText(
                `${window.location.origin}/p/${proposal.shareToken}`
              );
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          </Button>
        </div>
      )}

      <h1 className="text-xl font-bold mb-1">
        Template Editor — {proposal.client?.name || "Proposal"}
      </h1>
      <p className="text-sm text-muted-foreground mb-6">
        Edit the client-facing proposal template. Changes here do not affect the
        internal cost breakdown.
      </p>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left — Form Fields */}
        <div className="space-y-4">
          {/* Hero */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hero Section</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Headline</Label>
                <Input
                  value={heroHeadline}
                  onChange={(e) => setHeroHeadline(e.target.value)}
                />
              </div>
              <div>
                <Label className="text-xs">Subheadline</Label>
                <Textarea
                  value={heroSubheadline}
                  onChange={(e) => setHeroSubheadline(e.target.value)}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          {/* Approach */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Our Approach</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                value={approachText}
                onChange={(e) => setApproachText(e.target.value)}
                rows={4}
              />
            </CardContent>
          </Card>

          {/* Feature Cards */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Feature Cards (3)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {featureCards.map((card, i) => (
                <div key={i} className="space-y-2 p-3 rounded-lg bg-muted/30">
                  <Label className="text-xs text-muted-foreground">
                    Card {i + 1}
                  </Label>
                  <Input
                    value={card.title}
                    onChange={(e) => updateFeatureCard(i, "title", e.target.value)}
                    placeholder="Feature title..."
                  />
                  <Textarea
                    value={card.description}
                    onChange={(e) => updateFeatureCard(i, "description", e.target.value)}
                    rows={2}
                    placeholder="Feature description..."
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Valid Until */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Validity</CardTitle>
            </CardHeader>
            <CardContent>
              <Label className="text-xs">Valid Until</Label>
              <Input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right — Milestones */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  Milestone Billing
                </CardTitle>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={recalcMilestoneAmounts}
                  className="text-xs"
                >
                  Recalc from %
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {milestones.map((m, i) => (
                <div key={i} className="p-3 rounded-lg bg-muted/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5">
                      {i + 1}
                    </span>
                    <Input
                      value={m.name}
                      onChange={(e) => updateMilestone(i, "name", e.target.value)}
                      className="flex-1"
                      placeholder="Milestone name..."
                    />
                  </div>
                  <Input
                    value={m.description}
                    onChange={(e) =>
                      updateMilestone(i, "description", e.target.value)
                    }
                    placeholder="Description..."
                    className="text-sm"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">% of Total</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={m.percentage || ""}
                        onChange={(e) =>
                          updateMilestone(
                            i,
                            "percentage",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Amount ($)</Label>
                      <Input
                        type="number"
                        value={m.amount || ""}
                        onChange={(e) =>
                          updateMilestone(
                            i,
                            "amount",
                            parseFloat(e.target.value) || 0
                          )
                        }
                      />
                    </div>
                  </div>
                </div>
              ))}

              {/* Summary */}
              <div className="mt-4 pt-3 border-t space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Milestone Sum</span>
                  <span
                    className={`font-medium tabular-nums ${
                      Math.abs(milestoneSum - finalTotal) > 1
                        ? "text-yellow-400"
                        : ""
                    }`}
                  >
                    {fmt(milestoneSum)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Project Total</span>
                  <span className="font-bold tabular-nums">
                    {fmt(finalTotal)}
                  </span>
                </div>
                {Math.abs(milestoneSum - finalTotal) > 1 && (
                  <p className="text-xs text-yellow-400 mt-1">
                    Milestones don&apos;t sum to project total (difference:{" "}
                    {fmt(Math.abs(milestoneSum - finalTotal))})
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Render Images — upload + manage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Render Images ({renderImages.length}/3)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {/* Thumbnails with remove */}
              {renderImages.map((img, i) => (
                <div
                  key={i}
                  className="relative group rounded-lg overflow-hidden border bg-muted/30"
                >
                  <div className="flex items-center gap-2 p-2">
                    <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <img
                        src={img}
                        alt={`Render ${i + 1}`}
                        className="w-full aspect-video object-cover rounded"
                      />
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        setRenderImages((prev) => prev.filter((_, idx) => idx !== i));
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="px-2 pb-2 text-[10px] text-muted-foreground truncate">
                    Render {i + 1}
                  </p>
                </div>
              ))}

              {/* Upload button */}
              {renderImages.length < 3 && (
                <label
                  className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed rounded-lg cursor-pointer transition hover:border-primary/40 hover:bg-muted/30 ${
                    uploading ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !proposal) return;

                      setUploading(true);
                      setUploadError("");
                      const formData = new FormData();
                      formData.append("file", file);
                      formData.append("clientId", proposal.clientId);
                      formData.append("category", "GEMINI_RENDER");

                      try {
                        const res = await fetch("/api/upload", {
                          method: "POST",
                          body: formData,
                        });
                        const data = await res.json();
                        if (res.ok) {
                          setRenderImages((prev) => [...prev, data.storagePath]);
                        } else {
                          setUploadError(data.error || "Upload failed");
                        }
                      } catch (err) {
                        setUploadError(err instanceof Error ? err.message : "Upload failed");
                      }
                      setUploading(false);
                      e.target.value = "";
                    }}
                  />
                  {uploading ? (
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  ) : (
                    <Upload className="h-6 w-6 text-muted-foreground" />
                  )}
                  <span className="text-xs text-muted-foreground">
                    {uploading
                      ? "Uploading..."
                      : `Upload render image (${3 - renderImages.length} remaining)`}
                  </span>
                </label>
              )}

              {uploadError && (
                <p className="text-xs text-red-400">{uploadError}</p>
              )}
              <p className="text-[10px] text-muted-foreground">
                Images appear in the &quot;Our Approach&quot; section of the proposal. Click Save to persist changes.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
