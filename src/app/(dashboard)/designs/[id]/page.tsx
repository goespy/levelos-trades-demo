"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
import {
  DESIGN_STATUSES,
  DESIGN_STATUS_LABELS,
  DESIGN_STATUS_COLORS,
  POOL_TEMPLATES,
  FILE_CATEGORY_LABELS,
} from "@/lib/constants";
import {
  ArrowLeft,
  Loader2,
  Save,
  Image as ImageIcon,
  Upload,
  FileText,
} from "lucide-react";
import Link from "next/link";

interface DesignDetail {
  id: string;
  clientId: string;
  status: string;
  templateUsed: string | null;
  lotWidth: number | null;
  lotDepth: number | null;
  setbackFront: number | null;
  setbackSide: number | null;
  setbackRear: number | null;
  poolStyle: string | null;
  poolFeatures: string[] | null;
  estimatedSize: string | null;
  zoning: string | null;
  obstacles: string | null;
  surveyReceived: boolean;
  photosReceived: boolean;
  designStarted: string | null;
  designCompleted: string | null;
  rendersCompleted: string | null;
  notes: string | null;
  createdAt: string;
  client: {
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    city: string | null;
  };
  files: {
    id: string;
    filename: string;
    storagePath: string;
    fileType: string;
    fileSize: number;
    category: string;
    createdAt: string;
  }[];
  renderJobs: {
    id: string;
    promptUsed: string;
    rating: number | null;
    selected: boolean;
    createdAt: string;
    sourceScreenshot: { storagePath: string } | null;
    outputFiles: { id: string; storagePath: string; filename: string }[];
  }[];
}

export default function DesignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [design, setDesign] = useState<DesignDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [customTemplateNames, setCustomTemplateNames] = useState<string[]>([]);
  const [form, setForm] = useState({
    status: "",
    templateUsed: "",
    lotWidth: "",
    lotDepth: "",
    setbackFront: "",
    setbackSide: "",
    setbackRear: "",
    poolStyle: "",
    estimatedSize: "",
    zoning: "",
    obstacles: "",
    notes: "",
  });

  const fetchDesign = useCallback(async () => {
    const res = await fetch(`/api/designs/${id}`);
    if (!res.ok) {
      router.push("/designs");
      return;
    }
    const data = await res.json();
    setDesign(data);
    setForm({
      status: data.status,
      templateUsed: data.templateUsed || "",
      lotWidth: data.lotWidth?.toString() || "",
      lotDepth: data.lotDepth?.toString() || "",
      setbackFront: data.setbackFront?.toString() || "",
      setbackSide: data.setbackSide?.toString() || "",
      setbackRear: data.setbackRear?.toString() || "",
      poolStyle: data.poolStyle || "",
      estimatedSize: data.estimatedSize || "",
      zoning: data.zoning || "",
      obstacles: data.obstacles || "",
      notes: data.notes || "",
    });
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchDesign();
    fetch("/api/pool-templates")
      .then((r) => r.json())
      .then((data) => setCustomTemplateNames(data.map((t: { name: string }) => t.name)));
  }, [fetchDesign]);

  const handleSave = async () => {
    setSaving(true);
    await fetch(`/api/designs/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: form.status,
        templateUsed: form.templateUsed || null,
        lotWidth: form.lotWidth ? parseFloat(form.lotWidth) : null,
        lotDepth: form.lotDepth ? parseFloat(form.lotDepth) : null,
        setbackFront: form.setbackFront ? parseFloat(form.setbackFront) : null,
        setbackSide: form.setbackSide ? parseFloat(form.setbackSide) : null,
        setbackRear: form.setbackRear ? parseFloat(form.setbackRear) : null,
        poolStyle: form.poolStyle || null,
        estimatedSize: form.estimatedSize || null,
        zoning: form.zoning || null,
        obstacles: form.obstacles || null,
        notes: form.notes || null,
      }),
    });
    setSaving(false);
    fetchDesign();
  };

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    category: string
  ) => {
    const file = e.target.files?.[0];
    if (!file || !design) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("clientId", design.clientId);
    formData.append("designProjectId", design.id);
    formData.append("category", category);

    await fetch("/api/upload", { method: "POST", body: formData });
    setUploading(false);
    fetchDesign();
  };

  if (loading || !design) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const screenshots = design.files.filter(
    (f) => f.category === "VIP3D_SCREENSHOT"
  );
  const otherFiles = design.files.filter(
    (f) => f.category !== "VIP3D_SCREENSHOT"
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
        title={`Design: ${design.client.name}`}
        description={design.client.city || undefined}
        action={
          <div className="flex items-center gap-2">
            <Badge className={DESIGN_STATUS_COLORS[design.status]}>
              {DESIGN_STATUS_LABELS[design.status]}
            </Badge>
            <Link href={`/clients/${design.client.id}`}>
              <Button variant="outline" size="sm">
                View Client
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Design Settings */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Project Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Status</Label>
                <Select
                  value={form.status}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, status: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DESIGN_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {DESIGN_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>VIP3D Template</Label>
                <Select
                  value={form.templateUsed}
                  onValueChange={(v) =>
                    setForm((prev) => ({ ...prev, templateUsed: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template" />
                  </SelectTrigger>
                  <SelectContent>
                    {POOL_TEMPLATES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                    {customTemplateNames
                      .filter((n) => !POOL_TEMPLATES.includes(n as typeof POOL_TEMPLATES[number]))
                      .map((n) => (
                        <SelectItem key={n} value={n}>
                          {n}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>
                  Survey:{" "}
                  {design.surveyReceived ? "Received" : "Missing"}
                </span>
                <span>
                  Photos:{" "}
                  {design.photosReceived ? "Received" : "Missing"}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lot Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Lot Width (ft)</Label>
                  <Input
                    type="number"
                    value={form.lotWidth}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, lotWidth: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label>Lot Depth (ft)</Label>
                  <Input
                    type="number"
                    value={form.lotDepth}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, lotDepth: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Front Setback</Label>
                  <Input
                    type="number"
                    value={form.setbackFront}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        setbackFront: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Side Setback</Label>
                  <Input
                    type="number"
                    value={form.setbackSide}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        setbackSide: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label>Rear Setback</Label>
                  <Input
                    type="number"
                    value={form.setbackRear}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        setbackRear: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <div>
                <Label>Zoning</Label>
                <Input
                  value={form.zoning}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, zoning: e.target.value }))
                  }
                  placeholder="RS-1, PD, etc."
                />
              </div>
              <div>
                <Label>Obstacles</Label>
                <Input
                  value={form.obstacles}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, obstacles: e.target.value }))
                  }
                  placeholder="Septic, trees, slope, etc."
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pool Specs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Pool Style</Label>
                <Input
                  value={form.poolStyle}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, poolStyle: e.target.value }))
                  }
                  placeholder="Freeform, Geometric, etc."
                />
              </div>
              <div>
                <Label>Estimated Size</Label>
                <Input
                  value={form.estimatedSize}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      estimatedSize: e.target.value,
                    }))
                  }
                  placeholder="12x24, 14x28, etc."
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={3}
                  placeholder="Design notes, client preferences..."
                />
              </div>
              <Button onClick={handleSave} disabled={saving} className="w-full">
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Save Changes
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Right: Files & Renders */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                VIP3D Screenshots ({screenshots.length})
                <label>
                  <Button size="sm" variant="outline" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-1" />
                      {uploading ? "..." : "Upload"}
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) =>
                      handleFileUpload(e, "VIP3D_SCREENSHOT")
                    }
                  />
                </label>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {screenshots.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {screenshots.map((file) => (
                    <a
                      key={file.id}
                      href={file.storagePath}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="border rounded overflow-hidden hover:ring-2 ring-primary"
                    >
                      <img
                        src={file.storagePath}
                        alt={file.filename}
                        className="w-full h-24 object-cover"
                      />
                      <p className="text-xs p-1 truncate">{file.filename}</p>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No screenshots yet
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Render Jobs ({design.renderJobs.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {design.renderJobs.length > 0 ? (
                <div className="space-y-3">
                  {design.renderJobs.map((job) => (
                    <Link
                      key={job.id}
                      href={`/renders/${job.id}`}
                      className="block p-3 border rounded hover:bg-accent"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            Render{" "}
                            {new Date(job.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                            {job.promptUsed.slice(0, 60)}...
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {job.rating && (
                            <Badge variant="outline">{job.rating}/5</Badge>
                          )}
                          {job.selected && (
                            <Badge variant="default">Selected</Badge>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No render jobs yet.{" "}
                  <Link
                    href={`/renders?designId=${design.id}`}
                    className="text-primary underline"
                  >
                    Create one
                  </Link>
                </p>
              )}
            </CardContent>
          </Card>

          {otherFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Other Files ({otherFiles.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
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
                    </a>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Timeline</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created</span>
                <span>{new Date(design.createdAt).toLocaleDateString()}</span>
              </div>
              {design.designStarted && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Design Started</span>
                  <span>
                    {new Date(design.designStarted).toLocaleDateString()}
                  </span>
                </div>
              )}
              {design.designCompleted && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Design Completed</span>
                  <span>
                    {new Date(design.designCompleted).toLocaleDateString()}
                  </span>
                </div>
              )}
              {design.rendersCompleted && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Renders Completed
                  </span>
                  <span>
                    {new Date(design.rendersCompleted).toLocaleDateString()}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
