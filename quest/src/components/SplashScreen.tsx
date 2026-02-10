"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // 2秒後にフェードアウトを開始し、2.5秒後に完全に消す
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center animate-out fade-out fill-mode-forwards duration-500 delay-[2000ms]">
            <div className="text-center animate-in zoom-in-95 duration-700 ease-out">
                {/* アプリ名：既存のスタイルに合わせた黒・イタリック・極太 */}
                <h1 className="text-6xl font-black italic uppercase tracking-[0.2em] text-black mb-4">
                    Quest
                </h1>

                {/* 下部のバー：読み込み中を演出 */}
                <div className="w-12 h-[2px] bg-pink-500 mx-auto overflow-hidden relative">
                    <div className="absolute inset-0 bg-white/50 animate-shimmer translate-x-[-100%]"
                        style={{ animation: 'shimmer 1.5s infinite' }}
                    />
                </div>

                <p className="mt-8 text-[10px] font-bold text-gray-300 uppercase tracking-[0.5em] animate-pulse">
                    System Booting
                </p>
            </div>

            {/* 下部のコピーライト（オプション） */}
            <div className="absolute bottom-12 text-[8px] font-bold text-gray-200 uppercase tracking-widest">
                AI Concierge Engine v1.0
            </div>

            <style jsx>{`
                @keyframes shimmer {
                    100% { transform: translateX(100%); }
                }
            `}</style>
        </div>
    );
}