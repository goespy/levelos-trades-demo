import { SERVICE_AREAS } from "./constants";

interface ScoringInput {
  timeline?: string | null;
  financingInterested: boolean;
  hasSpecificFeatures: boolean;
  homeownerConfirmed: boolean;
  inServiceArea: boolean;
  city?: string | null;
  prepCompleted?: Date | string | null;
  prepTokenSent?: Date | string | null;
}

export interface ScoreBreakdown {
  total: number;
  factors: { label: string; points: number; applied: boolean }[];
}

export function calculateLeadScore(input: ScoringInput): ScoreBreakdown {
  const factors: ScoreBreakdown["factors"] = [];

  // +3 ASAP timeline
  const isASAP = input.timeline === "ASAP";
  factors.push({
    label: "ASAP Timeline",
    points: 3,
    applied: isASAP,
  });

  // +2 Financing interested
  factors.push({
    label: "Interested in Financing",
    points: 2,
    applied: input.financingInterested,
  });

  // +2 Has specific features
  factors.push({
    label: "Has Specific Features",
    points: 2,
    applied: input.hasSpecificFeatures,
  });

  // +2 Sent docs fast (within 48 hours of token being sent)
  let sentDocsFast = false;
  if (input.prepCompleted && input.prepTokenSent) {
    const completed = new Date(input.prepCompleted).getTime();
    const sent = new Date(input.prepTokenSent).getTime();
    const hoursDiff = (completed - sent) / (1000 * 60 * 60);
    sentDocsFast = hoursDiff <= 48;
  }
  factors.push({
    label: "Sent Documents Quickly",
    points: 2,
    applied: sentDocsFast,
  });

  // +1 Core service area
  const isCoreArea = input.city
    ? SERVICE_AREAS.core.some(
        (area) => area.toLowerCase() === input.city!.toLowerCase()
      )
    : false;
  factors.push({
    label: "Core Service Area",
    points: 1,
    applied: isCoreArea,
  });

  // -2 Just exploring
  const isExploring = input.timeline === "Just exploring";
  factors.push({
    label: "Just Exploring",
    points: -2,
    applied: isExploring,
  });

  // -2 No financing / budget concerns
  const noFinancing =
    !input.financingInterested && input.timeline !== "ASAP";
  factors.push({
    label: "No Financing / Budget Concerns",
    points: -2,
    applied: noFinancing,
  });

  const total = factors.reduce(
    (sum, f) => sum + (f.applied ? f.points : 0),
    0
  );

  return { total, factors };
}
