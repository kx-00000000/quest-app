"use client";

import { useState, useEffect, useMemo } from "react";
import { Navigation, ChevronLeft, ChevronRight, MapPin } from "lucide-react";
import { calculateDistance, calculateBearing } from "@/lib/geo";
import { updatePlan } from "@/lib/storage";
import dynamic from "next/dynamic";

const LazyMap = dynamic<any>(() => import("@/components/Map/LazyMap").then(mod => mod.default), { ssr: false });

export default function AdventureView({ plan: initialPlan }: { plan: any }) {
    // 1. プロップスから受け取ったデータを確実にステートにセット
    const [plan, setPlan] = useState<any>(initialPlan);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [currentAreaName, setCurrentAreaName] = useState<string>("");
    const [path, setPath] = useState<{ lat: number; lng: number }[]>(initialPlan.path || []);

    useEffect(() => {
        if (!("geolocation" in navigator)) return;

        const watchId = navigator.geolocation.watchPosition((pos) => {
            const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserLocation(newLoc);

            // 現在地の地名取得
            if (typeof google !== 'undefined' && google.maps.Geocoder) {
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: newLoc }, (res, status) => {
                    if (status === "OK" && res?.[0]) {
                        const clean = res[0].formatted_address
                            .replace(/日本、|〒[0-9-]* |[0-9-]{8} /g, "")
                            .split(',').slice(0, 1).join('').trim();
                        setCurrentAreaName(clean);
                    }
                });
            }

            // 到達判定
            setPlan((currentPlan: any) => {
                let hasChanged = false;
                const updatedItems = (currentPlan.items || []).map((item: any) => {
                    const dist = calculateDistance(newLoc.lat, newLoc.lng, item.lat, item.lng);
                    if (!item.isCollected && dist < 0.05) {
                        hasChanged = true;
                        return { ...item, isCollected: true, collectedAt: new Date().toISOString() };
                    }
                    return item;
                });
                if (hasChanged) {
                    const newPlan = { ...currentPlan, items: updatedItems };
                    updatePlan(newPlan);
                    return newPlan;
                }
                return currentPlan;
            });
        }, null, { enableHighAccuracy: true });

        return () => navigator.geolocation.clearWatch(watchId);
    }, [plan.id]);

    // 2. 表示用のターゲットを特定
    const displayItem = useMemo(() => {
        const uncollected = (plan.items || []).filter((i: any) => !i.isCollected);
        // 未収集があればその最初、なければ最後の地点を表示
        return uncollected.length > 0 ? uncollected[0] : plan.items[plan.items.length - 1];
    }, [plan.items]);

    // 3. ナビゲーション用の計算
    const navMetrics = useMemo(() => {
        if (!userLocation || !displayItem) return { dist: 0, bear: 0 };
        return {
            dist: calculateDistance(userLocation.lat, userLocation.lng, displayItem.lat, displayItem.lng),
            bear: calculateBearing(userLocation.lat, userLocation.lng, displayItem.lat, displayItem.lng)
        };
    }, [userLocation, displayItem]);

    return (
        <div className="relative h-screen bg-white overflow-hidden flex flex-col text-black font-sans">
            <div className="absolute inset-0 z-0">
                <LazyMap items={plan.items} userLocation={userLocation} center={plan.center} path={path} themeColor="#F37343" />
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
            </div>

            <header className="relative z-10 p-8 flex justify-between items-start">
                <div className="text-left">
                    <h1 className="text-xl font-black uppercase tracking-tight">{plan.name}</h1>
                    <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">{currentAreaName || "TRACKING..."}</p>
                </div>
                <div className="text-right">
                    <p className="text-xl font-black tabular-nums">
                        {plan.items.filter((i: any) => i.isCollected).length}
                        <span className="text-gray-300"> / {plan.items.length}</span>
                    </p>
                </div>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center relative z-10 -mt-16">
                <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                    <img src="/compass_bg.png" alt="Compass" className="w-full h-full object-contain opacity-40" />
                    {userLocation && displayItem && (
                        <Navigation
                            className="absolute text-[#F37343]"
                            size={48}
                            fill="currentColor"
                            style={{ transform: `rotate(${navMetrics.bear}deg)` }}
                        />
                    )}
                </div>
                <div className="text-center">
                    <p className="text-7xl font-black tabular-nums tracking-tighter flex items-baseline justify-center">
                        {userLocation ? (
                            navMetrics.dist < 1
                                ? <>{Math.floor(navMetrics.dist * 1000)}<span className="text-sm ml-2 text-gray-400 font-bold">m</span></>
                                : <>{navMetrics.dist.toFixed(1)}<span className="text-sm ml-2 text-gray-400 font-bold">km</span></>
                        ) : "--"}
                    </p>
                </div>
            </div>

            <footer className="relative z-10 pb-16 flex flex-col items-center gap-8">
                <div className="flex items-center gap-6 text-gray-300">
                    <ChevronLeft size={24} className="opacity-20" />
                    {/* ★ ここで addressName を表示。plan/page.tsx と同じキーを使います */}
                    <p className="text-[11px] font-black text-black uppercase tracking-[0.2em] max-w-[260px] truncate text-center">
                        {displayItem?.addressName || "MISSION COMPLETE"}
                    </p>
                    <ChevronRight size={24} className="opacity-20" />
                </div>

                <div className="flex gap-2">
                    {plan.items.map((item: any, idx: number) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full ${item.isCollected ? 'bg-black' : (displayItem?.id === item.id ? 'bg-[#F37343]' : 'bg-gray-200')}`} />
                    ))}
                </div>

                <div className="flex flex-col gap-3 w-full px-8 max-w-xs">
                    <div className="flex gap-2 w-full">
                        <button className="flex-1 py-3 bg-gray-50 text-[10px] font-bold rounded-full uppercase text-gray-400 border border-gray-100">Abort</button>
                        <button className="flex-1 py-3 bg-black text-white text-[10px] font-bold rounded-full uppercase tracking-widest shadow-md">Force Get</button>
                    </div>
                </div>
            </footer>
        </div>
    );
}