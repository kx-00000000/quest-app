import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
// ★ 修正：Navigationフォルダは無いので直接 components から読み込みます
import BottomNav from "@/components/BottomNav";

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
        {children}
        {/* ボトムナビゲーションを配置 */}
        <BottomNav />
      </body>
    </html>
  );
}