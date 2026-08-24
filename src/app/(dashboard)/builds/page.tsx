"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  BUILD_STATUSES,
  BUILD_STATUS_LABELS,
  BUILD_STATUS_COLORS,
  MARGIN_THRESHOLDS,
} from "@/lib/pool-costs";
import { Plus, Search, Calculator } from "lucide-react";

interface BuildListItem {
  id: string;
  name: string;
  status: string;
  totalCOGS: number;
  salePrice: number;
  marginPct: number;
  updatedAt: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

function marginColor(pct: number) {
  if (pct >= MARGIN_THRESHOLDS.green) return "bg-green-500/15 text-green-400";
  if (pct >= MARGIN_THRESHOLDS.yellow) return "bg-yellow-500/15 text-yellow-400";
  return "bg-red-500/15 text-red-400";
}

export default function BuildsPage() {
  const [builds, setBuilds] = useState<BuildListItem[]>([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBuilds = async () => {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (status) params.set("status", status);
      const res = await fetch(`/api/builds?${params}`);
      const data = await res.json();
      setBuilds(data);
      setLoading(false);
    };
    const timer = setTimeout(fetchBuilds, 300);
    return () => clearTimeout(timer);
  }, [search, status]);

  return (
    <div>
      <PageHeader
        title="Builds"
        description={`${builds.length} total builds`}
        action={
          <Link href="/builds/new">
            <Button size="sm" data-tour="new-build-action">
              <Plus className="h-4 w-4 mr-1" />
              New Build
            </Button>
          </Link>
        }
      />

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v === "ALL" ? "" : v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All Statuses</SelectItem>
            {BUILD_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {BUILD_STATUS_LABELS[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : builds.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <Calculator className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">
              {search || status
                ? "No builds found matching your filters"
                : "No builds yet. Create your first cost estimate!"}
            </p>
            {!search && !status && (
              <Link href="/builds/new">
                <Button>
                  <Plus className="h-4 w-4 mr-1" />
                  Create First Build
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {builds.map((build) => (
            <Link key={build.id} href={`/builds/${build.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium truncate">{build.name}</p>
                        <Badge
                          variant="secondary"
                          className={BUILD_STATUS_COLORS[build.status]}
                        >
                          {BUILD_STATUS_LABELS[build.status]}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground tabular-nums">
                        <span>COGS {formatCurrency(build.totalCOGS)}</span>
                        {build.salePrice > 0 && (
                          <>
                            <span>&middot;</span>
                            <span>Sale {formatCurrency(build.salePrice)}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      {build.salePrice > 0 && (
                        <Badge
                          variant="secondary"
                          className={marginColor(build.marginPct)}
                        >
                          {build.marginPct.toFixed(1)}%
                        </Badge>
                      )}
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
