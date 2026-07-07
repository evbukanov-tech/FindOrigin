import { chatCompletionJson } from "@/lib/ai/client";
import type { SourceCandidate, SourceMatch } from "@/lib/types";

const CONFIDENCE_THRESHOLD = 40;
const MAX_RESULTS = 3;

type CompareSourcesResponse = {
  matches?: Array<{
    url?: string;
    title?: string;
    confidence?: number;
    reasoning?: string;
  }>;
};

export async function compareSources(
  sourceText: string,
  candidates: SourceCandidate[],
): Promise<SourceMatch[]> {
  if (candidates.length === 0) {
    return [];
  }

  const candidateList = candidates
    .map(
      (candidate, index) =>
        `${index + 1}. URL: ${candidate.url}\nTitle: ${candidate.title}\nExcerpt: ${candidate.excerpt}`,
    )
    .join("\n\n");

  const result = await chatCompletionJson<CompareSourcesResponse>([
    {
      role: "system",
      content:
        "Compare the meaning of the source text with each candidate page. Do not rely on literal text matching. Estimate how likely each candidate is the original or earliest publisher of the information. Return JSON: {\"matches\": [{\"url\": string, \"title\": string, \"confidence\": number, \"reasoning\": string}]}. Confidence is 0-100. Reasoning is one short sentence in the same language as the source text. Include only candidates with confidence >= 40. Maximum 3 matches, sorted by confidence descending.",
    },
    {
      role: "user",
      content: `Source text:\n${sourceText}\n\nCandidates:\n${candidateList}`,
    },
  ]);

  const matches = (result.matches ?? [])
    .map((match) => ({
      url: match.url?.trim() ?? "",
      title: match.title?.trim() ?? "",
      confidence: normalizeConfidence(match.confidence),
      reasoning: match.reasoning?.trim() ?? "",
    }))
    .filter((match) => match.url && match.confidence >= CONFIDENCE_THRESHOLD)
    .sort((left, right) => right.confidence - left.confidence)
    .slice(0, MAX_RESULTS);

  return enrichMatches(matches, candidates);
}

function normalizeConfidence(value: unknown): number {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) {
    return 0;
  }
  return Math.max(0, Math.min(100, Math.round(number)));
}

function enrichMatches(matches: SourceMatch[], candidates: SourceCandidate[]): SourceMatch[] {
  return matches.map((match) => {
    const candidate = candidates.find((item) => item.url === match.url);
    return {
      ...match,
      title: match.title || candidate?.title || match.url,
    };
  });
}
