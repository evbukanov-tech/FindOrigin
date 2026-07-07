import { readFileSync } from "node:fs";

function loadEnvFile(path) {
  try {
    const content = readFileSync(path, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (value.startsWith("[") && value.endsWith("]")) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  } catch {
    // optional file
  }
}

loadEnvFile(".env");
loadEnvFile(".env.local");

const token = process.env.TELEGRAM_BOT_TOKEN ?? process.env.BOT_TOKEN;
const openAiKey = process.env.OPENAI_API_KEY ?? process.env.OPENROUTER_API_KEY;
const searchKey = process.env.SEARCH_API_KEY ?? process.env.TAVILY_API_KEY;
const openAiBaseUrl = process.env.OPENAI_BASE_URL ?? "https://openrouter.ai/api/v1";

const results = [];

async function check(name, fn) {
  try {
    const details = await fn();
    results.push({ name, ok: true, details });
  } catch (error) {
    results.push({
      name,
      ok: false,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}

await check("telegram_token", async () => {
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN не задан");
  const response = await fetch(`https://api.telegram.org/bot${token}/getMe`);
  const data = await response.json();
  if (!data.ok) throw new Error(data.description ?? "getMe failed");
  return `@${data.result.username}`;
});

await check("openrouter", async () => {
  if (!openAiKey) throw new Error("OPENROUTER_API_KEY / OPENAI_API_KEY не задан");
  const response = await fetch(`${openAiBaseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${openAiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.APP_URL ?? "https://find-origin-jet.vercel.app",
      "X-Title": "FindOrigin",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "openai/gpt-4o-mini",
      messages: [{ role: "user", content: "Ответь одним словом: ок" }],
      max_tokens: 10,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message ?? `HTTP ${response.status}`);
  }
  return data.choices?.[0]?.message?.content?.trim() ?? "ответ получен";
});

await check("tavily_search", async () => {
  if (!searchKey) throw new Error("SEARCH_API_KEY не задан");
  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: searchKey,
      query: "OpenAI company founded",
      search_depth: "basic",
      max_results: 1,
    }),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail ?? data.error ?? `HTTP ${response.status}`);
  }
  return `${data.results?.length ?? 0} результат(ов)`;
});

await check("vercel_webhook", async () => {
  const response = await fetch("https://find-origin-jet.vercel.app/api/webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      update_id: 1,
      message: {
        message_id: 1,
        chat: { id: 1, type: "private" },
        text: "ping",
      },
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
  return `HTTP ${response.status}, ok=${data.ok}`;
});

for (const result of results) {
  const status = result.ok ? "OK" : "FAIL";
  console.log(`${status} ${result.name}: ${result.details}`);
}

const failed = results.filter((result) => !result.ok).length;
process.exitCode = failed > 0 ? 1 : 0;
