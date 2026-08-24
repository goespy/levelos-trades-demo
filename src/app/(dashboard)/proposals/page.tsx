"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/layout/page-header";
import {
  PROPOSAL_STATUSES,
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUS_COLORS,
} from "@/lib/constants";
import { Plus, FileText } from "lucide-react";

interface ProposalListItem {
  id: string;
  clientId: string;
  clientName: string;
  buildName: string;
  status: string;
  total: number;
  discount: number;
  updatedAt: string;
  demoKey: string | null;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function ProposalsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [proposals, setProposals] = useState<ProposalListItem[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProposals = async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const res = await fetch(`/api/proposals?${params}`);
      const data = await res.json();
      setProposals(data);
      setLoading(false);
    };
    fetchProposals();
  }, [status]);
  useEffect(() => { if (searchParams.get("tourPreview") === "1") { const fixture = proposals.find((proposal) => proposal.demoKey === "hayward-internal-proposal"); if (fixture) router.replace(`/proposals/${fixture.id}/template?tourPreview=1`); } }, [proposals, router, searchParams]);

  return (
    <div>
      <PageHeader
        title="Proposals"
        description={`${proposals.length} total proposals`}
        action={
          <Link href="/proposals/new">
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              New Proposal
            </Button>
          </Link>
        }
      />

      <div className="flex gap-2 mb-4">
        <Select value={status} onValueChange={(v) => setStatus(v === "ALL" ? "" : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {PROPOSAL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {PROPOSAL_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : proposals.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">
              {status
                ? "No proposals found matching your filter"
                : "No proposals yet. Create one from a client's build!"}
            </p>
            {!status && (
              <Link href="/proposals/new">
                <Button>
                  <Plus className="h-4 w-4 mr-1" />
                  Create First Proposal
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {proposals.map((proposal) => (
            <Link key={proposal.id} href={`/proposals/${proposal.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{proposal.clientName}</p>
                        <Badge
                          variant="secondary"
                          className={PROPOSAL_STATUS_COLORS[proposal.status]}
                        >
                          {PROPOSAL_STATUS_LABELS[proposal.status]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>Build: {proposal.buildName}</span>
                        <span>&middot;</span>
                        <span>{new Date(proposal.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="font-semibold tabular-nums">
                        {formatCurrency(proposal.total - proposal.discount)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function ProposalsPage() { return <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Loading proposals…</div>}><ProposalsContent /></Suspense>; }
