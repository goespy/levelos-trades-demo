"use client";

import { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PageHeader } from "@/components/layout/page-header";
import { RENDER_TIMES, RENDER_CAMERA_ANGLES } from "@/lib/constants";
import { Image as ImageIcon, Loader2, Plus, Star } from "lucide-react";

interface RenderListItem {
  id: string;
  promptUsed: string;
  timeOfDay: string | null;
  cameraAngle: string | null;
  rating: number | null;
  selected: boolean;
  createdAt: string;
  designProject: {
    id: string;
    client: { id: string; name: string };
  };
  sourceScreenshot: { storagePath: string } | null;
  outputFiles: { id: string; storagePath: string; filename: string }[];
}

export default function RendersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      }
    >
      <RendersContent />
    </Suspense>
  );
}

function RendersContent() {
  const searchParams = useSearchParams();
  const designId = searchParams.get("designId");

  const [renders, setRenders] = useState<RenderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newRender, setNewRender] = useState({
    designProjectId: designId || "",
    promptUsed: "",
    timeOfDay: "",
    cameraAngle: "",
    notes: "",
  });

  // Fetch designs for the dropdown
  const [designs, setDesigns] = useState<
    { id: string; client: { name: string } }[]
  >([]);

  useEffect(() => {
    Promise.all([
      fetch("/api/renders").then((r) => r.json()),
      fetch("/api/designs").then((r) => r.json()),
    ]).then(([renderData, designData]) => {
      setRenders(renderData);
      setDesigns(designData);
      setLoading(false);
    });
  }, []);

  const handleCreate = async () => {
    if (!newRender.designProjectId || !newRender.promptUsed) return;
    setCreating(true);
    const res = await fetch("/api/renders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...newRender,
        timeOfDay: newRender.timeOfDay || null,
        cameraAngle: newRender.cameraAngle || null,
      }),
    });
    const data = await res.json();
    setRenders((prev) => [data, ...prev]);
    setDialogOpen(false);
    setCreating(false);
    setNewRender({
      designProjectId: "",
      promptUsed: "",
      timeOfDay: "",
      cameraAngle: "",
      notes: "",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Render Jobs"
        description={`${renders.length} total renders`}
        action={
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                New Render
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>New Render Job</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Design Project *</Label>
                  <Select
                    value={newRender.designProjectId}
                    onValueChange={(v) =>
                      setNewRender((prev) => ({
                        ...prev,
                        designProjectId: v,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      {designs.map((d) => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Gemini Prompt *</Label>
                  <Textarea
                    value={newRender.promptUsed}
                    onChange={(e) =>
                      setNewRender((prev) => ({
                        ...prev,
                        promptUsed: e.target.value,
                      }))
                    }
                    rows={6}
                    placeholder="Enter the full Gemini prompt..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Time of Day</Label>
                    <Select
                      value={newRender.timeOfDay}
                      onValueChange={(v) =>
                        setNewRender((prev) => ({
                          ...prev,
                          timeOfDay: v,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {RENDER_TIMES.map((t) => (
                          <SelectItem key={t} value={t}>
                            {t.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Camera Angle</Label>
                    <Select
                      value={newRender.cameraAngle}
                      onValueChange={(v) =>
                        setNewRender((prev) => ({
                          ...prev,
                          cameraAngle: v,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {RENDER_CAMERA_ANGLES.map((a) => (
                          <SelectItem key={a} value={a}>
                            {a.replace("_", " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={handleCreate}
                  disabled={
                    creating ||
                    !newRender.designProjectId ||
                    !newRender.promptUsed
                  }
                  className="w-full"
                >
                  {creating ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : null}
                  Create Render Job
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        }
      />

      {renders.length === 0 ? (
        <Card>
          <CardContent className="pt-6 text-center space-y-3">
            <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">
              No render jobs yet. Create one to start tracking Gemini renders.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {renders.map((render) => (
            <Link key={render.id} href={`/renders/${render.id}`}>
              <Card className="hover:bg-accent/50 transition-colors cursor-pointer h-full">
                {render.outputFiles.length > 0 ? (
                  <div className="h-40 overflow-hidden rounded-t-lg">
                    <img
                      src={render.outputFiles[0].storagePath}
                      alt="Render output"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : render.sourceScreenshot ? (
                  <div className="h-40 overflow-hidden rounded-t-lg opacity-60">
                    <img
                      src={render.sourceScreenshot.storagePath}
                      alt="Source"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="h-40 flex items-center justify-center bg-muted rounded-t-lg">
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
                <CardContent className="pt-3">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-medium text-sm">
                      {render.designProject.client.name}
                    </p>
                    <div className="flex items-center gap-1">
                      {render.rating && (
                        <div className="flex items-center gap-0.5">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-xs">{render.rating}</span>
                        </div>
                      )}
                      {render.selected && (
                        <Badge variant="default" className="text-[10px] px-1.5">
                          Selected
                        </Badge>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {render.promptUsed.slice(0, 80)}...
                  </p>
                  <div className="flex gap-2 mt-2 text-xs text-muted-foreground">
                    {render.timeOfDay && <span>{render.timeOfDay}</span>}
                    {render.outputFiles.length > 0 && (
                      <span>{render.outputFiles.length} outputs</span>
                    )}
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
