"use client";

import { useState } from "react";
import { Grid, LayoutList, X, MapPin, Calendar } from "lucide-react";

// --- モックデータ ---
const ITEMS = Array.from({ length: 15 }, (_, i) => ({
    id: `item_${i}`,
    name: i % 2 === 0 ? "Malibu California" : "Fuji Exploration",
    locationName: i % 2 === 0 ? "Malibu Beach" : "Mount Fuji Base",
    coords: i % 2 === 0 ? "34.0259° N, 118.7798° W" : "35.3606° N, 138.7274° E",
    collectedAt: "2026.02.12",
    description: "その土地の空気感を閉じ込めた特別なステッカー。旅の記憶が色鮮やかに蘇る。",
    // テスト用にステッカー例の画像パスを指定（実際の名前に合わせてください）
    imagePath: i % 2 === 0 ? "/images/items/sticker-ex1.png" : "/images/items/sticker-ex2.png",
    // ★ 傾きをランダムに持たせるためのプロパティ（-6度から6度）
    rotation: Math.floor(Math.random() * 12) - 6
}));

export default function ItemPage() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedItem, setSelectedItem] = useState<any>(null);

    return (
        <div className="min-h-screen bg-white font-sans pb-32">
            {/* ヘッダー */}
            <header className="p-8 pt-16 border-b border-gray-100 flex justify-between items-end">
                <div>
                    <h1 className="text-2xl font-bold tracking-tighter uppercase text-black">Collection</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Sticker Vault</p>
                </div>
                <div className="flex bg-gray-50 rounded-xl p-1">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-black' : 'text-gray-300'}`}>
                        <Grid size={18} />
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-black' : 'text-gray-300'}`}>
                        <LayoutList size={18} />
                    </button>
                </div>
            </header>

            {/* メインリスト */}
            <main className="p-4">
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-3 gap-6 pt-4">
                        {ITEMS.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className="aspect-square relative flex items-center justify-center cursor-pointer group"
                            >
                                {/* ステッカーのベース */}
                                <div
                                    className="w-full h-full p-2 transition-transform duration-300 group-hover:scale-110 group-active:scale-95"
                                    style={{ transform: `rotate(${item.rotation}deg)` }}
                                >
                                    <img
                                        src={item.imagePath}
                                        alt={item.name}
                                        /* ★ drop-shadow を適用してステッカーの厚みを表現 */
                                        className="w-full h-full object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)] filter"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* リスト表示（既存の洗練されたリスト） */
                    <div className="space-y-4">
                        {ITEMS.map((item) => (
                            <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 flex gap-6 items-center shadow-sm">
                                <div className="w-20 h-20 shrink-0" style={{ transform: `rotate(${item.rotation}deg)` }}>
                                    <img src={item.imagePath} alt={item.name} className="w-full h-full object-contain drop-shadow-md" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-black uppercase">{item.name}</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.locationName}</p>
                                    <p className="text-[10px] font-mono text-gray-300 mt-1">{item.coords}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* 詳細ポップアップ（ここもステッカーが主役） */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-md p-6 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 relative shadow-2xl animate-in zoom-in-95 duration-300">
                        <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 p-2 text-gray-300 hover:text-black transition-colors">
                            <X size={24} />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-48 h-48 mb-8" style={{ transform: `rotate(${selectedItem.rotation}deg)` }}>
                                <img
                                    src={selectedItem.imagePath}
                                    alt={selectedItem.name}
                                    className="w-full h-full object-contain drop-shadow-[0_10px_20px_rgba(0,0,0,0.2)]"
                                />
                            </div>

                            <h2 className="text-2xl font-bold text-black uppercase mb-2 tracking-tighter">{selectedItem.name}</h2>
                            <div className="flex items-center gap-2 text-gray-400 mb-6 font-bold uppercase text-[10px] tracking-widest">
                                <MapPin size={12} /> {selectedItem.locationName}
                            </div>

                            <div className="w-full bg-gray-50 rounded-3xl p-6 text-left space-y-4">
                                <p className="text-sm font-medium text-gray-600 leading-relaxed italic">
                                    "{selectedItem.description}"
                                </p>
                                <div className="pt-4 border-t border-gray-100 flex justify-between items-end">
                                    <div className="font-mono text-[9px] text-gray-300 leading-tight">
                                        GPS_REF: {selectedItem.coords}
                                    </div>
                                    <div className="flex items-center gap-1 text-[9px] font-black text-gray-200 uppercase tracking-tighter">
                                        <Calendar size={10} /> {selectedItem.collectedAt}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}