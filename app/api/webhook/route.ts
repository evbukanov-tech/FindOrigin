import { getAppUrl, getTelegramWebhookSecret } from "@/lib/config";
import { findOrigin } from "@/lib/pipeline/findOrigin";
import { sendMessage } from "@/lib/telegram/client";
import type { TelegramUpdate } from "@/lib/types/telegram";

export const runtime = "nodejs";
export const maxDuration = 60;

function isValidSecret(request: Request): boolean {
  const expectedSecret = getTelegramWebhookSecret();
  if (!expectedSecret) {
    return true;
  }

  const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token");
  return receivedSecret === expectedSecret;
}

export async function POST(request: Request): Promise<Response> {
  if (!isValidSecret(request)) {
    return Response.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const update = (await request.json()) as TelegramUpdate;
  const message = update.message;
  const chatId = message?.chat.id;
  const text = message?.text?.trim();

  if (!chatId) {
    return Response.json({ ok: true });
  }

  const appUrl = getAppUrl() ?? "http://localhost:3000";
  const webAppUrl = `${appUrl}/tma`;
  const replyMarkup = {
    inline_keyboard: [
      [
        {
          text: "Открыть Mini App",
          web_app: { url: webAppUrl },
        },
      ],
    ],
  };

  if (text === "/start" || text === "/tma" || text === "/webapp") {
    await sendMessage(
      chatId,
      "Привет! Можешь искать источники прямо в Telegram Mini App.",
      { replyMarkup },
    );
    return Response.json({ ok: true });
  }

  if (!text) {
    await sendMessage(
      chatId,
      "Пришлите текст или ссылку на Telegram-пост, и я попробую найти источник.",
      { replyMarkup },
    );
    return Response.json({ ok: true });
  }

  try {
    await sendMessage(chatId, "Ищу источники…", { replyMarkup });
    await findOrigin(chatId, text, { skipAck: true });
  } catch (error) {
    console.error("Webhook processing failed", {
      chatId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return Response.json({ ok: true });
}
