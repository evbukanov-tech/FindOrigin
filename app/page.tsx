export default function HomePage() {
  return (
    <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
      <h1>FindOrigin</h1>
      <p>Telegram-бот для поиска источников информации.</p>
      <p>
        Webhook endpoint: <code>/api/webhook</code>
      </p>
      <p>
        Telegram Mini App:{" "}
        <a href="/tma">/tma</a>
      </p>
    </main>
  );
}
