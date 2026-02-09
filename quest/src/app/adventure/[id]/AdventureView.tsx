"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getPlans, savePlan } from "@/lib/storage";
import { ArrowLeft, Navigation, Sparkles } from "lucide-react";
import { calculateBearing, calculateDistance } from "@/lib/geo";
import dynamic from "next/dynamic";

const LazyMap = dynamic(() => import("@/components/Map/LazyMap"), { ssr: false });

export default function AdventureView({ id }: { id: string }) {
    const router = useRouter();
    const [plan, setPlan] = useState<any>(null);
    const [isTracking, setIsTracking] = useState(false);

    // DOMを直接操作するための「手（Ref）」を用意
    const distanceRef = useRef<HTMLHeadingElement>(null);
    const compassRef = useRef<HTMLDivElement>(null);
    const userLocRef = useRef<{ lat: number, lng: number } | null>(null);

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

        // --- ここから React を通さない「直接操作」 ---
        let currentHeading = 0;
        let currentBearing = 0;

        // 1. 方位センサーの直接監視
        window.addEventListener("deviceorientation", (event: any) => {
            currentHeading = event.webkitCompassHeading || (event.alpha ? Math.abs(event.alpha - 360) : 0);
            if (compassRef.current) {
                // Reactを介さず、CSSの回転だけを直接書き換える
                compassRef.current.style.transform = `rotate(${currentBearing - currentHeading}deg)`;
            }
        });

        // 2. GPS監視
        navigator.geolocation.watchPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                userLocRef.current = { lat, lng };

                if (currentItem && distanceRef.current) {
                    const d = calculateDistance(lat, lng, currentItem.lat, currentItem.lng);
                    currentBearing = calculateBearing(lat, lng, currentItem.lat, currentItem.lng);

                    // Reactを介さず、文字だけを直接書き換える
                    distanceRef.current.innerText = `${Math.floor(d * 1000).toLocaleString()} m`;
                }
            },
            (err) => console.warn(err),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    if (!plan) return null;

    return (
        <div className="flex flex-col h-screen relative overflow-hidden bg-white">
            {/* 1. 背景地図（一度描画したら、userLocationにnullを渡して固定し、負荷を下げます） */}
            <div className="absolute inset-0 z-0">
                <LazyMap items={plan.items || []} userLocation={null} themeColor="#F06292" center={plan.center} />
            </div>

            <header className="relative z-10 p-6 pt-12">
                <button onClick={() => router.back()} className="w-12 h-12 bg-white/40 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg">
                    <ArrowLeft size={20} />
                </button>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
                {!isTracking ? (
                    <div className="bg-white/80 backdrop-blur-3xl p-10 rounded-[3rem] shadow-2xl border border-white text-center">
                        <Sparkles className="w-12 h-12 text-pink-500 mx-auto mb-4 animate-pulse" />
                        <h2 className="text-2xl font-black text-gray-800 mb-6 italic uppercase tracking-tighter">Start Adventure</h2>
                        <button onClick={handleStart} className="w-full bg-pink-500 text-white font-black py-5 px-10 rounded-2xl shadow-xl uppercase text-sm">Start</button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center space-y-8">
                        {/* 距離表示パネル（ID指定で直接書き換え） */}
                        <div className="text-center bg-white/60 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-2xl border border-white">
                            <p className="text-[10px] font-black text-pink-600 uppercase mb-1 tracking-widest">Distance</p>
                            <h1 ref={distanceRef} className="text-5xl font-black text-gray-900 italic tracking-tighter">
                                --- m
                            </h1>
                        </div>

                        {/* コンパス（Ref指定で直接回す） */}
                        <div className="relative w-64 h-64 flex items-center justify-center">
                            <div className="absolute inset-0 rounded-full border-4 border-pink-200/30 border-dashed animate-[spin_20s_linear_infinite]" />
                            <div ref={compassRef} className="relative text-pink-500 transition-transform duration-300 ease-out">
                                <Navigation size={80} fill="currentColor" className="drop-shadow-2xl" />
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}