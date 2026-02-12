"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Navigation, Compass, Target, CheckCircle2, Play } from "lucide-react";
import { calculateDistance, calculateBearing } from "@/lib/geo";
import { updatePlan } from "@/lib/storage";
import dynamic from "next/dynamic";

const LazyMap = dynamic<any>(() => import("@/components/Map/LazyMap").then(mod => mod.default), { ssr: false });

export default function AdventureView({ plan: initialPlan }: { plan: any }) {
    const router = useRouter();
    const [plan, setPlan] = useState(initialPlan);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const [comment, setComment] = useState("");

    useEffect(() => {
        if (typeof window !== "undefined" && "geolocation" in navigator) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setUserLocation(newLoc);

                    const updatedItems = plan.items.map((item: any) => {
                        if (!item.isCollected) {
                            const dist = calculateDistance(newLoc.lat, newLoc.lng, item.lat, item.lng);
                            if (dist < 0.05) return { ...item, isCollected: true, collectedAt: new Date().toISOString() };
                        }
                        return item;
                    });
                    if (JSON.stringify(updatedItems) !== JSON.stringify(plan.items)) {
                        const newPlan = { ...plan, items: updatedItems };
                        setPlan(newPlan);
                        updatePlan(newPlan);
                        if (updatedItems.every((i: any) => i.isCollected)) setIsComplete(true);
                    }
                },
                (err) => console.warn(err),
                { enableHighAccuracy: true }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, [plan]);

    const nearestItem = useMemo(() => {
        if (!userLocation) return null;
        const uncollected = plan.items.filter((i: any) => !i.isCollected);
        if (uncollected.length === 0) return null;
        return uncollected.map((item: any) => ({
            ...item,
            distance: calculateDistance(userLocation.lat, userLocation.lng, item.lat, item.lng) || 0,
            bearing: calculateBearing(userLocation.lat, userLocation.lng, item.lat, item.lng) || 0
        })).sort((a: any, b: any) => a.distance - b.distance)[0];
    }, [userLocation, plan.items]);

    return (
        <div className="relative h-screen bg-white overflow-hidden flex flex-col">
            <div className="absolute inset-0 z-0">
                <LazyMap items={plan.items} userLocation={userLocation} themeColor="#E6672E" center={plan.center} />
                <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />
            </div>

            <header className="relative z-10 p-6 pt-16">
                <div className="bg-black/90 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-2xl text-white">
                    <div className="flex justify-between items-start mb-6">
                        <div><p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] mb-1">Active Mission</p><h1 className="text-xl font-black uppercase truncate w-48">{plan.name}</h1></div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Status</p>
                            <div className="flex items-center gap-2 justify-end"><div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" /><span className="text-xs font-black uppercase">On Course</span></div>
                        </div>
                    </div>
                    {nearestItem ? (
                        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                            <div className="flex items-center gap-4">
                                <Navigation className="text-pink-500" size={24} style={{ transform: `rotate(${nearestItem.bearing}deg)` }} />
                                <div><p className="text-[8px] font-bold text-gray-500 uppercase">Distance</p><p className="text-lg font-black tabular-nums">{(nearestItem.distance < 1) ? `${Math.floor(nearestItem.distance * 1000)}m` : `${nearestItem.distance.toFixed(1)}km`}</p></div>
                            </div>
                            <div className="flex items-center gap-4 border-l border-white/5 pl-4">
                                <Compass size={24} className="text-gray-400" />
                                <div><p className="text-[8px] font-bold text-gray-500 uppercase">Heading</p><p className="text-lg font-black tabular-nums">{Math.floor(nearestItem.bearing)}°</p></div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-2"><p className="text-xs font-black uppercase text-green-500">All Waypoints Cleared</p></div>
                    )}
                </div>
            </header>

            {isComplete && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                    <div className="bg-white rounded-[3rem] p-8 w-full max-w-sm text-center space-y-8">
                        <h2 className="text-3xl font-black text-gray-900 uppercase">Mission Complete</h2>
                        <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="冒険にコメントを残す..." className="w-full h-32 p-4 bg-gray-50 rounded-3xl text-sm resize-none outline-none" />
                        <button onClick={() => { updatePlan({ ...plan, finishedAt: new Date().toISOString(), comment, status: "completed" }); router.push("/log"); }} className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl">Log and Archive</button>
                    </div>
                </div>
            )}
        </div>
    );
}