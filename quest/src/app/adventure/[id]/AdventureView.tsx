"use client";

import { useState, useEffect, useMemo } from "react";
import { Navigation, MapPin } from "lucide-react";
import { calculateDistance, calculateBearing } from "@/lib/geo";
import { updatePlan } from "@/lib/storage";
import dynamic from "next/dynamic";

const LazyMap = dynamic<any>(() => import("@/components/Map/LazyMap").then(mod => mod.default), { ssr: false });

export default function AdventureView({ plan: initialPlan }: { plan: any }) {
    const [plan, setPlan] = useState<any>(initialPlan);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [path, setPath] = useState<{ lat: number; lng: number }[]>(initialPlan.path || []);

    useEffect(() => {
        if (!("geolocation" in navigator)) return;

        const watchId = navigator.geolocation.watchPosition((pos) => {
            const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserLocation(newLoc);

            // 1. 軌跡の更新と保存
            setPath((prevPath: any[]) => {
                const lastPoint = prevPath[prevPath.length - 1];
                if (!lastPoint || calculateDistance(lastPoint.lat, lastPoint.lng, newLoc.lat, newLoc.lng) > 0.01) {
                    const newPath = [...prevPath, newLoc];
                    updatePlan({ ...plan, path: newPath });
                    return newPath;
                }
                return prevPath;
            });

            // 2. 到達判定（50m以内）
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
        }, (err) => console.error(err), {
            enableHighAccuracy: true,
            maximumAge: 0,
            timeout: 5000
        });

        return () => navigator.geolocation.clearWatch(watchId);
    }, [plan.id]);

    // 最寄りの目的地（未訪問のみ）を計算
    const nearestItem = useMemo(() => {
        if (!userLocation) return null;
        const uncollected = (plan.items || []).filter((i: any) => !i.isCollected);
        if (uncollected.length === 0) return null;

        return uncollected.map((item: any) => ({
            ...item,
            dist: calculateDistance(userLocation.lat, userLocation.lng, item.lat, item.lng),
            bear: calculateBearing(userLocation.lat, userLocation.lng, item.lat, item.lng)
        })).sort((a: any, b: any) => a.dist - b.dist)[0];
    }, [userLocation, plan.items]);

    return (
        <div className="relative h-screen bg-white overflow-hidden flex flex-col text-left">
            {/* 地図背景 */}
            <div className="absolute inset-0 z-0">
                <LazyMap items={plan.items} userLocation={userLocation} center={plan.center} path={path} themeColor="#F37343" />
                <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]" />
            </div>

            {/* コンシェルジュ・パネルUI */}
            <header className="relative z-50 p-6 pt-16">
                <div className="bg-black/95 backdrop-blur-2xl rounded-[2.5rem] p-8 shadow-2xl text-white border border-white/10 transition-all duration-500">
                    {/* ★ 解決：Planデータから現在の目標地点の名前を表示 */}
                    <p className="flex items-center gap-1.5 mb-2 text-[#F37343] font-black text-[10px] uppercase tracking-[0.3em]">
                        <MapPin size={12} strokeWidth={3} />
                        <span>{nearestItem ? "Next Waypoint" : "All Targets Clear"}</span>
                    </p>

                    <h1 className="text-xl font-black uppercase truncate mb-6 tracking-tight">
                        {plan.name}
                    </h1>

                    {nearestItem ? (
                        <div className="border-t border-white/10 pt-6 space-y-5">
                            {/* ★ 解決：Plan作成時に保存した addressName を流用 */}
                            <div className="flex flex-col">
                                <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1">Target Destination</p>
                                <p className="text-[13px] font-black text-white uppercase tracking-tight leading-snug">
                                    {nearestItem.addressName}
                                </p>
                            </div>

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-[#F37343] p-2.5 rounded-full shadow-[0_0_20px_rgba(243,115,67,0.4)]">
                                        <Navigation
                                            className="text-white"
                                            size={20}
                                            fill="currentColor"
                                            style={{ transform: `rotate(${nearestItem.bear}deg)` }}
                                        />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Distance</p>
                                        <p className="text-xl font-black tabular-nums leading-none mt-0.5">
                                            {nearestItem.dist < 1 ? `${Math.floor(nearestItem.dist * 1000)}m` : `${nearestItem.dist.toFixed(1)}km`}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right flex flex-col justify-center">
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Progress</p>
                                    <p className="text-xl font-black tabular-nums leading-none mt-0.5">
                                        {plan.items.filter((i: any) => i.isCollected).length}
                                        <span className="text-xs text-gray-500 ml-1">/ {plan.items.length}</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="border-t border-white/10 pt-6 text-center">
                            <p className="text-sm font-black text-[#F37343] uppercase tracking-[0.2em] animate-pulse">
                                Mission Accomplished
                            </p>
                        </div>
                    )}
                </div>
            </header>
        </div>
    );
}