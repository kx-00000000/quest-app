"use client";

import BottomNav from "@/components/BottomNav";
// ★ 追加：Google Maps API をこのレイアウト以下で有効にするための Provider
import { APIProvider } from '@vis.gl/react-google-maps';

export default function MainLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        /* ★ 修正：APIProvider で全体を包みます。
           これにより、BottomNav や各ページ(children)内のどこでも 
           Google Map コンポーネントが正常に動作するようになります。
        */
        <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
            <div className="min-h-screen bg-gray-50 pb-24">
                {/* 航空機のキャビンやコックピットのように、
                   情報を中央に集約させる max-w-md のモバイル用コンテナ 
                */}
                <main className="max-w-md mx-auto min-h-screen bg-white shadow-sm relative overflow-hidden">
                    {children}
                </main>

                {/* 既存のナビゲーションを維持 */}
                <BottomNav />
            </div>
        </APIProvider>
    );
}