"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getPlans } from "@/lib/storage";
import { ArrowLeft, Navigation, Sparkles, Map as MapIcon } from "lucide-react";
import { calculateBearing, calculateDistance } from "@/lib/geo";

export default function AdventureView({ id }: { id: string }) {
    const router = useRouter();
    const [plan, setPlan] = useState<any>(null);
    const [isTracking, setIsTracking] = useState(false);

    // Reactを介さない直接操作用のRef
    const distanceRef = useRef<HTMLHeadingElement>(null);
    const compassRef = useRef<HTMLDivElement>(null);
    const backgroundRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const found = getPlans().find((p) => p.id === id);
        if (found) setPlan(found);
    }, [id]);

    const currentItem = plan?.items?.find((i: any) => !i.isCollected) || null;

    const handleStart = async () => {
        if (typeof window === "undefined") return;

        // iOSセンサー許可
        const DeviceEvt = (window as any).DeviceOrientationEvent;
        if (DeviceEvt && typeof DeviceEvt.requestPermission === 'function') {
            try { await DeviceEvt.requestPermission(); } catch (e) { console.error(e); }
        }

        setIsTracking(true);

        let currentHeading = 0;
        let currentBearing = 0;

        // 1. 方位センサー監視（直接DOM操作）
        window.addEventListener("deviceorientation", (event: any) => {
            currentHeading = event.webkitCompassHeading || (event.alpha ? Math.abs(event.alpha - 360) : 0);
            if (compassRef.current) {
                compassRef.current.style.transform = `rotate(${currentBearing - currentHeading}deg)`;
            }
        });

        // 2. GPS監視（直接DOM操作）
        navigator.geolocation.watchPosition(
            (pos) => {
                const { latitude: lat, longitude: lng } = pos.coords;
                if (currentItem && distanceRef.current) {
                    const d = calculateDistance(lat, lng, currentItem.lat, currentItem.lng);
                    currentBearing = calculateBearing(lat, lng, currentItem.lat, currentItem.lng);

                    const meters = Math.floor(d * 1000);
                    distanceRef.current.innerText = `${meters.toLocaleString()} m`;

                    // 【演出】近づくほど背景の色を濃くする「Hot/Cold」機能
                    if (backgroundRef.current) {
                        const opacity = Math.max(0.1, 1 - (meters / 500)); // 500m以内で色が変化
                        backgroundRef.current.style.backgroundColor = `rgba(240, 98, 146, ${opacity})`;
                    }
                }
            },
            (err) => console.warn(err),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    if (!plan) return null;

    return (
        <div className="flex flex-col h-screen relative overflow-hidden bg-slate-900 text-white">
            {/* 演出用の背景層 */}
            <div ref={backgroundRef} className="absolute inset-0 transition-colors duration-1000" />

            {/* グリッド線（冒険感を出す装飾） */}
            <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:40px_40px]" />

            <header className="relative z-10 p-6 pt-12 flex justify-between">
                <button onClick={() => router.back()} className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                    <ArrowLeft size={20} />
                </button>
                <div className="bg-white/10 backdrop-blur-md px-6 py-2 rounded-2xl border border-white/20 font-black italic">
                    SEARCHING...
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
                {!isTracking ? (
                    <div className="text-center animate-in fade-in zoom-in duration-700">
                        <div className="w-24 h-24 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(240,98,146,0.5)]">
                            <Sparkles size={40} className="animate-pulse" />
                        </div>
                        <h2 className="text-3xl font-black mb-2 italic uppercase">Adventure</h2>
                        <p className="text-gray-400 text-sm mb-10">羅針盤を起動してターゲットを探せ</p>
                        <button
                            onClick={handleStart}
                            className="px-12 py-5 bg-white text-slate-900 font-black rounded-2xl shadow-xl active:scale-95 transition-all uppercase tracking-widest"
                        >
                            Start Radar
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center space-y-12">
                        {/* 距離表示 */}
                        <div className="text-center">
                            <p className="text-xs font-black text-pink-400 uppercase mb-2 tracking-[0.3em]">Target Range</p>
                            <h1 ref={distanceRef} className="text-7xl font-black italic tracking-tighter tabular-nums">
                                --- m
                            </h1>
                        </div>

                        {/* 羅針盤（メインビジュアル） */}
                        <div className="relative w-80 h-80 flex items-center justify-center">
                            {/* 装飾用のリング */}
                            <div className="absolute inset-0 rounded-full border-2 border-white/5" />
                            <div className="absolute inset-4 rounded-full border border-white/10 border-dashed animate-[spin_30s_linear_infinite]" />
                            <div className="absolute inset-10 rounded-full border-2 border-pink-500/20 shadow-[0_0_30px_rgba(240,98,146,0.2)]" />

                            {/* 回転する針 */}
                            <div ref={compassRef} className="relative transition-transform duration-300 ease-out">
                                <Navigation size={120} fill="currentColor" className="text-pink-500 drop-shadow-[0_0_20px_rgba(240,98,146,0.8)]" />
                            </div>
                        </div>

                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest animate-pulse">
                            Signal Tracking Active
                        </p>
                    </div>
                )}
            </main>

            {/* フッター（アイテムのヒント） */}
            <footer className="relative z-10 p-8">
                <div className="bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10 text-center">
                    <p className="text-gray-400 text-xs font-bold uppercase mb-1">Target</p>
                    <p className="text-lg font-black italic">{currentItem?.name || "???"}</p>
                </div>
            </footer>
        </div>
    );
}