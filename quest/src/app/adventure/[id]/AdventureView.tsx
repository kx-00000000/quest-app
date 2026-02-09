"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getPlans, savePlan } from "@/lib/storage";
import { ArrowLeft, Navigation, Sparkles, Zap, Map as MapIcon, Trophy } from "lucide-react";
import { calculateBearing, calculateDistance } from "@/lib/geo";

export default function AdventureView({ id }: { id: string }) {
    const router = useRouter();
    const [plan, setPlan] = useState<any>(null);
    const [isTracking, setIsTracking] = useState(false);
    const [isFound, setIsFound] = useState(false); // 獲得画面用

    // 直接操作用Ref
    const distanceRef = useRef<HTMLHeadingElement>(null);
    const compassRef = useRef<HTMLDivElement>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const scanLineRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const found = getPlans().find((p) => p.id === id);
        if (found) setPlan(found);
    }, [id]);

    const items = plan?.items || [];
    const currentItem = items.find((i: any) => !i.isCollected) || null;

    // --- 演出ロジック：距離に応じて見た目を変える ---
    const updateProximityEffects = (meters: number) => {
        if (!overlayRef.current || !scanLineRef.current) return;

        if (meters < 20) {
            // 超至近距離：激しく点滅
            overlayRef.current.className = "absolute inset-0 bg-pink-500/40 animate-pulse duration-75";
            scanLineRef.current.style.borderColor = "#ff4081";
        } else if (meters < 50) {
            // 近距離：ゆっくり脈動
            overlayRef.current.className = "absolute inset-0 bg-pink-500/20 animate-pulse duration-1000";
            scanLineRef.current.style.borderColor = "#f06292";
            // 接近バイブ（一度だけ）
            if (navigator.vibrate) navigator.vibrate(200);
        } else {
            // 遠距離：静か
            overlayRef.current.className = "absolute inset-0 bg-transparent";
            scanLineRef.current.style.borderColor = "rgba(255,255,255,0.1)";
        }
    };

    const handleStart = async () => {
        if (typeof window === "undefined") return;
        const DeviceEvt = (window as any).DeviceOrientationEvent;
        if (DeviceEvt && typeof DeviceEvt.requestPermission === 'function') {
            try { await DeviceEvt.requestPermission(); } catch (e) { console.error(e); }
        }

        setIsTracking(true);
        let currentHeading = 0;
        let currentBearing = 0;

        window.addEventListener("deviceorientation", (event: any) => {
            currentHeading = event.webkitCompassHeading || (event.alpha ? Math.abs(event.alpha - 360) : 0);
            if (compassRef.current) {
                compassRef.current.style.transform = `rotate(${currentBearing - currentHeading}deg)`;
            }
        });

        navigator.geolocation.watchPosition(
            (pos) => {
                if (currentItem && distanceRef.current) {
                    const d = calculateDistance(pos.coords.latitude, pos.coords.longitude, currentItem.lat, currentItem.lng);
                    currentBearing = calculateBearing(pos.coords.latitude, pos.coords.longitude, currentItem.lat, currentItem.lng);

                    const meters = Math.floor(d * 1000);
                    distanceRef.current.innerText = `${meters.toLocaleString()} m`;
                    updateProximityEffects(meters);
                }
            },
            (err) => console.warn(err),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    // --- テスト用：アイテムを強制獲得する ---
    const debugAcquire = () => {
        if (!currentItem) return;
        const now = new Date().toISOString();
        const updatedItems = items.map((i: any) => i.id === currentItem.id ? { ...i, isCollected: true, collectedAt: now } : i);
        const updatedPlan = { ...plan, items: updatedItems, collectedCount: (plan.collectedCount || 0) + 1 };
        savePlan(updatedPlan as any);
        setPlan(updatedPlan as any);
        setIsFound(true);
    };

    if (!plan) return null;

    return (
        <div className="flex flex-col h-screen relative overflow-hidden bg-[#0a0a0f] text-white font-sans">
            {/* 接近演出レイヤー */}
            <div ref={overlayRef} className="absolute inset-0 transition-all duration-500 pointer-events-none" />

            {/* レーダー風の走査線 */}
            <div ref={scanLineRef} className="absolute inset-0 border-[1px] opacity-20 pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(circle, transparent 30%, rgba(240,98,146,0.05) 100%)' }} />

            <header className="relative z-10 p-6 pt-12 flex justify-between items-center">
                <button onClick={() => router.back()} className="w-12 h-12 bg-white/5 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/10">
                    <ArrowLeft size={20} />
                </button>
                <div className="text-[10px] font-black tracking-[0.4em] text-pink-500 animate-pulse">
                    SIGNAL TRACKING
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
                {!isTracking ? (
                    <div className="text-center">
                        <div className="relative w-32 h-32 mx-auto mb-10">
                            <div className="absolute inset-0 bg-pink-500 rounded-full blur-2xl opacity-20 animate-pulse" />
                            <div className="relative w-full h-full bg-gradient-to-tr from-pink-500 to-orange-400 rounded-full flex items-center justify-center shadow-2xl">
                                <Sparkles size={48} />
                            </div>
                        </div>
                        <h2 className="text-4xl font-black mb-4 italic tracking-tighter uppercase">Quest Start</h2>
                        <button onClick={handleStart} className="px-12 py-5 bg-white text-black font-black rounded-2xl shadow-2xl active:scale-95 transition-all tracking-widest">
                            LAUNCH RADAR
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center space-y-16">
                        <div className="text-center">
                            <p className="text-[10px] font-bold text-pink-400 uppercase tracking-[0.5em] mb-4">Distance to Target</p>
                            <h1 ref={distanceRef} className="text-8xl font-black italic tracking-tighter tabular-nums text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
                                --- m
                            </h1>
                        </div>

                        <div className="relative w-72 h-72 flex items-center justify-center">
                            {/* レーダー装飾 */}
                            <div className="absolute inset-0 rounded-full border border-white/5 animate-ping duration-[3s]" />
                            <div className="absolute inset-0 rounded-full border-2 border-white/10" />
                            <div className="absolute inset-10 rounded-full border border-pink-500/20" />

                            <div ref={compassRef} className="relative transition-transform duration-300 ease-out">
                                <Navigation size={100} fill="currentColor" className="text-pink-500 drop-shadow-[0_0_20px_rgba(240,98,146,0.6)]" />
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* --- デバッグ用隠しパネル（開発時のみ使用） --- */}
            <div className="relative z-20 p-4 bg-white/5 border-t border-white/10 flex gap-4 justify-center backdrop-blur-xl">
                <button
                    onClick={debugAcquire}
                    className="flex items-center gap-2 px-4 py-2 bg-pink-500/20 text-pink-400 rounded-full text-[10px] font-black border border-pink-500/30 active:bg-pink-500"
                >
                    <Zap size={12} /> TEST: ACQUIRE
                </button>
                <div className="text-[8px] text-gray-500 flex items-center italic">
                    ※デバッグ用：歩かずに獲得
                </div>
            </div>

            {/* 獲得モーダル */}
            {isFound && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-[0_0_50px_rgba(250,204,21,0.4)] animate-bounce">
                            <Trophy size={48} className="text-black" />
                        </div>
                        <h2 className="text-5xl font-black italic mb-2 tracking-tighter">FOUND!</h2>
                        <p className="text-gray-400 mb-10 font-bold uppercase tracking-widest text-sm">Target has been secured</p>
                        <button
                            onClick={() => { setIsFound(false); if (!currentItem) router.push('/log'); }}
                            className="w-full bg-white text-black font-black py-5 rounded-2xl shadow-xl active:scale-95 transition-all uppercase tracking-widest"
                        >
                            {currentItem ? "Next Mission" : "Complete Adventure"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}