"use client";

import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import { MapPin, PlaneTakeoff } from "lucide-react";
import { getLocationName } from "@/lib/geo";

export default function MissionBriefing({ items, onComplete }: { items: any[], onComplete: () => void }) {
    const map = useMap();
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [locationName, setLocationName] = useState("");

    useEffect(() => {
        const runBriefing = async () => {
            // 1. 最初は全体が見える位置からスタート
            await new Promise(r => setTimeout(r, 1000));

            for (let i = 0; i < items.length; i++) {
                const item = items[i];

                // 地図をターゲットへ飛ばす（FlyTo）
                map.flyTo([item.lat, item.lng], 16, { duration: 2.5, easeLinearity: 0.25 });

                // 到着前に地名を取得開始
                const name = await getLocationName(item.lat, item.lng);

                setCurrentIndex(i);
                setLocationName(name);

                // 演出用の待機時間
                await new Promise(r => setTimeout(r, 3500));
            }

            // すべて巡回したら終了
            onComplete();
        };

        runBriefing();
    }, [items, map, onComplete]);

    return (
        <div className="absolute inset-0 z-[1000] pointer-events-none flex flex-col justify-between p-8">
            {/* 上部：タクティカルなステータス窓 */}
            <div className="bg-white/90 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-2xl border border-white max-w-[280px] animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center gap-2 mb-2 text-pink-500">
                    <PlaneTakeoff size={18} className="animate-pulse" />
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase">Initial Briefing</span>
                </div>
                {/* お気に入りのフォントスタイルを適用 */}
                <h3 className="text-xl font-black text-gray-800 leading-tight uppercase">
                    {currentIndex === -1 ? "Analyzing Route..." : `Target #0${currentIndex + 1}`}
                </h3>
                <div className="mt-4 flex gap-1">
                    {items.map((_, idx) => (
                        <div key={idx} className={`h-1 rounded-full transition-all duration-500 ${idx <= currentIndex ? "w-6 bg-pink-500" : "w-2 bg-gray-200"}`} />
                    ))}
                </div>
            </div>

            {/* 下部：現在の地名ヒント */}
            {currentIndex !== -1 && (
                <div className="mb-24 flex flex-col items-center animate-in fade-in zoom-in duration-500">
                    <div className="bg-gray-900/90 backdrop-blur-2xl px-8 py-5 rounded-[2rem] shadow-2xl border border-white/10 text-center">
                        <p className="text-[9px] font-black text-pink-400 uppercase tracking-[0.3em] mb-1">Area Recon</p>
                        <div className="text-lg font-black text-white uppercase tracking-tight">
                            {locationName || "Scanning..."}
                        </div>
                        <div className="flex items-center justify-center gap-1 mt-2 text-gray-500">
                            <MapPin size={10} />
                            <span className="text-[9px] font-bold">ESTABLISHING COORDINATES</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}