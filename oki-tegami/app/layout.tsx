import type { Metadata } from "next";
import { Dela_Gothic_One, Zen_Maru_Gothic, Yomogi } from "next/font/google";
import "./globals.css";

const delaGothic = Dela_Gothic_One({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-dela",
  display: "swap",
});

const zenMaru = Zen_Maru_Gothic({
  weight: ["300", "400", "500", "700", "900"],
  subsets: ["latin"],
  variable: "--font-zen",
  display: "swap",
});

const yomogi = Yomogi({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-yomogi",
  display: "swap",
});

import type { Viewport } from "next";

export const metadata: Metadata = {
  title: "Dropped and Found",
  description: "Leave a letter where you are.",
  manifest: "/manifest.json",
  applicationName: "Dropped and Found",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "D&F",
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport: Viewport = {
  themeColor: "#f5f5f5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false, // Prevent zoom for app-like feel
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${delaGothic.variable} ${zenMaru.variable} ${yomogi.variable} antialiased font-sans bg-[#FFFDF5] text-[#2D2D2D]`}
      >
        {children}
      </body>
    </html>
  );
}
