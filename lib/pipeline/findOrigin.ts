import { compareSources } from "@/lib/ai/compareSources";
import { generateSearchQueries } from "@/lib/ai/generateSearchQueries";
import { AiClientError } from "@/lib/ai/client";
import { extractInputText } from "@/lib/parser/input";
import { searchSources } from "@/lib/search/searchSources";
import { sendMessage } from "@/lib/telegram/client";
import { formatSearchResponse } from "@/lib/telegram/formatResponse";
import { InputParseError } from "@/lib/types";

type FindOriginOptions = {
  skipAck?: boolean;
};

export async function findOrigin(
  chatId: number,
  rawText: string,
  options?: FindOriginOptions,
): Promise<void> {
  const startedAt = Date.now();
  try {
    if (!options?.skipAck) {
      await sendMessage(chatId, "Ищу источники…");
    }

    console.log("findOrigin: start", { chatId });

    const text = await extractInputText(rawText);
    console.log("findOrigin: text extracted", { chatId, length: text.length });

    const queries = await generateSearchQueries(text);
    console.log("findOrigin: queries ready", { chatId, count: queries.length });

    const candidates = await searchSources(queries);
    console.log("findOrigin: search done", { chatId, count: candidates.length });

    const matches = await compareSources(text, candidates);
    console.log("findOrigin: compare done", { chatId, count: matches.length });

    const response = formatSearchResponse(matches);
    await sendMessage(chatId, response);

    console.log("findOrigin: complete", { chatId, durationMs: Date.now() - startedAt });
  } catch (error) {
    console.error("findOrigin: failed", {
      chatId,
      durationMs: Date.now() - startedAt,
      error: error instanceof Error ? error.message : String(error),
    });
    await safeSendMessage(chatId, getErrorMessage(error));
  }
}

async function safeSendMessage(chatId: number, text: string): Promise<void> {
  try {
    await sendMessage(chatId, text);
  } catch (sendError) {
    console.error("Failed to send Telegram message", {
      chatId,
      error: sendError instanceof Error ? sendError.message : String(sendError),
    });
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
