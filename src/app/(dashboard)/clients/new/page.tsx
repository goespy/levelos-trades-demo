"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import { LEAD_SOURCES, TIMELINES, SERVICE_AREAS } from "@/lib/constants";
import { Loader2 } from "lucide-react";

export default function NewClientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
    source: "",
    timeline: "",
    budget: "",
    financingInterested: false,
    hasSpecificFeatures: false,
    homeownerConfirmed: false,
    inServiceArea: true,
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const client = await res.json();
      router.push(`/clients/${client.id}`);
    } catch {
      alert("Failed to save client");
      setSaving(false);
    }
  };

  const update = (field: string, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const allCities = [...SERVICE_AREAS.core, ...SERVICE_AREAS.extended];

  return (
    <div>
      <PageHeader title="Add New Client" description="Enter lead information" />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Contact Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => update("name", e.target.value)}
                  placeholder="John Smith"
                  required
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={form.phone}
                  onChange={(e) => update("phone", e.target.value)}
                  placeholder="(239) 555-0123"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => update("email", e.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <Label htmlFor="source">Lead Source</Label>
                <Select
                  value={form.source}
                  onValueChange={(v) => update("source", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAD_SOURCES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={form.address}
                onChange={(e) => update("address", e.target.value)}
                placeholder="123 Main St"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Select
                  value={form.city}
                  onValueChange={(v) => {
                    update("city", v);
                    update(
                      "inServiceArea",
                      allCities.some(
                        (c) => c.toLowerCase() === v.toLowerCase()
                      )
                    );
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select city" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__divider_core" disabled>
                      — Core Area —
                    </SelectItem>
                    {SERVICE_AREAS.core.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                    <SelectItem value="__divider_extended" disabled>
                      — Extended Area —
                    </SelectItem>
                    {SERVICE_AREAS.extended.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="zip">ZIP</Label>
                <Input
                  id="zip"
                  value={form.zip}
                  onChange={(e) => update("zip", e.target.value)}
                  placeholder="33914"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Qualifying Info */}
        <Card>
          <CardHeader>
            <CardTitle>Qualifying Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timeline">Timeline</Label>
                <Select
                  value={form.timeline}
                  onValueChange={(v) => update("timeline", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select timeline" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIMELINES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="budget">Budget Range</Label>
                <Input
                  id="budget"
                  value={form.budget}
                  onChange={(e) => update("budget", e.target.value)}
                  placeholder="$50k-$80k"
                />
              </div>
            </div>

            <div className="space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.financingInterested}
                  onChange={(e) =>
                    update("financingInterested", e.target.checked)
                  }
                  className="rounded"
                />
                <span className="text-sm">Interested in financing</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.hasSpecificFeatures}
                  onChange={(e) =>
                    update("hasSpecificFeatures", e.target.checked)
                  }
                  className="rounded"
                />
                <span className="text-sm">
                  Has specific features in mind (spa, tanning ledge, etc.)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.homeownerConfirmed}
                  onChange={(e) =>
                    update("homeownerConfirmed", e.target.checked)
                  }
                  className="rounded"
                />
                <span className="text-sm">Confirmed homeowner</span>
              </label>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => update("notes", e.target.value)}
                placeholder="Additional notes about this lead..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={saving || !form.name.trim()}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              "Save Client"
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
