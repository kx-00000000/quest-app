"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { savePlan } from "@/lib/storage";
import { generateRandomPoint } from "@/lib/geo";
import LazyMap from "@/components/Map/LazyMap";
import { CheckCircle2, Play, Loader2 } from "lucide-react";

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
    const [showConfirm, setShowConfirm] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    const [briefingItems, setBriefingItems] = useState<any[]>([]);
    const [isBriefingActive, setIsBriefingActive] = useState(false);
    const [isFinalOverview, setIsFinalOverview] = useState(false);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.warn(err)
            );
        }
    }, []);

    const handleCreate = async () => {
        setIsCreating(true);
        let center = userLocation || { lat: 35.6812, lng: 139.7671 };
        const validItems: any[] = [];
        let attempts = 0;

        // 簡易的な陸地チェック（海を避ける努力は継続）
        while (validItems.length < itemCount && attempts < 20) {
            attempts++;
            const point = generateRandomPoint(center, radius);
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${point.lat}&lon=${point.lng}&format=json&zoom=10`);
                const data = await res.json();
                if (data.address && data.type !== "water") {
                    validItems.push({ id: Math.random().toString(36).substr(2, 9), lat: point.lat, lng: point.lng, isCollected: false, name: `Item #${validItems.length + 1}` });
                }
            } catch (e) { /* ignore */ }
        }

        if (validItems.length === 0) {
            const p = generateRandomPoint(center, radius * 0.2);
            validItems.push({ id: 'f1', lat: p.lat, lng: p.lng, isCollected: false, name: "Recon Target" });
        }

        savePlan({ id: Math.random().toString(36).substr(2, 9), name: name || "NEW QUEST", radius, itemCount: validItems.length, status: "ready", createdAt: new Date().toLocaleDateString(), totalDistance: 0, collectedCount: 0, center, items: validItems });
        setBriefingItems(validItems);
        setIsCreating(false);
        setShowConfirm(true);
    };

    return (
        <div className="flex flex-col h-full min-h-screen pb-20 relative overflow-hidden bg-white">
            <div className="absolute inset-0 z-0">
                <LazyMap
                    radiusInKm={radius} userLocation={userLocation} themeColor="#F06292"
                    items={briefingItems} isBriefingActive={isBriefingActive} isFinalOverview={isFinalOverview}
                    onBriefingStateChange={setIsFinalOverview}
                    onBriefingComplete={() => router.push("/plan")}
                />
            </div>

            {!isBriefingActive && !showConfirm && (
                <>
                    <div className="absolute top-8 left-6 right-6 z-20">
                        <div className="bg-white/40 backdrop-blur-2xl rounded-[2rem] border border-white/40 shadow-xl px-6 py-3 text-center font-black">
                            {name || "NEW QUEST"}
                        </div>
                    </div>
                    <div className="mt-auto relative z-10 px-4 mb-4">
                        <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-6 shadow-2xl border border-white space-y-5">
                            <div className="flex p-1 bg-black/5 rounded-2xl gap-1">
                                {rangeModes.map((mode) => (
                                    <button key={mode.id} onClick={() => { setActiveMode(mode); setRadius(mode.min); }} className={`flex-1 py-2 text-[9px] font-black rounded-xl transition-all ${activeMode.id === mode.id ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500'}`}>{mode.label}</button>
                                ))}
                            </div>
                            <div className="space-y-4 px-1">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm font-black text-pink-600 uppercase"><span>Radius</span><span className="text-gray-800">{formatDistance(radius)}</span></div>
                                    <input type="range" min={activeMode.min} max={activeMode.max} step={activeMode.step} value={radius} onChange={(e) => setRadius(parseFloat(e.target.value))} className="w-full h-1.5 accent-pink-500 bg-black/10 rounded-full appearance-none cursor-pointer" />
                                </div>
                            </div>
                            <button onClick={handleCreate} disabled={isCreating} className="w-full py-4 bg-gray-900 text-white rounded-[2rem] font-black shadow-lg flex items-center justify-center gap-2">
                                {isCreating ? <Loader2 className="animate-spin" /> : "クエストを作成"}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {showConfirm && (
                <div className="absolute inset-0 z-[2000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] p-8 shadow-2xl w-full max-w