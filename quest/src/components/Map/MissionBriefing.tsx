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
    const hasStarted = useRef(false);

    useEffect(() => {
        if (hasStarted.current || !items || items.length === 0) return;
        hasStarted.current = true;

        let isMounted = true;

        const runBriefing = async () => {
            const allNames: string[] = [];

            for (let i = 0; i < items.length; i++) {
                if (!isMounted) return;
                const item = items[i];
                map.flyTo([item.lat, item.lng], 15, { duration: 1.5 });

                const name = await getLocationName(item.lat, item.lng);
                allNames.push(name);

                if (isMounted) {
                    setDisplayNames([...allNames]);
                    setCurrentIndex(i);
                }

                await new Promise(r => setTimeout(r, 2200));
            }

            if (isMounted) {
                setIsFinalOverview(true);
                onStateChange(true);
                setCurrentIndex(-1);

                const bounds = L.latLngBounds(items.map(i => [i.lat, i.lng]));
                // モバイル対応：パディングを控えめにする (150px程度に)
                map.fitBounds(bounds, {
                    paddingTopLeft: [40, 40],
                    paddingBottomRight: [40, 150],
                    duration: 2
                });

                await new Promise(r => setTimeout(r, 5500));
                onComplete();
            }
        };

        runBriefing();
        return () => { isMounted = false; };
    }, [items, map, onComplete, onStateChange]);

    return (
        <div className="absolute inset-0 z-[1000] pointer-events-none p-4 flex flex-col">
            {!isFinalOverview && currentIndex !== -1 && (
                <div className="mt-8 self-center bg-gray-900/95 backdrop-blur-2xl px-5 py-3 rounded-[2rem] shadow-2xl border border-white/10 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-pink-500 rounded-full">
                            <PlaneTakeoff size={10} className="text-white animate-pulse" />
                            <span className="text-[9px] font-black text-white uppercase">{currentIndex + 1} / {items.length}</span>
                        </div>
                        <span className="text-xs font-black text-white uppercase tracking-tight truncate max-w-[140px]">
                            {displayNames[currentIndex] || "SCANNING..."}
                        </span>
                    </div>
                </div>
            )}

            {isFinalOverview && (
                <div className="mt-auto mb-28 w-full max-w-[320px] self-center bg-gray-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/10 p-5 animate-in slide-in-from-bottom-10 duration-700">
                    <h2 className="text-[9px] font-black text-pink-500 uppercase tracking-[0.3em] mb-3 text-center">
                        Discovery Report
                    </h2>
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                        {displayNames.map((name, idx) => (
                            <div key={idx} className="flex items-center gap-2 overflow-hidden">
                                <span className="text-[8px] font-black text-pink-900 italic">0{idx + 1}</span>
                                <span className="text-[10px] font-bold text-gray-200 uppercase truncate">
                                    {name}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}