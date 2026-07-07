const token = process.env.TELEGRAM_BOT_TOKEN ?? process.env.BOT_TOKEN;

if (!token) {
  console.log("TOKEN: missing (set TELEGRAM_BOT_TOKEN or BOT_TOKEN)");
  process.exit(1);
}

console.log("TOKEN: set");

for (const name of [
  "OPENAI_API_KEY",
  "OPENROUTER_API_KEY",
  "SEARCH_API_KEY",
  "TELEGRAM_WEBHOOK_SECRET",
  "OPENAI_BASE_URL",
  "APP_URL",
  "VERCEL_URL",
]) {
  const value = process.env[name];
  if (!value) {
    console.log(`${name}: missing`);
    continue;
  }

  const masked =
    name.includes("KEY") || name.includes("SECRET") || name.includes("TOKEN")
      ? "set"
      : value;
  console.log(`${name}: ${masked}`);
}

async function callTelegram(method) {
  const response = await fetch(`https://api.telegram.org/bot${token}/${method}`);
  return response.json();
}

const me = await callTelegram("getMe");
console.log(
  "getMe:",
  JSON.stringify({
    ok: me.ok,
    username: me.result?.username,
    first_name: me.result?.first_name,
  }),
);

const webhook = await callTelegram("getWebhookInfo");
const info = webhook.result ?? {};
console.log(
  "webhook:",
  JSON.stringify(
    {
      url: info.url || "(not set)",
      pending_update_count: info.pending_update_count ?? 0,
      last_error_message: info.last_error_message ?? null,
      last_error_date: info.last_error_date ?? null,
    },
    null,
    2,
  ),
);
