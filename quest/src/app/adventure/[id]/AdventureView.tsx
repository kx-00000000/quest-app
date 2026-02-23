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

            // 現在地の地名取得（画面左上に表示用）
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
        const uncollected = (plan.items || []).filter((i: any) => !i.isCollected);
        if (uncollected.length === 0) return null;
        if (!userLocation) return { ...uncollected[0], dist: 0, bear: 0 };
        return uncollected.map((item: any) => ({
            ...item,
            dist: calculateDistance(userLocation.lat, userLocation.lng, item.lat, item.lng),
            bear: calculateBearing(userLocation.lat, userLocation.lng, item.lat, item.lng)
        })).sort((a: any, b: any) => a.dist - b.dist)[0];
    }, [userLocation, plan.items]);

    const collectedCount = plan.items.filter((i: any) => i.isCollected).length;

    return (
        <div className="relative h-screen bg-white overflow-hidden flex flex-col text-black font-sans">
            <div className="absolute inset-0 z-0">
                <LazyMap items={plan.items} userLocation={userLocation} center={plan.center} path={path} themeColor="#F37343" />
                <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px]" />
            </div>

            {/* 上部ステータス */}
            <div className="relative z-10 p-8 flex justify-between items-start">
                <div>
                    <h1 className="text-xl font-black uppercase tracking-tight">{plan.name}</h1>
                    <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">{currentAreaName}</p>
                </div>
                <div className="text-right">
                    <p className="text-xl font-black tabular-nums">{collectedCount} <span className="text-gray-300">/ {plan.items.length}</span></p>
                </div>
            </div>

            {/* 中央コンパス・距離 */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 -mt-20">
                <div className="relative w-64 h-64 flex items-center justify-center mb-8">
                    <img src="/compass_bg.png" alt="Compass" className="w-full h-full object-contain opacity-80" />
                    {nearestItem && (
                        <Navigation
                            className="absolute text-[#F37343] drop-shadow-lg"
                            size={48}
                            fill="currentColor"
                            style={{ transform: `rotate(${nearestItem.bear}deg)` }}
                        />
                    )}
                </div>

                <div className="text-center">
                    <p className="text-7xl font-black tabular-nums tracking-tighter flex items-baseline">
                        {nearestItem && nearestItem.dist > 0 ? (
                            nearestItem.dist < 1
                                ? <>{Math.floor(nearestItem.dist * 1000)}<span className="text-sm ml-2 text-gray-400">m</span></>
                                : <>{nearestItem.dist.toFixed(1)}<span className="text-sm ml-2 text-gray-400">km</span></>
                        ) : "--"}
                    </p>
                </div>
            </div>

            {/* 下部ナビゲーション（★ここが「---」の場所です） */}
            <div className="relative z-10 pb-16 flex flex-col items-center gap-8">
                <div className="flex items-center gap-6 text-gray-300">
                    <ChevronLeft size={24} className="opacity-30" />
                    {/* ★ ここにプラン作成時の addressName を表示 */}
                    <p className="text-[11px] font-black text-black uppercase tracking-[0.2em] max-w-[200px] truncate text-center">
                        {nearestItem ? nearestItem.addressName : "COMPLETE"}
                    </p>
                    <ChevronRight size={24} className="opacity-30" />
                </div>

                {/* ページネーションドット */}
                <div className="flex gap-2">
                    {plan.items.map((item: any, idx: number) => (
                        <div key={idx} className={`w-1.5 h-1.5 rounded-full ${item.isCollected ? 'bg-black' : (nearestItem?.id === item.id ? 'bg-[#F37343]' : 'bg-gray-200')}`} />
                    ))}
                </div>

                <div className="flex flex-col gap-3 w-full px-8 max-w-xs">
                    <button className="py-2 text-[10px] font-bold text-gray-400 border border-gray-100 rounded-full uppercase tracking-widest flex items-center justify-center gap-2">
                        <MapPin size={12} /> ABORT
                    </button>
                    <div className="flex gap-2">
                        <button className="flex-1 py-3 bg-gray-50 text-[10px] font-bold rounded-full uppercase">TEST CLOSE</button>
                        <button className="flex-1 py-3 bg-black text-white text-[10px] font-bold rounded-full uppercase">FORCE GET</button>
                    </div>
                </div>
            </div>
        </div>
    );
}