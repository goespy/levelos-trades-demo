"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, RotateCcw } from "lucide-react";

interface Vertex {
  x: number;
  y: number;
}

interface DeckPolygonEditorProps {
  poolLength: number;
  poolWidth: number;
  deckLength: number;
  deckWidth: number;
  deckArea: number | null;
  onAreaChange: (area: number | null) => void;
  vertices: Vertex[];
  onChange: (vertices: Vertex[]) => void;
}

function polygonArea(verts: Vertex[]): number {
  if (verts.length < 3) return 0;
  let area = 0;
  for (let i = 0; i < verts.length; i++) {
    const j = (i + 1) % verts.length;
    area += verts[i].x * verts[j].y;
    area -= verts[j].x * verts[i].y;
  }
  return Math.abs(area) / 2;
}

function edgeLength(a: Vertex, b: Vertex): number {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

function snap(val: number): number {
  return Math.round(val);
}

const PADDING = 30;
const CANVAS_W = 380;
const CANVAS_H = 300;
export function DeckPolygonEditor({
  poolLength,
  poolWidth,
  deckLength,
  deckWidth,
  onAreaChange,
  vertices,
  onChange,
}: DeckPolygonEditorProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragging, setDragging] = useState<number | null>(null);

  // Scale to fit the deck in the canvas
  const maxDim = Math.max(deckLength, deckWidth, 20);
  const viewRange = maxDim + 10; // some breathing room
  const scale = Math.min(
    (CANVAS_W - PADDING * 2) / viewRange,
    (CANVAS_H - PADDING * 2) / viewRange
  );
  const originX = PADDING;
  const originY = CANVAS_H - PADDING; // y=0 at bottom

  const toSvg = (v: Vertex) => ({
    x: originX + v.x * scale,
    y: originY - v.y * scale,
  });

  const fromSvg = (sx: number, sy: number): Vertex => ({
    x: snap((sx - originX) / scale),
    y: snap((originY - sy) / scale),
  });

  const calcAndUpdate = (verts: Vertex[]) => {
    onChange(verts);
    if (verts.length >= 3) {
      const gross = polygonArea(verts);
      const poolCutout = poolLength * poolWidth;
      const net = Math.round(gross - poolCutout);
      onAreaChange(net > 0 ? net : 0);
    } else {
      onAreaChange(null);
    }
  };

  // Generate initial rectangle from deck dimensions
  const generateRect = () => {
    const rect: Vertex[] = [
      { x: 0, y: 0 },
      { x: deckLength, y: 0 },
      { x: deckLength, y: deckWidth },
      { x: 0, y: deckWidth },
    ];
    calcAndUpdate(rect);
  };

  const reset = () => {
    onChange([]);
    onAreaChange(null);
  };

  // Add a point on the longest edge
  const addPoint = () => {
    if (vertices.length < 3) return;
    let longestIdx = 0;
    let longestLen = 0;
    for (let i = 0; i < vertices.length; i++) {
      const len = edgeLength(vertices[i], vertices[(i + 1) % vertices.length]);
      if (len > longestLen) {
        longestLen = len;
        longestIdx = i;
      }
    }
    const a = vertices[longestIdx];
    const b = vertices[(longestIdx + 1) % vertices.length];
    const mid: Vertex = {
      x: snap((a.x + b.x) / 2),
      y: snap((a.y + b.y) / 2),
    };
    const updated = [...vertices];
    updated.splice(longestIdx + 1, 0, mid);
    calcAndUpdate(updated);
  };

  const handleMouseDown = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setDragging(idx);
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (dragging === null) return;
    const rect = svgRef.current!.getBoundingClientRect();
    const sx = (e.clientX - rect.left) * (CANVAS_W / rect.width);
    const sy = (e.clientY - rect.top) * (CANVAS_H / rect.height);
    const pt = fromSvg(sx, sy);
    const updated = [...vertices];
    updated[dragging] = pt;
    calcAndUpdate(updated);
  };

  const handleMouseUp = () => setDragging(null);

  const removeVertex = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (vertices.length <= 3) return; // need at least 3
    calcAndUpdate(vertices.filter((_, i) => i !== idx));
  };

  // Pool visual — centered
  const poolCenter = vertices.length >= 3
    ? {
        x: vertices.reduce((s, v) => s + v.x, 0) / vertices.length,
        y: vertices.reduce((s, v) => s + v.y, 0) / vertices.length,
      }
    : { x: deckLength / 2, y: deckWidth / 2 };

  const poolTL = toSvg({
    x: poolCenter.x - poolLength / 2,
    y: poolCenter.y + poolWidth / 2,
  });
  const poolW = poolLength * scale;
  const poolH = poolWidth * scale;

  const grossArea = vertices.length >= 3 ? polygonArea(vertices) : 0;
  const poolCutout = poolLength * poolWidth;
  const netArea = grossArea > 0 ? Math.round(grossArea - poolCutout) : 0;

  // Grid lines (every 5ft)
  const gridStep = 5;
  const gridCount = Math.ceil(viewRange / gridStep);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Deck Shape
        </Label>
        <div className="flex gap-1">
          {vertices.length === 0 ? (
            <Button
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={generateRect}
            >
              Generate from L&times;W
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={addPoint}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Point
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={reset}
              >
                <RotateCcw className="h-3 w-3 mr-1" />
                Clear
              </Button>
            </>
          )}
        </div>
      </div>

      <div className="border border-border rounded-lg bg-muted/30 overflow-hidden">
        <svg
          ref={svgRef}
          width={CANVAS_W}
          height={CANVAS_H}
          className="w-full select-none"
          viewBox={`0 0 ${CANVAS_W} ${CANVAS_H}`}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Grid */}
          {Array.from({ length: gridCount + 1 }).map((_, i) => {
            const ft = i * gridStep;
            const p = toSvg({ x: ft, y: 0 });
            const isMajor = ft % 10 === 0;
            return p.x <= CANVAS_W - PADDING / 2 ? (
              <g key={`gx-${i}`}>
                <line
                  x1={p.x} y1={PADDING / 2} x2={p.x} y2={CANVAS_H - PADDING / 2}
                  stroke="currentColor" strokeOpacity={isMajor ? 0.1 : 0.04}
                />
                {isMajor && (
                  <text x={p.x} y={CANVAS_H - 4} textAnchor="middle" fontSize={7}
                    fill="currentColor" fillOpacity={0.25}>
                    {ft}&apos;
                  </text>
                )}
              </g>
            ) : null;
          })}
          {Array.from({ length: gridCount + 1 }).map((_, i) => {
            const ft = i * gridStep;
            const p = toSvg({ x: 0, y: ft });
            const isMajor = ft % 10 === 0;
            return p.y >= PADDING / 2 ? (
              <g key={`gy-${i}`}>
                <line
                  x1={PADDING / 2} y1={p.y} x2={CANVAS_W - PADDING / 2} y2={p.y}
                  stroke="currentColor" strokeOpacity={isMajor ? 0.1 : 0.04}
                />
                {isMajor && (
                  <text x={6} y={p.y + 3} fontSize={7}
                    fill="currentColor" fillOpacity={0.25}>
                    {ft}&apos;
                  </text>
                )}
              </g>
            ) : null;
          })}

          {/* Polygon fill */}
          {vertices.length >= 3 && (
            <polygon
              points={vertices.map((v) => { const s = toSvg(v); return `${s.x},${s.y}`; }).join(" ")}
              fill="hsl(var(--primary))"
              fillOpacity={0.06}
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              strokeLinejoin="round"
            />
          )}

          {/* Edge length labels */}
          {vertices.length >= 3 &&
            vertices.map((v, i) => {
              const next = vertices[(i + 1) % vertices.length];
              const a = toSvg(v);
              const b = toSvg(next);
              const len = edgeLength(v, next);
              if (len < 0.5) return null;
              const mx = (a.x + b.x) / 2;
              const my = (a.y + b.y) / 2;
              // Offset label away from center
              const dx = b.y - a.y;
              const dy = a.x - b.x;
              const mag = Math.sqrt(dx * dx + dy * dy) || 1;
              const off = 12;
              return (
                <text
                  key={`len-${i}`}
                  x={mx + (dx / mag) * off}
                  y={my + (dy / mag) * off + 3}
                  textAnchor="middle"
                  fontSize={9}
                  fill="hsl(var(--primary))"
                  fontWeight={600}
                  fontFamily="ui-monospace, monospace"
                  className="select-none pointer-events-none"
                >
                  {len.toFixed(1)}&apos;
                </text>
              );
            })}

          {/* Pool rectangle */}
          {vertices.length >= 3 && (
            <>
              <rect
                x={poolTL.x} y={poolTL.y}
                width={poolW} height={poolH}
                fill="hsl(200 80% 60%)" fillOpacity={0.12}
                stroke="hsl(200 80% 60%)" strokeWidth={1}
                strokeDasharray="4 2" rx={2}
              />
              <text
                x={poolTL.x + poolW / 2} y={poolTL.y + poolH / 2 + 3}
                textAnchor="middle" fontSize={8}
                fill="hsl(200 80% 50%)" fontWeight={500}
                className="select-none pointer-events-none"
              >
                {poolLength}&times;{poolWidth} pool
              </text>
            </>
          )}

          {/* Vertex handles */}
          {vertices.map((v, i) => {
            const s = toSvg(v);
            return (
              <circle
                key={`v-${i}`}
                cx={s.x} cy={s.y} r={5}
                fill="hsl(var(--primary))"
                stroke="hsl(var(--background))"
                strokeWidth={2}
                className="cursor-grab active:cursor-grabbing"
                onMouseDown={(e) => handleMouseDown(i, e)}
                onDoubleClick={(e) => removeVertex(i, e)}
              />
            );
          })}

          {/* Empty state */}
          {vertices.length === 0 && (
            <text
              x={CANVAS_W / 2} y={CANVAS_H / 2}
              textAnchor="middle" fontSize={11}
              fill="hsl(var(--muted-foreground))"
              className="select-none pointer-events-none"
            >
              Click &ldquo;Generate&rdquo; to start with deck rectangle
            </text>
          )}
        </svg>
      </div>

      {vertices.length >= 3 && (
        <p className="text-[10px] text-muted-foreground">
          Click an edge to split it. Drag corners to reshape. Double-click a point to remove it.
        </p>
      )}

      {/* Area summary */}
      {vertices.length >= 3 && (
        <div className="p-2.5 rounded-lg bg-muted/50 space-y-1">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Gross area</span>
            <span className="tabular-nums">{grossArea.toFixed(0)} sqft</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Pool cutout</span>
            <span className="tabular-nums">-{poolCutout} sqft</span>
          </div>
          <div className="flex justify-between text-xs font-bold border-t border-border pt-1">
            <span>Net deck area</span>
            <span className="tabular-nums text-primary">
              {netArea > 0 ? `${netArea.toLocaleString()} sqft` : "—"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
