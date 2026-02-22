"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { Navigation, MapPin } from "lucide-react";
import { calculateDistance, calculateBearing } from "@/lib/geo";
import { updatePlan } from "@/lib/storage";
import dynamic from "next/dynamic";

const LazyMap = dynamic<any>(() => import("@/components/Map/LazyMap").then(mod => mod.default), { ssr: false });

export default function AdventureView({ plan: initialPlan }: { plan: any }) {
    const [plan, setPlan] = useState(initialPlan);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [currentAreaName, setCurrentAreaName] = useState<string>("Scanning...");
    const [path, setPath] = useState<{ lat: number; lng: number }[]>(initialPlan.path || []);

    // 位置情報の監視
    useEffect(() => {
        if (!("geolocation" in navigator)) return;

        const geocoder = new google.maps.Geocoder();

        const watchId = navigator.geolocation.watchPosition((pos) => {
            const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserLocation(newLoc);

            // 1. 現在地の地名取得
            geocoder.geocode({ location: newLoc }, (res, status) => {
                if (status === "OK" && res?.[0]) {
                    const comp = res[0].address_components;
                    const pref = comp.find(c => c.types.includes("administrative_area_level_1"))?.long_name || "";
                    const locality = comp.find(c => c.types.includes("locality"))?.long_name ||
                        comp.find(c => c.types.includes("administrative_area_level_2"))?.long_name || "";
                    const country = comp.find(c => c.types.includes("country"))?.long_name || "";
                    setCurrentAreaName(`${pref} ${locality}, ${country}`.trim());
                }
            });

            // 2. 軌跡（Polyline）の更新ロジック
            setPath(prevPath => {
                const lastPoint = prevPath[prevPath.length - 1];
                // 前回記録から10m以上移動したかチェック (0.01km)
                if (!lastPoint || calculateDistance(lastPoint.lat, lastPoint.lng, newLoc.lat, newLoc.lng) > 0.01) {
                    const newPath = [...prevPath, newLoc];
                    // 非同期でストレージに保存
                    updatePlan({ ...plan, path: newPath });
                    return newPath;
                }
                return prevPath;
            });

            // 3. 到達判定（50m以内）
            setPlan(currentPlan => {
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

        }, (err) => console.error(err), {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        });

        return () => navigator.geolocation.clearWatch(watchId);
    }, [plan.id]); // plan.id が変わらない限りwatchを維持

    // 最寄りの目的地計算
    const nearestItem = useMemo(() => {
        if (!userLocation) return null;
        const uncollected = (plan.items || []).filter((i: any) => !i.isCollected);
        if (uncollected.length === 0) return null;

        return uncollected.map((item: any) => ({
            ...item,
            dist: calculateDistance(userLocation.lat, userLocation.lng, item.lat, item.lng),
            bear: calculateBearing(userLocation.lat, userLocation.lng, item.lat, item.lng)
        })).sort((a, b) => a.dist - b.dist)[0];
    }, [userLocation, plan.items]);

    return (
        <div className="relative h-screen bg-white overflow-hidden flex flex-col">
            {/* 背面：ぼかした地図とオレンジの航跡 */}
            <div className="absolute inset-0 z-0">
                <LazyMap
                    items={plan.items}
                    userLocation={userLocation}
                    center={plan.center}
                    path={path}
                    themeColor="#F37343"
                />
                <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />
            </div>

            {/* 前面：ナビゲーションUI */}
            <header className="relative z-10 p-6 pt-16 text-left">
                <div className="bg-black/90 backdrop-blur-xl rounded-[2.5rem] p-7 shadow-2xl text-white border border-white/10">
                    <p className="flex items-center gap-1.5 mb-1.5 text-[#F37343] font-black text-[10px] uppercase tracking-[0.2em]">
                        <MapPin size={12} strokeWidth={3} />
                        <span>{currentAreaName}</span>
                    </p>

                    <h1 className="text-xl font-black uppercase truncate mb-5 tracking-tight">
                        {plan.name}
                    </h1>

                    {nearestItem ? (
                        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-5">
                            <div className="flex items-center gap-4">
                                <div className="bg-[#F37343] p-2 rounded-full shadow-[0_0_15px_rgba(243,115,67,0.4)]">
                                    <Navigation
                                        className="text-white"
                                        size={20}
                                        fill="currentColor"
                                        style={{ transform: `rotate(${nearestItem.bear}deg)` }}
                                    />
                                </div>
                                <div className="text-left">
                                    <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Next Target</p>
                                    <p className="text-lg font-black tabular-nums leading-none mt-0.5">
                                        {nearestItem.dist < 1 ? `${Math.floor(nearestItem.dist * 1000)}m` : `${nearestItem.dist.toFixed(1)}km`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex flex-col justify-center items-end text-right">
                                <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Progress</p>
                                <p className="text-lg font-black tabular-nums leading-none mt-0.5">
                                    {plan.items.filter((i: any) => i.isCollected).length} <span className="text-[10px] text-gray-600">/ {plan.items.length}</span>
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="border-t border-white/10 pt-5 text-center">
                            <p className="text-sm font-black text-[#F37343] uppercase tracking-widest animate-pulse">
                                All Waypoints Collected
                            </p>
                        </div>
                    )}
                </div>
            </header>
        </div>
    );
}