import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
// スプラッシュスクリーンのインポート
import SplashScreen from "@/components/SplashScreen";

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
      <body className={`${nunito.variable} antialiased relative bg-white`}>
        {/* スプラッシュスクリーン 
          z-indexを最大に設定しているため、最前面で描画されます 
        */}
        <SplashScreen />

        {/* メインコンテンツエリア */}
        <main className="min-h-screen">
          {children}
        </main>

        {/* ボトムナビゲーション 
          スプラッシュ画面が表示されている間も背面に存在しますが、
          スプラッシュ側のz-indexにより隠れます 
        */}
        <BottomNav />
      </body>
    </html>
  );
}