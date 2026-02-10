"use client";

import { useEffect, useState, useRef } from "react";
import { useMap } from "react-leaflet";
import { PlaneTakeoff } from "lucide-react";
import { getLocationName } from "@/lib/geo";
import L from "leaflet";

export default function MissionBriefing({ items, onStateChange, onComplete }: { items: any[], onStateChange: (val: boolean) => void, onComplete: () => void }) {
    const map = useMap();
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [displayNames, setDisplayNames] = useState<string[]>([]);
    const [isFinalOverview, setIsFinalOverview] = useState(false);
    const briefingStarted = useRef(false);

    useEffect(() => {
        if (briefingStarted.current || !items || items.length === 0) return;
        briefingStarted.current = true;

        const run = async () => {
            const names: string[] = [];
            for (let i = 0; i < items.length; i++) {
                map.flyTo([items[i].lat, items[i].lng], 15, { duration: 1.5 });
                const name = await getLocationName(items[i].lat, items[i].lng);
                names.push(name);
                setDisplayNames([...names]);
                setCurrentIndex(i);
                await new Promise(r => setTimeout(r, 2200));
            }

            setIsFinalOverview(true);
            onStateChange(true);
            setCurrentIndex(-1);

            const bounds = L.latLngBounds(items.map(i => [i.lat, i.lng]));
            map.fitBounds(bounds, { padding: [40, 100], duration: 2 });

            await new Promise(r => setTimeout(r, 5000));
            onComplete();
        };
        run();
    }, [items, map, onComplete, onStateChange]);

    return (
        <div className="absolute inset-0 z-[1000] pointer-events-none p-4 flex flex-col">
            {!isFinalOverview && currentIndex !== -1 && (
                <div className="mt-8 self-center bg-gray-900/95 backdrop-blur-2xl px-5 py-3 rounded-[2rem] shadow-2xl border border-white/10 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-3 text-white">
                        <PlaneTakeoff size={14} className="text-pink-500 animate-pulse" />
                        <span className="text-[10px] font-black">{currentIndex + 1} / {items.length}</span>
                        <span className="text-xs font-black truncate max-w-[140px] uppercase tracking-tight">{displayNames[currentIndex] || "SCANNING..."}</span>
                    </div>
                </div>
            )}

            {isFinalOverview && (
                <div className="mt-auto mb-28 w-full max-w-[320px] self-center bg-gray-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/10 p-5 animate-in slide-in-from-bottom-10">
                    <h2 className="text-[9px] font-black text-pink-500 uppercase tracking-[0.3em] mb-3 text-center">Discovery Report</h2>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                        {displayNames.map((name, idx) => (
                            <div key={idx} className="flex items-center gap-2 overflow-hidden text-gray-200">
                                <span className="text-[8px] font-black text-pink-500">0{idx + 1}</span>
                                <span className="text-[10px] font-bold uppercase truncate">{name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}