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
    const hasStarted = useRef(false); // ★多重実行防止フラグ

    useEffect(() => {
        if (hasStarted.current) return;
        hasStarted.current = true;

        const runBriefing = async () => {
            const allNames: string[] = [];

            // 1. 各ターゲットを順番に巡回
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                map.flyTo([item.lat, item.lng], 15, { duration: 1.5 });

                const name = await getLocationName(item.lat, item.lng);
                allNames.push(name);

                // ステートを更新
                setDisplayNames([...allNames]);
                setCurrentIndex(i);

                await new Promise(r => setTimeout(r, 2200));
            }

            // 2. 巡回完了後：レポートを表示
            setIsFinalOverview(true);
            onStateChange(true); // 親（Map）に通知して円を表示
            setCurrentIndex(-1);

            const bounds = L.latLngBounds(items.map(i => [i.lat, i.lng]));
            const center = map.getCenter();
            bounds.extend(center);

            map.fitBounds(bounds, {
                paddingTopLeft: [60, 60],
                paddingBottomRight: [60, 350],
                duration: 2
            });

            // 3. 終了
            await new Promise(r => setTimeout(r, 5500));
            onComplete();
        };

        runBriefing();
    }, [items, map, onComplete, onStateChange]);

    return (
        <div className="absolute inset-0 z-[1000] pointer-events-none p-6 flex flex-col">
            {/* 巡回中ステータス */}
            {!isFinalOverview && currentIndex !== -1 && (
                <div className="mt-8 self-center bg-gray-900/95 backdrop-blur-2xl px-6 py-4 rounded-[2rem] shadow-2xl border border-white/10 animate-in fade-in slide-in-from-top-4">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 bg-pink-500 rounded-full">
                            <PlaneTakeoff size={12} className="text-white animate-pulse" />
                            <span className="text-[10px] font-black text-white uppercase tracking-tighter">
                                {currentIndex + 1} / {items.length}
                            </span>
                        </div>
                        <span className="text-sm font-black text-white uppercase tracking-tight truncate max-w-[180px]">
                            {displayNames[currentIndex] || "SCANNING..."}
                        </span>
                    </div>
                </div>
            )}

            {/* ディスカバリーレポート：全ての地点を表示 */}
            {isFinalOverview && (
                <div className="mt-auto mb-32 w-full max-w-sm self-center bg-gray-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/10 p-6 animate-in slide-in-from-bottom-10 duration-700">
                    <h2 className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] mb-4 text-center">
                        Discovery Report
                    </h2>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2">
                        {displayNames.map((name, idx) => (
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