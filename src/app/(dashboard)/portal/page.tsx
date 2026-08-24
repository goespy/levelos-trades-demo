"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/layout/page-header";
import { Globe, Copy, ExternalLink, Check } from "lucide-react";

interface JobPhase {
  id: string;
  name: string;
  sortOrder: number;
  status: string;
}

interface PortalJob {
  id: string;
  name: string;
  status: string;
  portalToken: string | null;
  client: { id: string; name: string; email: string | null } | null;
  phases: JobPhase[];
  progress: { complete: number; total: number; percent: number };
  currentPhaseName: string | null;
}

export default function PortalAdminPage() {
  const [jobs, setJobs] = useState<PortalJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/jobs`)
      .then((r) => r.json())
      .then((data: PortalJob[]) => {
        setJobs(data.filter((j) => j.portalToken));
        setLoading(false);
      });
  }, []);

  const copyLink = async (token: string, jobId: string) => {
    const url = `${window.location.origin}/j/${token}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(jobId);
      setTimeout(() => setCopiedId(null), 1500);
    } catch {
      // Fallback for environments where clipboard API fails
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopiedId(jobId);
      setTimeout(() => setCopiedId(null), 1500);
    }
  };

  return (
    <div>
      <PageHeader
        title="Customer Portal"
        description={`${jobs.length} ${jobs.length === 1 ? "portal" : "portals"} active`}
      />

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : jobs.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <Globe className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">
              No active customer portals. Portals are created when a job is
              started from a contract.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {jobs.map((job) => {
            const portalUrl = job.portalToken
              ? `/j/${job.portalToken}`
              : null;
            const isCopied = copiedId === job.id;
            return (
              <Card key={job.id}>
                <CardContent>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold truncate">
                          {job.client?.name || "Unknown Client"}
                        </p>
                        <Badge variant="outline">{job.name}</Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {job.currentPhaseName && (
                          <>
                            <span>Current phase:</span>
                            <span className="font-medium text-foreground">
                              {job.currentPhaseName}
                            </span>
                          </>
                        )}
                        {!job.currentPhaseName && job.progress.percent === 100 && (
                          <span className="text-green-500 font-medium">
                            Complete
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Progress
                          value={job.progress.percent}
                          className="h-2 flex-1"
                        />
                        <span className="text-xs tabular-nums text-muted-foreground shrink-0">
                          {job.progress.complete}/{job.progress.total} phases
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          job.portalToken && copyLink(job.portalToken, job.id)
                        }
                      >
                        {isCopied ? (
                          <>
                            <Check className="h-4 w-4 mr-1 text-green-500" />
                            Copied
                          </>
                        ) : (
                          <>
                            <Copy className="h-4 w-4 mr-1" />
                            Copy Link
                          </>
                        )}
                      </Button>
                      {portalUrl && (
                        <a
                          href={portalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <Button variant="default" size="sm">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Open
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
