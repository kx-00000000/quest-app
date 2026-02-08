"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { savePlan } from "@/lib/storage";
import { generateRandomPoint } from "@/lib/geo";
import LazyMap from "@/components/Map/LazyMap";
import { Map as MapIcon } from "lucide-react";

const formatDistance = (km: number): string => {
    const meters = km * 1000;
    if (meters < 1000) return `${Math.floor(meters).toLocaleString()} m`;
    return `${km.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
};

export default function NewQuestPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [name, setName] = useState("");
    const [radius, setRadius] = useState(1);
    const [itemCount, setItemCount] = useState(3); // 復活！
    const [isCreating, setIsCreating] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.warn("GPS Error:", err),
                { enableHighAccuracy: true }
            );
        }
    }, []);

    const handleCreate = async () => {
        setIsCreating(true);
        await new Promise(r => setTimeout(r, 800));
        let center = userLocation || { lat: 35.6812, lng: 139.7671 };
        const items = Array.from({ length: itemCount }).map((_, i) => {
            const point = generateRandomPoint(center, radius);
            return { id: Math.random().toString(36).substr(2, 9), lat: point.lat, lng: point.lng, isCollected: false, name: `Item #${i + 1}` };
        });
        savePlan({ id: Math.random().toString(36).substr(2, 9), name: name || t("default_adventure_name"), radius, itemCount, status: "ready", createdAt: new Date().toLocaleDateString(), totalDistance: 0, collectedCount: 0, center, items });
        router.push("/plan");
    };

    return (
        <div className="flex flex-col h-full min-h-screen pb-24 relative overflow-hidden">
            <div className="absolute inset-0 z-0">
                <LazyMap radiusInKm={radius} userLocation={userLocation} themeColor="#F48FB1" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
            </div>

            <div className="relative z-10 p-8">
                <h1 className="text-3xl font-black text-white drop-shadow-lg flex items-center gap-3 italic">
                    <MapIcon className="w-8 h-8" /> {t("new_quest_title").toUpperCase()}
                </h1>
            </div>

            <div className="mt-auto relative z-10 px-6 mb-4">
                <div className="bg-white/40 backdrop-blur-2xl rounded-[3rem] p-8 shadow-2xl border border-white/30 space-y-6">
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("adventure_name_placeholder")} className="w-full px-6 py-4 rounded-2xl bg-white/60 border-none outline-none text-gray-800 font-bold" />

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-pink-900 uppercase px-1">Radius: {formatDistance(radius)}</label>
                            <input type="range" min="0.5" max="15" step="0.1" value={radius} onChange={(e) => setRadius(parseFloat(e.target.value))} className="w-full h-1.5 accent-pink-600" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-pink-900 uppercase px-1">Items: {itemCount}</label>
                            <input type="range" min="1" max="10" step="1" value={itemCount} onChange={(e) => setItemCount(parseInt(e.target.value))} className="w-full h-1.5 accent-pink-600" />
                        </div>
                    </div>

                    <button onClick={handleCreate} disabled={isCreating} className="w-full py-5 bg-gradient-to-r from-[#F06292] to-[#FF8A65] text-white rounded-[2rem] font-black text-lg shadow-xl active:scale-95 transition-all">
                        {isCreating ? "CREATING..." : t("create_button").toUpperCase()}
                    </button>
                    {!userLocation && <p className="text-center text-[10px] text-pink-900 font-bold animate-pulse">Waiting for GPS...</p>}
                </div>
            </div>
        </div>
    );
}