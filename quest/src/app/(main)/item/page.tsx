"use client";

import { useState } from "react";
import { Package, Grid, LayoutList, X, MapPin, Calendar, Info } from "lucide-react";

// --- モックデータ：新仕様に基づいた項目 ---
const ITEMS = Array.from({ length: 12 }, (_, i) => ({
    id: `item_${i}`,
    name: i % 2 === 0 ? "ローカル・アンティーク" : "名産の欠片",
    locationName: "東京都 目黒区 自由が丘周辺",
    coords: "35.6074° N, 139.6672° E",
    collectedAt: "2026.02.12 14:30",
    description: "その土地でしか見つからない特別なアイテム。長い年月を経て、不思議な輝きを放ち続けている。",
    imagePath: `/images/items/item-${(i % 3) + 1}.png`
}));

export default function ItemPage() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedItem, setSelectedItem] = useState<any>(null);

    return (
        <div className="min-h-screen bg-white font-sans pb-32">
            {/* 1. ヘッダー（切替スイッチ） */}
            <div className="flex border-b border-gray-100 bg-white sticky top-0 z-10">
                <button onClick={() => setViewMode('grid')} className={`flex-1 py-4 flex justify-center items-center border-b-2 transition-all ${viewMode === 'grid' ? 'border-black text-black' : 'border-transparent text-gray-300'}`}>
                    <Grid size={20} />
                </button>
                <button onClick={() => setViewMode('list')} className={`flex-1 py-4 flex justify-center items-center border-b-2 transition-all ${viewMode === 'list' ? 'border-black text-black' : 'border-transparent text-gray-300'}`}>
                    <LayoutList size={20} />
                </button>
            </div>

            {/* 2. メインコンテンツ */}
            <main className="animate-in fade-in duration-500">
                {viewMode === 'grid' ? (
                    /* グリッド表示：画像が主役 */
                    <div className="grid grid-cols-3 gap-0.5 bg-gray-100">
                        {ITEMS.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className="aspect-square bg-white flex items-center justify-center p-4 active:opacity-60 transition-opacity cursor-pointer overflow-hidden"
                            >
                                <img src={item.imagePath} alt={item.name} className="w-full h-full object-contain" />
                            </div>
                        ))}
                    </div>
                ) : (
                    /* リスト表示：すべての情報を縦に並べる */
                    <div className="p-4 space-y-4">
                        {ITEMS.map((item) => (
                            <div key={item.id} className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm space-y-4">
                                <div className="flex gap-4 items-start">
                                    <div className="w-20 h-20 bg-gray-50 rounded-2xl flex items-center justify-center shrink-0">
                                        <img src={item.imagePath} alt={item.name} className="w-14 h-14 object-contain" />
                                    </div>
                                    <div className="flex-1 min-w-0 text-black">
                                        <h3 className="font-bold text-lg leading-tight mb-1 truncate">{item.name}</h3>
                                        <div className="space-y-1">
                                            <p className="flex items-center gap-1.5 text-[10px] font-medium text-gray-400">
                                                <MapPin size={10} /> {item.locationName}
                                            </p>
                                            <p className="text-[10px] font-mono text-gray-300 ml-3.5">
                                                {item.coords}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2 border-t border-gray-50 pt-3 text-black">
                                    <p className="text-[11px] leading-relaxed font-medium">
                                        {item.description}
                                    </p>
                                    <p className="text-[9px] font-bold text-gray-200 uppercase tracking-widest flex items-center gap-1">
                                        <Calendar size={10} /> {item.collectedAt}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* 3. 詳細ポップアップ (Grid表示からの遷移用) */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 backdrop-blur-sm p-4 animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-md rounded-[2.5rem] p-8 pb-12 relative animate-in slide-in-from-bottom duration-500">
                        <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 p-2 bg-gray-50 rounded-full text-gray-400 active:scale-90 transition-transform">
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center space-y-6 text-black">
                            <div className="w-32 h-32 bg-gray-50 rounded-3xl flex items-center justify-center">
                                <img src={selectedItem.imagePath} alt={selectedItem.name} className="w-24 h-24 object-contain" />
                            </div>

                            <div className="space-y-1">
                                <h2 className="text-2xl font-bold tracking-tight">{selectedItem.name}</h2>
                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center justify-center gap-1">
                                    <MapPin size={12} /> {selectedItem.locationName}
                                </p>
                                <p className="text-[10px] font-mono text-gray-300">{selectedItem.coords}</p>
                            </div>

                            <p className="text-sm font-medium leading-relaxed px-4 text-gray-600">
                                {selectedItem.description}
                            </p>

                            <div className="pt-4 border-t border-gray-50 w-full">
                                <p className="text-[10px] font-bold text-gray-200 uppercase tracking-tighter italic">Collected on {selectedItem.collectedAt}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}