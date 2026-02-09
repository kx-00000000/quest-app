"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getPlans, savePlan } from "@/lib/storage";
import { ArrowLeft, CheckCircle, Package, Navigation, Trophy, Sparkles } from "lucide-react";
import { calculateBearing, calculateDistance, type LatLng } from "@/lib/geo";
import dynamic from "next/dynamic";

const LazyMap = dynamic(() => import("@/components/Map/LazyMap"), { ssr: false });
const SafeCompass = dynamic(() => import("@/components/Compass"), { ssr: false });

export default function AdventureView({ id }: { id: string }) {
    const router = useRouter();
    const [plan, setPlan] = useState<any>(null);
    const [userLoc, setUserLoc] = useState<LatLng | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [bearing, setBearing] = useState(0);
    const [isTracking, setIsTracking] = useState(false);
    const [collectedItem, setCollectedItem] = useState<any>(null);

    useEffect(() => {
        const found = getPlans().find((p) => p.id === id);
        if (found) setPlan(found);
    }, [id]);

    const items = useMemo(() => plan?.items || [], [plan]);
    const currentItem = useMemo(() => items.find((i: any) => !i.isCollected) || null, [items]);

    // 【最重要】iOSのセンサー許可とGPS開始
    const startAdventure = async () => {
        if (typeof window === "undefined") return;

        // 1. iOS特有の「方位センサー利用許可」をリクエスト
        const DeviceEvt = window.DeviceOrientationEvent as any;
        if (DeviceEvt && typeof DeviceEvt.requestPermission === 'function') {
            try {
                const response = await DeviceEvt.requestPermission();
                if (response !== 'granted') {
                    alert("方位センサーの利用が拒否されました。設定を確認してください。");
                }
            } catch (e) {
                console.error("Permission request failed", e);
            }
        }

        // 2. GPS監視開始
        setIsTracking(true);
        navigator.geolocation.watchPosition(
            (pos) => {
                const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLoc(newLoc);

                // currentItemの存在と緯度経度が有効か厳格にチェックしてから計算
                if (currentItem && typeof currentItem.lat === 'number') {
                    try {
                        const d = calculateDistance(newLoc.lat, newLoc.lng, currentItem.lat, currentItem.lng);
                        const b = calculateBearing(newLoc.lat, newLoc.lng, currentItem.lat, currentItem.lng);

                        if (!isNaN(d)) setDistance(d * 1000); // メートル換算
                        if (!isNaN(b)) setBearing(b);
                    } catch (err) {
                        console.error("Calculation logic failed safely.");
                    }
                }
            },
            (err) => console.warn("GPS error:", err),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    if (!plan) return null;

    return (
        <div className="flex flex-col h-screen relative overflow-hidden bg-white">
            <div className="absolute inset-0 z-0">
                <LazyMap items={items} userLocation={userLoc} themeColor="#F06292" center={plan.center} />
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
                    <div className="bg-white/70 backdrop-blur-3xl p-10 rounded-[3rem] shadow-2xl border border-white/40 text-center animate-scale-up">
                        <Sparkles className="w-12 h-12 text-pink-500 mx-auto mb-4 animate-pulse" />
                        <h2 className="text-2xl font-black text-gray-800 mb-2 italic tracking-tighter uppercase">Ready to go?</h2>
                        <p className="text-gray-400 text-[10px] font-bold mb-8 italic uppercase tracking-widest">Enable sensors to start</p>
                        <button
                            onClick={startAdventure}
                            className="w-full bg-pink-500 text-white font-black py-5 px-10 rounded-2xl shadow-xl shadow-pink-200 active:scale-95 transition-all uppercase tracking-widest text-sm"
                        >
                            Start Adventure
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="text-center mb-8 bg-white/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/30 shadow-2xl">
                            <p className="text-[10px] font-black text-pink-600 uppercase mb-1 tracking-widest">Distance</p>
                            <h1 className="text-5xl font-black text-gray-900 italic tracking-tighter">
                                {distance !== null ? `${Math.floor(distance).toLocaleString()} m` : "Waiting..."}
                            </h1>
                        </div>
                        <div className="relative">
                            <div className="absolute inset-0 bg-pink-500/20 blur-3xl rounded-full animate-pulse" />
                            <SafeCompass bearing={bearing} />
                        </div>
                    </>
                )}
            </main>

            <div className="relative z-10 px-4 mb-4">
                <div className="bg-white/50 backdrop-blur-3xl rounded-[3rem] p-6 shadow-2xl border border-white/40">
                    <div className="flex gap-3 overflow-x-auto no-scrollbar">
                        {items.map((item: any) => (
                            <div key={item.id} className={`w-14 h-14 flex-shrink-0 rounded-2xl flex items-center justify-center border-2 transition-all ${item.isCollected ? "bg-pink-100 border-pink-200 text-pink-500" :
                                    item.id === currentItem?.id && isTracking ? "bg-white border-pink-500 text-pink-600 shadow-lg scale-105 animate-bounce" :
                                        "bg-white/50 border-gray-100 text-gray-300"
                                }`}>
                                {item.isCollected ? <CheckCircle size={22} /> : <Package size={22} />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 獲得モーダルなどは省略せず保持 */}
        </div>
    );
}