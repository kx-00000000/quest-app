"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getPlans, savePlan } from "@/lib/storage";
import { ArrowLeft, Navigation, Sparkles, Zap, Trophy, CheckCircle, Package } from "lucide-react";
import { calculateBearing, calculateDistance } from "@/lib/geo";

export default function AdventureView({ id }: { id: string }) {
    const router = useRouter();
    const [plan, setPlan] = useState<any>(null);
    const [isTracking, setIsTracking] = useState(false);
    const [isFound, setIsFound] = useState(false);

    const distanceRef = useRef<HTMLHeadingElement>(null);
    const compassRef = useRef<HTMLDivElement>(null);
    const proximityOverlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const found = getPlans().find((p) => p.id === id);
        if (found) setPlan(found);
    }, [id]);

    const items = useMemo(() => plan?.items || [], [plan]);
    const currentItem = useMemo(() => items.find((i: any) => !i.isCollected) || null, [items]);

    // 接近時の演出：上品な「呼吸」のような光り方に
    const updateEffects = (meters: number) => {
        if (!proximityOverlayRef.current) return;
        if (meters < 50) {
            proximityOverlayRef.current.style.opacity = "1";
            proximityOverlayRef.current.style.backgroundColor = `rgba(240, 98, 146, ${Math.max(0.05, 0.15 - meters / 500)})`;
        } else {
            proximityOverlayRef.current.style.opacity = "0";
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
                    updateEffects(meters);
                }
            },
            (err) => console.warn(err),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const debugAcquire = (e: React.MouseEvent) => {
        e.stopPropagation(); // イベントの伝播を止める
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
        <div className="flex flex-col h-screen relative overflow-hidden bg-[#FAFAFA] text-slate-800 font-sans">
            {/* 接近時の柔らかい光 */}
            <div ref={proximityOverlayRef} className="absolute inset-0 opacity-0 transition-opacity duration-1000 pointer-events-none z-0" />

            {/* ヘッダー */}
            <header className="relative z-20 p-6 pt-12 flex justify-between items-end">
                <button onClick={() => router.back()} className="w-11 h-11 bg-white shadow-sm rounded-2xl flex items-center justify-center border border-gray-100 active:scale-95 transition-all">
                    <ArrowLeft size={18} className="text-slate-400" />
                </button>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none mb-1">Mission Progress</p>
                    <p className="text-xl font-light text-pink-500 tracking-tighter italic">
                        {plan.collectedCount || 0} <span className="text-slate-300 mx-1">/</span> {plan.itemCount}
                    </p>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
                {!isTracking ? (
                    <div className="text-center max-w-xs animate-in fade-in duration-700">
                        <div className="w-20 h-20 bg-white rounded-[2.2rem] flex items-center justify-center mx-auto mb-8 shadow-sm border border-gray-50">
                            <Sparkles size={32} className="text-pink-300" />
                        </div>
                        <h2 className="text-2xl font-light mb-2 tracking-tight text-slate-900">Adventure Starts</h2>
                        <p className="text-slate-400 text-sm mb-10 leading-relaxed font-light">羅針盤を起動して、目的地までの<br />距離と方角を確認してください。</p>
                        <button
                            onClick={handleStart}
                            className="w-full py-4 bg-slate-900 text-white font-medium rounded-2xl shadow-lg active:scale-98 transition-all tracking-wide text-sm"
                        >
                            Start Radar
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center space-y-12 w-full max-w-sm">
                        {/* 距離表示パネル */}
                        <div className="text-center w-full py-10 bg-white/40 backdrop-blur-md rounded-[3rem] border border-white/60 shadow-sm">
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.4em] mb-4">Distance</p>
                            <h1 ref={distanceRef} className="text-6xl font-light tracking-tighter tabular-nums text-slate-800 italic">
                                --- m
                            </h1>
                        </div>

                        {/* 精密な方位磁石 */}
                        <div className="relative w-72 h-72 flex items-center justify-center">
                            {/* 外側の繊細な目盛り */}
                            <div className="absolute inset-0 rounded-full border border-slate-100" />
                            <div className="absolute inset-[2px] rounded-full border border-slate-50 border-dashed animate-[spin_60s_linear_infinite]" />

                            {/* 中心のすりガラス */}
                            <div className="absolute inset-12 rounded-full bg-white/30 backdrop-blur-sm border border-white/50 shadow-sm" />

                            <div ref={compassRef} className="relative transition-transform duration-500 ease-out z-10">
                                <Navigation size={64} fill="currentColor" className="text-pink-500 opacity-90" />
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* フッター：コレクション・トレイ */}
            <footer className="relative z-20 p-6 pb-12">
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-5 border border-white shadow-sm">
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                        {items.map((item: any) => (
                            <div key={item.id} className={`w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center border transition-all ${item.isCollected ? "bg-pink-50 border-pink-100 text-pink-400" :
                                    (item.id === currentItem?.id && isTracking ? "bg-white border-pink-300 text-pink-500 shadow-sm" : "bg-gray-50/50 border-gray-100 text-gray-200")
                                }`}>
                                {item.isCollected ? <CheckCircle size={18} /> : <Package size={18} />}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 px-2 flex justify-between items-center">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">
                            {currentItem ? `Next: ${currentItem.name}` : "Complete"}
                        </p>
                        {/* 稲妻ボタンをここに配置して確実に押せるように */}
                        <button
                            onClick={debugAcquire}
                            className="w-8 h-8 flex items-center justify-center text-slate-200 hover:text-pink-200 transition-colors"
                            title="Test: Acquire"
                        >
                            <Zap size={14} />
                        </button>
                    </div>
                </div>
            </footer>

            {/* 獲得モーダル：プレミアム・トーン */}
            {isFound && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-slate-900/10 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="text-center bg-white p-12 rounded-[3.5rem] shadow-2xl border border-white w-full max-w-xs scale-in-center">
                        <div className="w-20 h-20 bg-pink-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-pink-400 border border-pink-100">
                            <Trophy size={36} />
                        </div>
                        <h2 className="text-2xl font-light mb-2 tracking-tight text-slate-800 italic">Found!</h2>
                        <p className="text-slate-400 mb-10 text-xs font-light tracking-wide uppercase">目的地に到達しました</p>
                        <button
                            onClick={() => { setIsFound(false); if (!currentItem) router.push('/log'); }}
                            className="w-full py-4 bg-slate-900 text-white font-medium rounded-2xl shadow-sm active:scale-95 transition-all tracking-wide text-xs"
                        >
                            {currentItem ? "Next Mission" : "Adventure Log"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}