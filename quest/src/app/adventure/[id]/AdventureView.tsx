"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { getPlans, savePlan } from "@/lib/storage";
import { ArrowLeft, CheckCircle, Package, Trophy, Sparkles, Navigation } from "lucide-react";
import { calculateBearing, calculateDistance, type LatLng } from "@/lib/geo";
import dynamic from "next/dynamic";

const LazyMap = dynamic(() => import("@/components/Map/LazyMap"), { ssr: false });
const Compass = dynamic(() => import("@/components/Compass"), { ssr: false });

export default function AdventureView({ id }: { id: string }) {
    const router = useRouter();
    const [plan, setPlan] = useState<any>(null);
    const [userLoc, setUserLoc] = useState<LatLng | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [heading, setHeading] = useState(0);
    const [bearing, setBearing] = useState(0);
    const [isTracking, setIsTracking] = useState(false);
    const [collectedItem, setCollectedItem] = useState<any>(null);

    // 【重要】更新頻度を抑えるための「タイマー」
    const lastUpdate = useRef(0);

    useEffect(() => {
        const found = getPlans().find((p) => p.id === id);
        if (found) setPlan(found);
    }, [id]);

    const items = useMemo(() => plan?.items || [], [plan]);
    const currentItem = useMemo(() => items.find((i: any) => !i.isCollected) || null, [items]);

    // 方位センサーの「大洪水」をせき止める関数
    const handleOrientation = (event: any) => {
        const now = Date.now();
        // 100ミリ秒（1秒に10回）以下の更新は無視して、負荷を下げる
        if (now - lastUpdate.current < 100) return;
        lastUpdate.current = now;

        const h = event.webkitCompassHeading || (event.alpha ? Math.abs(event.alpha - 360) : 0);
        setHeading(h);
    };

    const handleStart = async () => {
        if (typeof window === "undefined") return;

        // 1. iOSのセンサー許可
        const DeviceEvt = window.DeviceOrientationEvent as any;
        if (DeviceEvt && typeof DeviceEvt.requestPermission === 'function') {
            try {
                const res = await DeviceEvt.requestPermission();
                if (res !== 'granted') return;
            } catch (e) { console.error(e); }
        }

        // 2. センサー監視開始（間引き処理付き）
        window.addEventListener("deviceorientation", handleOrientation);

        // 3. GPS監視開始
        setIsTracking(true);
        navigator.geolocation.watchPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                setUserLoc({ lat, lng });

                if (currentItem) {
                    const d = calculateDistance(lat, lng, currentItem.lat, currentItem.lng);
                    const b = calculateBearing(lat, lng, currentItem.lat, currentItem.lng);
                    if (!isNaN(d)) setDistance(d * 1000);
                    if (!isNaN(b)) setBearing(b);
                }
            },
            (err) => console.warn(err),
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
                <button onClick={() => router.back()} className="w-12 h-12 bg-white/40 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/20">
                    <ArrowLeft size={20} />
                </button>
                <div className="bg-white/40 backdrop-blur-xl px-6 py-2 rounded-2xl border border-white/20 shadow-lg font-black text-gray-800 italic">
                    {plan.collectedCount || 0} / {plan.itemCount || 0}
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
                {!isTracking ? (
                    <div className="bg-white/80 backdrop-blur-3xl p-10 rounded-[3rem] shadow-2xl border border-white/40 text-center">
                        <Sparkles className="w-12 h-12 text-pink-500 mx-auto mb-4 animate-pulse" />
                        <h2 className="text-2xl font-black text-gray-800 mb-6 italic uppercase tracking-tighter">Ready?</h2>
                        <button
                            onClick={handleStart}
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
                                {distance !== null ? `${Math.floor(distance).toLocaleString()} m` : "Locating..."}
                            </h1>
                        </div>
                        <div className="relative">
                            <Compass rotation={bearing - heading} />
                        </div>
                    </>
                )}
            </main>

            <div className="relative z-10 px-4 mb-4">
                <div className="bg-white/40 backdrop-blur-3xl rounded-[3rem] p-6 shadow-2xl border border-white/20">
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                        {items.map((item: any) => (
                            <div key={item.id} className={`w-14 h-14 flex-shrink-0 rounded-2xl flex items-center justify-center border-2 transition-all ${item.isCollected ? "bg-pink-100 border-pink-200 text-pink-500" :
                                    item.id === currentItem?.id && isTracking ? "bg-white border-pink-500 text-pink-600 shadow-lg scale-105 animate-bounce" :
                                        "bg-white/40 border-gray-100 text-gray-300"
                                }`}>
                                {item.isCollected ? <CheckCircle size={22} /> : <Package size={22} />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {collectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[3rem] p-10 w-full max-w-sm text-center shadow-2xl animate-scale-up">
                        <div className="w-20 h-20 bg-gradient-to-tr from-[#F06292] to-[#FF8A65] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-bounce">
                            <Navigation className="text-white w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 mb-8 italic uppercase">Found It!</h2>
                        <button onClick={() => setCollectedItem(null)} className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl shadow-lg uppercase tracking-widest text-sm">Next Target</button>
                    </div>
                </div>
            )}
        </div>
    );
}