"use client";

import { useEffect, useState, useRef } from "react";
import { useMap } from "react-leaflet";
import { PlaneTakeoff } from "lucide-react";
import { getLocationName } from "@/lib/geo";
import { getPlans, savePlan } from "@/lib/storage"; // 追加
import L from "leaflet";

export default function MissionBriefing({ items, planId, onStateChange, onComplete }: { items: any[], planId?: string | null, onStateChange: (val: boolean) => void, onComplete: () => void }) {
    const map = useMap();
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [displayNames, setDisplayNames] = useState<string[]>([]);
    const [isFinalOverview, setIsFinalOverview] = useState(false);
    const hasStarted = useRef(false);

    useEffect(() => {
        if (hasStarted.current) return;
        hasStarted.current = true;

        const run = async () => {
            const allNames: string[] = [];
            for (let i = 0; i < items.length; i++) {
                map.flyTo([items[i].lat, items[i].lng], 15, { duration: 1.5 });
                const name = await getLocationName(items[i].lat, items[i].lng);
                allNames.push(name);
                setDisplayNames([...allNames]);
                setCurrentIndex(i);
                await new Promise(r => setTimeout(r, 2200));
            }

            // ★解析した地名を保存
            if (planId) {
                const plans = getPlans();
                const planIndex = plans.findIndex(p => p.id === planId);
                if (planIndex !== -1) {
                    plans[planIndex].items = plans[planIndex].items.map((it: any, idx: number) => ({
                        ...it,
                        locationName: allNames[idx] || "Land Target"
                    }));
                    savePlan(plans[planIndex]);
                }
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
    }, [items, map, onComplete, onStateChange, planId]);

    return (
        <div className="absolute inset-0 z-[1000] pointer-events-none p-6 flex flex-col">
            {!isFinalOverview && currentIndex !== -1 && (
                <div className="mt-8 self-center bg-gray-900/95 backdrop-blur-2xl px-6 py-4 rounded-[2rem] shadow-2xl border border-white/10 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-pink-500 rounded-full">
                            <PlaneTakeoff size={12} className="text-white animate-pulse" />
                            <span className="text-[10px] font-black text-white">{currentIndex + 1} / {items.length}</span>
                        </div>
                        <span className="text-sm font-black text-white uppercase tracking-tight">{displayNames[currentIndex] || "SCANNING..."}</span>
                    </div>
                </div>
            )}

            {isFinalOverview && (
                <div className="mt-auto mb-32 w-full max-w-sm self-center bg-gray-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/10 p-6 animate-in slide-in-from-bottom-10">
                    <h2 className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] mb-4 text-center">Discovery Report</h2>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {displayNames.map((name, idx) => (
                            <div key={idx} className="flex items-center gap-2 overflow-hidden">
                                <span className="text-[9px] font-black text-pink-500 italic">0{idx + 1}</span>
                                <span className="text-[11px] font-bold text-gray-200 uppercase truncate">{name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}