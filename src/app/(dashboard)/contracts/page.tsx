"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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
  CONTRACT_STATUSES,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
} from "@/lib/constants";
import { FileSignature } from "lucide-react";

interface ContractListItem {
  id: string;
  status: string;
  clientName: string;
  proposal: { id: string; total: number };
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

function ContractsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [contracts, setContracts] = useState<ContractListItem[]>([]);
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const res = await fetch(`/api/contracts?${params}`);
      const data = await res.json();
      setContracts(data);
      setLoading(false);
    };
    fetchContracts();
  }, [status]);
  useEffect(() => { if (searchParams.get("tourSigned") === "1") { const hayward = contracts.find((c) => c.demoKey === "hayward-signed-contract"); if (hayward) router.replace(`/contracts/${hayward.id}`); } }, [contracts, router, searchParams]);

  return (
    <div>
      <PageHeader
        title="Contracts"
        description={`${contracts.length} total contracts`}
      />

      <div className="flex gap-2 mb-4">
        <Select value={status} onValueChange={(v) => setStatus(v === "ALL" ? "" : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {CONTRACT_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {CONTRACT_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : contracts.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <FileSignature className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">
              {status
                ? "No contracts found matching your filter"
                : "No contracts yet. Generate one from a proposal!"}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {contracts.map((contract) => (
            <Link key={contract.id} href={`/contracts/${contract.id}`} data-tour={contract.demoKey ?? undefined}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{contract.clientName}</p>
                        <Badge
                          variant="secondary"
                          className={CONTRACT_STATUS_COLORS[contract.status]}
                        >
                          {CONTRACT_STATUS_LABELS[contract.status]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                        <span>{new Date(contract.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="font-semibold tabular-nums">
                        {formatCurrency(contract.proposal.total)}
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

export default function ContractsPage() { return <Suspense fallback={<div className="py-8 text-center text-muted-foreground">Loading contracts…</div>}><ContractsContent /></Suspense>; }
