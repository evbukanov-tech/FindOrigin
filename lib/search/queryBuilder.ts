import type { ParsedInput } from "@/lib/types";

const MAX_QUERIES = 4;

export function buildSearchQueries(parsed: ParsedInput): string[] {
  const queries: string[] = [];
  const primaryClaim = parsed.claims[0];
  const primaryDate = parsed.dates[0];
  const primaryName = parsed.names[0];

  if (primaryClaim && primaryDate) {
    queries.push(`${primaryClaim} ${primaryDate}`);
  }

  if (primaryClaim && primaryName) {
    queries.push(`${primaryClaim} ${primaryName}`);
  }

  if (primaryClaim) {
    queries.push(primaryClaim);
  }

  if (parsed.names.length > 0 && parsed.dates.length > 0) {
    queries.push(`${parsed.names.slice(0, 2).join(" ")} ${parsed.dates[0]}`);
  }

  const keywordQuery = buildKeywordQuery(parsed.rawText);
  if (keywordQuery) {
    queries.push(keywordQuery);
  }

  return uniqueQueries(queries).slice(0, MAX_QUERIES);
}

function buildKeywordQuery(text: string): string {
  const words = text
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/[^\p{L}\p{N}\s-]/gu, " ")
    .split(/\s+/)
    .filter((word) => word.length > 3);

  const stopWords = new Set([
    "этот",
    "этого",
    "этой",
    "these",
    "those",
    "which",
    "where",
    "when",
    "what",
    "that",
    "this",
    "with",
    "from",
    "have",
    "been",
    "will",
    "would",
    "could",
    "should",
    "about",
    "after",
    "before",
    "their",
    "there",
    "they",
    "them",
    "then",
    "than",
    "also",
    "just",
    "only",
    "very",
    "more",
    "some",
    "such",
    "into",
    "over",
    "under",
    "between",
  ]);

  const keywords = [...new Set(words.filter((word) => !stopWords.has(word)))].slice(0, 8);
  return keywords.join(" ");
}

function uniqueQueries(queries: string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const query of queries) {
    const normalized = query.trim().replace(/\s+/g, " ");
    if (!normalized) {
      continue;
    }
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(normalized);
  }

  return result;
}
