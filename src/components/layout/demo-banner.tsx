import { FlaskConical, ShieldCheck } from "lucide-react";

export function DemoBanner() {
  return (
    <div className="border-b border-cyan-400/20 bg-cyan-400/8 px-4 py-2 print:hidden">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-1 text-center text-xs text-cyan-50/80">
        <span className="inline-flex items-center gap-1.5 font-semibold text-cyan-200">
          <FlaskConical className="h-3.5 w-3.5" />
          Portfolio demo
        </span>
        <span>Fictional people, projects, pricing, and legal content</span>
        <span className="inline-flex items-center gap-1.5 text-emerald-300">
          <ShieldCheck className="h-3.5 w-3.5" />
          External actions disabled
        </span>
      </div>
    </div>
  );
}
