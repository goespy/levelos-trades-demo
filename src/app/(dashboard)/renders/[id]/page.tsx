"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/page-header";
import {
  ArrowLeft,
  Copy,
  Image as ImageIcon,
  Loader2,
  Star,
  Upload,
} from "lucide-react";
import Link from "next/link";

interface RenderDetail {
  id: string;
  promptUsed: string;
  timeOfDay: string | null;
  cameraAngle: string | null;
  rating: number | null;
  selected: boolean;
  notes: string | null;
  createdAt: string;
  designProject: {
    id: string;
    clientId: string;
    client: { id: string; name: string };
  };
  sourceScreenshot: {
    id: string;
    storagePath: string;
    filename: string;
  } | null;
  outputFiles: {
    id: string;
    storagePath: string;
    filename: string;
  }[];
}

export default function RenderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [render, setRender] = useState<RenderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fetchRender = useCallback(async () => {
    const res = await fetch(`/api/renders/${id}`);
    if (!res.ok) {
      router.push("/renders");
      return;
    }
    setRender(await res.json());
    setLoading(false);
  }, [id, router]);

  useEffect(() => {
    fetchRender();
  }, [fetchRender]);

  const updateRender = async (data: Record<string, unknown>) => {
    await fetch(`/api/renders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchRender();
  };

  const handleOutputUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !render) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("clientId", render.designProject.clientId);
    formData.append("designProjectId", render.designProject.id);
    formData.append("category", "GEMINI_RENDER");

    await fetch("/api/upload", { method: "POST", body: formData });

    // Link to render job via adding to outputFiles
    // For now we'll just re-fetch since the relation is M:N in schema
    // In practice you'd update the relation
    setUploading(false);
    fetchRender();
  };

  if (loading || !render) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back
        </Button>
      </div>

      <PageHeader
        title={`Render: ${render.designProject.client.name}`}
        description={new Date(render.createdAt).toLocaleDateString()}
        action={
          <div className="flex items-center gap-2">
            {render.selected && <Badge variant="default">Selected</Badge>}
            <Link href={`/designs/${render.designProject.id}`}>
              <Button variant="outline" size="sm">
                View Design
              </Button>
            </Link>
          </div>
        }
      />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Left: Prompt & Settings */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Gemini Prompt
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    navigator.clipboard.writeText(render.promptUsed)
                  }
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-xs whitespace-pre-wrap bg-muted p-3 rounded-md max-h-60 overflow-auto">
                {render.promptUsed}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Time of Day</span>
                <span>{render.timeOfDay || "Not set"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Camera Angle</span>
                <span>{render.cameraAngle || "Not set"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Rating & Selection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Rating (1-5)</Label>
                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => updateRender({ rating: n })}
                      className="p-1"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          render.rating && n <= render.rating
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-muted-foreground/40"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <Button
                variant={render.selected ? "default" : "outline"}
                onClick={() =>
                  updateRender({ selected: !render.selected })
                }
                className="w-full"
              >
                {render.selected
                  ? "Selected for Presentation"
                  : "Mark as Selected"}
              </Button>
              <div>
                <Label>Notes</Label>
                <Textarea
                  defaultValue={render.notes || ""}
                  onBlur={(e) => updateRender({ notes: e.target.value })}
                  rows={3}
                  placeholder="Notes about this render..."
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Images */}
        <div className="space-y-4">
          {render.sourceScreenshot && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Source Screenshot</CardTitle>
              </CardHeader>
              <CardContent>
                <a
                  href={render.sourceScreenshot.storagePath}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <img
                    src={render.sourceScreenshot.storagePath}
                    alt="Source"
                    className="w-full rounded-md border"
                  />
                </a>
                <p className="text-xs text-muted-foreground mt-1">
                  {render.sourceScreenshot.filename}
                </p>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                Render Outputs ({render.outputFiles.length})
                <label>
                  <Button size="sm" variant="outline" asChild>
                    <span>
                      <Upload className="h-4 w-4 mr-1" />
                      {uploading ? "..." : "Add Output"}
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleOutputUpload}
                  />
                </label>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {render.outputFiles.length > 0 ? (
                <div className="space-y-3">
                  {render.outputFiles.map((file) => (
                    <a
                      key={file.id}
                      href={file.storagePath}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <img
                        src={file.storagePath}
                        alt={file.filename}
                        className="w-full rounded-md border mb-1"
                      />
                      <p className="text-xs text-muted-foreground">
                        {file.filename}
                      </p>
                    </a>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <ImageIcon className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No render outputs yet. Upload Gemini results above.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
