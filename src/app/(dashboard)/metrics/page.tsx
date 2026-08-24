"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PageHeader } from "@/components/layout/page-header";
import { KPI_LABELS } from "@/lib/constants";
import { Loader2, Save, TrendingUp, TrendingDown, Minus } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

interface WeeklyMetric {
  id: string;
  weekStartDate: string;
  newLeads: number;
  formsCompleted: number;
  qualifyingCalls: number;
  designsStarted: number;
  appointmentsSet: number;
  proposalsSent: number;
  dealsClosed: number;
  notes: string | null;
}

const KPI_KEYS = [
  "newLeads",
  "formsCompleted",
  "qualifyingCalls",
  "designsStarted",
  "appointmentsSet",
  "proposalsSent",
  "dealsClosed",
] as const;

function getMonday(d: Date): Date {
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export default function MetricsPage() {
  const [metrics, setMetrics] = useState<WeeklyMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const currentMonday = getMonday(new Date());
  const [form, setForm] = useState({
    weekStartDate: currentMonday.toISOString().slice(0, 10),
    newLeads: 0,
    formsCompleted: 0,
    qualifyingCalls: 0,
    designsStarted: 0,
    appointmentsSet: 0,
    proposalsSent: 0,
    dealsClosed: 0,
    notes: "",
  });

  useEffect(() => {
    fetch("/api/metrics")
      .then((r) => r.json())
      .then((data: WeeklyMetric[]) => {
        setMetrics(data);
        // Pre-fill form if current week exists
        const current = data.find(
          (m) =>
            new Date(m.weekStartDate).toISOString().slice(0, 10) ===
            currentMonday.toISOString().slice(0, 10)
        );
        if (current) {
          setForm({
            weekStartDate: currentMonday.toISOString().slice(0, 10),
            newLeads: current.newLeads,
            formsCompleted: current.formsCompleted,
            qualifyingCalls: current.qualifyingCalls,
            designsStarted: current.designsStarted,
            appointmentsSet: current.appointmentsSet,
            proposalsSent: current.proposalsSent,
            dealsClosed: current.dealsClosed,
            notes: current.notes || "",
          });
        }
        setLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/metrics", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    // Refresh data
    const res = await fetch("/api/metrics");
    setMetrics(await res.json());
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const thisWeek = metrics[0];
  const lastWeek = metrics[1];

  // Prepare chart data (reverse for chronological order)
  const chartData = [...metrics].reverse().map((m) => ({
    week: new Date(m.weekStartDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    ...KPI_KEYS.reduce(
      (acc, key) => ({ ...acc, [key]: m[key] }),
      {} as Record<string, number>
    ),
  }));

  const chartColors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#8b5cf6",
    "#ec4899",
    "#06b6d4",
    "#f97316",
  ];

  return (
    <div>
      <PageHeader
        title="Weekly Metrics"
        description="Track your 7 KPIs each week"
      />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Entry Form */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Week of{" "}
              {new Date(form.weekStartDate).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {KPI_KEYS.map((key) => (
                <div key={key}>
                  <Label className="text-xs">{KPI_LABELS[key]}</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form[key]}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        [key]: parseInt(e.target.value) || 0,
                      }))
                    }
                  />
                </div>
              ))}
            </div>
            <div>
              <Label className="text-xs">Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, notes: e.target.value }))
                }
                rows={2}
                placeholder="Weekly highlights, blockers, etc."
              />
            </div>
            <Button onClick={handleSave} disabled={saving} className="w-full">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save This Week
            </Button>
          </CardContent>
        </Card>

        {/* This Week vs Last Week */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">This Week vs Last Week</CardTitle>
          </CardHeader>
          <CardContent>
            {thisWeek ? (
              <div className="space-y-3">
                {KPI_KEYS.map((key) => {
                  const current = thisWeek[key];
                  const previous = lastWeek?.[key] ?? 0;
                  const diff = current - previous;
                  return (
                    <div
                      key={key}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm">{KPI_LABELS[key]}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">{current}</span>
                        {lastWeek && (
                          <div
                            className={`flex items-center text-xs ${
                              diff > 0
                                ? "text-green-400"
                                : diff < 0
                                  ? "text-red-400"
                                  : "text-muted-foreground"
                            }`}
                          >
                            {diff > 0 ? (
                              <TrendingUp className="h-3 w-3 mr-0.5" />
                            ) : diff < 0 ? (
                              <TrendingDown className="h-3 w-3 mr-0.5" />
                            ) : (
                              <Minus className="h-3 w-3 mr-0.5" />
                            )}
                            {diff > 0 ? "+" : ""}
                            {diff}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                No metrics entered yet. Fill in this week&apos;s numbers to get started.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      {chartData.length > 1 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Trends Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  {KPI_KEYS.map((key, i) => (
                    <Line
                      key={key}
                      type="monotone"
                      dataKey={key}
                      name={KPI_LABELS[key]}
                      stroke={chartColors[i]}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {metrics.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2 font-medium">Week</th>
                    {KPI_KEYS.map((key) => (
                      <th key={key} className="text-center p-2 font-medium">
                        {KPI_LABELS[key].split(" ")[0]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {metrics.map((m) => (
                    <tr key={m.id} className="border-b">
                      <td className="p-2">
                        {new Date(m.weekStartDate).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </td>
                      {KPI_KEYS.map((key) => (
                        <td key={key} className="text-center p-2">
                          {m[key]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
