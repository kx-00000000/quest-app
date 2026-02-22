"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { savePlan } from "@/lib/storage";
import { generateRandomPoint } from "@/lib/geo";
import { Play, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";

const LazyMap = dynamic<any>(() => import("@/components/Map/LazyMap").then(mod => mod.default), { ssr: false });

const rangeModes = [
    { id: 'neighborhood', label: 'NEIGHBORHOOD', min: 0.5, max: 15, step: 0.1 },
    { id: 'excursion', label: 'EXCURSION', min: 15, max: 200, step: 1 },
    { id: 'grand', label: 'GRAND', min: 200, max: 40000, step: 100 }
];

const formatDistance = (km: number): string => km < 1 ? `${Math.floor(km * 1000)} m` : `${km.toFixed(1)} km`;

export default function NewQuestPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [activeMode, setActiveMode] = useState(rangeModes[0]);
    const [radius, setRadius] = useState(1);
    const [itemCount, setItemCount] = useState(3);
    const [isCreating, setIsCreating] = useState(false);
    const [isBriefingReady, setIsBriefingReady] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);
    const [briefingItems, setBriefingItems] = useState<any[]>([]);
    const [isBriefingActive, setIsBriefingActive] = useState(false);
    const [isFinalOverview, setIsFinalOverview] = useState(false);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition((pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }));
        }
    }, []);

    const resetReadyStatus = () => { if (isBriefingReady) setIsBriefingReady(false); };

    const handleAction = async () => {
        if (isBriefingReady) { setIsBriefingActive(true); return; }
        setIsCreating(true);
        const center = userLocation || { lat: 35.6812, lng: 139.7671 };
        const validItems: any[] = [];
        const geocoder = new google.maps.Geocoder();

        while (validItems.length < itemCount) {
            const point = generateRandomPoint(center, radius);
            const result = await new Promise<any>((resolve) => {
                geocoder.geocode({ location: point }, (res, status) => {
                    if (status === "OK" && res?.[0]) {
                        const comp = res[0].address_components;
                        const pref = comp.find(c => c.types.includes("administrative_area_level_1"))?.long_name;
                        const locality = comp.find(c => c.types.includes("locality"))?.long_name ||
                            comp.find(c => c.types.includes("sublocality_level_1"))?.long_name;
                        const country = comp.find(c => c.types.includes("country"))?.long_name;

                        // ★ 都道府県、市区町村が取得できる「確実な陸地」のみを採用
                        if (pref && locality && country) {
                            // ★ 解決：ランダム座標ではなく、Geocoderが返した「正式な陸地の住所の座標」に書き換える
                            const precisePos = {
                                lat: res[0].geometry.location.lat(),
                                lng: res[0].geometry.location.lng()
                            };
                            resolve({ address: `${pref} ${locality}, ${country}`.trim(), pos: precisePos });
                            return;
                        }
                    }
                    resolve(null);
                });
            });

            if (result) {
                validItems.push({ id: Math.random().toString(36).substr(2, 9), ...result.pos, isCollected: false, addressName: result.address });
            }
            await new Promise(r => setTimeout(r, 100));
        }

        savePlan({ id: Math.random().toString(36).substr(2, 9), name: name.trim() || "NEW QUEST", radius, center, items: validItems, status: "ready", createdAt: new Date().toISOString(), itemCount: validItems.length, totalDistance: 0, collectedCount: 0 });
        setBriefingItems(validItems);
        setIsCreating(false);
        setIsBriefingReady(true);
    };

    return (
        <div className="flex flex-col h-full min-h-screen relative bg-white overflow-hidden">
            <div className="absolute inset-0 z-0">
                <LazyMap radiusInKm={radius} userLocation={userLocation} items={(isBriefingActive || isFinalOverview) ? briefingItems : []} isBriefingActive={isBriefingActive} isFinalOverview={isFinalOverview} onBriefingStateChange={setIsFinalOverview} onBriefingComplete={() => setIsBriefingActive(false)} />
            </div>
            {!isBriefingActive && !isFinalOverview && (
                <div className="flex flex-col h-full relative z-10">
                    <div className="p-8 pt-16">
                        <div className="bg-white/40 backdrop-blur-2xl rounded-[2rem] border border-white/40 shadow-xl px-6 py-3">
                            <input type="text" value={name} onChange={(e) => { setName(e.target.value); resetReadyStatus(); }} placeholder="QUEST NAME" className="w-full bg-transparent border-none outline-none text-gray-800 font-black text-center" />
                        </div>
                    </div>
                    <div className="mt-auto px-4 mb-4">
                        <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-6 shadow-2xl border border-white space-y-5">
                            <div className="flex p-1 bg-black/5 rounded-2xl gap-1">
                                {rangeModes.map((m) => (<button key={m.id} onClick={() => { setActiveMode(m); setRadius(m.min); resetReadyStatus(); }} className={`flex-1 py-2 text-[9px] font-black rounded-xl transition-all ${activeMode.id === m.id ? 'bg-white text-[#F37343]' : 'text-gray-500'}`}>{m.label}</button>))}
                            </div>
                            <div className="space-y-4 px-1">
                                <div className="space-y-1"><div className="flex justify-between text-[10px] font-black text-[#F37343] uppercase tracking-widest"><span>Radius</span><span>{formatDistance(radius)}</span></div><input type="range" min={activeMode.min} max={activeMode.max} step={activeMode.step} value={radius} onChange={(e) => { setRadius(parseFloat(e.target.value)); resetReadyStatus(); }} className="w-full h-3 bg-gray-100 rounded-full appearance-none" /></div>
                                <div className="space-y-1"><div className="flex justify-between text-[10px] font-black text-[#F37343] uppercase tracking-widest"><span>Items</span><span>{itemCount}</span></div><input type="range" min="1" max="7" step="1" value={itemCount} onChange={(e) => { setItemCount(parseInt(e.target.value)); resetReadyStatus(); }} className="w-full h-3 bg-gray-100 rounded-full appearance-none" /></div>
                            </div>
                            <button onClick={handleAction} disabled={isCreating} className={`w-full py-4 rounded-[2rem] font-black flex items-center justify-center gap-2 transition-all uppercase ${isBriefingReady ? "bg-[#F37343] text-white" : "bg-gray-900 text-white"}`}>
                                {isCreating ? <Loader2 className="animate-spin" /> : isBriefingReady ? <><Play size={16} fill="currentColor" /> START BRIEFING</> : "CREATE QUEST"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {isFinalOverview && (
                <div className="absolute inset-0 z-[3000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-[2px]">
                    <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] p-8 w-full max-w-sm space-y-6 shadow-2xl text-center border border-white/50">
                        <div className="absolute top-0 left-0 w-full h-1 bg-[#F37343]" />
                        <h2 className="text-xl font-black text-gray-900 uppercase truncate">{name || "NEW QUEST"}</h2>
                        <div className="space-y-2 py-2">{briefingItems.map((item, idx) => (<div key={idx} className="flex items-center gap-3 text-left"><span className="flex-none w-5 h-5 bg-[#F37343] text-white text-[10px] font-black flex items-center justify-center rounded-full">{idx + 1}</span><span className="text-[12px] font-bold text-gray-700 uppercase truncate flex-1 tracking-tight">{item.addressName}</span></div>))}</div>
                        <button onClick={() => router.push("/plan")} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-3"><Play size={14} fill="currentColor" /><span>Confirm Quest</span></button>
                    </div>
                </div>
            )}
        </div>
    );
}