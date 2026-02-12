"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { savePlan } from "@/lib/storage";
import { generateRandomPoint } from "@/lib/geo";
import { CheckCircle2, Play, Loader2, Target, Navigation } from "lucide-react";
import dynamic from "next/dynamic";

const LazyMap = dynamic<any>(() => import("@/components/Map/LazyMap").then(mod => mod.default), { ssr: false });

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
        if (typeof window !== "undefined" && "geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.warn(err)
            );
        }
    }, []);

    const handleCreate = async () => {
        setIsCreating(true);
        const center = userLocation || { lat: 35.6812, lng: 139.7671 };
        const validItems: any[] = [];
        const geocoder = new google.maps.Geocoder();

        let attempts = 0;
        while (validItems.length < itemCount && attempts < 20) {
            attempts++;
            const point = generateRandomPoint(center, radius);
            await new Promise((resolve) => {
                geocoder.geocode({ location: point }, (results, status) => {
                    if (status === "OK" && results?.[0]) {
                        const addr = results[0].address_components;
                        const city = addr.find(c => c.types.includes("locality"))?.long_name ||
                            addr.find(c => c.types.includes("administrative_area_level_2"))?.long_name || "Unknown Area";
                        validItems.push({ id: Math.random().toString(36).substr(2, 9), lat: point.lat, lng: point.lng, isCollected: false, addressName: city });
                    }
                    resolve(null);
                });
            });
        }

        savePlan({ id: Math.random().toString(36).substr(2, 9), name: name.trim() || "NEW QUEST", radius, itemCount: validItems.length, status: "ready", createdAt: new Date().toISOString(), totalDistance: 0, collectedCount: 0, center, items: validItems });
        setBriefingItems(validItems);
        setIsCreating(false);
        setShowConfirm(true);
    };

    return (
        <div className="flex flex-col h-full min-h-screen relative bg-white overflow-hidden">
            <div className="absolute inset-0 z-0">
                <LazyMap radiusInKm={radius} userLocation={userLocation} themeColor="#E6672E" items={briefingItems} isBriefingActive={isBriefingActive} isFinalOverview={isFinalOverview} onBriefingStateChange={setIsFinalOverview} onBriefingComplete={() => setIsBriefingActive(false)} />
            </div>

            {!isBriefingActive && !showConfirm && !isFinalOverview && (
                <>
                    {/* 名前入力を上部に分離 */}
                    <div className="absolute top-8 left-6 right-6 z-20">
                        <div className="bg-white/40 backdrop-blur-2xl rounded-[2rem] border border-white/40 shadow-xl px-6 py-3">
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="冒険の名前を入力" className="w-full bg-transparent border-none outline-none text-gray-800 font-black text-center placeholder:text-gray-400" />
                        </div>
                    </div>

                    {/* タブとスライダーのUI */}
                    <div className="mt-auto relative z-10 px-4 mb-4">
                        <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-6 shadow-2xl border border-white space-y-5">
                            <div className="flex p-1 bg-black/5 rounded-2xl gap-1">
                                {rangeModes.map((mode) => (
                                    <button key={mode.id} onClick={() => { setActiveMode(mode); setRadius(mode.min); }} className={`flex-1 py-2 text-[9px] font-black rounded-xl transition-all ${activeMode.id === mode.id ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500'}`}>{mode.label}</button>
                                ))}
                            </div>
                            <div className="space-y-4 px-1">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-black text-pink-500 uppercase"><span>Radius</span><span>{formatDistance(radius)}</span></div>
                                    {/* ★ 改良：塗りつぶしなし・枠なしのスライダー */}
                                    <input type="range" min={activeMode.min} max={activeMode.max} step={activeMode.step} value={radius} onChange={(e) => setRadius(parseFloat(e.target.value))}
                                        className="w-full h-1 bg-gray-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-pink-500 [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-pink-500 [&::-moz-range-thumb]:rounded-full" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-black text-pink-500 uppercase"><span>Items Count</span><span>{itemCount}</span></div>
                                    <input type="range" min="1" max="7" step="1" value={itemCount} onChange={(e) => setItemCount(parseInt(e.target.value))}
                                        className="w-full h-1 bg-gray-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:bg-pink-500 [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:bg-pink-500 [&::-moz-range-thumb]:rounded-full" />
                                </div>
                            </div>
                            <button onClick={handleCreate} disabled={isCreating} className="w-full py-4 bg-gray-900 text-white rounded-[2rem] font-black flex items-center justify-center gap-2">{isCreating ? <Loader2 className="animate-spin" /> : "クエストを作成"}</button>
                        </div>
                    </div>
                </>
            )}

            {/* Discovery Report */}
            {isFinalOverview && (
                <div className="absolute inset-0 z-[3000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in zoom-in-95 duration-500">
                    <div className="bg-white rounded-[3rem] p-8 w-full max-w-sm space-y-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-pink-500 to-orange-400" />
                        <p className="text-[9px] font-black text-pink-500 uppercase tracking-[0.3em] text-center">Discovery Report</p>
                        <div className="space-y-1 py-3 px-5 bg-gray-50 rounded-[2rem] border border-gray-100">
                            {briefingItems.map((item, idx) => (
                                <div key={idx} className="flex items-baseline gap-3">
                                    <span className="text-[9px] font-black text-pink-500 tabular-nums">#{idx + 1}</span>
                                    <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight truncate text-left flex-1">{item.addressName}</span>
                                </div>
                            ))}
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center"><Target size={14} className="text-gray-300 mx-auto mb-1" /><p className="text-lg font-black">{briefingItems.length}</p></div>
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 text-center"><Navigation size={14} className="text-gray-300 mx-auto mb-1" /><p className="text-lg font-black">{formatDistance(radius)}</p></div>
                        </div>
                        <button onClick={() => router.push("/plan")} className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl">Start Adventure</button>
                    </div>
                </div>
            )}

            {showConfirm && (
                <div className="absolute inset-0 z-[2000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-[3rem] p-8 shadow-2xl w-full max-w-sm text-center space-y-6">
                        <CheckCircle2 size={32} className="text-pink-500 mx-auto" /><h3 className="text-xl font-black">QUEST READY</h3>
                        <button onClick={() => { setShowConfirm(false); setIsBriefingActive(true); }} className="w-full py-4 bg-gray-900 text-white rounded-[2rem] font-black flex items-center justify-center gap-2 shadow-xl"><Play size={16} fill="currentColor" /> START BRIEFING</button>
                    </div>
                </div>
            )}
        </div>
    );
}