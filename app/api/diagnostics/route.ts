import { chatCompletion } from "@/lib/ai/client";
import { getSearchApiKey } from "@/lib/config";
import { searchSources } from "@/lib/search/searchSources";

export const runtime = "nodejs";

type CheckResult = {
  ok: boolean;
  details: string;
};

export async function GET(): Promise<Response> {
  const checks: Record<string, CheckResult> = {};

  checks.openrouter = await runCheck(async () => {
    const answer = await chatCompletion(
      [{ role: "user", content: "Ответь одним словом: ок" }],
      { temperature: 0 },
    );
    return answer.trim().slice(0, 50);
  });

  checks.tavily = await runCheck(async () => {
    getSearchApiKey();
    const results = await searchSources(["OpenAI company founded"]);
    return `${results.length} результат(ов)`;
  });

  const ok = Object.values(checks).every((check) => check.ok);

  return Response.json({ ok, checks });
}

async function runCheck(fn: () => Promise<string>): Promise<CheckResult> {
  try {
    return { ok: true, details: await fn() };
  } catch (error) {
    return {
      ok: false,
      details: error instanceof Error ? error.message : String(error),
    };
  }
}
