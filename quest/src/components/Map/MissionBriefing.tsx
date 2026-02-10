"use client";

import { useEffect, useState } from "react";
import { useMap } from "react-leaflet";
import { MapPin, PlaneTakeoff, ShieldCheck } from "lucide-react";
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

                // --- Grandモード軽量化対策 ---
                // 1. 移動前に「読み込み待ち」を少し入れ、タイル描画の詰まりを防止
                await new Promise(r => setTimeout(r, 400));

                // 2. 移動アニメーションの「キレ」を重視
                // 距離が遠い（Grand）場合、LeafletのflyToは自動的に「高度」を上げてくれます。
                // ボケ防止のため、あえてズームを15（少し引きめ）に固定し、負荷を下げます。
                map.flyTo([item.lat, item.lng], 15, {
                    duration: 1.8,
                    easeLinearity: 0.1, // ★動き出しを滑らかにして、カクつきを目立たせない
                    noMoveStart: true
                });

                const name = await getLocationName(item.lat, item.lng);
                names.push(name);
                setLocationNames([...names]);
                setCurrentIndex(i);

                await new Promise(r => setTimeout(r, 2200));
            }

            // 最後の全体俯瞰
            setIsFinalOverview(true);
            setCurrentIndex(-1);
            const bounds = L.latLngBounds(items.map(i => [i.lat, i.lng]));
            map.fitBounds(bounds, { padding: [60, 60], duration: 1.5 });

            await new Promise(r => setTimeout(r, 3500));
            onComplete();
        };

        runBriefing();
    }, [items, map, onComplete]);

    return (
        <div className="absolute inset-0 z-[1000] pointer-events-none p-6 flex flex-col items-center">

            {/* 統合された「ミッション・ダッシュボード」 */}
            <div className="mt-12 w-full max-w-sm bg-gray-900/95 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl border border-white/10 p-6 animate-in fade-in slide-in-from-top-6 duration-700">

                {/* 上段：ステータス ＆ 進捗ドット */}
                <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-2">
                        <PlaneTakeoff size={16} className="text-pink-500 animate-pulse" />
                        <span className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em]">
                            {isFinalOverview ? "Mission Ready" : "Target Scanning"}
                        </span>
                    </div>
                    {/* 進捗ドット：地名と同じ枠内に収める */}
                    <div className="flex gap-1.5">
                        {items.map((_, idx) => (
                            <div
                                key={idx}
                                className={`h-1.5 rounded-full transition-all duration-500 ${idx === currentIndex ? "w-6 bg-pink-500" : (idx < currentIndex ? "w-1.5 bg-pink-900" : "w-1.5 bg-gray-700")
                                    }`}
                            />
                        ))}
                    </div>
                </div>

                {/* 中段：メイン地名表示（視線がここだけで完結するように） */}
                {!isFinalOverview ? (
                    <div className="py-2">
                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.3em] mb-1">Target ID #0{currentIndex + 1}</p>
                        <h2 className="text-xl font-black text-white uppercase tracking-tight leading-none truncate">
                            {locationNames[currentIndex] || "Locating..."}
                        </h2>
                    </div>
                ) : (
                    <div className="py-2 space-y-2">
                        <h2 className="text-sm font-black text-white uppercase tracking-widest border-b border-white/10 pb-2 mb-2">Discovery Report</h2>
                        {locationNames.map((name, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-gray-300">
                                <span className="text-[10px] font-black text-pink-500 italic">0{idx + 1}</span>
                                <span className="text-xs font-bold uppercase tracking-tight truncate">{name}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* 下段：フッター（全体の信頼性を演出） */}
                <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-gray-500">
                        <ShieldCheck size={12} />
                        <span className="text-[8px] font-black uppercase tracking-widest italic">Encrypted Connection</span>
                    </div>
                    <span className="text-[8px] font-black text-pink-900 uppercase">Ver 1.0.4</span>
                </div>
            </div>

            {/* 地図を隠さないための工夫：中央はあえて空けておく */}
        </div>
    );
}