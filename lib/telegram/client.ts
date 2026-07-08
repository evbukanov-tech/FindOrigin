import { getTelegramBotToken } from "@/lib/config";
import type { SendMessageResult } from "@/lib/types/telegram";

const TELEGRAM_API = "https://api.telegram.org";

export async function sendMessage(
  chatId: number,
  text: string,
  options?: {
    parseMode?: "HTML" | "Markdown";
    replyMarkup?: unknown;
  },
): Promise<SendMessageResult> {
  const token = getTelegramBotToken();
  const parseMode = options?.parseMode ?? "HTML";

  const replyMarkup = options?.replyMarkup;

  const body: Record<string, unknown> = {
    chat_id: chatId,
    text,
    parse_mode: parseMode,
  };

  if (replyMarkup) {
    body.reply_markup = replyMarkup;
  }

  const response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as SendMessageResult & {
    description?: string;
  };

  if (!response.ok || !data.ok) {
    throw new Error(data.description ?? `Telegram API error: ${response.status}`);
  }

  return data;
}

export async function setWebhook(url: string, secretToken?: string): Promise<unknown> {
  const token = getTelegramBotToken();
  const body: Record<string, string> = { url };
  if (secretToken) {
    body.secret_token = secretToken;
  }

  const response = await fetch(`${TELEGRAM_API}/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return response.json();
}

export async function getWebhookInfo(): Promise<unknown> {
  const token = getTelegramBotToken();
  const response = await fetch(`${TELEGRAM_API}/bot${token}/getWebhookInfo`);
  return response.json();
}
