"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getPlans, savePlan } from "@/lib/storage";
import { ArrowLeft, CheckCircle, Package, Navigation, Trophy, Sparkles, Loader2 } from "lucide-react";
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
    const [status, setStatus] = useState<"idle" | "requesting" | "active">("idle");
    const [collectedItem, setCollectedItem] = useState<any>(null);

    useEffect(() => {
        const found = getPlans().find((p) => p.id === id);
        if (found) setPlan(found);
    }, [id]);

    const currentItem = useMemo(() => plan?.items?.find((i: any) => !i.isCollected) || null, [plan]);

    // 【最重要】段階的な起動シーケンス
    const startAdventure = async () => {
        if (typeof window === "undefined") return;
        setStatus("requesting");

        try {
            // 1. 方位センサーの許可（iOS）
            const DeviceEvt = window.DeviceOrientationEvent as any;
            if (DeviceEvt && typeof DeviceEvt.requestPermission === 'function') {
                const response = await DeviceEvt.requestPermission();
                if (response !== 'granted') {
                    alert("方位センサーの許可が必要です");
                    setStatus("idle");
                    return;
                }
            }

            // 2. センサー監視の開始（計算はまだしない）
            window.addEventListener("deviceorientation", (event: any) => {
                const h = event.webkitCompassHeading || (event.alpha ? Math.abs(event.alpha - 360) : 0);
                setHeading(h);
            });

            // 3. 0.5秒だけ待ってからGPSを起動（iPhoneの負荷を分散）
            setTimeout(() => {
                navigator.geolocation.watchPosition(
                    (pos) => {
                        const lat = pos.coords.latitude;
                        const lng = pos.coords.longitude;
                        setUserLoc({ lat, lng });

                        if (currentItem && typeof currentItem.lat === 'number') {
                            const d = calculateDistance(lat, lng, currentItem.lat, currentItem.lng);
                            const b = calculateBearing(lat, lng, currentItem.lat, currentItem.lng);
                            if (!isNaN(d)) setDistance(d * 1000);
                            if (!isNaN(b)) setBearing(b);
                        }
                    },
                    (err) => console.warn(err),
                    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
                );
                setStatus("active");
            }, 500);

        } catch (e) {
            console.error(e);
            setStatus("idle");
        }
    };

    if (!plan) return null;

    return (
        <div className="flex flex-col h-screen relative overflow-hidden bg-white">
            <div className="absolute inset-0 z-0">
                <LazyMap items={plan.items || []} userLocation={userLoc} themeColor="#F06292" center={plan.center} />
            </div>

            <header className="relative z-10 flex justify-between items-center p-6 pt-12">
                <button onClick={() => router.back()} className="w-12 h-12 bg-white/50 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/40">
                    <ArrowLeft size={20} />
                </button>
                <div className="bg-white/50 backdrop-blur-xl px-6 py-2 rounded-2xl border border-white/40 shadow-lg font-black text-gray-800 italic">
                    {plan.collectedCount || 0} / {plan.itemCount || 0}
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
                {status !== "active" ? (
                    <div className="bg-white/80 backdrop-blur-3xl p-10 rounded-[3rem] shadow-2xl border border-white/40 text-center animate-scale-up">
                        {status === "requesting" ? (
                            <Loader2 className="w-12 h-12 text-pink-500 mx-auto animate-spin" />
                        ) : (
                            <Sparkles className="w-12 h-12 text-pink-500 mx-auto mb-4 animate-pulse" />
                        )}
                        <h2 className="text-2xl font-black text-gray-800 mb-2 italic uppercase">Adventure?</h2>
                        <p className="text-gray-400 text-[10px] font-bold mb-8 italic uppercase">Tap start to sync sensors</p>
                        <button
                            onClick={startAdventure}
                            disabled={status === "requesting"}
                            className="w-full bg-pink-500 text-white font-black py-5 px-10 rounded-2xl shadow-xl shadow-pink-200 active:scale-95 transition-all uppercase text-sm tracking-widest disabled:opacity-50"
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
                            <div className="absolute inset-0 bg-pink-500/10 blur-3xl rounded-full" />
                            {/* 計算済みの回転角度（bearing - heading）を渡す */}
                            <Compass rotation={bearing - heading} />
                        </div>
                    </>
                )}
            </main>

            <div className="relative z-10 px-4 mb-4">
                <div className="bg-white/50 backdrop-blur-3xl rounded-[3rem] p-6 shadow-2xl border border-white/40">
                    <div className="flex gap-3 overflow-x-auto no-scrollbar">
                        {(plan.items || []).map((item: any) => (
                            <div key={item.id} className={`w-14 h-14 flex-shrink-0 rounded-2xl flex items-center justify-center border-2 transition-all ${item.isCollected ? "bg-pink-100 border-pink-200 text-pink-500" :
                                    item.id === currentItem?.id && status === "active" ? "bg-white border-pink-500 text-pink-600 shadow-lg scale-105 animate-bounce" :
                                        "bg-white/50 border-gray-100 text-gray-300"
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
                        <button onClick={() => setCollectedItem(null)} className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl">NEXT TARGET</button>
                    </div>
                </div>
            )}
        </div>
    );
}