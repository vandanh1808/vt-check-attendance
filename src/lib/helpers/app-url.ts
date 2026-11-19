/**
 * Public base URL of the app, without trailing slash.
 * Used where a fixed URL is required (Azure AD redirect URI, links in emails),
 * independent of the host the request came from.
 */
export function getAppUrl(): string {
  const url = process.env.APP_URL || process.env.NEXTAUTH_URL || "http://localhost:3000";
  return url.replace(/\/+$/, "");
}
