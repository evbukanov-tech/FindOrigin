import { getSearchApiKey } from "@/lib/config";
import type { SourceCandidate } from "@/lib/types";

const BLOCKED_DOMAINS = [
  "t.me",
  "telegram.me",
  "facebook.com",
  "instagram.com",
  "twitter.com",
  "x.com",
  "tiktok.com",
  "vk.com",
  "reddit.com",
  "youtube.com",
];

const PRIORITY_TLDS = [".gov", ".edu"];

type TavilyResult = {
  results?: Array<{
    url?: string;
    title?: string;
    content?: string;
  }>;
};

export async function searchSources(queries: string[]): Promise<SourceCandidate[]> {
  const uniqueQueries = [...new Set(queries.map((query) => query.trim()).filter(Boolean))];
  const candidates: SourceCandidate[] = [];

  for (const query of uniqueQueries) {
    const results = await searchTavily(query);
    candidates.push(...results);
  }

  return deduplicateCandidates(candidates)
    .sort((left, right) => scoreCandidate(right) - scoreCandidate(left))
    .slice(0, 15);
}

async function searchTavily(query: string): Promise<SourceCandidate[]> {
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: getSearchApiKey(),
      query,
      search_depth: "basic",
      max_results: 5,
      include_answer: false,
    }),
  });

  if (!response.ok) {
    throw new Error(`Search API error: ${response.status}`);
  }

  const data = (await response.json()) as TavilyResult;

  return (data.results ?? [])
    .map((result) => ({
      url: result.url?.trim() ?? "",
      title: result.title?.trim() ?? "",
      excerpt: (result.content?.trim() ?? "").slice(0, 500),
    }))
    .filter((candidate) => candidate.url && !isBlockedDomain(candidate.url));
}

function isBlockedDomain(url: string): boolean {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return BLOCKED_DOMAINS.some(
      (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
    );
  } catch {
    return true;
  }
}

function scoreCandidate(candidate: SourceCandidate): number {
  try {
    const hostname = new URL(candidate.url).hostname.toLowerCase();
    if (PRIORITY_TLDS.some((tld) => hostname.endsWith(tld))) {
      return 2;
    }
    return 1;
  } catch {
    return 0;
  }
}

function deduplicateCandidates(candidates: SourceCandidate[]): SourceCandidate[] {
  const seen = new Set<string>();
  const result: SourceCandidate[] = [];

  for (const candidate of candidates) {
    const key = candidate.url.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(candidate);
  }

  return result;
}
