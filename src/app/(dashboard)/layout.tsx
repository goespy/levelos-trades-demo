import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { DemoBanner } from "@/components/layout/demo-banner";
import { GuidedTourProvider } from "@/components/layout/guided-tour-provider";
import { isPublicDemo } from "@/lib/public-demo";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const tourEnabled = isPublicDemo() && process.env.DEMO_TOUR_ENABLED !== "false";
  return (
    <GuidedTourProvider enabled={tourEnabled}><div className="min-h-screen">
      <Sidebar />
      <div className="md:pl-64 print:pl-0">
        <DemoBanner />
        <main className="p-4 md:p-6 pb-20 md:pb-6 print:p-0">{children}</main>
      </div>
      <MobileNav />
    </div></GuidedTourProvider>
  );
}
