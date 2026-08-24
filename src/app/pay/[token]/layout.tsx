import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pay Invoice — Persistent Pools",
  description: "Secure payment for your Persistent Pools invoice",
};

export default function PublicPayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-[#fdfdfd]">{children}</div>;
}
