"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getPlans, savePlan } from "@/lib/storage";
import { ArrowLeft, CheckCircle, Package, Navigation, Trophy, Sparkles } from "lucide-react";
import { calculateBearing, calculateDistance, type LatLng } from "@/lib/geo";
import dynamic from "next/dynamic";

// 地図を「完全に静的」にする（ユーザー位置を渡さないテスト）
const LazyMap = dynamic(() => import("@/components/Map/LazyMap"), { ssr: false });

export default function AdventureView({ id }: { id: string }) {
    const router = useRouter();
    const [plan, setPlan] = useState<any>(null);
    const [userLoc, setUserLoc] = useState<LatLng | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [isTracking, setIsTracking] = useState(false);
    const [collectedItem, setCollectedItem] = useState<any>(null);
    const [runtimeError, setRuntimeError] = useState<string | null>(null);

    // 1. データ読み込み
    useEffect(() => {
        try {
            const found = getPlans().find((p) => p.id === id);
            if (found) setPlan(found);
        } catch (e: any) {
            setRuntimeError("Data Load: " + e.message);
        }
    }, [id]);

    const items = useMemo(() => plan?.items || [], [plan]);
    const currentItem = useMemo(() => items.find((i: any) => !i.isCollected) || null, [items]);

    // 2. GPS開始（極限までシンプルに）
    const startAdventure = () => {
        if (typeof window === "undefined" || !navigator.geolocation) return;
        setIsTracking(true);

        navigator.geolocation.watchPosition(
            (pos) => {
                try {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;

                    // 数値チェック
                    if (typeof lat !== 'number' || typeof lng !== 'number') return;

                    setUserLoc({ lat, lng });

                    if (currentItem && typeof currentItem.lat === 'number') {
                        const d = calculateDistance(lat, lng, currentItem.lat, currentItem.lng);
                        // NaNチェックを徹底
                        if (!isNaN(d)) {
                            setDistance(d * 1000);
                        }
                    }
                } catch (err: any) {
                    setRuntimeError("GPS Calc: " + err.message);
                }
            },
            (err) => setRuntimeError("GPS Signal: " + err.message),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    if (runtimeError) {
        return (
            <div className="h-screen bg-red-50 p-10 flex flex-col items-center justify-center text-center">
                <h1 className="text-red-600 font-black mb-4 uppercase">System Error</h1>
                <p className="text-xs text-red-400 font-mono break-all mb-10">{runtimeError}</p>
                <button onClick={() => window.location.reload()} className="bg-red-500 text-white px-8 py-3 rounded-full font-bold">RELOAD</button>
            </div>
        );
    }

    if (!plan) return null;

    return (
        <div className="flex flex-col h-screen relative overflow-hidden bg-white">
            {/* 1. 地図：userLocationをあえて渡さず、地図が原因で落ちるのを防ぐ */}
            <div className="absolute inset-0 z-0">
                <LazyMap items={items} userLocation={null} themeColor="#F06292" center={plan.center} />
            </div>

            <header className="relative z-10 flex justify-between items-center p-6 pt-12">
                <button onClick={() => router.back()} className="w-12 h-12 bg-white/50 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/40">
                    <ArrowLeft size={20} />
                </button>
                <div className="bg-white/50 backdrop-blur-xl px-6 py-2 rounded-2xl border border-white/40 shadow-lg font-black text-gray-800">
                    {plan.collectedCount || 0} / {plan.itemCount || 0}
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
                {!isTracking ? (
                    <div className="bg-white/70 backdrop-blur-3xl p-10 rounded-[3rem] shadow-2xl border border-white/40 text-center">
                        <Sparkles className="w-12 h-12 text-pink-500 mx-auto mb-4 animate-pulse" />
                        <h2 className="text-2xl font-black text-gray-800 mb-2 italic">START QUEST?</h2>
                        <button
                            onClick={startAdventure}
                            className="w-full mt-6 bg-pink-500 text-white font-black py-5 px-10 rounded-2xl shadow-xl shadow-pink-200 active:scale-95 transition-all"
                        >
                            Start
                        </button>
                    </div>
                ) : (
                    <div className="text-center mb-8 bg-white/40 backdrop-blur-md p-10 rounded-[2.5rem] border border-white/30 shadow-2xl">
                        <p className="text-[10px] font-black text-pink-600 uppercase mb-1 tracking-widest">Target Distance</p>
                        <h1 className="text-5xl font-black text-gray-900 italic tracking-tighter">
                            {distance !== null ? `${Math.floor(distance).toLocaleString()} m` : "Locating..."}
                        </h1>
                        {/* 方位磁石の代わりに、GPS座標をデバッグ表示 */}
                        <p className="text-[8px] font-mono text-gray-400 mt-4 uppercase">
                            {userLoc ? `GPS: ${userLoc.lat.toFixed(4)}, ${userLoc.lng.toFixed(4)}` : "Waiting for coordinates..."}
                        </p>
                    </div>
                )}
            </main>

            <div className="relative z-10 px-4 mb-4">
                <div className="bg-white/50 backdrop-blur-3xl rounded-[3rem] p-6 shadow-2xl border border-white/40">
                    <div className="flex gap-3 overflow-x-auto no-scrollbar">
                        {items.map((item: any) => (
                            <div key={item.id} className={`w-14 h-14 flex-shrink-0 rounded-2xl flex items-center justify-center border-2 transition-all ${item.isCollected ? "bg-pink-100 border-pink-200 text-pink-500" :
                                    item.id === currentItem?.id && isTracking ? "bg-white border-pink-500 text-pink-600 shadow-lg" :
                                        "bg-white/50 border-gray-100 text-gray-300"
                                }`}>
                                {item.isCollected ? <CheckCircle size={22} /> : <Package size={22} />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}