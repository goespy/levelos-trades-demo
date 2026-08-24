"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import { ArrowLeft, Loader2 } from "lucide-react";

interface ClientOption {
  id: string;
  name: string;
}

interface BuildOption {
  id: string;
  name: string;
  clientId: string | null;
  totalCOGS: number;
  salePrice: number;
  status: string;
}

function NewProposalForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const presetClientId = searchParams.get("clientId") || "";
  const presetBuildId = searchParams.get("buildId") || "";

  const [clients, setClients] = useState<ClientOption[]>([]);
  const [builds, setBuilds] = useState<BuildOption[]>([]);
  const [clientId, setClientId] = useState(presetClientId);
  const [buildId, setBuildId] = useState(presetBuildId);
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [createError, setCreateError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/clients").then((r) => r.json()),
      fetch("/api/builds").then((r) => r.json()),
    ]).then(([clientData, buildData]) => {
      setClients(clientData);
      setBuilds(buildData);
      setLoading(false);
    });
  }, []);

  // If a build has a clientId, auto-select the client
  useEffect(() => {
    if (buildId && !clientId) {
      const build = builds.find((b) => b.id === buildId);
      if (build?.clientId) {
        setClientId(build.clientId);
      }
    }
  }, [buildId, builds, clientId]);

  const filteredBuilds = clientId
    ? builds.filter((b) => b.clientId === clientId || !b.clientId)
    : builds;

  const selectedBuild = builds.find((b) => b.id === buildId);

  const handleCreate = async () => {
    if (!clientId || !buildId) return;
    setCreating(true);
    setCreateError(null);

    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, buildId, notes: notes || null }),
      });

      const body = await res.text();
      let parsed: { id?: string; error?: string } = {};
      try {
        parsed = body ? JSON.parse(body) : {};
      } catch {
        // non-JSON response
      }

      if (!res.ok || !parsed.id) {
        setCreating(false);
        setCreateError(
          `Create failed (${res.status}): ${parsed.error || body || "no response body"}`
        );
        console.error("Proposal create failed", { status: res.status, body });
        return;
      }

      router.push(`/proposals/${parsed.id}/template`);
    } catch (err) {
      setCreating(false);
      setCreateError(`Network error: ${err instanceof Error ? err.message : String(err)}`);
      console.error("Proposal create threw", err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const fmt = (v: number) =>
    new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <PageHeader
        title="New Proposal"
        description="Select a client and build to generate a proposal"
      />

      <div className="max-w-lg space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Client & Build</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-xs">Client</Label>
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select client..." />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs">Build</Label>
              <Select value={buildId} onValueChange={setBuildId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select build..." />
                </SelectTrigger>
                <SelectContent>
                  {filteredBuilds.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name} — {fmt(b.salePrice || b.totalCOGS)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedBuild && (
              <div className="p-3 rounded-lg bg-muted/50 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">COGS</span>
                  <span className="font-medium tabular-nums">{fmt(selectedBuild.totalCOGS)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sale Price</span>
                  <span className="font-medium tabular-nums">{fmt(selectedBuild.salePrice)}</span>
                </div>
              </div>
            )}

            <div>
              <Label className="text-xs">Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Any notes for this proposal..."
              />
            </div>
          </CardContent>
        </Card>

        <Button
          onClick={handleCreate}
          disabled={!clientId || !buildId || creating}
          className="w-full"
        >
          {creating ? (
            <Loader2 className="h-4 w-4 animate-spin mr-1" />
          ) : null}
          Generate Proposal
        </Button>

        {createError && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-sm text-red-400 whitespace-pre-wrap">
            {createError}
          </div>
        )}
      </div>
    </div>
  );
}

export default function NewProposalPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    }>
      <NewProposalForm />
    </Suspense>
  );
}
