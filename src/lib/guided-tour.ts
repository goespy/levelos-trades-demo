export const TOUR_STORAGE_KEY = "levelos:guided-tour:v1";
export type TourStep = "dashboard" | "clients" | "builds" | "newBuild" | "estimator" | "proposalNav" | "proposals" | "template" | "contracts" | "contract" | "complete";
export type TourState = { step: TourStep; active: boolean; completed: boolean; dismissed: boolean; paused: boolean };
export const initialTourState: TourState = { step: "dashboard", active: true, completed: false, dismissed: false, paused: false };
const order: TourStep[] = ["dashboard", "clients", "builds", "newBuild", "estimator", "proposalNav", "proposals", "template", "contracts", "contract", "complete"];
export const expectedRoute: Record<Exclude<TourStep, "complete">, string> = { dashboard: "/", clients: "/clients", builds: "/clients", newBuild: "/builds", estimator: "/builds/new", proposalNav: "/builds/new", proposals: "/proposals", template: "/proposals", contracts: "/contracts", contract: "/contracts/" };
export type TourAction = { type: "NEXT" | "BACK" | "SKIP" | "RESTART" | "PAUSE" | "RESUME" } | { type: "HYDRATE"; state: TourState };
export function hydrateTourState(raw: unknown): TourState | null { if(!raw||typeof raw!=="object")return null; const value=raw as Partial<TourState>; if(!order.includes(value.step as TourStep)||typeof value.active!=="boolean"||typeof value.completed!=="boolean"||typeof value.dismissed!=="boolean"||typeof value.paused!=="boolean")return null; return {step:value.step as TourStep,active:value.active,completed:value.completed,dismissed:value.dismissed,paused:value.paused}; }
export function tourReducer(state: TourState, action: TourAction): TourState {
  if (action.type === "HYDRATE") return action.state;
  if (action.type === "SKIP") return { ...state, active: false, dismissed: true, paused: false };
  if (action.type === "RESTART") return initialTourState;
  if (action.type === "PAUSE") return { ...state, paused: true };
  if (action.type === "RESUME") return { ...state, paused: false };
  const index = order.indexOf(state.step);
  if (action.type === "BACK") return { ...state, step: order[Math.max(0, index - 1)] };
  const next = order[Math.min(index + 1, order.length - 1)];
  return next === "complete" ? { ...state, step: next, active: false, completed: true, paused: false } : { ...state, step: next, paused: false };
}
export function routeMatches(step: TourStep, pathname: string) { if (step === "complete") return true; if (step === "template") return /^\/proposals\/[^/]+\/template$/.test(pathname); if (step === "contract") return /^\/contracts\/[^/]+$/.test(pathname); const route = expectedRoute[step]; return pathname === route; }
