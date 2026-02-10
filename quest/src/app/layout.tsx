// src/app/layout.tsx
import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/Navigation/BottomNav"; // ★インポートを追加

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Quest - 今日という日を冒険にする",
  description: "日常を冒険に変える位置情報探索アプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${nunito.variable} antialiased`}>
        {/* ★ children の下に BottomNav を配置 */}
        {children}
        <BottomNav />
      </body>
    </html>
  );
}