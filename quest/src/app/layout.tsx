import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
// 相対パスに変更して、エイリアスのトラブルを回避
import BottomNav from "../components/Navigation/BottomNav";

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
        <BottomNav />
      </body>
    </html>
  );
}