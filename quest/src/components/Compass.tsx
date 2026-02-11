"use client";

import { useEffect, useState, useCallback } from "react";

// コンパスが正しい方向（北）を指すためのオフセット角度
// 画像の針が最初から北を指している場合は0でOKです
const NEEDLE_OFFSET = 0;

interface CompassProps {
    targetBearing: number; // 目的地の方位（0-360度）
}

export default function Compass({ targetBearing }: CompassProps) {
    const [currentHeading, setCurrentHeading] = useState(0); // 現在のスマホの向き

    // デバイスのジャイロセンサーから方角を取得する処理
    const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
        let heading = event.alpha || 0;
        // AndroidのChromeなど、一部の環境では補正が必要な場合があります
        if (typeof (event as any).webkitCompassHeading === "number") {
            heading = (event as any).webkitCompassHeading;
        }
        setCurrentHeading(heading);
    }, []);

    useEffect(() => {
        // ジャイロセンサーのイベントリスナーを登録
        if (window.DeviceOrientationEvent) {
            window.addEventListener("deviceorientation", handleOrientation, true);
        }
        return () => {
            window.removeEventListener("deviceorientation", handleOrientation);
        };
    }, [handleOrientation]);

    // 針の回転角度を計算
    // (目的地の方位 - 現在のスマホの向き) で、針が目的地を指すようになります
    // NEEDLE_OFFSET は針の画像の初期位置合わせ用です
    const needleRotation = (targetBearing - currentHeading + NEEDLE_OFFSET + 360) % 360;

    return (
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* 図1: ダイヤル盤（背景） */}
            <img
                src="/images/compass-dial.png"
                alt="Compass Dial"
                className="absolute inset-0 w-full h-full object-contain"
            />

            {/* 図2: 針（回転する要素） */}
            {/* transition-transform で滑らかに回転させます */}
            <img
                src="/images/compass-needle.png"
                alt="Compass Needle"
                className="absolute inset-0 w-full h-full object-contain transition-transform duration-300 ease-out will-change-transform"
                style={{ transform: `rotate(${needleRotation}deg)` }}
            />

            {/* デバッグ用：現在の方位と目的地の方位を表示（開発中のみ表示しても良いでしょう） */}
            <div className="absolute bottom-[-40px] text-white text-xs text-center w-full">
                <p>Heading: {Math.round(currentHeading)}°</p>
                <p>Target: {Math.round(targetBearing)}°</p>
            </div>
        </div>
    );
}