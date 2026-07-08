import crypto from "crypto";
import { AiClientError } from "@/lib/ai/client";
import { analyzeOrigin } from "@/lib/pipeline/analyzeOrigin";
import { getTelegramBotToken } from "@/lib/config";
import type { SourceMatch } from "@/lib/types";
import { InputParseError } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

type AnalyzeTmaRequest = {
  text?: string;
  initData?: string;
};

type AnalyzeTmaResponse =
  | { ok: true; matches: SourceMatch[]; html: string }
  | { ok: false; error: string };

export async function POST(request: Request): Promise<Response> {
  try {
    const body = (await request.json()) as AnalyzeTmaRequest;
    const text = body.text?.trim();

    if (!text) {
      return Response.json(
        { ok: false, error: "Введите текст для поиска." } satisfies AnalyzeTmaResponse,
        { status: 400 },
      );
    }

    if (body.initData) {
      verifyTelegramWebAppInitData(body.initData, getTelegramBotToken());
    }

    const { matches, html } = await analyzeOrigin(text);
    return Response.json({ ok: true, matches, html } satisfies AnalyzeTmaResponse);
  } catch (error) {
    const message = getErrorMessage(error);
    const status = message === "Unauthorized" ? 401 : 500;
    return Response.json(
      { ok: false, error: message } satisfies AnalyzeTmaResponse,
      { status },
    );
  }
}

function verifyTelegramWebAppInitData(initData: string, botToken: string): void {
  // Format: query string-like data. Example:
  // query_id=...&user=...&auth_date=...&hash=...
  const params = new URLSearchParams(initData);
  const receivedHash = params.get("hash");
  if (!receivedHash) {
    throw new Error("Unauthorized");
  }

  params.delete("hash");

  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");

  const secretKey = crypto.createHash("sha256").update(botToken).digest();
  const checkHmac = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");

  if (checkHmac.toLowerCase() !== receivedHash.toLowerCase()) {
    throw new Error("Unauthorized");
  }
}

function getErrorMessage(error: unknown): string {
  if (error instanceof InputParseError) {
    return error.message;
  }

  if (error instanceof AiClientError) {
    return "Не удалось обработать запрос через AI. Проверьте OPENAI_API_KEY и попробуйте позже.";
  }

  if (error instanceof Error) {
    if (error.message === "Unauthorized") {
      return "Unauthorized";
    }

    if (error.message.includes("SEARCH_API_KEY")) {
      return "Поиск не настроен. Добавьте SEARCH_API_KEY (Tavily) в переменные окружения.";
    }
    if (error.message.includes("OPENAI_API_KEY")) {
      return "AI не настроен. Добавьте OPENAI_API_KEY в переменные окружения.";
    }
    if (error.message.includes("Search API error")) {
      return "Ошибка поискового API. Попробуйте позже.";
    }
  }

  return "Произошла ошибка при поиске источников. Попробуйте ещё раз.";
}

