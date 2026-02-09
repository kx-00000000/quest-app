"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getPlans, savePlan } from "@/lib/storage";
import { ArrowLeft, Navigation, Sparkles, CheckCircle, Package, Trophy, Zap } from "lucide-react";
import { calculateBearing, calculateDistance } from "@/lib/geo";
import dynamic from "next/dynamic";

const LazyMap = dynamic(() => import("@/components/Map/LazyMap"), { ssr: false });

export default function AdventureView({ id }: { id: string }) {
    const router = useRouter();
    const [plan, setPlan] = useState<any>(null);
    const [isTracking, setIsTracking] = useState(false);
    const [isFound, setIsFound] = useState(false);

    // 直接操作用Ref（Reactの再レンダリングを介さず爆速更新）
    const distanceRef = useRef<HTMLDivElement>(null);
    const compassRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const found = getPlans().find((p) => p.id === id);
        if (found) setPlan(found);
    }, [id]);

    const items = useMemo(() => plan?.items || [], [plan]);
    const currentItem = useMemo(() => items.find((i: any) => !i.isCollected) || null, [items]);

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

                    // 直接書き換え
                    distanceRef.current.innerText = `${meters.toLocaleString()} m`;
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
        <div className="min-h-screen bg-gray-50/50 relative overflow-hidden font-sans">
            {/* 1. 背景地図（固定表示で負荷を最小化） */}
            <div className="absolute inset-0 z-0">
                <LazyMap items={items} userLocation={null} themeColor="#f06292" center={plan.center} />
                <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />
            </div>

            {/* 2. ヘッダー：Plan/Logと共通の「←」ボタン */}
            <header className="relative z-10 p-6 pt-12 flex justify-between items-center">
                <button onClick={() => router.back()} className="w-12 h-12 bg-white/80 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/60 active:scale-90 transition-all">
                    <ArrowLeft className="text-gray-400" size={20} />
                </button>
                <div className="bg-white/80 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/60 shadow-sm">
                    <p className="text-[9px] font-black text-pink-500 uppercase tracking-tighter leading-none mb-0.5">Progress</p>
                    <p className="text-sm font-black text-gray-800 leading-none">{plan.collectedCount} / {plan.itemCount}</p>
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6 h-[60vh]">
                {!isTracking ? (
                    <div className="bg-white/70 backdrop-blur-2xl p-10 rounded-[2.5rem] shadow-2xl border border-white/60 text-center w-full max-w-xs">
                        <div className="w-20 h-20 bg-pink-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-pink-400">
                            <Sparkles size={32} />
                        </div>
                        <h2 className="text-xl font-black text-gray-800 mb-2">Ready to Start?</h2>
                        <p className="text-gray-400 text-xs mb-8 font-bold uppercase tracking-widest">Connect to Compass</p>
                        <button
                            onClick={handleStart}
                            className="w-full bg-gradient-to-r from-[#F06292] to-[#FF8A65] text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all text-sm uppercase tracking-widest border-b-4 border-black/10"
                        >
                            Start Adventure
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center space-y-10 w-full">
                        {/* 距離計：PlanPageのスタッツボックスを応用 */}
                        <div className="bg-white/70 backdrop-blur-2xl p-8 rounded-[3rem] shadow-2xl border border-white/60 text-center w-full max-w-sm">
                            <p className="text-[10px] font-black text-pink-600 uppercase tracking-[0.3em] mb-4">Target Distance</p>
                            <div ref={distanceRef} className="text-6xl font-black text-gray-800 tracking-tighter">
                                --- m
                            </div>
                        </div>

                        {/* 羅針盤：洗練されたミニマリズム */}
                        <div className="relative w-64 h-64 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-2 border-white/40" />
                            <div className="absolute inset-4 rounded-full border border-pink-100 border-dashed animate-[spin_30s_linear_infinite]" />
                            <div className="absolute inset-10 rounded-full bg-white/20 backdrop-blur-md border border-white/60 shadow-inner" />

                            <div ref={compassRef} className="relative transition-transform duration-300 ease-out z-10">
                                <Navigation size={80} fill="currentColor" className="text-pink-500 drop-shadow-xl" />
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* 3. ボトム：コレクション・トレイ (Logページと統一) */}
            <footer className="fixed bottom-10 left-6 right-6 z-10">
                <div className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] p-5 shadow-2xl border border-white/60">
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                        {items.map((item: any) => (
                            <div key={item.id} className={`w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center border transition-all ${item.isCollected ? "bg-pink-50 border-pink-100 text-pink-400" :
                                    (item.id === currentItem?.id && isTracking ? "bg-white border-pink-300 text-pink-500 shadow-md animate-bounce" : "bg-gray-100/50 border-gray-100 text-gray-200")
                                }`}>
                                {item.isCollected ? <CheckCircle size={18} /> : <Package size={18} />}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex justify-between items-center px-2">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                            {currentItem ? `Next: ${currentItem.name}` : "Complete!"}
                        </p>
                        {/* テスト用ボタン：控えめに配置 */}
                        <button onClick={debugAcquire} className="text-gray-200 hover:text-pink-200 transition-colors">
                            <Zap size={14} />
                        </button>
                    </div>
                </div>
            </footer>

            {/* 獲得モーダル：Plan/Logと共通の品格 */}
            {isFound && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-8 bg-gray-900/10 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="text-center bg-white p-12 rounded-[3.5rem] shadow-2xl border border-white w-full max-w-xs">
                        <div className="w-20 h-20 bg-pink-50 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-pink-400 border border-pink-100">
                            <Trophy size={36} />
                        </div>
                        <h2 className="text-2xl font-black mb-2 text-gray-800">FOUND!</h2>
                        <p className="text-gray-400 mb-10 text-[10px] font-black tracking-widest uppercase">Target has been secured</p>
                        <button
                            onClick={() => { setIsFound(false); if (!currentItem) router.push('/log'); }}
                            className="w-full py-4 bg-gray-900 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all uppercase tracking-widest text-xs"
                        >
                            {currentItem ? "Next Mission" : "Show Results"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}