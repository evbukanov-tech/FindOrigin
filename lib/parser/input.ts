import { InputParseError } from "@/lib/types";
import { decodeHtmlEntities, normalizeText } from "@/lib/parser/normalize";

const TELEGRAM_POST_PATTERNS = [
  /^https?:\/\/t\.me\/c\/(\d+)\/(\d+)\/?$/i,
  /^https?:\/\/t\.me\/([a-zA-Z0-9_]+)\/(\d+)\/?$/i,
];

export function isTelegramPostUrl(input: string): boolean {
  const trimmed = input.trim();
  return TELEGRAM_POST_PATTERNS.some((pattern) => pattern.test(trimmed));
}

export async function extractInputText(rawMessage: string): Promise<string> {
  const trimmed = rawMessage.trim();

  if (!trimmed) {
    throw new InputParseError("Сообщение пустое. Пришлите текст или ссылку на пост.");
  }

  if (isTelegramPostUrl(trimmed)) {
    const text = await fetchTelegramPostText(trimmed);
    if (!text) {
      throw new InputParseError(
        "Не удалось получить текст поста. Перешлите сообщение текстом или пришлите ссылку на публичный канал.",
      );
    }
    return normalizeText(text);
  }

  return normalizeText(trimmed);
}

async function fetchTelegramPostText(url: string): Promise<string | null> {
  const embedUrl = url.includes("?") ? `${url}&embed=1` : `${url}?embed=1`;

  try {
    const response = await fetch(embedUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; FindOriginBot/1.0)",
      },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return null;
    }

    const html = await response.text();
    return extractTextFromTelegramEmbed(html);
  } catch {
    return null;
  }
}

function extractTextFromTelegramEmbed(html: string): string | null {
  const widgetMatch = html.match(
    /<div class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
  );
  if (widgetMatch?.[1]) {
    return stripHtmlTags(decodeHtmlEntities(widgetMatch[1])).trim() || null;
  }

  const ogDescriptionMatch = html.match(
    /<meta\s+property="og:description"\s+content="([^"]*)"/i,
  );
  if (ogDescriptionMatch?.[1]) {
    return decodeHtmlEntities(ogDescriptionMatch[1]).trim() || null;
  }

  return null;
}

function stripHtmlTags(html: string): string {
  return html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, "");
}
