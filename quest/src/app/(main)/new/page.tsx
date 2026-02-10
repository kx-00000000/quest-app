"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { savePlan } from "@/lib/storage";
import { generateRandomPoint } from "@/lib/geo";
import LazyMap from "@/components/Map/LazyMap";
import { CheckCircle2, Play, LocateFixed, Loader2 } from "lucide-react";

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
    const [showConfirm, setShowConfirm] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    const [briefingItems, setBriefingItems] = useState<any[]>([]);
    const [isBriefingActive, setIsBriefingActive] = useState(false);
    const [isFinalOverview, setIsFinalOverview] = useState(false);
    const mapInstanceRef = useRef<any>(null);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.warn(err),
                { enableHighAccuracy: false, timeout: 5000 }
            );
        }
    }, []);

    const handleRadiusChange = (val: number) => {
        setRadius(val);
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => { setMapRadius(val); }, 300);
    };

    const handleCreate = async () => {
        setIsCreating(true);
        let center = userLocation || { lat: 35.6812, lng: 139.7671 };
        const validItems: any[] = [];
        let attempts = 0;

        while (validItems.length < itemCount && attempts < 25) {
            attempts++;
            const point = generateRandomPoint(center, radius);
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${point.lat}&lon=${point.lng}&format=json&zoom=10`);
                const data = await res.json();
                const hasPlace = data.address && (data.address.country || data.address.city || data.address.state);
                if (hasPlace && data.type !== "water") {
                    validItems.push({ id: Math.random().toString(36).substr(2, 9), lat: point.lat, lng: point.lng, isCollected: false, name: `Item #${validItems.length + 1}` });
                }
            } catch (e) { /* ignore */ }
        }

        if (validItems.length === 0) {
            validItems.push({ id: 'f1', lat: center.lat + 0.01, lng: center.lng + 0.01, isCollected: false, name: "Target Recon" });
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
                    radiusInKm={mapRadius} userLocation={userLocation} themeColor="#F06292"
                    items={briefingItems} isBriefingActive={isBriefingActive} isFinalOverview={isFinalOverview}
                    onBriefingStateChange={setIsFinalOverview}
                    onBriefingComplete={() => router.push("/plan")}
                    onMapReady={(map: any) => { mapInstanceRef.current = map; }}
                />
            </div>

            {!isBriefingActive && !showConfirm && (
                <>
                    <div className="absolute top-8 left-6 right-6 z-20">
                        <div className="bg-white/40 backdrop-blur-2xl rounded-[2rem] border border-white/40 shadow-xl px-6 py-3">
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="冒険の名前を入力" className="w-full bg-transparent border-none outline-none text-gray-800 font-bold text-center" />
                        </div>
                    </div>
                    {userLocation && (
                        <button onClick={() => mapInstanceRef.current?.setView([userLocation.lat, userLocation.lng], 14)} className="absolute top-24 right-6 z-20 w-12 h-12 bg-white/80 backdrop-blur-xl rounded-2xl shadow-xl flex items-center justify-center text-gray-800 border border-white active:scale-90 transition-all">
                            <LocateFixed size={20} />
                        </button>
                    )}
                    <div className="mt-auto relative z-10 px-4 mb-4">
                        <div className="bg-white/30 backdrop-blur-3xl rounded-[3rem] p-6 shadow-2xl border border-white/40 space-y-5">
                            <div className="flex p-1 bg-black/5 rounded-2xl gap-1">
                                {rangeModes.map((mode) => (
                                    <button key={mode.id} onClick={() => { setActiveMode(mode); handleRadiusChange(mode.min); }} className={`flex-1 py-2 text-[9px] font-black rounded-xl transition-all ${activeMode.id === mode.id ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500'}`}>{mode.label}</button>
                                ))}
                            </div>
                            <div className="space-y-4 px-1">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm font-black text-pink-600 uppercase"><span>Radius</span><span className="text-gray-800">{formatDistance(radius)}</span></div>
                                    <input type="range" min={activeMode.min} max={activeMode.max} step={activeMode.step} value={radius} onChange={(e) => handleRadiusChange(parseFloat(e.target.value))} className="w-full h-1.5 accent-gray-400 bg-black/10 rounded-full appearance-none" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm font-black text-pink-600 uppercase"><span>Count</span><span className="text-gray-800">{itemCount}</span></div>
                                    <input type="range" min="1" max="7" step="1" value={itemCount} onChange={(e) => setItemCount(parseInt(e.target.value))} className="w-full h-1.5 accent-gray-400 bg-black/10 rounded-full appearance-none" />
                                </div>
                            </div>
                            <button onClick={handleCreate} disabled={isCreating} className="w-full py-4 bg-gradient-to-r from-[#F06292] to-[#FF8A65] text-white rounded-[2rem] font-black text-lg shadow-lg flex items-center justify-center gap-2">
                                {isCreating ? <Loader2 className="animate-spin" /> : "クエストを作成"}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {showConfirm && (
                <div className="absolute inset-0 z-[2000] flex items-center justify-center p-6 bg-black/20 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] p-8 shadow-2xl w-full max-w-sm text-center space-y-6">
                        <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 size={32} className="text-pink-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight">Quest Ready</h3>
                            <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">ブリーフィングを開始しますか？</p>
                        </div>
                        <button onClick={() => { setShowConfirm(false); setIsBriefingActive(true); }} className="w-full py-4 bg-gray-900 text-white rounded-[2rem] font-black flex items-center justify-center gap-2 shadow-xl">
                            <Play size={16} fill="currentColor" /> START BRIEFING
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}