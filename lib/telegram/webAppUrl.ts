import { getAppUrl } from "@/lib/config";

export function getWebAppUrl(request?: Request): string {
  const base = resolveAppBaseUrl(request);
  return `${base}/tma`;
}

function resolveAppBaseUrl(request?: Request): string {
  const fromEnv = getAppUrl();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }

  if (request) {
    const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
    if (host && !host.startsWith("localhost") && !host.startsWith("127.0.0.1")) {
      const proto = request.headers.get("x-forwarded-proto") ?? "https";
      return `${proto}://${host}`.replace(/\/$/, "");
    }
  }

  return "http://localhost:3000";
}
