const MAX_QUERIES = 4;

export function buildSearchQueriesFromText(text: string): string[] {
  const keywordQuery = buildKeywordQuery(text);
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 30)
    .slice(0, 3);

  const queries = [...sentences, keywordQuery].filter(Boolean);
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
    "этот", "этого", "этой", "these", "those", "which", "where", "when", "what",
    "that", "this", "with", "from", "have", "been", "will", "would", "could",
    "should", "about", "after", "before", "their", "there", "they", "them",
    "then", "than", "also", "just", "only", "very", "more", "some", "such",
    "into", "over", "under", "between",
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
