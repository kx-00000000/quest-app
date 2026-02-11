"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        // 2.5秒後にフェードアウトを開始するタイマー
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 2500);

        return () => clearTimeout(timer);
    }, []);

    if (!isVisible) return null;

    return (
        <div className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-700 ${isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="relative w-full h-full max-w-md flex flex-col items-center justify-center p-12">
                <img
                    src="/images/splash.png"
                    alt="Quest Splash"
                    className="w-full h-auto object-contain animate-in fade-in zoom-in duration-1000"
                />
            </div>
        </div>
    );
}