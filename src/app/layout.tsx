import type { Metadata } from "next";
import { Inter, Manrope } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  variable: "--font-inter",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Интеллектуальный менеджер задач — Рабочее пространство",
  description: "Управление задачами, фильтры и ИИ-подсказки",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${inter.variable} ${manrope.variable}`}>
      <head>
        {/* Material Symbols for shell/table icons (prototype parity); Inter/Manrope stay on next/font. */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- icon font not in next/font catalog */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=swap" />
      </head>
      <body>{children}</body>
    </html>
  );
}
