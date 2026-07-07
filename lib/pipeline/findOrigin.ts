import { compareSources } from "@/lib/ai/compareSources";
import { generateSearchQueries } from "@/lib/ai/generateSearchQueries";
import { AiClientError } from "@/lib/ai/client";
import { extractInputText } from "@/lib/parser/input";
import { searchSources } from "@/lib/search/searchSources";
import { sendMessage } from "@/lib/telegram/client";
import { formatSearchResponse } from "@/lib/telegram/formatResponse";
import { InputParseError } from "@/lib/types";

export async function findOrigin(chatId: number, rawText: string): Promise<void> {
  try {
    await sendMessage(chatId, "Ищу источники…");

    const text = await extractInputText(rawText);
    const queries = await generateSearchQueries(text);
    const candidates = await searchSources(queries);
    const matches = await compareSources(text, candidates);
    const response = formatSearchResponse(matches);

    await sendMessage(chatId, response);
  } catch (error) {
    const message = getErrorMessage(error);
    await sendMessage(chatId, message);
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
