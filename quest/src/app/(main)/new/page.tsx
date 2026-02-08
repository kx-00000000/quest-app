"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { savePlan } from "@/lib/storage";
import { generateRandomPoint } from "@/lib/geo";
import LazyMap from "@/components/Map/LazyMap";
import { Map as MapIcon } from "lucide-react";

export default function NewQuestPage() {
    const router = useRouter();
    const { t, i18n } = useTranslation();
    const [mounted, setMounted] = useState(false); // 追記：マウント状態を管理
    const [name, setName] = useState("");
    const [radius, setRadius] = useState(1);
    const [activeRangeMode, setActiveRangeMode] = useState({ id: 'neighborhood', min: 0.5, max: 15, step: 0.1 });
    const [itemCount, setItemCount] = useState(3);
    const [isCreating, setIsCreating] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    // 1. マウント完了を待つ
    useEffect(() => {
        setMounted(true);

        // 位置情報の取得
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.warn(err)
            );
        }
    }, []);

    const handleCreate = async () => {
        if (!userLocation) return;
        setIsCreating(true);
        await new Promise(r => setTimeout(r, 800));

        const center = userLocation;
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
            name: name || t("default_adventure_name"),
            radius,
            itemCount,
            status: "ready",
            createdAt: new Date().toLocaleDateString(),
            totalDistance: 0,
            collectedCount: 0,
            center,
            items
        });
        router.push("/plan");
    };

    // 重要：マウントされる前（サーバーサイド）は何も表示しない
    if (!mounted) return <div className="min-h-screen bg-[#FDF2F8]" />;

    return (
        <div className="flex flex-col h-full min-h-screen pb-24 relative overflow-hidden bg-[#FDF2F8]">
            <div className="absolute inset-0 z-0">
                <LazyMap radiusInKm={radius} userLocation={userLocation} themeColor="#F48FB1" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/30 pointer-events-none" />
            </div>

            <div className="relative z-10 p-8">
                <h1 className="text-3xl font-black text-white drop-shadow-md flex items-center gap-3 italic tracking-tighter">
                    <MapIcon className="w-8 h-8" />
                    {(t("new_quest_title") || "NEW QUEST").toUpperCase()}
                </h1>
            </div>

            <div className="mt-auto relative z-10 px-6 mb-4">
                <div className="bg-white/50 backdrop-blur-3xl rounded-[3rem] p-8 shadow-2xl border border-white/40 space-y-6">
                    <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder={t("adventure_name_placeholder")}
                        className="w-full px-6 py-4 rounded-2xl bg-white/70 border-none outline-none text-gray-800 font-bold shadow-inner placeholder:text-gray-400"
                    />

                    <div className="space-y-3">
                        <div className="flex justify-between items-end px-1">
                            <label className="text-[11px] font-black text-pink-600/70 uppercase tracking-widest">Radius Range</label>
                            <span className="text-2xl font-black text-gray-800 tabular-nums">
                                {radius >= 1 ? `${radius.toFixed(1)} km` : `${Math.floor(radius * 1000)} m`}
                            </span>
                        </div>
                        <input
                            type="range"
                            min={activeRangeMode.min}
                            max={activeRangeMode.max}
                            step={activeRangeMode.step}
                            value={radius}
                            onChange={(e) => setRadius(parseFloat(e.target.value))}
                            className="w-full h-2 bg-pink-100 rounded-lg appearance-none cursor-pointer accent-pink-500"
                        />
                    </div>

                    <button
                        onClick={handleCreate}
                        disabled={isCreating || !userLocation}
                        className="w-full py-5 bg-gradient-to-r from-pink-500 to-orange-400 text-white rounded-[2rem] font-black text-xl shadow-lg active:scale-95 disabled:opacity-50 transition-all border-b-4 border-black/10"
                    >
                        {isCreating ? "..." : (t("create_button") || "START").toUpperCase()}
                    </button>

                    {!userLocation && (
                        <p className="text-[10px] text-center font-bold text-pink-600 animate-pulse">
                            Waiting for GPS...
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}