import type { SourceMatch } from "@/lib/types";

export function formatSearchResponse(matches: SourceMatch[]): string {
  if (matches.length === 0) {
    return [
      "<b>Источники не найдены</b>",
      "",
      "Попробуйте прислать более конкретный текст: добавьте дату, имя или ключевой факт.",
    ].join("\n");
  }

  const sections = ["<b>Найденные источники</b>", ""];

  matches.forEach((match, index) => {
    sections.push(
      `${index + 1}. <a href="${escapeAttribute(match.url)}">${escapeHtml(match.title)}</a>`,
      `Уверенность: ${match.confidence}%`,
      escapeHtml(match.reasoning),
      "",
    );
  });

  return truncate(sections.join("\n").trim(), 4096);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function escapeAttribute(value: string): string {
  return value.replace(/"/g, "&quot;");
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
}
