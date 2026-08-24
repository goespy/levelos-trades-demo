"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PHOTO_ANGLE_LABELS } from "@/lib/constants";
import {
  Upload,
  CheckCircle2,
  Camera,
  FileText,
  ArrowRight,
  Loader2,
} from "lucide-react";

interface PrepClient {
  id: string;
  name: string;
  prepCompleted: string | null;
  files: { id: string; category: string; angle: string | null; filename: string }[];
}

const REQUIRED_ANGLES = ["BACK_DOOR", "LEFT", "RIGHT", "BACK_FENCE"] as const;

export default function PrepKitPage() {
  const params = useParams();
  const token = params.token as string;

  const [client, setClient] = useState<PrepClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const [uploadedAngles, setUploadedAngles] = useState<Set<string>>(new Set());
  const [surveyUploaded, setSurveyUploaded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [step, setStep] = useState(1);

  const fetchClient = useCallback(async () => {
    try {
      const res = await fetch(`/api/prep/${token}`);
      if (!res.ok) throw new Error("Invalid or expired link");
      const data = await res.json();
      setClient(data);

      if (data.prepCompleted) {
        setCompleted(true);
      }

      const angles = new Set<string>();
      data.files.forEach((f: PrepClient["files"][0]) => {
        if (f.category === "BACKYARD_PHOTO" && f.angle) {
          angles.add(f.angle);
        }
        if (f.category === "SURVEY") {
          setSurveyUploaded(true);
        }
      });
      setUploadedAngles(angles);
    } catch {
      setError("This link is invalid or has expired. Please contact Persistent Pools for a new link.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

  const handleFileUpload = async (
    file: File,
    category: string,
    angle?: string
  ) => {
    if (!client) return;

    const key = angle || category;
    setUploading((prev) => ({ ...prev, [key]: true }));

    const formData = new FormData();
    formData.append("file", file);
    formData.append("clientId", client.id);
    formData.append("category", category);
    if (angle) formData.append("angle", angle);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (!res.ok) throw new Error("Upload failed");

      if (category === "SURVEY") {
        setSurveyUploaded(true);
      } else if (angle) {
        setUploadedAngles((prev) => new Set([...prev, angle]));
      }
    } catch {
      alert("Upload failed. Please try again.");
    } finally {
      setUploading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await fetch(`/api/prep/${token}`, { method: "POST" });
      setCompleted(true);
    } catch {
      alert("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <p className="text-destructive">{error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center space-y-4">
            <CheckCircle2 className="h-16 w-16 text-green-400 mx-auto" />
            <h2 className="text-2xl font-bold">All Set!</h2>
            <p className="text-muted-foreground">
              Thank you, {client?.name}! We&apos;ve received your files and will begin
              working on your custom pool design. We&apos;ll be in touch soon!
            </p>
            <div className="pt-4 text-sm text-muted-foreground">
              Persistent Pools
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const allPhotosUploaded = REQUIRED_ANGLES.every((a) => uploadedAngles.has(a));
  const canSubmit = surveyUploaded && allPhotosUploaded;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="font-bold text-xl">Persistent Pools</h1>
            <p className="text-sm text-muted-foreground">Design Prep Kit</p>
          </div>
          <div className="text-right text-sm">
            <p className="font-medium">{client?.name}</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-6">
        {/* Progress */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div
                className={`h-2 flex-1 rounded-full ${
                  step >= s ? "bg-blue-500" : "bg-muted"
                }`}
              />
            </div>
          ))}
        </div>

        {/* Step 1: Welcome & Survey */}
        {step === 1 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-400" />
                  Step 1: Upload Your Survey
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-base text-muted-foreground">
                  Your property survey shows us your lot dimensions, setbacks,
                  easements, and where we can place your pool. If you don&apos;t
                  have one handy, your title company or county records office
                  can help.
                </p>
                <div className="bg-blue-500/10 rounded-lg p-4 text-base">
                  <p className="font-medium text-blue-300 mb-2">What we need:</p>
                  <ul className="list-disc list-inside text-blue-400/80 space-y-1.5">
                    <li>Property boundary survey (PDF or photo)</li>
                    <li>Shows lot dimensions & setback lines</li>
                    <li>Shows any easements or utility lines</li>
                  </ul>
                </div>

                <div>
                  <Label
                    htmlFor="survey-upload"
                    className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
                      surveyUploaded
                        ? "border-green-500/40 bg-green-500/10"
                        : "border-muted-foreground/30 hover:border-blue-400 hover:bg-blue-500/10"
                    }`}
                  >
                    {uploading["SURVEY"] ? (
                      <Loader2 className="h-10 w-10 animate-spin text-blue-400" />
                    ) : surveyUploaded ? (
                      <>
                        <CheckCircle2 className="h-10 w-10 text-green-400 mb-2" />
                        <span className="text-base text-green-400 font-medium">
                          Survey uploaded!
                        </span>
                        <span className="text-sm text-green-500/70 mt-1">
                          Tap to replace
                        </span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-10 w-10 text-muted-foreground mb-2" />
                        <span className="text-base font-medium text-muted-foreground">
                          Tap to upload survey
                        </span>
                        <span className="text-sm text-muted-foreground/70 mt-1">
                          PDF, JPG, or PNG
                        </span>
                      </>
                    )}
                  </Label>
                  <input
                    id="survey-upload"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.heic"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileUpload(file, "SURVEY");
                    }}
                  />
                </div>

                <Button
                  onClick={() => setStep(2)}
                  className="w-full"
                  disabled={!surveyUploaded}
                >
                  Next: Backyard Photos
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 2: Backyard Photos */}
        {step === 2 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5 text-blue-400" />
                  Step 2: Backyard Photos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-base text-muted-foreground">
                  We need 4 photos of your backyard from different angles. These
                  help us understand the space and create accurate 3D designs.
                </p>

                {/* Visual angle diagram */}
                <div className="bg-blue-500/10 rounded-lg p-4">
                  <p className="text-base font-medium text-blue-300 mb-3">
                    Stand in each position and take a photo:
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-card rounded border">
                      <div className="text-3xl font-bold mb-1">1</div>
                      <p className="font-semibold text-base">Back Door</p>
                      <p className="text-sm text-muted-foreground">
                        Looking out at yard
                      </p>
                    </div>
                    <div className="text-center p-3 bg-card rounded border">
                      <div className="text-3xl font-bold mb-1">2</div>
                      <p className="font-semibold text-base">Left Side</p>
                      <p className="text-sm text-muted-foreground">
                        From left fence
                      </p>
                    </div>
                    <div className="text-center p-3 bg-card rounded border">
                      <div className="text-3xl font-bold mb-1">3</div>
                      <p className="font-semibold text-base">Right Side</p>
                      <p className="text-sm text-muted-foreground">
                        From right fence
                      </p>
                    </div>
                    <div className="text-center p-3 bg-card rounded border">
                      <div className="text-3xl font-bold mb-1">4</div>
                      <p className="font-semibold text-base">Back Fence</p>
                      <p className="text-sm text-muted-foreground">
                        Looking toward house
                      </p>
                    </div>
                  </div>
                </div>

                {/* Photo upload grid */}
                <div className="space-y-3">
                  {REQUIRED_ANGLES.map((angle) => {
                    const uploaded = uploadedAngles.has(angle);
                    const isUploading = uploading[angle];
                    return (
                      <div key={angle}>
                        <Label
                          htmlFor={`photo-${angle}`}
                          className={`flex items-center gap-4 w-full p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                            uploaded
                              ? "border-green-500/40 bg-green-500/10"
                              : "border-muted hover:border-blue-400"
                          }`}
                        >
                          {isUploading ? (
                            <Loader2 className="h-8 w-8 animate-spin text-blue-400 shrink-0" />
                          ) : uploaded ? (
                            <CheckCircle2 className="h-8 w-8 text-green-400 shrink-0" />
                          ) : (
                            <Camera className="h-8 w-8 text-muted-foreground shrink-0" />
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-base">
                              {PHOTO_ANGLE_LABELS[angle]}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {uploaded ? "Uploaded - tap to replace" : "Tap to take or choose photo"}
                            </p>
                          </div>
                          {uploaded && (
                            <CheckCircle2 className="h-4 w-4 text-green-400 shrink-0" />
                          )}
                        </Label>
                        <input
                          id={`photo-${angle}`}
                          type="file"
                          accept="image/*"
                          capture="environment"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file)
                              handleFileUpload(file, "BACKYARD_PHOTO", angle);
                          }}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    className="flex-1"
                    disabled={!allPhotosUploaded}
                  >
                    Next: Review
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Step 3: Review & Submit */}
        {step === 3 && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Step 3: Review & Submit</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    {surveyUploaded ? (
                      <CheckCircle2 className="h-6 w-6 text-green-400" />
                    ) : (
                      <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30" />
                    )}
                    <span className="text-base">Property Survey</span>
                  </div>
                  {REQUIRED_ANGLES.map((angle) => (
                    <div key={angle} className="flex items-center gap-3">
                      {uploadedAngles.has(angle) ? (
                        <CheckCircle2 className="h-6 w-6 text-green-400" />
                      ) : (
                        <div className="h-6 w-6 rounded-full border-2 border-muted-foreground/30" />
                      )}
                      <span className="text-base">
                        {PHOTO_ANGLE_LABELS[angle]} Photo
                      </span>
                    </div>
                  ))}
                </div>

                {canSubmit && (
                  <div className="bg-green-500/10 rounded-lg p-4 text-base text-green-300">
                    Everything looks great! Submit your files and we&apos;ll get
                    started on your custom pool design.
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="flex-1"
                    disabled={!canSubmit || submitting}
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Submitting...
                      </>
                    ) : (
                      "Submit Files"
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground pb-8">
          Persistent Pools &bull; Southwest Florida
        </p>
      </div>
    </div>
  );
}
