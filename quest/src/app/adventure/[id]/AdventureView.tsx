"use client";

import { useEffect, useState, useMemo, useRef, memo } from "react";
import { useRouter } from "next/navigation";
import { getPlans, savePlan } from "@/lib/storage";
// CheckCircle と Package を追加
import { ArrowLeft, Navigation, Sparkles, CheckCircle, Package } from "lucide-react";
import { calculateBearing, calculateDistance, type LatLng } from "@/lib/geo";
import dynamic from "next/dynamic";

// 地図を「重い部品」として特別扱いし、親の細かい動きに反応させない
const LazyMap = dynamic(() => import("@/components/Map/LazyMap"), { ssr: false });
const MemoizedMap = memo(LazyMap);

export default function AdventureView({ id }: { id: string }) {
    const router = useRouter();
    const [plan, setPlan] = useState<any>(null);
    const [userLoc, setUserLoc] = useState<LatLng | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [heading, setHeading] = useState(0);
    const [bearing, setBearing] = useState(0);
    const [isTracking, setIsTracking] = useState(false);

    // 描画の洪水（大爆発）を防ぐためのリミッター
    const lastSensorUpdate = useRef(0);

    useEffect(() => {
        const found = getPlans().find((p) => p.id === id);
        if (found) setPlan(found);
    }, [id]);

    const items = useMemo(() => plan?.items || [], [plan]);
    const currentItem = useMemo(() => items.find((i: any) => !i.isCollected) || null, [items]);

    const handleStart = async () => {
        if (typeof window === "undefined") return;

        // iOS センサー許可の儀式
        const DeviceEvt = (window as any).DeviceOrientationEvent;
        if (DeviceEvt && typeof DeviceEvt.requestPermission === 'function') {
            try { await DeviceEvt.requestPermission(); } catch (e) { console.error(e); }
        }

        // 方位センサー：300ミリ秒（1秒に3回）だけ画面を更新するように制限
        window.addEventListener("deviceorientation", (event: any) => {
            const now = Date.now();
            if (now - lastSensorUpdate.current < 300) return;
            lastSensorUpdate.current = now;

            const h = event.webkitCompassHeading || (event.alpha ? Math.abs(event.alpha - 360) : 0);
            setHeading(h);
        });

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
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
        );
    };

    if (!plan) return null;

    return (
        <div className="flex flex-col h-screen relative overflow-hidden bg-white">
            {/* 1. 地図：userLocationを渡してもMemoizedMapが負荷を抑え込みます */}
            <div className="absolute inset-0 z-0">
                <MemoizedMap
                    items={items}
                    userLocation={userLoc}
                    themeColor="#F06292"
                    center={plan.center}
                />
                <div className="absolute inset-0 bg-white/5 pointer-events-none" />
            </div>

            <header className="relative z-10 flex justify-between p-6 pt-12">
                <button onClick={() => router.back()} className="w-12 h-12 bg-white/60 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg border border-white/20 active:scale-90">
                    <ArrowLeft size={20} />
                </button>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
                {!isTracking ? (
                    <div className="bg-white/80 backdrop-blur-2xl p-10 rounded-[3rem] shadow-2xl border border-white text-center animate-in fade-in zoom-in duration-500">
                        <Sparkles className="w-12 h-12 text-pink-500 mx-auto mb-4 animate-pulse" />
                        <h2 className="text-2xl font-black text-gray-800 mb-6 italic uppercase tracking-tighter leading-none">Start Adventure</h2>
                        <button
                            onClick={handleStart}
                            className="w-full bg-pink-500 text-white font-black py-5 px-10 rounded-2xl shadow-xl shadow-pink-200 active:scale-95 transition-all uppercase tracking-widest text-sm"
                        >
                            Start
                        </button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center space-y-8">
                        <div className="text-center bg-white/60 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-2xl border border-white">
                            <p className="text-[10px] font-black text-pink-600 uppercase mb-1 tracking-widest">Distance</p>
                            <h1 className="text-5xl font-black text-gray-900 italic tracking-tighter">
                                {distance !== null ? `${Math.floor(distance).toLocaleString()} m` : "..."}
                            </h1>
                        </div>

                        <div className="relative w-64 h-64 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-4 border-pink-200/30 border-dashed animate-[spin_20s_linear_infinite]" />
                            <div
                                className="relative text-pink-500 transition-transform duration-500 ease-out"
                                style={{ transform: `rotate(${bearing - heading}deg)` }}
                            >
                                <div className="drop-shadow-[0_0_15px_rgba(240,98,146,0.4)]">
                                    <Navigation size={80} fill="currentColor" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* 下部アイテムリスト：アイコンの読み込みエラーを解消 */}
            <div className="relative z-10 px-4 mb-8">
                <div className="bg-white/60 backdrop-blur-2xl rounded-[3rem] p-6 shadow-2xl border border-white overflow-x-auto no-scrollbar">
                    <div className="flex gap-3">
                        {items.map((item: any) => (
                            <div key={item.id} className={`w-12 h-12 flex-shrink-0 rounded-xl flex items-center justify-center border-2 ${item.isCollected ? "bg-pink-100 border-pink-200 text-pink-500" : "bg-white/50 border-gray-100 text-gray-300"
                                }`}>
                                {item.isCollected ? <CheckCircle size={18} /> : <Package size={18} />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}