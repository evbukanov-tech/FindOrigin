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

export function getOpenAiApiKey(): string {
  const apiKey = readEnv("OPENAI_API_KEY");
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return apiKey;
}

export function getOpenAiBaseUrl(): string {
  return readEnv("OPENAI_BASE_URL") ?? "https://openrouter.ai/api/v1";
}

export function getOpenAiModel(): string {
  return readEnv("OPENAI_MODEL") ?? "openai/gpt-4o-mini";
}

export function getSearchApiKey(): string {
  const apiKey = readEnv("SEARCH_API_KEY") ?? readEnv("TAVILY_API_KEY");
  if (!apiKey) {
    throw new Error("SEARCH_API_KEY is not set");
  }
  return apiKey;
}

export function getAppUrl(): string | undefined {
  return readEnv("VERCEL_URL")
    ? `https://${readEnv("VERCEL_URL")}`
    : readEnv("APP_URL");
}
