"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Palette,
  Image,
  Kanban,
  Calculator,
  BarChart3,
  FileText,
  FileSignature,
  LogOut,
  HardHat,
  Receipt,
  Wrench,
  Star,
  UserPlus,
  Smartphone,
  TrendingUp,
  CalendarClock,
  Globe,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    label: "Pre-Sale",
    items: [
      { href: "/", label: "Dashboard", icon: LayoutDashboard },
      { href: "/clients", label: "Clients", icon: Users },
      { href: "/designs", label: "Designs", icon: Palette },
      { href: "/pipeline", label: "Pipeline", icon: Kanban },
      { href: "/builds", label: "Builds", icon: Calculator },
      { href: "/proposals", label: "Proposals", icon: FileText },
      { href: "/contracts", label: "Contracts", icon: FileSignature },
      { href: "/renders", label: "Renders", icon: Image },
      { href: "/metrics", label: "Metrics", icon: BarChart3 },
    ],
  },
  {
    label: "Execution",
    items: [
      { href: "/jobs", label: "Jobs", icon: HardHat },
      { href: "/subs", label: "Subcontractors", icon: Wrench },
      { href: "/field", label: "Field View", icon: Smartphone },
    ],
  },
  {
    label: "Customer",
    items: [
      { href: "/portal", label: "Customer Portal", icon: Globe },
      { href: "/reviews", label: "Reviews", icon: Star },
      { href: "/referrals", label: "Referrals", icon: UserPlus },
    ],
  },
  {
    label: "Back-Office",
    items: [
      { href: "/invoices", label: "Invoices", icon: Receipt },
      { href: "/accounting", label: "Accounting", icon: TrendingUp },
      { href: "/maintenance", label: "Maintenance Plans", icon: CalendarClock },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 border-r bg-card print:!hidden">
      <div className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center h-16 px-4 border-b">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">L</span>
            </div>
            <div>
              <h1 className="font-semibold text-sm leading-tight">LEVELos</h1>
              <p className="text-[10px] text-muted-foreground leading-tight">for the Trades</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-4 overflow-y-auto">
          {navGroups.map((group) => (
            <div key={group.label}>
              <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    item.href === "/"
                      ? pathname === "/"
                      : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      data-tour={`nav-${item.href === "/" ? "dashboard" : item.href.slice(1)}`}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm shadow-primary/10"
                          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
        <div className="px-2 py-4 border-t">
          <button
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              router.push("/demo");
              router.refresh();
            }}
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors w-full"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </div>
    </aside>
  );
}
