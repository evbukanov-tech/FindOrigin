import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FindOrigin — Mini App",
  description: "Поиск источников информации в Telegram",
};

export default function TmaLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="tma-root">
      {children}
      <style>{`
        .tma-root {
          min-height: 100dvh;
          background: var(--tg-theme-bg-color, #ffffff);
          color: var(--tg-theme-text-color, #111111);
        }

        body {
          margin: 0;
        }
      `}</style>
    </div>
  );
}
