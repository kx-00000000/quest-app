"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Navigation, Compass, MapPin } from "lucide-react";
import { calculateDistance, calculateBearing } from "@/lib/geo";
import { updatePlan } from "@/lib/storage";
import dynamic from "next/dynamic";

const LazyMap = dynamic<any>(() => import("@/components/Map/LazyMap").then(mod => mod.default), { ssr: false });

export default function AdventureView({ plan: initialPlan }: { plan: any }) {
    const router = useRouter();
    const [plan, setPlan] = useState(initialPlan);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [currentAreaName, setCurrentAreaName] = useState<string>("Scanning...");

    useEffect(() => {
        if (typeof window !== "undefined" && "geolocation" in navigator) {
            const geocoder = new google.maps.Geocoder();
            const watchId = navigator.geolocation.watchPosition((pos) => {
                const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLocation(newLoc);

                // ★ 解決：座標から地名をリアルタイム取得して表示
                if (geocoder) {
                    geocoder.geocode({ location: newLoc }, (results, status) => {
                        if (status === "OK" && results?.[0]) {
                            const addr = results[0].address_components;
                            const city = addr.find(c => c.types.includes("locality"))?.long_name ||
                                addr.find(c => c.types.includes("administrative_area_level_2"))?.long_name || "Active Area";
                            setCurrentAreaName(city);
                        }
                    });
                }

                const updatedItems = (plan.items || []).map((item: any) => {
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
                }
            }, null, { enableHighAccuracy: true });
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, [plan]);

    const nearestItem = useMemo(() => {
        if (!userLocation) return null;
        const uncollected = (plan.items || []).filter((i: any) => !i.isCollected);
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
                <LazyMap items={plan.items} userLocation={userLocation} themeColor="#F37343" center={plan.center} />
                <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />
            </div>
            <header className="relative z-10 p-6 pt-16">
                <div className="bg-black/90 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-2xl text-white">
                    <div className="flex justify-between items-start mb-6">
                        <div className="flex-1 text-left">
                            <p className="text-[10px] font-black text-[#F37343] uppercase tracking-[0.3em] mb-1 flex items-center gap-1">
                                <MapPin size={10} /> {currentAreaName}
                            </p>
                            <h1 className="text-xl font-black uppercase truncate w-48">{plan.name}</h1>
                        </div>
                    </div>
                    {nearestItem && (
                        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                            <div className="flex items-center gap-4 text-left">
                                <Navigation className="text-[#F37343]" size={24} style={{ transform: `rotate(${nearestItem.bearing}deg)` }} />
                                <div><p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Distance</p><p className="text-lg font-black">{nearestItem.distance < 1 ? `${Math.floor(nearestItem.distance * 1000)}m` : `${nearestItem.distance.toFixed(1)}km`}</p></div>
                            </div>
                            <div className="flex items-center gap-4 border-l border-white/5 pl-4 text-left">
                                <Compass size={24} className="text-gray-400" />
                                <div><p className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Heading</p><p className="text-lg font-black">{Math.floor(nearestItem.bearing)}°</p></div>
                            </div>
                        </div>
                    )}
                </div>
            </header>
        </div>
    );
}