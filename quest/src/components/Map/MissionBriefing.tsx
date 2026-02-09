"use client";

import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import { MapPin, PlaneTakeoff, ShieldCheck } from "lucide-react";
import { getLocationName } from "@/lib/geo";

export default function MissionBriefing({ items, onComplete }: { items: any[], onComplete: () => void }) {
    const map = useMap();
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [locationName, setLocationName] = useState("");

    useEffect(() => {
        const runBriefing = async () => {
            // 最初の待機時間を短縮（即応性アップ）
            await new Promise(r => setTimeout(r, 600));

            for (let i = 0; i < items.length; i++) {
                const item = items[i];

                // --- 安定のシングル・フォーカス ---
                // ズームを 16 に固定し、duration を 1.5秒に短縮（キレを出す）
                map.flyTo([item.lat, item.lng], 16, { duration: 1.5, easeLinearity: 0.25 });

                const name = await getLocationName(item.lat, item.lng);
                setCurrentIndex(i);
                setLocationName(name);

                // ターゲットを確認するための静止時間
                await new Promise(r => setTimeout(r, 2000));
            }

            // 最後はスムーズに完了
            await new Promise(r => setTimeout(r, 500));
            onComplete();
        };

        runBriefing();
    }, [items, map, onComplete]);

    return (
        <div className="absolute inset-0 z-[1000] pointer-events-none flex flex-col justify-between p-8">
            {/* 上部ステータスパネル：フォントとデザインをPLANページに完全同期 */}
            <div className="bg-white/90 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-2xl border border-white max-w-[280px] animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="flex items-center gap-2 mb-2 text-pink-500">
                    <PlaneTakeoff size={18} className="animate-pulse" />
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase leading-none">Scanning Target</span>
                </div>
                <h3 className="text-xl font-black text-gray-800 leading-tight uppercase">
                    {currentIndex === -1 ? "Analyzing..." : `Target #0${currentIndex + 1}`}
                </h3>
                <div className="mt-4 flex gap-1">
                    {items.map((_, idx) => (
                        <div key={idx} className={`h-1 rounded-full transition-all duration-500 ${idx <= currentIndex ? "w-6 bg-pink-500" : "w-2 bg-gray-200"}`} />
                    ))}
                </div>
            </div>

            {/* 下部地名パネル */}
            {currentIndex !== -1 && (
                <div className="mb-24 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                    <div className="bg-gray-900/90 backdrop-blur-2xl px-8 py-5 rounded-[2rem] shadow-2xl border border-white/10 text-center">
                        <p className="text-[9px] font-black text-pink-400 uppercase tracking-[0.3em] mb-1">Position Info</p>
                        <div className="text-lg font-black text-white uppercase tracking-tight leading-none">
                            {locationName || "Locating..."}
                        </div>
                        <div className="mt-2 flex items-center justify-center gap-1 text-gray-500 opacity-50">
                            <ShieldCheck size={10} />
                            <span className="text-[8px] font-bold uppercase tracking-widest">Verified Target</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}