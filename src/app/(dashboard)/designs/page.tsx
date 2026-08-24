"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/layout/page-header";
import { DESIGN_STATUSES, DESIGN_STATUS_LABELS, DESIGN_STATUS_COLORS } from "@/lib/constants";
import { Palette, Loader2 } from "lucide-react";

interface DesignListItem {
  id: string;
  status: string;
  templateUsed: string | null;
  createdAt: string;
  updatedAt: string;
  client: {
    id: string;
    name: string;
    city: string | null;
  };
  files: { id: string; category: string }[];
  renderJobs: { id: string }[];
}

export default function DesignsPage() {
  const [designs, setDesigns] = useState<DesignListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/designs")
      .then((r) => r.json())
      .then((data) => {
        setDesigns(data);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Group by status
  const grouped: Record<string, DesignListItem[]> = {};
  DESIGN_STATUSES.forEach((s) => {
    grouped[s] = designs.filter((d) => d.status === s);
  });

  return (
    <div>
      <PageHeader
        title="Design Projects"
        description={`${designs.length} total projects`}
      />

      {designs.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <Palette className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">
              No design projects yet. Create one from a client&apos;s detail page.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {DESIGN_STATUSES.map((status) => {
            const items = grouped[status];
            if (items.length === 0) return null;
            return (
              <div key={status}>
                <div className="flex items-center gap-2 mb-3">
                  <Badge
                    variant="secondary"
                    className={DESIGN_STATUS_COLORS[status]}
                  >
                    {DESIGN_STATUS_LABELS[status]}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    ({items.length})
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {items.map((design) => (
                    <Link key={design.id} href={`/designs/${design.id}`}>
                      <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">
                            {design.client.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="text-sm space-y-1">
                          {design.client.city && (
                            <p className="text-muted-foreground">
                              {design.client.city}
                            </p>
                          )}
                          {design.templateUsed && (
                            <p>Template: {design.templateUsed}</p>
                          )}
                          <div className="flex gap-2 pt-1">
                            <span className="text-xs text-muted-foreground">
                              {design.files.length} files
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {design.renderJobs.length} renders
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
