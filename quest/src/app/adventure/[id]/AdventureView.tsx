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
    const proximityRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const found = getPlans().find((p) => p.id === id);
        if (found) setPlan(found);
    }, [id]);

    const items = useMemo(() => plan?.items || [], [plan]);
    const currentItem = useMemo(() => items.find((i: any) => !i.isCollected) || null, [items]);

    // 接近演出：背景をピンクに脈動させる
    const updateEffects = (meters: number) => {
        if (!proximityRef.current) return;
        if (meters < 50) {
            proximityRef.current.className = "absolute inset-0 bg-pink-500/10 animate-pulse pointer-events-none";
            if (meters < 20 && navigator.vibrate) navigator.vibrate(100);
        } else {
            proximityRef.current.className = "absolute inset-0 bg-transparent pointer-events-none";
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
        <div className="flex flex-col h-screen relative overflow-hidden bg-white text-gray-900 font-sans">
            {/* 接近演出レイヤー */}
            <div ref={proximityRef} className="absolute inset-0 transition-all duration-500 pointer-events-none" />

            {/* ヘッダー：進捗を表示 */}
            <header className="relative z-10 p-6 pt-12 flex justify-between items-center">
                <button onClick={() => router.back()} className="w-12 h-12 bg-white shadow-lg rounded-2xl flex items-center justify-center border border-gray-50 active:scale-90 transition-all">
                    <ArrowLeft size={20} />
                </button>
                <div className="bg-pink-50 text-pink-500 px-6 py-2 rounded-2xl font-black italic shadow-sm border border-pink-100">
                    PROGRESS: {plan.collectedCount || 0} / {plan.itemCount}
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
                {!isTracking ? (
                    <div className="text-center animate-in fade-in zoom-in duration-500">
                        <div className="w-24 h-24 bg-pink-100 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-pink-500 shadow-inner">
                            <Sparkles size={40} className="animate-pulse" />
                        </div>
                        <h2 className="text-3xl font-black mb-2 italic uppercase tracking-tighter">Ready?</h2>
                        <p className="text-gray-400 text-sm mb-10 font-medium">羅針盤を起動してターゲットを探しましょう</p>
                        <button
                            onClick={handleStart}
                            className="w-full max-w-xs py-5 bg-pink-500 text-white font-black rounded-3xl shadow-xl shadow-pink-200 active:scale-95 transition-all uppercase tracking-widest text-sm"
                        >
                            Start Radar
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center space-y-12">
                        {/* 距離表示パネル */}
                        <div className="text-center bg-white/50 backdrop-blur-xl p-8 rounded-[3rem] border border-white shadow-2xl shadow-pink-100">
                            <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] mb-2">Distance</p>
                            <h1 ref={distanceRef} className="text-7xl font-black italic tracking-tighter tabular-nums text-gray-800">
                                --- m
                            </h1>
                        </div>

                        {/* 羅針盤 */}
                        <div className="relative w-64 h-64 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-4 border-pink-50 border-dashed animate-[spin_30s_linear_infinite]" />
                            <div className="absolute inset-4 rounded-full bg-pink-50/50 backdrop-blur-sm border border-white shadow-inner" />

                            <div ref={compassRef} className="relative transition-transform duration-300 ease-out">
                                <Navigation size={80} fill="currentColor" className="text-pink-500 drop-shadow-[0_10px_15px_rgba(240,98,146,0.3)]" />
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* ボトム：アイテム進捗リスト */}
            <footer className="relative z-10 p-6 pb-10">
                <div className="bg-white/50 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white shadow-xl">
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                        {items.map((item: any) => (
                            <div key={item.id} className={`w-12 h-12 flex-shrink-0 rounded-2xl flex items-center justify-center border-2 transition-all ${item.isCollected ? "bg-pink-100 border-pink-200 text-pink-500 shadow-inner" :
                                    (item.id === currentItem?.id && isTracking ? "bg-white border-pink-400 text-pink-500 shadow-md animate-bounce" : "bg-gray-50 border-gray-100 text-gray-200")
                                }`}>
                                {item.isCollected ? <CheckCircle size={20} /> : <Package size={20} />}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 text-center">
                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">
                            {currentItem ? `Next: ${currentItem.name}` : "All Items Found!"}
                        </p>
                    </div>
                </div>
            </footer>

            {/* デバッグボタン：デザインに馴染ませる */}
            <button
                onClick={debugAcquire}
                className="fixed bottom-2 right-2 p-3 bg-gray-50 text-gray-300 rounded-full opacity-30 hover:opacity-100 transition-opacity"
            >
                <Zap size={14} />
            </button>

            {/* 獲得モーダル：统一スタイル */}
            {isFound && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-white/90 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="text-center bg-white p-12 rounded-[4rem] shadow-2xl border border-pink-50">
                        <div className="w-24 h-24 bg-pink-500 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-white shadow-xl shadow-pink-200 animate-bounce">
                            <Trophy size={48} />
                        </div>
                        <h2 className="text-4xl font-black italic mb-2 tracking-tighter text-gray-800 uppercase">Found!</h2>
                        <p className="text-gray-400 mb-10 font-bold uppercase tracking-widest text-sm">ターゲットを発見しました</p>
                        <button
                            onClick={() => { setIsFound(false); if (!currentItem) router.push('/log'); }}
                            className="w-full py-5 bg-gray-900 text-white font-black rounded-3xl shadow-xl active:scale-95 transition-all uppercase tracking-widest text-sm"
                        >
                            {currentItem ? "Next Mission" : "Show Logs"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}