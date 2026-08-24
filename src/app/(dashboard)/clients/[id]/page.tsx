"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { PageHeader } from "@/components/layout/page-header";
import {
  DESIGN_STATUS_LABELS,
  DESIGN_STATUS_COLORS,
  FILE_CATEGORY_LABELS,
  PHOTO_ANGLE_LABELS,
} from "@/lib/constants";
import { calculateLeadScore } from "@/lib/scoring";
import {
  ArrowLeft,
  Calculator,
  Copy,
  ExternalLink,
  FileSignature,
  FileText,
  Image as ImageIcon,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import {
  PROPOSAL_STATUS_LABELS,
  PROPOSAL_STATUS_COLORS,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
} from "@/lib/constants";
import { BUILD_STATUS_LABELS, BUILD_STATUS_COLORS } from "@/lib/pool-costs";
import Link from "next/link";

interface ClientDetail {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  zip: string | null;
  source: string | null;
  leadScore: number;
  timeline: string | null;
  budget: string | null;
  financingInterested: boolean;
  hasSpecificFeatures: boolean;
  homeownerConfirmed: boolean;
  inServiceArea: boolean;
  notes: string | null;
  prepToken: string | null;
  prepTokenSent: string | null;
  prepCompleted: string | null;
  createdAt: string;
  designProject: {
    id: string;
    status: string;
    templateUsed: string | null;
    renderJobs: { id: string }[];
  } | null;
  files: {
    id: string;
    filename: string;
    storagePath: string;
    fileType: string;
    fileSize: number;
    category: string;
    angle: string | null;
    description: string | null;
    createdAt: string;
  }[];
}
export default function ClientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [creatingDesign, setCreatingDesign] = useState(false);
  const [linkedBuilds, setLinkedBuilds] = useState<{ id: string; name: string; status: string; salePrice: number }[]>([]);
  const [proposals, setProposals] = useState<{
    id: string;
    status: string;
    total: number;
    buildName: string;
    shareToken: string | null;
  }[]>([]);
  const [contracts, setContracts] = useState<{ id: string; status: string; proposal: { total: number } }[]>([]);

  const fetchClient = useCallback(async () => {
    const res = await fetch(`/api/clients/${id}`);
    if (!res.ok) {
      router.push("/clients");
      return;
    }
    const data = await res.json();
    setClient(data);
    setLoading(false);
  }, [id, router]);

  const fetchRelated = useCallback(async () => {
    const [buildsRes, proposalsRes, contractsRes] = await Promise.all([
      fetch(`/api/builds?clientId=${id}`).then((r) => r.ok ? r.json() : []).catch(() => []),
      fetch(`/api/proposals?clientId=${id}`).then((r) => r.ok ? r.json() : []).catch(() => []),
      fetch(`/api/contracts`).then((r) => r.ok ? r.json() : []).catch(() => []),
    ]);
    // Builds with clientId matching
    const builds = (buildsRes as { id: string; name: string; status: string; salePrice: number; clientId: string | null }[])
      .filter((b) => b.clientId === id);
    setLinkedBuilds(builds);
    setProposals(proposalsRes);
    // Filter contracts to those from this client's proposals
    const proposalIds = new Set(proposalsRes.map((p: { id: string }) => p.id));
    const clientContracts = (contractsRes as { id: string; status: string; proposalId: string; proposal: { total: number } }[])
      .filter((c) => proposalIds.has(c.proposalId));
    setContracts(clientContracts);
  }, [id]);

  useEffect(() => {
    fetchClient();
    fetchRelated();
  }, [fetchClient, fetchRelated]);

  const sendPrepKit = async () => {
    if (!client) return;
    await fetch(`/api/clients/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prepTokenSent: new Date().toISOString() }),
    });
    fetchClient();
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    category: string
  ) => {
    const file = e.target.files?.[0];
    if (!file || !client) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("clientId", client.id);
    formData.append("category", category);

    await fetch("/api/upload", { method: "POST", body: formData });
    setUploading(false);
    fetchClient();
  };

  const createDesignProject = async () => {
    if (!client) return;
    setCreatingDesign(true);
    await fetch("/api/designs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId: client.id }),
    });
    setCreatingDesign(false);
    fetchClient();
  };

  const deleteClient = async () => {
    const pin = prompt("Enter admin PIN to delete this client:");
    if (!pin) return;
    const res = await fetch(`/api/clients/${id}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin }),
    });
    if (!res.ok) {
      alert("Invalid PIN. Client not deleted.");
      return;
    }
    router.push("/clients");
  };

  if (loading || !client) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const prepKitUrl = client.prepToken
    ? `${typeof window !== "undefined" ? window.location.origin : ""}/prep/${client.prepToken}`
    : null;

  const scoreBreakdown = calculateLeadScore({
    timeline: client.timeline,
    financingInterested: client.financingInterested,
    hasSpecificFeatures: client.hasSpecificFeatures,
    homeownerConfirmed: client.homeownerConfirmed,
    inServiceArea: client.inServiceArea,
    city: client.city,
    prepCompleted: client.prepCompleted,
    prepTokenSent: client.prepTokenSent,
  });

  const surveys = client.files.filter((f) => f.category === "SURVEY");
  const photos = client.files.filter((f) => f.category === "BACKYARD_PHOTO");
  const otherFiles = client.files.filter(
    (f) => !["SURVEY", "BACKYARD_PHOTO"].includes(f.category)
  );

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <PageHeader
        title={client.name}
        description={`Added ${new Date(client.createdAt).toLocaleDateString()}`}
        action={
          <div className="flex gap-2">
            {!client.designProject && (
              <Button
                size="sm"
                variant="outline"
                onClick={createDesignProject}
                disabled={creatingDesign}
              >
                {creatingDesign ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : null}
                Create Design Project
              </Button>
            )}
            <Button
              size="sm"
              variant="destructive"
              onClick={deleteClient}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        }
      />

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left Column: Contact + Score */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              {client.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${client.phone}`} className="hover:underline">
                    {client.phone}
                  </a>
                </div>
              )}
              {client.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${client.email}`} className="hover:underline">
                    {client.email}
                  </a>
                </div>
              )}
              {(client.address || client.city) && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {[client.address, client.city, client.zip]
                      .filter(Boolean)
                      .join(", ")}
                  </span>
                </div>
              )}
              {client.source && (
                <div className="text-muted-foreground">
                  Source: {client.source}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Lead Score
                <Badge variant="default" className="text-lg px-3">
                  {client.leadScore}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {scoreBreakdown.factors.map((f, i) => (
                <div
                  key={i}
                  className={`flex items-center justify-between text-sm ${
                    !f.applied ? "opacity-40" : ""
                  }`}
                >
                  <span>{f.label}</span>
                  <span
                    className={
                      f.points > 0 ? "text-green-400" : "text-red-400"
                    }
                  >
                    {f.applied
                      ? `${f.points > 0 ? "+" : ""}${f.points}`
                      : "-"}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Qualifying Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Timeline</span>
                <span className="font-medium">
                  {client.timeline || "Not set"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Budget</span>
                <span className="font-medium">
                  {client.budget || "Not set"}
                </span>
              </div>
              <Separator />
              <div className="space-y-1">
                {[
                  {
                    label: "Financing Interested",
                    value: client.financingInterested,
                  },
                  {
                    label: "Specific Features",
                    value: client.hasSpecificFeatures,
                  },
                  {
                    label: "Homeowner Confirmed",
                    value: client.homeownerConfirmed,
                  },
                  { label: "In Service Area", value: client.inServiceArea },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between"
                  >
                    <span>{item.label}</span>
                    <span>{item.value ? "Yes" : "No"}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Files, Design, Prep Kit */}
        <div className="md:col-span-2 space-y-4">
          {/* Prep Kit Link */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Design Prep Kit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {prepKitUrl && (
                <div className="flex items-center gap-2">
                  <Input
                    value={prepKitUrl}
                    readOnly
                    className="text-xs font-mono"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(prepKitUrl);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Link href={prepKitUrl} target="_blank">
                    <Button size="sm" variant="outline">
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              )}
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Sent: </span>
                  {client.prepTokenSent ? (
                    new Date(client.prepTokenSent).toLocaleDateString()
                  ) : (
                    <Button size="sm" variant="outline" onClick={sendPrepKit}>
                      Mark as Sent
                    </Button>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Completed: </span>
                  {client.prepCompleted
                    ? new Date(client.prepCompleted).toLocaleDateString()
                    : "Not yet"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Design Project Status */}
          {client.designProject && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  Design Project
                  <Badge
                    className={
                      DESIGN_STATUS_COLORS[client.designProject.status]
                    }
                  >
                    {DESIGN_STATUS_LABELS[client.designProject.status]}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Link href={`/designs/${client.designProject.id}`}>
                  <Button variant="outline" size="sm">
                    View Design Details
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Linked Builds */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <Calculator className="h-4 w-4" />
                  Builds ({linkedBuilds.length})
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {linkedBuilds.length > 0 ? (
                <div className="space-y-2">
                  {linkedBuilds.map((build) => (
                    <Link key={build.id} href={`/builds/${build.id}`}>
                      <div className="flex items-center justify-between p-2 rounded hover:bg-accent">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">{build.name}</span>
                          <Badge variant="secondary" className={BUILD_STATUS_COLORS[build.status]}>
                            {BUILD_STATUS_LABELS[build.status]}
                          </Badge>
                        </div>
                        {build.salePrice > 0 && (
                          <span className="text-sm tabular-nums text-muted-foreground">
                            {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(build.salePrice)}
                          </span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">No builds linked to this client</p>
              )}
            </CardContent>
          </Card>

          {/* Proposals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Proposals ({proposals.length})
                </span>
                <Link href={`/proposals/new?clientId=${id}`}>
                  <Button size="sm" variant="outline">
                    <Plus className="h-3 w-3 mr-1" />
                    New
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {proposals.length > 0 ? (
                <div className="space-y-2">
                  {proposals.map((p) => (
                    <Link
                      key={p.id}
                      href={
                        p.shareToken
                          ? `/p/${p.shareToken}`
                          : `/proposals/${p.id}/template`
                      }
                    >
                      <div className="flex items-center justify-between p-2 rounded hover:bg-accent">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{p.buildName}</span>
                          <Badge variant="secondary" className={PROPOSAL_STATUS_COLORS[p.status]}>
                            {PROPOSAL_STATUS_LABELS[p.status]}
                          </Badge>
                        </div>
                        <span className="text-sm font-medium tabular-nums">
                          {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(p.total)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-2">No proposals yet</p>
              )}
            </CardContent>
          </Card>

          {/* Contracts */}
          {contracts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileSignature className="h-4 w-4" />
                  Contracts ({contracts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {contracts.map((c) => (
                    <Link key={c.id} href={`/contracts/${c.id}`}>
                      <div className="flex items-center justify-between p-2 rounded hover:bg-accent">
                        <Badge variant="secondary" className={CONTRACT_STATUS_COLORS[c.status]}>
                          {CONTRACT_STATUS_LABELS[c.status]}
                        </Badge>
                        <span className="text-sm font-medium tabular-nums">
                          {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 0 }).format(c.proposal.total)}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Files */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Files ({client.files.length})
                <div className="flex gap-2">
                  <label>
                    <Button size="sm" variant="outline" asChild>
                      <span>
                        <Upload className="h-4 w-4 mr-1" />
                        {uploading ? "Uploading..." : "Upload"}
                      </span>
                    </Button>
                    <input
                      type="file"
                      className="hidden"
                      onChange={(e) => handleFileUpload(e, "OTHER")}
                    />
                  </label>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="photos">
                <TabsList className="mb-4">
                  <TabsTrigger value="photos">
                    Photos ({photos.length})
                  </TabsTrigger>
                  <TabsTrigger value="survey">
                    Survey ({surveys.length})
                  </TabsTrigger>
                  <TabsTrigger value="other">
                    Other ({otherFiles.length})
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="photos">
                  {photos.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3">
                      {photos.map((file) => (
                        <div
                          key={file.id}
                          className="border rounded-lg overflow-hidden"
                        >
                          {file.fileType.startsWith("image/") ? (
                            <img
                              src={file.storagePath}
                              alt={file.angle || file.filename}
                              className="w-full h-32 object-cover"
                            />
                          ) : (
                            <div className="w-full h-32 flex items-center justify-center bg-muted">
                              <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          <div className="p-2 text-xs">
                            <p className="font-medium">
                              {file.angle
                                ? PHOTO_ANGLE_LABELS[file.angle]
                                : file.filename}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No backyard photos yet
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="survey">
                  {surveys.length > 0 ? (
                    <div className="space-y-2">
                      {surveys.map((file) => (
                        <a
                          key={file.id}
                          href={file.storagePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded hover:bg-accent"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{file.filename}</span>
                          <span className="text-xs text-muted-foreground ml-auto">
                            {(file.fileSize / 1024).toFixed(0)} KB
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No survey uploaded yet
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="other">
                  {otherFiles.length > 0 ? (
                    <div className="space-y-2">
                      {otherFiles.map((file) => (
                        <a
                          key={file.id}
                          href={file.storagePath}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 p-2 rounded hover:bg-accent"
                        >
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">{file.filename}</p>
                            <p className="text-xs text-muted-foreground">
                              {FILE_CATEGORY_LABELS[file.category]}
                            </p>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {(file.fileSize / 1024).toFixed(0)} KB
                          </span>
                        </a>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground py-4 text-center">
                      No other files
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Notes */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
