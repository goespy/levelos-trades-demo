"use client";

import { useEffect, useState } from "react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { PageHeader } from "@/components/layout/page-header";
import { Star, Send, RefreshCw, Plus, Copy, Check } from "lucide-react";

interface ReviewItem {
  id: string;
  jobId: string;
  status: string;
  rating: number | null;
  text: string | null;
  platform: string | null;
  requestSentAt: string | null;
  completedAt: string | null;
  requestToken: string | null;
  publicReviewUrl: string | null;
  job: { id: string; name: string } | null;
  client: { id: string; name: string; email: string | null } | null;
}

interface JobOption {
  id: string;
  name: string;
  status: string;
  client: { id: string; name: string } | null;
  progress: { complete: number; total: number; percent: number };
}

const PLATFORMS = ["Google", "Yelp", "Facebook", "Internal"];

function daysSince(dateStr: string | null): number | null {
  if (!dateStr) return null;
  const ms = Date.now() - new Date(dateStr).getTime();
  return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
}

function StarsDisplay({ count }: { count: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={
            n <= count
              ? "h-4 w-4 fill-yellow-400 text-yellow-400"
              : "h-4 w-4 text-muted-foreground/30"
          }
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Send-new-request form state
  const [selectedJobId, setSelectedJobId] = useState<string>("");
  const [selectedPlatform, setSelectedPlatform] = useState<string>("Google");
  const [submitting, setSubmitting] = useState(false);

  const loadAll = async () => {
    const [rRes, jRes] = await Promise.all([
      fetch("/api/reviews"),
      fetch("/api/jobs"),
    ]);
    const [rData, jData] = await Promise.all([rRes.json(), jRes.json()]);
    setReviews(rData);
    setJobs(jData);
    setLoading(false);
  };

  useEffect(() => {
    const run = async () => {
      const [rRes, jRes] = await Promise.all([
        fetch("/api/reviews"),
        fetch("/api/jobs"),
      ]);
      const [rData, jData] = await Promise.all([rRes.json(), jRes.json()]);
      setReviews(rData);
      setJobs(jData);
      setLoading(false);
    };
    run();
  }, []);

  const handleResend = async (id: string) => {
    setResendingId(id);
    await fetch(`/api/reviews/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "resend" }),
    });
    await loadAll();
    setResendingId(null);
  };

  const handleSubmit = async () => {
    if (!selectedJobId) return;
    setSubmitting(true);
    await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId: selectedJobId,
        platform: selectedPlatform,
      }),
    });
    setSelectedJobId("");
    setSelectedPlatform("Google");
    await loadAll();
    setSubmitting(false);
  };

  const handleCopyReviewLink = async (id: string, token: string | null) => {
    if (!token) return;
    const url = `${window.location.origin}/review/${token}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = url;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const pending = reviews.filter((r) => r.status === "REQUESTED");
  const completed = reviews.filter((r) => r.status === "COMPLETED");

  // Aggregate metrics on completed reviews only
  const ratings = completed.map((r) => r.rating || 0).filter((n) => n > 0);
  const avg =
    ratings.length > 0
      ? ratings.reduce((a, b) => a + b, 0) / ratings.length
      : 0;

  // Eligible jobs for new review request: any active or complete job
  const eligibleJobs = jobs.filter(
    (j) => j.status === "ACTIVE" || j.status === "COMPLETE"
  );

  return (
    <div>
      <PageHeader
        title="Reviews"
        description={
          completed.length > 0
            ? `${avg.toFixed(1)} avg rating • ${completed.length} completed • ${pending.length} pending`
            : `${pending.length} pending • no completed reviews yet`
        }
      />

      {/* Aggregate banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <Card>
          <CardContent>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Avg Rating
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold tabular-nums">
                {ratings.length > 0 ? avg.toFixed(1) : "—"}
              </span>
              {ratings.length > 0 && <StarsDisplay count={Math.round(avg)} />}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Completed Reviews
            </div>
            <div className="text-2xl font-bold tabular-nums mt-1">
              {completed.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="text-xs uppercase tracking-wider text-muted-foreground">
              Pending Requests
            </div>
            <div className="text-2xl font-bold tabular-nums mt-1">
              {pending.length}
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <Tabs defaultValue="pending">
          <TabsList>
            <TabsTrigger value="pending">
              Pending
              <Badge variant="secondary" className="ml-1.5">
                {pending.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="completed">
              Completed
              <Badge variant="secondary" className="ml-1.5">
                {completed.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="new">
              <Plus className="h-3.5 w-3.5" />
              New Request
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="mt-4">
            {pending.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No pending review requests.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {pending.map((r) => {
                  const days = daysSince(r.requestSentAt);
                  return (
                    <Card key={r.id}>
                      <CardContent>
                        <div className="flex items-center justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium">
                                {r.client?.name || "Unknown"}
                              </p>
                              <Badge
                                variant="secondary"
                                className="bg-blue-500/15 text-blue-400"
                              >
                                {r.platform || "Google"}
                              </Badge>
                              {days !== null && days >= 7 && (
                                <Badge
                                  variant="secondary"
                                  className="bg-orange-500/15 text-orange-400"
                                >
                                  {days}d outstanding
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {r.job?.name && <span>{r.job.name}</span>}
                              {r.requestSentAt && (
                                <>
                                  {" • Sent "}
                                  {new Date(r.requestSentAt).toLocaleDateString()}
                                  {days !== null && (
                                    <>
                                      {" • "}
                                      <span>{days} day{days === 1 ? "" : "s"} ago</span>
                                    </>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleCopyReviewLink(r.id, r.requestToken)
                              }
                              disabled={!r.requestToken}
                            >
                              {copiedId === r.id ? (
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
                            <Button
                              size="sm"
                              onClick={() => handleResend(r.id)}
                              disabled={resendingId === r.id}
                            >
                              <RefreshCw
                                className={`h-4 w-4 mr-1 ${
                                  resendingId === r.id ? "animate-spin" : ""
                                }`}
                              />
                              Resend
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed" className="mt-4">
            {completed.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No completed reviews yet.
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {completed.map((r) => (
                  <Card key={r.id}>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium">
                              {r.client?.name || "Unknown"}
                            </p>
                            <Badge
                              variant="secondary"
                              className="bg-green-500/15 text-green-400"
                            >
                              {r.platform || "Internal"}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            {r.rating && <StarsDisplay count={r.rating} />}
                          </div>
                        </div>
                        {r.text && (
                          <p className="text-sm text-muted-foreground italic">
                            &ldquo;{r.text}&rdquo;
                          </p>
                        )}
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{r.job?.name}</span>
                          {r.completedAt && (
                            <span>
                              Posted{" "}
                              {new Date(r.completedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="new" className="mt-4">
            <Card>
              <CardContent className="space-y-4 pt-6">
                <div>
                  <label className="text-sm font-medium block mb-1.5">
                    Job
                  </label>
                  <Select
                    value={selectedJobId}
                    onValueChange={setSelectedJobId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pick a job to request a review for..." />
                    </SelectTrigger>
                    <SelectContent>
                      {eligibleJobs.length === 0 ? (
                        <SelectItem value="__none__" disabled>
                          No eligible jobs
                        </SelectItem>
                      ) : (
                        eligibleJobs.map((j) => (
                          <SelectItem key={j.id} value={j.id}>
                            {j.client?.name || "Unknown"} — {j.name}
                            {j.status === "COMPLETE"
                              ? " (Complete)"
                              : ` (${j.progress.percent}%)`}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">
                    Includes active jobs (for early requests) and completed
                    jobs.
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium block mb-1.5">
                    Platform
                  </label>
                  <Select
                    value={selectedPlatform}
                    onValueChange={setSelectedPlatform}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PLATFORMS.map((p) => (
                        <SelectItem key={p} value={p}>
                          {p}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={!selectedJobId || submitting}
                  className="w-full md:w-auto"
                >
                  <Send className="h-4 w-4 mr-1" />
                  {submitting ? "Sending..." : "Send Review Request"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
