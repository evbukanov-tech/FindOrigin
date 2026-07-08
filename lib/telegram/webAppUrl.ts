import { getAppUrl } from "@/lib/config";

const DEFAULT_PRODUCTION_URL = "https://find-origin-jet.vercel.app";

export function getWebAppUrl(): string {
  const raw = getAppUrl() ?? DEFAULT_PRODUCTION_URL;
  const normalized = raw.replace(/\/$/, "");

  // APP_URL иногда задают сразу с путём /tma (как в BotFather).
  if (normalized.endsWith("/tma")) {
    return normalized;
  }

  return `${normalized}/tma`;
}
