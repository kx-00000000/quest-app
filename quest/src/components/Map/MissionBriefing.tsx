"use client";

import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import { PlaneTakeoff } from "lucide-react";
import { getLocationName } from "@/lib/geo";
import L from "leaflet";

export default function MissionBriefing({ items, onComplete }: { items: any[], onComplete: () => void }) {
    const map = useMap();
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [locationNames, setLocationNames] = useState<string[]>([]);
    const [isFinalOverview, setIsFinalOverview] = useState(false);

    useEffect(() => {
        const runBriefing = async () => {
            const names: string[] = [];
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                map.flyTo([item.lat, item.lng], 15, { duration: 1.5 });

                const name = await getLocationName(item.lat, item.lng);
                names.push(name);
                setLocationNames([...names]);
                setCurrentIndex(i);
                await new Promise(r => setTimeout(r, 2000));
            }

            setIsFinalOverview(true);
            setCurrentIndex(-1);

            const bounds = L.latLngBounds(items.map(i => [i.lat, i.lng]));
            map.fitBounds(bounds, {
                paddingTopLeft: [50, 50],
                paddingBottomRight: [50, 320],
                duration: 1.5
            });

            await new Promise(r => setTimeout(r, 4500));
            onComplete();
        };
        runBriefing();
    }, [items, map, onComplete]);

    return (
        <div className="absolute inset-0 z-[1000] pointer-events-none p-6 flex flex-col">
            {/* 巡回中の上部ステータス */}
            {!isFinalOverview && currentIndex !== -1 && (
                <div className="mt-8 self-center bg-gray-900/95 backdrop-blur-2xl px-6 py-4 rounded-[2rem] shadow-2xl border border-white/10 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-pink-500 rounded-full">
                            <PlaneTakeoff size={12} className="text-white animate-pulse" />
                            <span className="text-[10px] font-black text-white uppercase tracking-tighter">
                                {currentIndex + 1} / {items.length}
                            </span>
                        </div>
                        <span className="text-sm font-black text-white uppercase tracking-tight">
                            {locationNames[currentIndex]}
                        </span>
                    </div>
                </div>
            )}

            {/* Discovery Report：下部 */}
            {isFinalOverview && (
                <div className="mt-auto mb-32 w-full max-w-sm self-center bg-gray-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/10 p-6 animate-in slide-in-from-bottom-10 duration-700">
                    <h2 className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] mb-4 text-center">
                        Discovery Report
                    </h2>

                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {locationNames.map((name, idx) => (
                            <div key={idx} className="flex items-center gap-2 overflow-hidden">
                                <span className="text-[9px] font-black text-pink-900 italic">0{idx + 1}</span>
                                <span className="text-[11px] font-bold text-gray-200 uppercase truncate">
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