import { getOpenAiApiKey } from "@/lib/config";
import type { ParsedInput } from "@/lib/types";

const URL_PATTERN = /https?:\/\/[^\s<>"')\]]+/gi;

const DATE_PATTERNS = [
  /\b\d{1,2}[./-]\d{1,2}[./-]\d{2,4}\b/g,
  /\b\d{4}-\d{2}-\d{2}\b/g,
  /\b\d{1,2}\s+(?:январ[яе]|феврал[яе]|март[ае]?|апрел[яе]|ма[яй]|июн[яе]|июл[яе]|август[ае]|сентябр[яе]|октябр[яе]|ноябр[яе]|декабр[яе])\s+\d{4}\b/gi,
  /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b/gi,
];

const NUMBER_PATTERNS = [
  /\b\d{1,3}(?:[ \u00A0]\d{3})+(?:[.,]\d+)?\b/g,
  /\b\d+(?:[.,]\d+)?\s*(?:%|₽|руб\.?|USD|EUR|\$|€)\b/gi,
  /\b\d+(?:[.,]\d+)?\s*(?:тыс|млн|млрд|тысяч|миллион(?:ов|а)?|миллиард(?:ов|а)?)\b/gi,
];

export async function extractEntities(rawText: string): Promise<ParsedInput> {
  const links = extractLinks(rawText);
  const dates = extractDates(rawText);
  const numbers = extractNumbers(rawText);

  const aiResult = await extractWithAi(rawText);
  const claims = aiResult?.claims.length ? aiResult.claims : extractClaimsFallback(rawText);
  const names = aiResult?.names.length ? aiResult.names : extractNamesFallback(rawText);

  return {
    rawText,
    claims: unique(claims),
    dates: unique(dates),
    numbers: unique(numbers),
    names: unique(names),
    links: unique(links),
  };
}

function extractLinks(text: string): string[] {
  const matches = text.match(URL_PATTERN) ?? [];
  return matches.map((url) => url.replace(/[.,;:!?)]+$/, ""));
}

function extractDates(text: string): string[] {
  const results: string[] = [];
  for (const pattern of DATE_PATTERNS) {
    const matches = text.match(pattern) ?? [];
    results.push(...matches);
  }
  return results;
}

function extractNumbers(text: string): string[] {
  const results: string[] = [];
  for (const pattern of NUMBER_PATTERNS) {
    const matches = text.match(pattern) ?? [];
    results.push(...matches);
  }
  return results;
}

function extractClaimsFallback(text: string): string[] {
  const sentences = text
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.length >= 40);

  if (sentences.length === 0) {
    return [text.slice(0, 280)];
  }

  return sentences.slice(0, 5);
}

function extractNamesFallback(text: string): string[] {
  const matches =
    text.match(/\b[А-ЯЁA-Z][a-zа-яё]+(?:\s+[А-ЯЁA-Z][a-zа-яё]+){0,2}\b/g) ?? [];
  const stopWords = new Set([
    "The", "This", "That", "When", "Where", "What", "Which", "However", "Therefore",
    "Also", "But", "And", "Or", "Not", "For", "From", "With", "About", "After",
    "Before", "During", "While", "Because", "Since", "Until", "Although", "Though",
    "Russian", "English", "Telegram", "Internet", "Google", "Microsoft", "Apple",
    "January", "February", "March", "April", "May", "June", "July", "August",
    "September", "October", "November", "December",
  ]);

  return matches
    .filter((name) => !stopWords.has(name.split(" ")[0]))
    .slice(0, 10);
}

type AiExtraction = {
  claims: string[];
  names: string[];
};

async function extractWithAi(rawText: string): Promise<AiExtraction | null> {
  const apiKey = getOpenAiApiKey();
  if (!apiKey) {
    return null;
  }

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content:
              "Extract key factual claims and named entities from user text. Return JSON: {\"claims\": string[], \"names\": string[]}. Claims: 1-5 short factual statements. Names: people, organizations, brands. Use the same language as the input.",
          },
          {
            role: "user",
            content: rawText,
          },
        ],
      }),
    });

    if (!response.ok) {
      return null;
    }

    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return null;
    }

    const parsed = JSON.parse(content) as AiExtraction;
    return {
      claims: Array.isArray(parsed.claims) ? parsed.claims.filter(Boolean) : [],
      names: Array.isArray(parsed.names) ? parsed.names.filter(Boolean) : [],
    };
  } catch {
    return null;
  }
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}
