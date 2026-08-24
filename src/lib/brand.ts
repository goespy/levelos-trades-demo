export const BRAND = {
  product: "LEVELos for the Trades",
  tenant: "Persistent Pools",
  portfolioLabel: "Powered by LEVELos",
  demoUrl: "https://levelos-trades-demo.vercel.app",
  githubUrl: "https://github.com/goespy/levelos-trades-demo",
} as const;

export function customerBrand(): string {
  return BRAND.tenant;
}
