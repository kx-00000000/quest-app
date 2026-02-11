"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
    // 画像（ナマケモノ）のフェードイン管理
    const [imageShowing, setImageShowing] = useState(false);
    // スプラッシュ画面全体のフェードアウト管理
    const [isFadingOut, setIsFadingOut] = useState(false);
    // DOMから消去する管理
    const [shouldRender, setShouldRender] = useState(true);

    useEffect(() => {
        // 1. 起動直後に画像だけをふわっと出す
        const imageTimer = setTimeout(() => {
            setImageShowing(true);
        }, 300); // 0.3秒後に画像が浮き出る

        // 2. 3.5秒間しっかり見せる
        const startFadeOutTimer = setTimeout(() => {
            setIsFadingOut(true); // 全体を消し始める

            // 3. フェードアウトのアニメーションが終わったら消去
            setTimeout(() => {
                setShouldRender(false);
            }, 1000);

        }, 3500);

        return () => {
            clearTimeout(imageTimer);
            clearTimeout(startFadeOutTimer);
        };
    }, []);

    if (!shouldRender) return null;

    return (
        /* 背景の白い幕：最初から opacity-100 にしておくことで背景を完全に隠します */
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-1000 ${isFadingOut ? 'opacity-0' : 'opacity-100'
                }`}
        >
            <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                <img
                    src="/images/splash.png"
                    alt="Quest Splash"
                    /* 画像だけをふわっと浮かび上がらせる */
                    className={`w-full h-auto object-contain max-h-[80vh] transition-all duration-1000 transform ${imageShowing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
                        }`}
                />
            </div>
        </div>
    );
}