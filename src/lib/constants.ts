// Lead Sources
export const LEAD_SOURCES = [
  "FB Ad",
  "Referral",
  "Walk-in",
  "Google",
  "Website",
  "Nextdoor",
  "Home Show",
  "Other",
] as const;

// Timelines
export const TIMELINES = [
  "ASAP",
  "1-3 months",
  "3-6 months",
  "6-12 months",
  "Just exploring",
] as const;

// Design Project Statuses
export const DESIGN_STATUSES = [
  "WAITING_INFO",
  "READY_TO_DESIGN",
  "IN_PROGRESS",
  "SCREENSHOTS",
  "RENDERING",
  "COMPLETE",
] as const;

export const DESIGN_STATUS_LABELS: Record<string, string> = {
  WAITING_INFO: "Waiting on Info",
  READY_TO_DESIGN: "Ready to Design",
  IN_PROGRESS: "In Progress",
  SCREENSHOTS: "Screenshots",
  RENDERING: "Rendering",
  COMPLETE: "Complete",
};

export const DESIGN_STATUS_COLORS: Record<string, string> = {
  WAITING_INFO: "bg-yellow-500/15 text-yellow-400",
  READY_TO_DESIGN: "bg-blue-500/15 text-blue-400",
  IN_PROGRESS: "bg-purple-500/15 text-purple-400",
  SCREENSHOTS: "bg-orange-500/15 text-orange-400",
  RENDERING: "bg-pink-500/15 text-pink-400",
  COMPLETE: "bg-green-500/15 text-green-400",
};

// Pool Templates (VIP3D)
export const POOL_TEMPLATES = [
  "Modern Geometric",
  "Tropical Lagoon",
  "Lap Pool",
  "Minimalist Luxury",
  "Family Standard",
  "Custom",
] as const;

// Pool Shapes (VIP3D design)
export const POOL_SHAPES = [
  "Rectangular",
  "Freeform",
  "Kidney",
  "L-Shaped",
  "Roman / Grecian",
  "Figure 8",
  "Oval",
  "Custom",
] as const;

// Common Pool Features (VIP3D design)
export const POOL_FEATURES = [
  "Spa",
  "Sun Shelf",
  "Tanning Ledge",
  "Water Feature",
  "Grotto",
  "Infinity Edge",
  "Beach Entry",
  "LED Lighting",
  "Fire Features",
  "Slide",
  "Swim-Up Bar",
] as const;

// File Categories
export const FILE_CATEGORIES = [
  "SURVEY",
  "BACKYARD_PHOTO",
  "VIP3D_SCREENSHOT",
  "GEMINI_RENDER",
  "INSPIRATION",
  "CONTRACT",
  "OTHER",
] as const;

export const FILE_CATEGORY_LABELS: Record<string, string> = {
  SURVEY: "Survey",
  BACKYARD_PHOTO: "Backyard Photo",
  VIP3D_SCREENSHOT: "VIP3D Screenshot",
  GEMINI_RENDER: "Gemini Render",
  INSPIRATION: "Inspiration",
  CONTRACT: "Contract",
  OTHER: "Other",
};

// Photo Angles
export const PHOTO_ANGLES = [
  "BACK_DOOR",
  "LEFT",
  "RIGHT",
  "BACK_FENCE",
  "DETAIL",
] as const;

export const PHOTO_ANGLE_LABELS: Record<string, string> = {
  BACK_DOOR: "From Back Door",
  LEFT: "Left Side",
  RIGHT: "Right Side",
  BACK_FENCE: "From Back Fence",
  DETAIL: "Detail/Other",
};

// Render Time of Day
export const RENDER_TIMES = [
  "golden_hour",
  "midday",
  "dusk",
  "night",
] as const;

// Render Camera Angles
export const RENDER_CAMERA_ANGLES = [
  "aerial",
  "eye_level",
  "elevated",
  "detail",
] as const;

// Prompt Template Categories
export const PROMPT_CATEGORIES = [
  "RENDER",
  "FOLLOW_UP_TEXT",
  "EMAIL",
  "OTHER",
] as const;

// Lead Scoring Formula
export const LEAD_SCORE_RULES = {
  ASAP_TIMELINE: { points: 3, label: "ASAP Timeline" },
  FINANCING_INTERESTED: { points: 2, label: "Interested in Financing" },
  SPECIFIC_FEATURES: { points: 2, label: "Has Specific Features in Mind" },
  SENT_DOCS_FAST: { points: 2, label: "Sent Documents Quickly" },
  CORE_SERVICE_AREA: { points: 1, label: "In Core Service Area" },
  EXPLORING: { points: -2, label: "Just Exploring" },
  NO_FINANCING: { points: -2, label: "No Financing / Budget Concerns" },
} as const;

// SW Florida Service Areas
export const SERVICE_AREAS = {
  core: [
    "Cape Coral",
    "Fort Myers",
    "Estero",
    "Bonita Springs",
    "Naples",
    "Lehigh Acres",
  ],
  extended: [
    "Sanibel",
    "Marco Island",
    "Ave Maria",
    "Punta Gorda",
    "Port Charlotte",
  ],
};

// Proposal Statuses
export const PROPOSAL_STATUSES = [
  "DRAFT",
  "SENT",
  "ACCEPTED",
  "REJECTED",
] as const;

export const PROPOSAL_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  ACCEPTED: "Accepted",
  REJECTED: "Rejected",
};

export const PROPOSAL_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SENT: "bg-blue-500/15 text-blue-400",
  ACCEPTED: "bg-green-500/15 text-green-400",
  REJECTED: "bg-red-500/15 text-red-400",
};

// Contract Statuses
export const CONTRACT_STATUSES = [
  "DRAFT",
  "SENT",
  "SIGNED",
  "VOID",
] as const;

export const CONTRACT_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  SIGNED: "Signed",
  VOID: "Void",
};

export const CONTRACT_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SENT: "bg-blue-500/15 text-blue-400",
  SIGNED: "bg-green-500/15 text-green-400",
  VOID: "bg-red-500/15 text-red-400",
};

// Weekly Metrics KPIs
export const KPI_LABELS: Record<string, string> = {
  newLeads: "New Leads",
  formsCompleted: "Forms Completed",
  qualifyingCalls: "Qualifying Calls",
  designsStarted: "Designs Started",
  appointmentsSet: "Appointments Set",
  proposalsSent: "Proposals Sent",
  dealsClosed: "Deals Closed",
};

// Invoice Statuses
export const INVOICE_STATUSES = [
  "DRAFT",
  "SENT",
  "PAID",
  "OVERDUE",
  "VOID",
] as const;

export const INVOICE_STATUS_LABELS: Record<string, string> = {
  DRAFT: "Draft",
  SENT: "Sent",
  PAID: "Paid",
  OVERDUE: "Overdue",
  VOID: "Void",
};

export const INVOICE_STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SENT: "bg-blue-500/15 text-blue-400",
  PAID: "bg-green-500/15 text-green-400",
  OVERDUE: "bg-red-500/15 text-red-400",
  VOID: "bg-neutral-500/15 text-neutral-400",
};

// Payment Methods
export const PAYMENT_METHODS = ["STRIPE", "CHECK", "ACH", "WIRE"] as const;

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  STRIPE: "Stripe / Card",
  CHECK: "Check",
  ACH: "ACH Transfer",
  WIRE: "Wire Transfer",
};

// Job Cost Categories
export const COST_CATEGORIES = [
  "MATERIAL",
  "LABOR",
  "SUBCONTRACTOR",
  "PERMIT",
  "EQUIPMENT",
  "OTHER",
] as const;

export const COST_CATEGORY_LABELS: Record<string, string> = {
  MATERIAL: "Material",
  LABOR: "Labor",
  SUBCONTRACTOR: "Subcontractor",
  PERMIT: "Permit",
  EQUIPMENT: "Equipment",
  OTHER: "Other",
};

export const COST_CATEGORY_COLORS: Record<string, string> = {
  MATERIAL: "bg-blue-500/15 text-blue-400",
  LABOR: "bg-purple-500/15 text-purple-400",
  SUBCONTRACTOR: "bg-orange-500/15 text-orange-400",
  PERMIT: "bg-yellow-500/15 text-yellow-400",
  EQUIPMENT: "bg-cyan-500/15 text-cyan-400",
  OTHER: "bg-muted text-muted-foreground",
};

// Maintenance
export const MAINTENANCE_TYPES = [
  "Spring Open",
  "Winter Close",
  "Equipment Service",
  "Custom",
] as const;

export const MAINTENANCE_CADENCES = [
  "Annual",
  "Semi-Annual",
  "Quarterly",
  "Monthly",
] as const;

export const MAINTENANCE_STATUSES = [
  "ACTIVE",
  "PAUSED",
  "CANCELLED",
  "COMPLETED",
] as const;

export const MAINTENANCE_STATUS_LABELS: Record<string, string> = {
  ACTIVE: "Active",
  PAUSED: "Paused",
  CANCELLED: "Cancelled",
  COMPLETED: "Completed",
};

export const MAINTENANCE_STATUS_COLORS: Record<string, string> = {
  ACTIVE: "bg-green-500/15 text-green-400",
  PAUSED: "bg-yellow-500/15 text-yellow-400",
  CANCELLED: "bg-red-500/15 text-red-400",
  COMPLETED: "bg-blue-500/15 text-blue-400",
};

// Cadence -> next-due offset in months for "Mark Done & Reschedule"
export const CADENCE_MONTHS: Record<string, number> = {
  Annual: 12,
  "Semi-Annual": 6,
  Quarterly: 3,
  Monthly: 1,
};
