"use client";

import { useState, useEffect, useMemo } from "react";
import { Navigation, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { calculateDistance, calculateBearing } from "@/lib/geo";
import { updatePlan } from "@/lib/storage";
import dynamic from "next/dynamic";

const LazyMap = dynamic<any>(() => import("@/components/Map/LazyMap").then(mod => mod.default), { ssr: false });

export default function AdventureView({ plan: initialPlan }: { plan: any }) {
    const [plan, setPlan] = useState<any>(initialPlan);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [currentAreaName, setCurrentAreaName] = useState<string>("");
    const [path, setPath] = useState<{ lat: number; lng: number }[]>(initialPlan.path || []);

    useEffect(() => {
        if (!("geolocation" in navigator)) return;

        const watchId = navigator.geolocation.watchPosition((pos) => {
            const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserLocation(newLoc);

            // 現在地の地名取得（左上に表示）
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

            // 到達判定ロジック
            setPlan((currentPlan: any) => {
                let hasChanged = false;
                const updatedItems = (currentPlan.items || []).map((item: any) => {
                    if (!item.isCollected && calculateDistance(newLoc.lat, newLoc.lng, item.lat, item.lng) < 0.05) {
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

    // ★ GPSを待たずに、プラン内の地名を即座に特定する
    const activeTarget = useMemo(() => {
        const uncollected = (plan.items || []).filter((i: any) => !i.isCollected);
        if (uncollected.length === 0) return null;

        const base = uncollected[0];
        if (!userLocation) return { ...base, dist: 0, bear: 0 };

        return {
            ...base,
            dist: calculateDistance(userLocation.lat, userLocation.lng, base.lat, base.lng),
            bear: calculateBearing(userLocation.lat, userLocation.lng, base.lat, base.lng)
        };
    }, [userLocation, plan.items]);

    return (
        <div className="relative h-screen bg-white overflow-hidden flex flex-col text-black font-sans">
            <div className="absolute inset-0 z-0">
                <LazyMap items={plan.items} userLocation={userLocation} center={plan.center} path={path} themeColor="#F37343" />
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px]" />
            </div>

            {/* 上部ステータス */}
            <header className="relative z-10 p-8 flex justify-between items-start">
                <div className="text-left">
                    <h1 className="text-xl font-black uppercase tracking-tight">{plan.name}</h1>
                    <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">{currentAreaName || "TRACKING..."}</p>
                </div>
                <div className="text-right">
                    <p className="text-xl font-black tabular-nums">
                        {plan.items.filter((i: any) => i.isCollected).length}
                        <span className="text-gray-200"> / {plan.items.length}</span>
                    </p>
                </div>
            </header>

            {/* 中央コンパス・距離 */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 -mt-20">
                <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                    <img src="/compass_bg.png" alt="Compass" className="w-full h-full object-contain opacity-30" />
                    {activeTarget && userLocation && (
                        <Navigation
                            className="absolute text-[#F37343]"
                            size={48}
                            fill="currentColor"
                            style={{ transform: `rotate(${activeTarget.bear}deg)` }}
                        />
                    )}
                </div>
                <div className="text-center">
                    <p className="text-7xl font-black tabular-nums tracking-tighter flex items-baseline justify-center">
                        {activeTarget && userLocation ? (
                            activeTarget.dist < 1
                                ? <>{Math.floor(activeTarget.dist * 1000)}<span className="text-sm ml-2 text-gray-400">m</span></>
                                : <>{activeTarget.dist.toFixed(1)}<span className="text-sm ml-2 text-gray-400">km</span></>
                        ) : "--"}
                    </p>
                </div>
            </div>

            {/* 下部ナビゲーション: 地名表示エリア */}
            <footer className="relative z-10 pb-16 flex flex-col items-center gap-8">
                <div className="flex items-center gap-6 text-gray-300">
                    <ChevronLeft size={24} className="opacity-30" />
                    {/* ★ ここが「---」の場所です。プラン内の addressName を表示します */}
                    <p className="text-[11px] font-black text-black uppercase tracking-[0.2em] max-w-[240px] truncate text-center">
                        {activeTarget ? activeTarget.addressName : "COMPLETE"}
                    </p>
                    <ChevronRight size={24} className="opacity-30" />
                </div>

                <div className="flex gap-2">
                    {plan.items.map((item: any, idx: number) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full ${item.isCollected ? 'bg-black' : (activeTarget?.id === item.id ? 'bg-[#F37343]' : 'bg-gray-200')}`} />
                    ))}
                </div>

                <div className="flex flex-col gap-3 w-full px-8 max-w-xs">
                    <div className="flex gap-2 w-full">
                        <button className="flex-1 py-3 bg-gray-50 text-[10px] font-bold rounded-full uppercase text-gray-400 border border-gray-100">Abort</button>
                        <button className="flex-1 py-3 bg-black text-white text-[10px] font-bold rounded-full uppercase tracking-widest">Force Get</button>
                    </div>
                </div>
            </footer>
        </div>
    );
}