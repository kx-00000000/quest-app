"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { savePlan } from "@/lib/storage";
import { generateRandomPoint } from "@/lib/geo";
import LazyMap from "@/components/Map/LazyMap";

const rangeModes = [
    { id: 'neighborhood', label: 'NEIGHBORHOOD', min: 0.5, max: 15, step: 0.1 },
    { id: 'excursion', label: 'EXCURSION', min: 15, max: 200, step: 1 },
    { id: 'grand', label: 'GRAND', min: 200, max: 40000, step: 100 }
];

const formatDistance = (km: number): string => {
    const meters = km * 1000;
    if (meters < 1000) return `${Math.floor(meters).toLocaleString()} m`;
    return `${km.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
};

export default function NewQuestPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [name, setName] = useState("");
    const [activeMode, setActiveMode] = useState(rangeModes[0]);

    const [radius, setRadius] = useState(1);
    const [mapRadius, setMapRadius] = useState(1);
    const [itemCount, setItemCount] = useState(3);
    const [isCreating, setIsCreating] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    const [briefingItems, setBriefingItems] = useState<any[]>([]);
    const [isBriefingActive, setIsBriefingActive] = useState(false);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => console.warn(err)
        );
        return () => { if (timerRef.current) clearTimeout(timerRef.current); };
    }, []);

    // ★負荷軽減：スライダー操作中の地図更新を0.3秒遅らせる
    const handleRadiusChange = (val: number) => {
        setRadius(val);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            setMapRadius(val);
        }, 300);
    };

    const handleCreate = async () => {
        setIsCreating(true);
        let center = userLocation || { lat: 35.6812, lng: 139.7671 };

        const items = Array.from({ length: itemCount }).map((_, i) => {
            const point = generateRandomPoint(center, radius);
            return {
                id: Math.random().toString(36).substr(2, 9),
                lat: point.lat,
                lng: point.lng,
                isCollected: false,
                name: `Item #${i + 1}`
            };
        });

        savePlan({
            id: Math.random().toString(36).substr(2, 9),
            name: name || "NEW QUEST",
            radius,
            itemCount,
            status: "ready",
            createdAt: new Date().toLocaleDateString(),
            totalDistance: 0,
            collectedCount: 0,
            center,
            items
        });

        setBriefingItems(items);
        setIsBriefingActive(true);
    };

    return (
        <div className="flex flex-col h-full min-h-screen pb-20 relative overflow-hidden bg-white">
            <div className="absolute inset-0 z-0">
                <LazyMap
                    radiusInKm={mapRadius}
                    userLocation={userLocation}
                    themeColor="#F06292"
                    items={briefingItems}
                    isBriefingActive={isBriefingActive}
                    onBriefingComplete={() => router.push("/plan")}
                />
            </div>

            {!isBriefingActive && (
                <>
                    <div className="absolute top-8 left-6 right-6 z-20 animate-in fade-in duration-500">
                        <div className="bg-white/40 backdrop-blur-2xl rounded-[2rem] border border-white/40 shadow-xl px-6 py-3">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t("adventure_name_placeholder")}
                                className="w-full bg-transparent border-none outline-none text-gray-800 font-bold placeholder:text-gray-400 text-center"
                            />
                        </div>
                    </div>

                    <div className="mt-auto relative z-10 px-4 mb-4 animate-in slide-in-from-bottom-8 duration-500">
                        <div className="bg-white/30 backdrop-blur-3xl rounded-[3rem] p-6 shadow-2xl border border-white/40 space-y-5">
                            <div className="flex p-1 bg-black/5 rounded-2xl gap-1">
                                {rangeModes.map((mode) => (
                                    <button
                                        key={mode.id}
                                        onClick={() => {
                                            setActiveMode(mode);
                                            handleRadiusChange(mode.min);
                                        }}
                                        className={`flex-1 py-2 text-[9px] font-black rounded-xl transition-all ${activeMode.id === mode.id ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500'}`}
                                    >
                                        {mode.label}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-4 px-1">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm font-black text-pink-600 uppercase tracking-widest">
                                        <span>Radius Range</span>
                                        <span className="text-gray-800">{formatDistance(radius)}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={activeMode.min}
                                        max={activeMode.max}
                                        step={activeMode.step}
                                        value={radius}
                                        onChange={(e) => handleRadiusChange(parseFloat(e.target.value))}
                                        className="w-full h-1.5 accent-gray-400 bg-black/10 rounded-full appearance-none cursor-pointer"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm font-black text-pink-600 uppercase tracking-widest">
                                        <span>Items Count</span>
                                        <span className="text-gray-800">{itemCount}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="7"
                                        step="1"
                                        value={itemCount}
                                        onChange={(e) => setItemCount(parseInt(e.target.value))}
                                        className="w-full h-1.5 accent-gray-400 bg-black/10 rounded-full appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>

                            <button onClick={handleCreate} disabled={isCreating} className="w-full py-4 bg-gradient-to-r from-[#F06292] to-[#FF8A65] text-white rounded-[2rem] font-black text-lg shadow-lg active:scale-95 transition-all border-b-4 border-black/10">
                                {isCreating ? "MISSION GENERATING..." : "START SCANNING"}
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}