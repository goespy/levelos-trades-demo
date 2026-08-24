import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pool Proposal — Persistent Pools",
  description: "Your custom pool proposal from Persistent Pools",
};

export default function PublicProposalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="min-h-screen bg-[#fdfdfd]">{children}</div>;
}
