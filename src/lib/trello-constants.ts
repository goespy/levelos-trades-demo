// Trello label colors → hex values
// Includes dark/light variants used by Trello
export const TRELLO_LABEL_COLORS: Record<string, string> = {
  green: "#61bd4f",
  green_dark: "#519839",
  green_light: "#b7ddb0",
  yellow: "#f2d600",
  yellow_dark: "#d9b51c",
  yellow_light: "#f5ea92",
  orange: "#ff9f1a",
  orange_dark: "#cd8313",
  orange_light: "#fad29c",
  red: "#eb5a46",
  red_dark: "#b04632",
  red_light: "#efb3ab",
  purple: "#c377e0",
  purple_dark: "#89609e",
  purple_light: "#dfc0eb",
  blue: "#0079bf",
  blue_dark: "#055a8c",
  blue_light: "#8bbdd9",
  sky: "#00c2e0",
  sky_dark: "#0098b7",
  sky_light: "#8fdfeb",
  lime: "#51e898",
  lime_dark: "#4bbf6b",
  lime_light: "#b3f1d0",
  pink: "#ff78cb",
  pink_dark: "#c9558f",
  pink_light: "#f9c2e4",
  black: "#344563",
  black_dark: "#091e42",
  black_light: "#8590a2",
};

// Design status → Trello list name mapping
// When a design status changes, move the linked card to this list
export const DESIGN_STATUS_TO_TRELLO_LIST: Record<string, string> = {
  WAITING_INFO: "Waiting on Info",
  IN_PROGRESS: "Design Phase",
  SCREENSHOTS: "Design Phase",
  RENDERING: "Design Phase",
  COMPLETE: "Appointment Set",
};

// Trello list name → Design status (reverse mapping for reference)
export const TRELLO_LIST_TO_DESIGN_STATUS: Record<string, string> = {
  "Waiting on Info": "WAITING_INFO",
  "Design Phase": "IN_PROGRESS",
  "Appointment Set": "COMPLETE",
};

// Default list for new cards created from the app
export const DEFAULT_NEW_CARD_LIST = "New FB Leads";

// List that triggers auto-client creation
export const QUALIFYING_CALL_LIST = "Qualifying Call";
