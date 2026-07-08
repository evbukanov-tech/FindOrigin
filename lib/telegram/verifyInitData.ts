import crypto from "crypto";

export class TelegramAuthError extends Error {
  constructor(message = "Unauthorized") {
    super(message);
    this.name = "TelegramAuthError";
  }
}

export function verifyTelegramWebAppInitData(initData: string, botToken: string): void {
  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  if (!receivedHash) {
    throw new TelegramAuthError();
  }

  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  // https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app
  // secret_key = HMAC_SHA256("WebAppData", bot_token)
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const checkHmac = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (checkHmac.toLowerCase() !== receivedHash.toLowerCase()) {
    throw new TelegramAuthError();
  }

  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate)) {
    throw new TelegramAuthError();
  }

  const maxAgeSeconds = 60 * 60 * 24;
  if (Math.floor(Date.now() / 1000) - authDate > maxAgeSeconds) {
    throw new TelegramAuthError();
  }
}
