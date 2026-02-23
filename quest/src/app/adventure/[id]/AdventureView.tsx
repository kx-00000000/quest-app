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
    const [currentAreaName, setCurrentAreaName] = useState<string>("Scanning...");
    const [path, setPath] = useState<{ lat: number; lng: number }[]>(initialPlan.path || []);

    useEffect(() => {
        if (!("geolocation" in navigator)) return;

        const watchId = navigator.geolocation.watchPosition((pos) => {
            const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setUserLocation(newLoc);

            // 現在地の地名取得（全世界対応版）
            if (typeof google !== 'undefined' && google.maps.Geocoder) {
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: newLoc }, (res, status) => {
                    if (status === "OK" && res?.[0]) {
                        const clean = res[0].formatted_address
                            .replace(/日本、|〒[0-9-]* |[0-9-]{8} /g, "")
                            .split(',').slice(0, 2).join(',').trim();
                        setCurrentAreaName(clean || "Exploring...");
                    }
                });
            }

            // 軌跡保存
            setPath((prevPath: any[]) => {
                const lastPoint = prevPath[prevPath.length - 1];
                if (!lastPoint || calculateDistance(lastPoint.lat, lastPoint.lng, newLoc.lat, newLoc.lng) > 0.01) {
                    const newPath = [...prevPath, newLoc];
                    updatePlan({ ...plan, path: newPath });
                    return newPath;
                }
                return prevPath;
            });

            // 到達判定
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
        }, (err) => console.error(err), { enableHighAccuracy: true });

        return () => navigator.geolocation.clearWatch(watchId);
    }, [plan.id]);

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
        <div className="relative h-screen bg-white overflow-hidden flex flex-col text-left font-sans">
            <div className="absolute inset-0 z-0">
                <LazyMap items={plan.items} userLocation={userLocation} center={plan.center} path={path} themeColor="#F37343" />
                <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />
            </div>

            <header className="relative z-50 p-6 pt-16">
                <div className="bg-black/90 backdrop-blur-xl rounded-[2.5rem] p-7 shadow-2xl text-white border border-white/10">
                    <p className="flex items-center gap-1.5 mb-1.5 text-[#F37343] font-black text-[10px] uppercase tracking-[0.2em]">
                        <MapPin size={12} strokeWidth={3} />
                        <span>{currentAreaName}</span>
                    </p>
                    <h1 className="text-xl font-black uppercase truncate mb-5 tracking-tight">{plan.name}</h1>

                    {nearestItem && (
                        <div className="border-t border-white/10 pt-5 space-y-4">
                            <div className="flex flex-col text-left">
                                <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest mb-1 text-left">Target</p>
                                <p className="text-sm font-black text-white truncate uppercase tracking-tight">
                                    {nearestItem.addressName}
                                </p>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="bg-[#F37343] p-2 rounded-full shadow-[0_0_15px_rgba(243,115,67,0.4)]">
                                        <Navigation className="text-white" size={20} fill="currentColor" style={{ transform: `rotate(${nearestItem.bear}deg)` }} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[8px] font-bold text-gray-500 uppercase tracking-widest text-left">Dist</p>
                                        <p className="text-lg font-black tabular-nums leading-none">
                                            {nearestItem.dist < 1 ? `${Math.floor(nearestItem.dist * 1000)}m` : `${nearestItem.dist.toFixed(1)}km`}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Items</p>
                                    <p className="text-lg font-black tabular-nums leading-none">
                                        {plan.items.filter((i: any) => i.isCollected).length} / {plan.items.length}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </header>
        </div>
    );
}