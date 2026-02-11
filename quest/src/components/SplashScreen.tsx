"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
    // フェードイン・アウトの状態を管理するフラグ（初期値 false で透明から開始）
    const [isShowing, setIsShowing] = useState(false);
    // DOMにレンダリングするかどうかを管理するフラグ
    const [shouldRender, setShouldRender] = useState(true);

    useEffect(() => {
        // マウント直後にフェードインを開始
        // 少しだけ遅延させることで、ブラウザの描画準備を待ち、より滑らかに開始します
        const startTimer = setTimeout(() => {
            setIsShowing(true);
        }, 100);

        // ★変更点2: 表示時間を延長（3500ms = 3.5秒後にフェードアウト開始）
        const fadeOutTimer = setTimeout(() => {
            setIsShowing(false); // フェードアウト開始

            // CSSのアニメーション時間（duration-1000）が終了したらDOMから完全に削除
            setTimeout(() => {
                setShouldRender(false);
            }, 1000);

        }, 3500); // 合計の表示時間

        return () => {
            clearTimeout(startTimer);
            clearTimeout(fadeOutTimer);
        };
    }, []);

    // 完全に消えたら何も描画しない（背面の操作を阻害しないため）
    if (!shouldRender) return null;

    return (
        // ★変更点1: isShowing フラグで opacity を制御。duration-1000 でゆっくりと変化。
        <div
            className={`fixed inset-0 z-[9999] flex items-center justify-center bg-white transition-opacity duration-1000 ${isShowing ? 'opacity-100' : 'opacity-0'
                }`}
        >
            {/* ★変更点3: 画像コンテナのサイズ制限を緩和し、余白を減らす */}
            {/* max-w-md を削除し、p-12 を p-4 に変更して画像を大きく表示 */}
            <div className="relative w-full h-full flex flex-col items-center justify-center p-4">
                <img
                    src="/images/splash.png"
                    alt="Quest Splash"
                    // 親の opacity transition に任せるため、個別の animate クラスは削除
                    // 画面からはみ出さない範囲で最大限大きく表示
                    className="w-full h-auto object-contain max-h-screen"
                />
            </div>
        </div>
    );
}