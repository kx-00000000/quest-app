"use client";

import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import { MapPin, PlaneTakeoff, ShieldCheck, ListChecks } from "lucide-react";
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

            // 1. 各ターゲットを巡回
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                map.flyTo([item.lat, item.lng], 16, { duration: 1.5 });

                const name = await getLocationName(item.lat, item.lng);
                names.push(name);
                setLocationNames([...names]);
                setCurrentIndex(i);

                await new Promise(r => setTimeout(r, 2000));
            }

            // 2. グランドフィナーレ：全ターゲットが見えるまで引く
            setIsFinalOverview(true);
            setCurrentIndex(-1);

            const bounds = L.latLngBounds(items.map(i => [i.lat, i.lng]));
            map.fitBounds(bounds, { padding: [80, 80], duration: 2 });

            // ヒントをじっくり見せる時間
            await new Promise(r => setTimeout(r, 4000));
            onComplete();
        };

        runBriefing();
    }, [items, map, onComplete]);

    return (
        <div className="absolute inset-0 z-[1000] pointer-events-none flex flex-col justify-between p-8 bg-gray-900/10 backdrop-blur-[1px]">

            {/* 上部：ステータスパネル */}
            <div className="bg-white/95 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-2xl border border-white max-w-[280px] animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2 mb-2 text-pink-500">
                    {isFinalOverview ? <ListChecks size={18} /> : <PlaneTakeoff size={18} className="animate-pulse" />}
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase">
                        {isFinalOverview ? "Final Report" : "Target Scanning"}
                    </span>
                </div>
                <h3 className="text-xl font-black text-gray-800 leading-tight uppercase">
                    {isFinalOverview ? "All Targets ID'd" : `Target #0${currentIndex + 1}`}
                </h3>
            </div>

            {/* 下部：地名表示エリア */}
            <div className="mb-24 flex flex-col items-center w-full">
                {!isFinalOverview ? (
                    // 個別巡回中の表示
                    <div className="bg-gray-900/90 backdrop-blur-2xl px-8 py-5 rounded-[2rem] shadow-2xl border border-white/10 text-center animate-in zoom-in duration-300">
                        <p className="text-[9px] font-black text-pink-400 uppercase tracking-[0.3em] mb-1">Target Area</p>
                        <div className="text-lg font-black text-white uppercase tracking-tight">
                            {locationNames[currentIndex] || "Locating..."}
                        </div>
                    </div>
                ) : (
                    // 最後の全体まとめ表示
                    <div className="bg-white/95 backdrop-blur-2xl p-8 rounded-[3rem] shadow-2xl border border-white w-full max-w-xs animate-in slide-in-from-bottom-8 duration-700">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em] mb-4 text-center">Mission Briefing Summary</p>
                        <div className="space-y-3">
                            {locationNames.map((name, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <div className="w-6 h-6 bg-pink-50 rounded-lg flex items-center justify-center text-[10px] font-black text-pink-500 border border-pink-100">
                                        {idx + 1}
                                    </div>
                                    <div className="text-sm font-black text-gray-700 uppercase tracking-tight italic">
                                        {name}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 pt-4 border-t border-gray-50 flex items-center justify-center gap-2 text-pink-400">
                            <ShieldCheck size={14} />
                            <span className="text-[9px] font-black uppercase tracking-widest">Route Optimized</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}