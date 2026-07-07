import { chatCompletionJson } from "@/lib/ai/client";
import { buildSearchQueriesFromText } from "@/lib/search/queryBuilder";

const MAX_QUERIES = 4;

export async function generateSearchQueries(text: string): Promise<string[]> {
  try {
    const result = await chatCompletionJson<{ queries?: string[] }>([
      {
        role: "system",
        content:
          "Generate 2-4 concise web search queries to find the original source of the information in the user text. Return JSON: {\"queries\": string[]}. Use the same language as the input. Focus on facts, dates, names, and official sources.",
      },
      {
        role: "user",
        content: text,
      },
    ]);

    const queries = (result.queries ?? [])
      .map((query) => query.trim())
      .filter(Boolean)
      .slice(0, MAX_QUERIES);

    if (queries.length > 0) {
      return queries;
    }
  } catch {
    // fallback below
  }

  return buildSearchQueriesFromText(text);
}
