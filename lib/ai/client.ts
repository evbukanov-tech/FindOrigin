import {
  getAppUrl,
  getOpenAiApiKey,
  getOpenAiBaseUrl,
  getOpenAiModel,
} from "@/lib/config";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
  error?: {
    message?: string;
  };
};

export class AiClientError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiClientError";
  }
}

export async function chatCompletion(
  messages: ChatMessage[],
  options?: { temperature?: number; json?: boolean },
): Promise<string> {
  const response = await fetch(`${getOpenAiBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getOpenAiApiKey()}`,
      "Content-Type": "application/json",
      "HTTP-Referer": getAppUrl() ?? "https://find-origin-jet.vercel.app",
      "X-Title": "FindOrigin",
    },
    body: JSON.stringify({
      model: getOpenAiModel(),
      temperature: options?.temperature ?? 0.2,
      response_format: options?.json ? { type: "json_object" } : undefined,
      messages,
    }),
  });

  const data = (await response.json()) as ChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content;

  if (!response.ok || !content) {
    throw new AiClientError(data.error?.message ?? `AI API error: ${response.status}`);
  }

  return content;
}

export async function chatCompletionJson<T>(
  messages: ChatMessage[],
  options?: { temperature?: number },
): Promise<T> {
  const content = await chatCompletion(messages, { ...options, json: true });

  try {
    return JSON.parse(content) as T;
  } catch {
    throw new AiClientError("AI returned invalid JSON");
  }
}
