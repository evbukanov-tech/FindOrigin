import { getAppUrl } from "@/lib/config";

const DEFAULT_PRODUCTION_URL = "https://find-origin-jet.vercel.app";

export function getWebAppUrl(): string {
  const base = getAppUrl() ?? DEFAULT_PRODUCTION_URL;
  return `${base.replace(/\/$/, "")}/tma`;
}
