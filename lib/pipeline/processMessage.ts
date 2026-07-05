import { buildSearchQueries } from "@/lib/search/queryBuilder";
import { extractEntities } from "@/lib/parser/extract";
import { extractInputText } from "@/lib/parser/input";
import { formatParsedInput } from "@/lib/telegram/formatParsed";
import { sendMessage } from "@/lib/telegram/client";
import { InputParseError } from "@/lib/types";

export async function processUserMessage(chatId: number, rawText: string): Promise<void> {
  try {
    const text = await extractInputText(rawText);
    const parsed = await extractEntities(text);
    const queries = buildSearchQueries(parsed);
    const response = formatParsedInput(parsed, queries);
    await sendMessage(chatId, response);
  } catch (error) {
    const message =
      error instanceof InputParseError
        ? error.message
        : "Произошла ошибка при обработке сообщения. Попробуйте ещё раз.";
    await sendMessage(chatId, message);
  }
}
