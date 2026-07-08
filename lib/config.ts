function readEnv(name: string): string | undefined {
  let value = process.env[name]?.trim();
  if (!value) {
    return undefined;
  }

  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1).trim();
  } else {
    value = value.replace(/^["']+|["']+$/g, "").trim();
  }

  if (value.startsWith("[") && value.endsWith("]")) {
    value = value.slice(1, -1).trim();
  }

  return value || undefined;
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
  const apiKey = readEnv("OPENAI_API_KEY") ?? readEnv("OPENROUTER_API_KEY");
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

function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

export function getAppUrl(): string | undefined {
  const explicit = readEnv("APP_URL");
  if (explicit) {
    return normalizeBaseUrl(explicit);
  }

  // Стабильный production-домен (не preview URL вида *-projects.vercel.app).
  const productionUrl = readEnv("VERCEL_PROJECT_PRODUCTION_URL");
  if (productionUrl) {
    return normalizeBaseUrl(productionUrl);
  }

  // VERCEL_URL — URL конкретного деплоя; для бота используем только на production.
  const vercelEnv = readEnv("VERCEL_ENV");
  const vercelUrl = readEnv("VERCEL_URL");
  if (vercelEnv === "production" && vercelUrl && !vercelUrl.includes("-projects.vercel.app")) {
    return normalizeBaseUrl(vercelUrl);
  }

  return undefined;
}
