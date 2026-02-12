"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { savePlan } from "@/lib/storage";
import { generateRandomPoint } from "@/lib/geo";
import { CheckCircle2, Play, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const LazyMap = dynamic<any>(() => import("@/components/Map/LazyMap").then(mod => mod.default), { ssr: false });

const rangeModes = [
    { id: 'neighborhood', label: 'NEIGHBORHOOD', min: 0.5, max: 15, step: 0.1 },
    { id: 'excursion', label: 'EXCURSION', min: 15, max: 200, step: 1 },
    { id: 'grand', label: 'GRAND', min: 200, max: 40000, step: 100 }
];

const formatDistance = (km: number): string => {
    return km < 1 ? `${Math.floor(km * 1000)} m` : `${km.toFixed(1)} km`;
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

        for (let i = 0; i < itemCount; i++) {
            const point = generateRandomPoint(center, radius);
            await new Promise((resolve) => {
                geocoder.geocode({ location: point }, (results, status) => {
                    let city = "Unknown Waypoint";
                    if (status === "OK" && results?.[0]) {
                        city = results[0].address_components.find(c => c.types.includes("locality"))?.long_name || "Active Area";
                    }
                    validItems.push({ id: Math.random().toString(36).substr(2, 9), lat: point.lat, lng: point.lng, isCollected: false, addressName: city });
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
                <LazyMap radiusInKm={radius} userLocation={userLocation} themeColor="#F37343" items={briefingItems} isBriefingActive={isBriefingActive} isFinalOverview={isFinalOverview} onBriefingStateChange={setIsFinalOverview} onBriefingComplete={() => setIsBriefingActive(false)} />
            </div>

            {!isBriefingActive && !showConfirm && !isFinalOverview && (
                <>
                    <div className="absolute top-8 left-6 right-6 z-20">
                        <div className="bg-white/40 backdrop-blur-2xl rounded-[2rem] border border-white/40 shadow-xl px-6 py-3">
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="QUEST NAME" className="w-full bg-transparent border-none outline-none text-gray-800 font-black text-center" />
                        </div>
                    </div>
                    <div className="mt-auto relative z-10 px-4 mb-4">
                        <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-6 shadow-2xl border border-white space-y-5">
                            <div className="flex p-1 bg-black/5 rounded-2xl gap-1">
                                {rangeModes.map((mode) => (
                                    <button key={mode.id} onClick={() => { setActiveMode(mode); setRadius(mode.min); }} className={`flex-1 py-2 text-[9px] font-black rounded-xl transition-all ${activeMode.id === mode.id ? 'bg-white text-[#F37343] shadow-sm' : 'text-gray-500'}`}>{mode.label}</button>
                                ))}
                            </div>
                            <div className="space-y-4 px-1">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-black text-[#F37343] uppercase tracking-widest"><span>Radius</span><span>{formatDistance(radius)}</span></div>
                                    <input type="range" min={activeMode.min} max={activeMode.max} step={activeMode.step} value={radius} onChange={(e) => setRadius(parseFloat(e.target.value))}
                                        className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-[#F37343] [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#F37343] [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-none" />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-black text-[#F37343] uppercase tracking-widest"><span>Items Count</span><span>{itemCount}</span></div>
                                    <input type="range" min="1" max="7" step="1" value={itemCount} onChange={(e) => setItemCount(parseInt(e.target.value))}
                                        className="w-full h-3 bg-gray-100 rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:bg-[#F37343] [&::-webkit-slider-thumb]:rounded-full [&::-moz-range-thumb]:bg-[#F37343] [&::-moz-range-thumb]:w-6 [&::-moz-range-thumb]:h-6 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-none" />
                                </div>
                            </div>
                            <button onClick={handleCreate} disabled={isCreating} className="w-full py-4 bg-gray-900 text-white rounded-[2rem] font-black flex items-center justify-center gap-2 active:scale-95 shadow-lg">CREATE QUEST</button>
                        </div>
                    </div>
                </>
            )}

            {isFinalOverview && (
                <div className="absolute inset-0 z-[3000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md">
                    <div className="bg-white rounded-[3rem] p-8 w-full max-w-sm space-y-6 shadow-2xl relative overflow-hidden text-center">
                        <div className="absolute top-0 left-0 w-full h-1.5 bg-[#F37343]" />
                        <p className="text-[9px] font-black text-[#F37343] uppercase tracking-[0.3em]">Discovery Report</p>
                        <div className="space-y-1.5 py-3 px-5 bg-gray-50 rounded-[2rem] border border-gray-100">
                            {briefingItems.map((item, idx) => (
                                <div key={idx} className="flex items-baseline gap-3 text-left">
                                    <span className="text-[9px] font-black text-[#F37343]">#{idx + 1}</span>
                                    <span className="text-[11px] font-black text-gray-900 uppercase truncate flex-1">{item.addressName}</span>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => router.push("/plan")} className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"><Play size={14} fill="currentColor" />Start Adventure</button>
                    </div>
                </div>
            )}

            {showConfirm && (
                <div className="absolute inset-0 z-[2000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[3rem] p-8 shadow-2xl w-full max-w-sm text-center space-y-6">
                        <CheckCircle2 size={32} className="text-[#F37343] mx-auto" /><h3 className="text-xl font-black uppercase tracking-tight">Quest Ready</h3>
                        <button onClick={() => { setShowConfirm(false); setIsBriefingActive(true); }} className="w-full py-4 bg-gray-900 text-white rounded-[2rem] font-black flex items-center justify-center gap-2 shadow-xl"><Play size={16} fill="currentColor" /> START BRIEFING</button>
                    </div>
                </div>
            )}
        </div>
    );
}