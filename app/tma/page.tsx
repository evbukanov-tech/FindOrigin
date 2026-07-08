"use client";

import { useEffect, useState } from "react";
import type { SourceMatch } from "@/lib/types";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        initDataUnsafe?: { start_param?: string };
        ready?: () => void;
        expand?: () => void;
        themeParams?: Record<string, string>;
        colorScheme?: "light" | "dark";
      };
    };
  }
}

type AnalyzeTmaResponse =
  | { ok: true; matches: SourceMatch[]; html: string }
  | { ok: false; error: string };

export default function TmaPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<SourceMatch[]>([]);
  const [fallbackHtml, setFallbackHtml] = useState<string | null>(null);
  const [initData, setInitData] = useState<string | undefined>(undefined);
  const [inTelegram, setInTelegram] = useState(false);

  useEffect(() => {
    function initTelegram() {
      const tg = window.Telegram?.WebApp;
      if (!tg) {
        return;
      }

      setInTelegram(true);
      tg.ready?.();
      tg.expand?.();
      setInitData(tg.initData || undefined);

      const startParam = tg.initDataUnsafe?.start_param;
      if (startParam) {
        try {
          setText(decodeURIComponent(startParam));
        } catch {
          setText(startParam);
        }
      }
    }

    initTelegram();

    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) {
      setText((current) => current || q);
    }

    window.addEventListener("load", initTelegram);
    return () => window.removeEventListener("load", initTelegram);
  }, []);

  async function onSubmit() {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    setLoading(true);
    setError(null);
    setMatches([]);
    setFallbackHtml(null);

    try {
      const response = await fetch("/api/tma/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed, initData }),
      });

      const data = (await response.json()) as AnalyzeTmaResponse;
      if (!response.ok || !data.ok) {
        setError((data as { ok: false; error: string }).error ?? "Ошибка запроса.");
        return;
      }

      setMatches(data.matches);
      setFallbackHtml(data.html);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Ошибка сети.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      style={{
        padding: 16,
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
        maxWidth: 720,
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      <h1 style={{ margin: "8px 0 4px", fontSize: 22, lineHeight: 1.2 }}>FindOrigin</h1>
      <p style={{ margin: "0 0 16px", fontSize: 14, opacity: 0.75, lineHeight: 1.4 }}>
        {inTelegram
          ? "Вставьте текст или ссылку на Telegram-пост."
          : "Откройте эту страницу из бота Telegram для полной интеграции."}
      </p>

      <div style={{ display: "grid", gap: 10 }}>
        <label
          htmlFor="findorigin-input"
          style={{ display: "block", fontSize: 13, opacity: 0.85, lineHeight: 1.4 }}
        >
          Текст или ссылка
        </label>
        <textarea
          id="findorigin-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Например: «5 июля 2026 президент подписал…» или https://t.me/channel/123"
          style={{
            width: "100%",
            boxSizing: "border-box",
            padding: 12,
            borderRadius: 12,
            border: "1px solid var(--tg-theme-hint-color, rgba(0,0,0,0.2))",
            background: "var(--tg-theme-secondary-bg-color, #f7f7f7)",
            color: "var(--tg-theme-text-color, #111)",
            fontSize: 16,
            lineHeight: 1.4,
            resize: "vertical",
            minHeight: 120,
          }}
        />

        <button
          type="button"
          onClick={onSubmit}
          disabled={loading || text.trim().length === 0}
          style={{
            padding: "14px 16px",
            borderRadius: 12,
            border: "none",
            background:
              loading || text.trim().length === 0
                ? "var(--tg-theme-hint-color, #bdbdbd)"
                : "var(--tg-theme-button-color, #2ea44f)",
            color: "var(--tg-theme-button-text-color, #ffffff)",
            cursor: loading || text.trim().length === 0 ? "not-allowed" : "pointer",
            fontWeight: 600,
            fontSize: 16,
          }}
        >
          {loading ? "Ищу источники…" : "Найти источники"}
        </button>
      </div>

      {error ? (
        <div
          role="alert"
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 10,
            background: "rgba(176, 0, 32, 0.08)",
            color: "#b00020",
            whiteSpace: "pre-wrap",
            lineHeight: 1.4,
          }}
        >
          {error}
        </div>
      ) : null}

      {matches.length > 0 ? (
        <section style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 17, margin: "0 0 12px" }}>Найденные источники</h2>
          <ol style={{ paddingLeft: 20, margin: 0, display: "grid", gap: 14 }}>
            {matches.map((m, i) => (
              <li key={m.url + i} style={{ lineHeight: 1.45 }}>
                <div style={{ fontWeight: 700 }}>
                  <a href={m.url} target="_blank" rel="noreferrer">
                    {m.title || m.url}
                  </a>
                </div>
                <div style={{ opacity: 0.85, marginTop: 4 }}>Уверенность: {m.confidence}%</div>
                <div style={{ marginTop: 6, opacity: 0.9 }}>{m.reasoning}</div>
              </li>
            ))}
          </ol>
        </section>
      ) : fallbackHtml ? (
        <section style={{ marginTop: 20 }}>
          <h2 style={{ fontSize: 17, margin: "0 0 12px" }}>Результат</h2>
          <div
            dangerouslySetInnerHTML={{ __html: fallbackHtml }}
            style={{ opacity: 0.95, lineHeight: 1.45 }}
          />
        </section>
      ) : null}
    </main>
  );
}
