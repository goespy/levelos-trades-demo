import type { Metadata } from "next";
import "./globals.css";
import { BRAND } from "@/lib/brand";


export const metadata: Metadata = {
  title: {
    default: `${BRAND.product} — Portfolio Demo`,
    template: `%s | ${BRAND.product}`,
  },
  description:
    "A sanitized portfolio demo for Persistent Pools, powered by LEVELos for the Trades.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
