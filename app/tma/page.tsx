"use client";

import { useEffect, useState } from "react";
import type { SourceMatch } from "@/lib/types";

declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData?: string;
        ready?: () => void;
        expand?: () => void;
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

  useEffect(() => {
    const tg = window.Telegram?.WebApp;
    if (tg?.ready) tg.ready();
    if (tg?.expand) tg.expand();
    setInitData(tg?.initData);

    // Optional: allow prefill from URL (?q=...).
    try {
      const params = new URLSearchParams(window.location.search);
      const q = params.get("q");
      if (q && !text) setText(q);
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function onSubmit() {
    const trimmed = text.trim();
    if (!trimmed) return;

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
        fontFamily: "system-ui, sans-serif",
        maxWidth: 720,
        margin: "0 auto",
      }}
    >
      <h1 style={{ margin: "8px 0 16px", fontSize: 20 }}>FindOrigin</h1>

      <div style={{ display: "grid", gap: 8 }}>
        <label style={{ fontSize: 13, opacity: 0.8 }}>
          Введите текст или ссылку на Telegram-пост
        </label>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={6}
          placeholder="Например: «5 июля 2026 президент подписал…» или ссылку вида https://t.me/…/…"
          style={{
            width: "100%",
            padding: 12,
            borderRadius: 10,
            border: "1px solid rgba(0,0,0,0.15)",
            fontSize: 14,
            resize: "vertical",
          }}
        />

        <button
          onClick={onSubmit}
          disabled={loading || text.trim().length === 0}
          style={{
            padding: "12px 14px",
            borderRadius: 10,
            border: "none",
            background: loading || text.trim().length === 0 ? "#bdbdbd" : "#2ea44f",
            color: "white",
            cursor: loading || text.trim().length === 0 ? "not-allowed" : "pointer",
            fontWeight: 600,
          }}
        >
          {loading ? "Ищу источники…" : "Найти источники"}
        </button>
      </div>

      {error ? (
        <div style={{ marginTop: 16, color: "#b00020", whiteSpace: "pre-wrap" }}>
          {error}
        </div>
      ) : null}

      {matches.length > 0 ? (
        <section style={{ marginTop: 18 }}>
          <h2 style={{ fontSize: 16, margin: "0 0 10px" }}>Найденные источники</h2>
          <ol style={{ paddingLeft: 18, margin: 0, display: "grid", gap: 12 }}>
            {matches.map((m, i) => (
              <li key={m.url + i} style={{ lineHeight: 1.35 }}>
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
        <section style={{ marginTop: 18 }}>
          <h2 style={{ fontSize: 16, margin: "0 0 10px" }}>Результат</h2>
          <div
            // formatSearchResponse уже экранирует HTML (только <b> и <a>)
            dangerouslySetInnerHTML={{ __html: fallbackHtml }}
            style={{ opacity: 0.95 }}
          />
        </section>
      ) : null}
    </main>
  );
}

