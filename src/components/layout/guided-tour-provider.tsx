"use client";

import {
  useEffect,
  useReducer,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { GripVertical } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import {
  clampTourPanelPosition,
  defaultTourPanelPosition,
  hydrateTourPanelPosition,
  hydrateTourState,
  initialTourState,
  routeMatches,
  TOUR_STORAGE_KEY,
  tourReducer,
  type TourPanelPosition,
  type TourStep,
} from "@/lib/guided-tour";

type ActiveTourStep = Exclude<TourStep, "complete">;

const TOUR_PANEL_POSITION_KEY = "levelos:guided-tour-panel:v1";
const PANEL_FALLBACK_SIZE = { width: 384, height: 260 };

const copy: Record<
  ActiveTourStep,
  { title: string; body: string; target?: string; next?: string }
> = {
  dashboard: {
    title: "Your operations hub",
    body: "Start with pipeline, revenue, and build signals. Open Clients to follow an intake.",
    target: "nav-clients",
  },
  clients: {
    title: "Client intake",
    body: "CRM records keep intake, source data, and lead scoring together.",
    next: "Continue to Builds",
  },
  builds: {
    title: "Build estimator",
    body: "A build turns project choices into deterministic pricing. Open Builds to see it.",
    target: "nav-builds",
  },
  newBuild: {
    title: "Build estimator",
    body: "Create a build to open the deterministic quote tool.",
    target: "new-build-action",
  },
  estimator: {
    title: "Explore the estimator",
    body: "Adjust the estimator freely; this guided path never modifies your work.",
    next: "Continue to Proposals",
  },
  proposalNav: {
    title: "Continue to proposals",
    body: "When you are ready, use the Proposals tab to turn an estimate into a customer story.",
    target: "nav-proposals",
  },
  proposals: {
    title: "Customer-ready proposal",
    body: "Proposals turn a selected estimate into a clear narrative and payment plan.",
    next: "Open Hayward preview",
  },
  template: {
    title: "Preview mode",
    body: "The deterministic preview keeps the editing sidebar available.",
    target: "nav-contracts",
  },
  contracts: {
    title: "Auditable contracts",
    body: "Contracts carry project records, acknowledgements, signatures, and audit evidence.",
    next: "Open signed Hayward contract",
  },
  contract: {
    title: "Signed record",
    body: "This final callout shows the immutable signed document and its audit evidence.",
    next: "Finish tour",
  },
};

function routeForStep(step: TourStep): string {
  if (step === "dashboard") return "/";
  if (step === "clients" || step === "builds") return "/clients";
  if (step === "newBuild") return "/builds";
  if (step === "estimator" || step === "proposalNav") return "/builds/new";
  if (step === "proposals") return "/proposals";
  return "/contracts";
}

export function GuidedTourProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [state, dispatch] = useReducer(tourReducer, initialTourState);
  const [ready, setReady] = useState(false);
  const [spotlightBox, setSpotlightBox] = useState<DOMRect | null>(null);
  const [panelPosition, setPanelPosition] =
    useState<TourPanelPosition | null>(null);
  const dialog = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);
  const drag = useRef<{
    pointerId: number;
    offsetX: number;
    offsetY: number;
  } | null>(null);
  const desktopViewport = useRef<boolean | null>(null);

  const clampPosition = (position: TourPanelPosition) => {
    const panelRect = dialog.current?.getBoundingClientRect();
    return clampTourPanelPosition(
      position,
      { width: window.innerWidth, height: window.innerHeight },
      panelRect
        ? { width: panelRect.width, height: panelRect.height }
        : PANEL_FALLBACK_SIZE,
    );
  };

  const resetPanelPosition = () => {
    if (typeof window === "undefined") return;
    sessionStorage.removeItem(TOUR_PANEL_POSITION_KEY);
    setPanelPosition(
      clampPosition(
        defaultTourPanelPosition({
          width: window.innerWidth,
          height: window.innerHeight,
        }),
      ),
    );
  };

  useEffect(() => {
    if (!enabled) return;

    try {
      const savedState = hydrateTourState(
        JSON.parse(localStorage.getItem(TOUR_STORAGE_KEY) || "null"),
      );
      if (savedState) dispatch({ type: "HYDRATE", state: savedState });
    } catch {}

    let savedPosition: TourPanelPosition | null = null;
    try {
      savedPosition = hydrateTourPanelPosition(
        JSON.parse(
          sessionStorage.getItem(TOUR_PANEL_POSITION_KEY) || "null",
        ),
      );
    } catch {}

    desktopViewport.current = window.innerWidth >= 768;
    setPanelPosition(
      clampPosition(
        savedPosition ??
          defaultTourPanelPosition({
            width: window.innerWidth,
            height: window.innerHeight,
          }),
      ),
    );
    setReady(true);
  }, [enabled]);

  useEffect(() => {
    if (enabled && ready) {
      localStorage.setItem(TOUR_STORAGE_KEY, JSON.stringify(state));
    }
  }, [enabled, ready, state]);

  useEffect(() => {
    if (!enabled || !ready || !panelPosition) return;
    sessionStorage.setItem(
      TOUR_PANEL_POSITION_KEY,
      JSON.stringify(panelPosition),
    );
  }, [enabled, panelPosition, ready]);

  useEffect(() => {
    if (enabled && ready && state.active) {
      dispatch({
        type: routeMatches(state.step, pathname) ? "RESUME" : "PAUSE",
      });
    }
  }, [enabled, pathname, ready, state.active, state.step]);

  useEffect(() => {
    if (!enabled || !ready || !state.active || state.paused) return;

    previousFocus.current ??= document.activeElement as HTMLElement;
    const target = copy[state.step as ActiveTourStep]?.target;
    dialog.current?.focus();

    if (!target) {
      setSpotlightBox(null);
      return;
    }

    let targetElement: HTMLElement | null = null;
    let animationFrame = 0;
    let lastBox: Pick<DOMRect, "left" | "top" | "width" | "height"> | null =
      null;

    const isVisible = (element: HTMLElement) =>
      element.isConnected &&
      element.getClientRects().length > 0 &&
      getComputedStyle(element).visibility !== "hidden";

    const findTarget = () =>
      (Array.from(
        document.querySelectorAll(`[data-tour="${target}"]`),
      ) as HTMLElement[]).find(isVisible) ?? null;

    const trackTarget = () => {
      if (!targetElement || !isVisible(targetElement)) {
        targetElement = findTarget();
      }

      if (targetElement) {
        const nextBox = targetElement.getBoundingClientRect();
        const changed =
          !lastBox ||
          Math.abs(nextBox.left - lastBox.left) > 0.25 ||
          Math.abs(nextBox.top - lastBox.top) > 0.25 ||
          Math.abs(nextBox.width - lastBox.width) > 0.25 ||
          Math.abs(nextBox.height - lastBox.height) > 0.25;
        if (changed) {
          lastBox = nextBox;
          setSpotlightBox(nextBox);
        }
      } else if (lastBox) {
        lastBox = null;
        setSpotlightBox(null);
      }

      animationFrame = window.requestAnimationFrame(trackTarget);
    };

    trackTarget();
    return () => {
      window.cancelAnimationFrame(animationFrame);
    };
  }, [
    enabled,
    pathname,
    ready,
    state.active,
    state.paused,
    state.step,
  ]);

  useEffect(() => {
    if (!enabled || !ready || !state.active) return;

    const keepPanelVisible = () => {
      const isDesktop = window.innerWidth >= 768;
      const crossedBreakpoint =
        desktopViewport.current !== null &&
        desktopViewport.current !== isDesktop;
      desktopViewport.current = isDesktop;

      setPanelPosition((current) =>
        clampPosition(
          crossedBreakpoint || !current
            ? defaultTourPanelPosition({
                width: window.innerWidth,
                height: window.innerHeight,
              })
            : current,
        ),
      );
    };

    const animationFrame = window.requestAnimationFrame(keepPanelVisible);
    window.addEventListener("resize", keepPanelVisible);
    return () => {
      window.cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", keepPanelVisible);
    };
  }, [enabled, ready, state.active, state.paused, state.step]);

  useEffect(() => () => previousFocus.current?.focus(), []);

  if (!enabled || !ready) return <>{children}</>;

  if (!state.active) {
    return (
      <>
        {children}
        <button
          onClick={() => {
            resetPanelPosition();
            dispatch({ type: "RESTART" });
            router.push("/");
          }}
          className="fixed bottom-3 right-3 z-30 rounded bg-background/95 px-3 py-2 text-xs shadow print:hidden"
        >
          Restart tour
        </button>
      </>
    );
  }

  const item = copy[state.step as ActiveTourStep];
  const ordinal =
    [
      "dashboard",
      "clients",
      "builds",
      "newBuild",
      "estimator",
      "proposalNav",
      "proposals",
      "template",
      "contracts",
      "contract",
    ].indexOf(state.step) + 1;
  const freeplay = state.step === "estimator";

  const next = () => {
    if (state.step === "clients" || state.step === "estimator") {
      dispatch({ type: "NEXT" });
    } else if (state.step === "proposals") {
      dispatch({ type: "NEXT" });
      router.push("/proposals?tourPreview=1");
    } else if (state.step === "contracts") {
      dispatch({ type: "NEXT" });
      router.push("/contracts?tourSigned=1");
    } else {
      dispatch({ type: "NEXT" });
    }
  };

  const activate = () => {
    if (item.target === "nav-clients") {
      dispatch({ type: "NEXT" });
      router.push("/clients");
    } else if (item.target === "nav-builds") {
      dispatch({ type: "NEXT" });
      router.push("/builds");
    } else if (item.target === "new-build-action") {
      dispatch({ type: "NEXT" });
      router.push("/builds/new");
    } else if (item.target === "nav-proposals") {
      dispatch({ type: "NEXT" });
      router.push("/proposals");
    } else if (item.target === "nav-contracts") {
      dispatch({ type: "NEXT" });
      router.push("/contracts");
    }
  };

  const close = (action: "SKIP" | "RESTART") => {
    dispatch({ type: action });
    previousFocus.current?.focus();
    if (action === "RESTART") {
      resetPanelPosition();
      router.push("/");
    }
  };

  const trapFocus = (event: KeyboardEvent<HTMLDivElement>) => {
    if (freeplay || event.key !== "Tab") return;
    const controls = Array.from(
      event.currentTarget.querySelectorAll<HTMLElement>(
        'button,[href],[tabindex]:not([tabindex="-1"])',
      ),
    ).filter((element) => !element.hasAttribute("disabled"));
    if (!controls.length) return;

    const first = controls[0];
    const last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const startDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0 || !dialog.current) return;
    const rect = dialog.current.getBoundingClientRect();
    drag.current = {
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left,
      offsetY: event.clientY - rect.top,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    event.preventDefault();
  };

  const moveDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    setPanelPosition(
      clampPosition({
        x: event.clientX - drag.current.offsetX,
        y: event.clientY - drag.current.offsetY,
      }),
    );
  };

  const endDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag.current || drag.current.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    drag.current = null;
  };

  const nudgePanel = (event: KeyboardEvent<HTMLButtonElement>) => {
    const movement: Record<string, TourPanelPosition> = {
      ArrowLeft: { x: -16, y: 0 },
      ArrowRight: { x: 16, y: 0 },
      ArrowUp: { x: 0, y: -16 },
      ArrowDown: { x: 0, y: 16 },
    };
    const delta = movement[event.key];
    if (!delta) return;

    event.preventDefault();
    setPanelPosition((current) => {
      const base =
        current ??
        defaultTourPanelPosition({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      return clampPosition({
        x: base.x + delta.x,
        y: base.y + delta.y,
      });
    });
  };

  return (
    <>
      {children}
      {!freeplay && (
        <div aria-hidden className="fixed inset-0 z-40 bg-black/45" />
      )}
      {spotlightBox && item.target && (
        <button
          data-tour-highlight
          aria-label={`Open ${item.title}`}
          onClick={activate}
          className="levelos-tour-highlight fixed z-40 rounded-lg"
          style={{
            left: spotlightBox.left,
            top: spotlightBox.top,
            width: spotlightBox.width,
            height: spotlightBox.height,
          }}
        />
      )}
      <div
        ref={dialog}
        data-tour-panel
        onKeyDown={trapFocus}
        tabIndex={-1}
        role="dialog"
        aria-modal={!freeplay}
        aria-live="polite"
        aria-label={`Guided tour: ${item.title}`}
        className="fixed z-50 w-[min(24rem,calc(100vw-2rem))] rounded-xl border bg-background p-4 shadow-2xl outline-none print:hidden"
        style={{
          left: panelPosition?.x ?? 272,
          top: panelPosition?.y ?? 80,
        }}
      >
        <button
          type="button"
          aria-label="Move tutorial panel"
          title="Drag to move. Arrow keys also reposition the panel."
          onPointerDown={startDrag}
          onPointerMove={moveDrag}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={nudgePanel}
          className="flex w-full touch-none cursor-grab items-center justify-between gap-3 rounded-md text-left active:cursor-grabbing"
        >
          <span className="text-xs font-semibold uppercase tracking-wide text-primary">
            Guided tour · {ordinal} / 10
          </span>
          <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
            Drag
            <GripVertical aria-hidden className="size-4" />
          </span>
        </button>
        <h2 className="mt-2 font-semibold">{item.title}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{item.body}</p>
        {state.paused && (
          <button
            onClick={() => router.push(routeForStep(state.step))}
            className="mt-3 rounded border px-3 py-2 text-xs"
          >
            Return to tour
          </button>
        )}
        <div className="mt-4 flex gap-2">
          <button
            onClick={item.target ? activate : next}
            className="rounded bg-primary px-3 py-2 text-xs font-medium text-primary-foreground"
          >
            {item.target
              ? "Open highlighted step"
              : item.next || "Continue"}
          </button>
          <button
            onClick={() => close("SKIP")}
            className="ml-auto text-xs underline"
          >
            Skip
          </button>
          <button
            onClick={() => close("RESTART")}
            className="text-xs underline"
          >
            Restart
          </button>
        </div>
      </div>
    </>
  );
}
