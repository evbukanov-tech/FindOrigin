function readEnv(name: string): string | undefined {
  const value = process.env[name];
  return value?.trim() || undefined;
}

export function getTelegramBotToken(): string {
  const token = readEnv("TELEGRAM_BOT_TOKEN") ?? readEnv("BOT_TOKEN");
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not set");
  }
  return token;
}

export function getTelegramWebhookSecret(): string | undefined {
  return readEnv("TELEGRAM_WEBHOOK_SECRET");
}

export function getOpenAiApiKey(): string | undefined {
  return readEnv("OPENAI_API_KEY");
}

export function getAppUrl(): string | undefined {
  return readEnv("VERCEL_URL")
    ? `https://${readEnv("VERCEL_URL")}`
    : readEnv("APP_URL");
}
