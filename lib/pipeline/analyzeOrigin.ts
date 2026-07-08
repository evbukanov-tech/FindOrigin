import { compareSources } from "@/lib/ai/compareSources";
import { generateSearchQueries } from "@/lib/ai/generateSearchQueries";
import { extractInputText } from "@/lib/parser/input";
import { searchSources } from "@/lib/search/searchSources";
import { formatSearchResponse } from "@/lib/telegram/formatResponse";
import type { SourceMatch } from "@/lib/types";

export type AnalyzeOriginResult = {
  inputText: string;
  matches: SourceMatch[];
  html: string;
};

export async function analyzeOrigin(rawText: string): Promise<AnalyzeOriginResult> {
  const inputText = await extractInputText(rawText);

  const queries = await generateSearchQueries(inputText);
  const candidates = await searchSources(queries);
  const matches = await compareSources(inputText, candidates);

  const html = formatSearchResponse(matches);
  return { inputText, matches, html };
}

