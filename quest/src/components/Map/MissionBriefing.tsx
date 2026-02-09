"use client";

import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import { MapPin, PlaneTakeoff, Globe } from "lucide-react";
import { getLocationName } from "@/lib/geo";

export default function MissionBriefing({ items, onComplete }: { items: any[], onComplete: () => void }) {
    const map = useMap();
    const [currentIndex, setCurrentIndex] = useState(-1);
    const [locationName, setLocationName] = useState("");
    const [isZoomingOut, setIsZoomingOut] = useState(false);

    useEffect(() => {
        const runBriefing = async () => {
            // 冒険の開始地点（全体像）
            const initialCenter = map.getCenter();
            const initialZoom = map.getZoom();

            for (let i = 0; i < items.length; i++) {
                const item = items[i];

                // --- STEP 1: ターゲットへ急降下 (Focus) ---
                setIsZoomingOut(false);
                map.flyTo([item.lat, item.lng], 17, { duration: 2, easeLinearity: 0.25 });

                const name = await getLocationName(item.lat, item.lng);
                setCurrentIndex(i);
                setLocationName(name);

                await new Promise(r => setTimeout(r, 2500)); // ターゲットをじっくり見せる

                // --- STEP 2: 上空へ大きく引く (Overview) ---
                if (i < items.length - 1) { // 最後のアイテム以外
                    setIsZoomingOut(true);
                    // ターゲット地点のまま高度だけ上げる、もしくは中心に戻る
                    map.flyTo([item.lat, item.lng], 13, { duration: 1.5, easeLinearity: 0.2 });
                    await new Promise(r => setTimeout(r, 1800));
                }
            }

            // --- STEP 3: 全ミッション完了の俯瞰 ---
            setIsZoomingOut(true);
            map.flyTo(initialCenter, initialZoom, { duration: 2 });
            await new Promise(r => setTimeout(r, 2000));

            onComplete();
        };

        runBriefing();
    }, [items, map, onComplete]);

    return (
        <div className="absolute inset-0 z-[1000] pointer-events-none flex flex-col justify-between p-8">
            {/* 上部ステータスパネル */}
            <div className="bg-white/90 backdrop-blur-xl p-6 rounded-[2.5rem] shadow-2xl border border-white max-w-[280px] animate-in fade-in slide-in-from-top-4 duration-700">
                <div className="flex items-center gap-2 mb-2 text-pink-500">
                    {isZoomingOut ? <Globe size={18} className="animate-spin-slow" /> : <PlaneTakeoff size={18} className="animate-pulse" />}
                    <span className="text-[10px] font-black tracking-[0.2em] uppercase">
                        {isZoomingOut ? "Scanning Area" : "Target Lock"}
                    </span>
                </div>
                <h3 className="text-xl font-black text-gray-800 leading-tight uppercase">
                    {currentIndex === -1 ? "Analyzing..." : `Target #0${currentIndex + 1}`}
                </h3>
                <div className="mt-4 flex gap-1">
                    {items.map((_, idx) => (
                        <div key={idx} className={`h-1 rounded-full transition-all duration-700 ${idx <= currentIndex ? "w-6 bg-pink-500" : "w-2 bg-gray-200"}`} />
                    ))}
                </div>
            </div>

            {/* 下部地名パネル（ズームアウト中は少し透過させる演出） */}
            {currentIndex !== -1 && (
                <div className={`mb-24 flex flex-col items-center transition-all duration-500 ${isZoomingOut ? "opacity-40 scale-95" : "opacity-100 scale-100"}`}>
                    <div className="bg-gray-900/90 backdrop-blur-2xl px-8 py-5 rounded-[2rem] shadow-2xl border border-white/10 text-center">
                        <p className="text-[9px] font-black text-pink-400 uppercase tracking-[0.3em] mb-1">Position Info</p>
                        <div className="text-lg font-black text-white uppercase tracking-tight">
                            {locationName || "Detecting..."}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}