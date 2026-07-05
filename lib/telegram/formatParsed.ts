import type { ParsedInput } from "@/lib/types";

export function formatParsedInput(parsed: ParsedInput, queries: string[]): string {
  const sections: string[] = ["<b>Текст получен и разобран</b>", ""];

  if (parsed.claims.length > 0) {
    sections.push("<b>Утверждения:</b>");
    parsed.claims.forEach((claim, index) => {
      sections.push(`${index + 1}. ${escapeHtml(claim)}`);
    });
    sections.push("");
  }

  if (parsed.dates.length > 0) {
    sections.push(`<b>Даты:</b> ${parsed.dates.map(escapeHtml).join(", ")}`);
    sections.push("");
  }

  if (parsed.numbers.length > 0) {
    sections.push(`<b>Числа:</b> ${parsed.numbers.map(escapeHtml).join(", ")}`);
    sections.push("");
  }

  if (parsed.names.length > 0) {
    sections.push(`<b>Имена:</b> ${parsed.names.map(escapeHtml).join(", ")}`);
    sections.push("");
  }

  if (parsed.links.length > 0) {
    sections.push("<b>Ссылки в тексте:</b>");
    parsed.links.forEach((link) => {
      sections.push(`• ${escapeHtml(link)}`);
    });
    sections.push("");
  }

  if (queries.length > 0) {
    sections.push("<b>Поисковые запросы (готовы к этапу 5):</b>");
    queries.forEach((query, index) => {
      sections.push(`${index + 1}. ${escapeHtml(query)}`);
    });
  }

  return truncate(sections.join("\n"), 4096);
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) {
    return text;
  }
  return `${text.slice(0, maxLength - 1)}…`;
}
