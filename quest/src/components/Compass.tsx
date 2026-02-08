"use client";

import { useEffect, useState } from "react";
import { Navigation } from "lucide-react"; // Planeより矢印らしいアイコンに変更

interface CompassProps {
    bearing: number; // ターゲットの方角（度）
}

export default function Compass({ bearing }: CompassProps) {
    const [heading, setHeading] = useState(0);

    useEffect(() => {
        const handleOrientation = (event: DeviceOrientationEvent) => {
            let compassHeading = 0;

            // iOS (Safari) の場合の取得方法
            if ((event as any).webkitCompassHeading !== undefined) {
                compassHeading = (event as any).webkitCompassHeading;
            }
            // Android / Chrome の場合の取得方法（nullチェックを厳格に）
            else if (event.alpha !== null && event.alpha !== undefined) {
                // alphaは反時計回りなので、時計回りに変換
                compassHeading = Math.abs(event.alpha - 360);
            }

            setHeading(compassHeading);
        };

        // センサーが利用可能な場合のみイベントを登録
        if (typeof window !== "undefined" && window.DeviceOrientationEvent) {
            window.addEventListener("deviceorientation", handleOrientation);
        }

        return () => {
            if (typeof window !== "undefined") {
                window.removeEventListener("deviceorientation", handleOrientation);
            }
        };
    }, []);

    // 回転の計算：スマホの向き（heading）を考慮して、ターゲット（bearing）を指す
    const rotation = bearing - heading;

    return (
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* 外側のリング：ピンクのデザインに合わせて調整 */}
            <div className="absolute inset-0 rounded-full border-4 border-pink-200/30 border-dashed animate-[spin_10s_linear_infinite]" />

            {/* 中央の円体：すりガラス効果 */}
            <div className="absolute inset-8 rounded-full bg-white/20 backdrop-blur-md shadow-inner border border-white/30" />

            {/* 方位針（アイコン）：ピンクのグラデーション */}
            <div
                className="relative z-10 text-pink-500 transition-transform duration-500 ease-out"
                style={{ transform: `rotate(${rotation}deg)` }}
            >
                <div className="drop-shadow-[0_0_15px_rgba(240,98,146,0.5)]">
                    <Navigation size={80} fill="currentColor" />
                </div>
            </div>

            {/* 北（N）のインジケーター */}
            <div
                className="absolute top-2 font-black text-pink-600 text-sm tracking-tighter opacity-40 transition-transform duration-500"
                style={{ transform: `rotate(${-heading}deg)` }} // 北の位置を固定
            >
                N
            </div>
        </div>
    );
}