export const PUBLIC_DEMO_MESSAGE =
  "This external action is disabled in the public portfolio demo.";

export function isPublicDemo(): boolean {
  return process.env.PUBLIC_DEMO !== "false";
}
