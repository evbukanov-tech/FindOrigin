import { getTelegramWebhookSecret } from "@/lib/config";
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

  if (!text) {
    await sendMessage(
      chatId,
      "Пришлите текст или ссылку на Telegram-пост, и я попробую найти источник.",
    );
    return Response.json({ ok: true });
  }

  try {
    await sendMessage(chatId, "Ищу источники…");
    await findOrigin(chatId, text, { skipAck: true });
  } catch (error) {
    console.error("Webhook processing failed", {
      chatId,
      error: error instanceof Error ? error.message : String(error),
    });
  }

  return Response.json({ ok: true });
}
