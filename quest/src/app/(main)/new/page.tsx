"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { savePlan } from "@/lib/storage";
import { generateRandomPoint } from "@/lib/geo";
import LazyMap from "@/components/Map/LazyMap";
import MissionBriefing from "@/components/Map/MissionBriefing"; // ★追加

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
    const [itemCount, setItemCount] = useState(3);
    const [isCreating, setIsCreating] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    // ★追加ステート
    const [briefingItems, setBriefingItems] = useState<any[]>([]);
    const [isBriefingActive, setIsBriefingActive] = useState(false);

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
            (err) => console.warn(err)
        );
    }, []);

    const handleCreate = async () => {
        setIsCreating(true);

        let center = userLocation || { lat: 35.6812, lng: 139.7671 };

        // アイテム生成
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

        // データを保存
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

        // ★即座に遷移せず、ブリーフィングを開始
        setBriefingItems(items);
        setIsBriefingActive(true);
    };

    return (
        <div className="flex flex-col h-full min-h-screen pb-20 relative overflow-hidden bg-white">

            <div className="absolute inset-0 z-0">
                {/* LazyMapにアイテムを渡すように修正 */}
                <LazyMap
                    radiusInKm={radius}
                    userLocation={userLocation}
                    themeColor="#F06292"
                    items={briefingItems} // ★追加
                    isBriefingActive={isBriefingActive} // ★追加
                    onBriefingComplete={() => router.push("/plan")} // ★終了時に遷移
                />
            </div>

            {/* UIパーツ：ブリーフィング中は隠す演出 */}
            {!isBriefingActive && (
                <>
                    <div className="absolute top-8 left-6 right-6 z-20 animate-in fade-in duration-500">
                        <div className="bg-white/40 backdrop-blur-2xl rounded-[2rem] border border-white/40 shadow-xl px-6 py-3">
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("adventure_name_placeholder")} className="w-full bg