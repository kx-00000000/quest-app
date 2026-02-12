"use client";

import { useState } from "react";
import { Grid, LayoutList, X, MapPin, Calendar } from "lucide-react";

// --- モックデータ生成 ---
const STICKER_FILES = [
    "/images/items/sticker-ex1.png",
    "/images/items/sticker-ex2.png",
    "/images/items/sticker-ex3.png",
    "/images/items/sticker-ex4.png"
];

const ITEMS = Array.from({ length: 24 }, (_, i) => ({
    id: `item_${i}`,
    name: ["Malibu", "Fuji", "Australia", "Sydney"][i % 4],
    locationName: ["Beach", "Mountain", "Outback", "Harbour"][i % 4],
    coords: "34.0259° N, 118.7798° W",
    collectedAt: "2026.02.12",
    description: "旅の記憶を鮮やかに彩るステッカー。手に入れた時の空気感まで思い出させてくれる。",
    imagePath: STICKER_FILES[i % 4],
    // ★ 乱雑さと「詰まった感」を出すためのパラメータ
    rotation: Math.floor(Math.random() * 30) - 15, // -15度 ~ 15度
    // 少しだけサイズにバラつきを持たせる (80px ~ 110px)
    size: Math.floor(Math.random() * 30) + 80,
    // 上下左右に少しだけ食い込むためのマイナスマージン
    mt: Math.floor(Math.random() * -10),
    ml: Math.floor(Math.random() * -10)
}));

export default function ItemPage() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedItem, setSelectedItem] = useState<any>(null);

    return (
        <div className="min-h-screen bg-white font-sans pb-32">
            {/* ヘッダー */}
            <header className="p-8 pt-16 border-b border-gray-100 flex justify-between items-end bg-white/90 backdrop-blur-md sticky top-0 z-30">
                <div>
                    <h1 className="text-2xl font-bold tracking-tighter uppercase text-black">Collection</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 opacity-50">Sticker Vault</p>
                </div>
                <div className="flex bg-gray-100 rounded-xl p-1">
                    <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-black' : 'text-gray-300'}`}>
                        <Grid size={18} />
                    </button>
                    <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-black' : 'text-gray-300'}`}>
                        <LayoutList size={18} />
                    </button>
                </div>
            </header>

            {/* メインリスト */}
            <main className="p-6">
                {viewMode === 'grid' ? (
                    /* --- 左上から詰めて貼るスクラップブック風表示 --- */
                    <div className="flex flex-wrap gap-4 justify-start items-start">
                        {ITEMS.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className="relative cursor-pointer group"
                                style={{
                                    width: `${item.size}px`,
                                    height: `${item.size}px`,
                                    marginTop: `${item.mt}px`,
                                    marginLeft: `${item.ml}px`
                                }}
                            >
                                <div
                                    className="w-full h-full transition-all duration-300 group-hover:scale-110 group-hover:z-10 group-active:scale-95"
                                    style={{ transform: `rotate(${item.rotation}deg)` }}
                                >
                                    <img
                                        src={item.imagePath}
                                        alt={item.name}
                                        className="w-full h-full object-contain drop-shadow-[0_4px_6px_rgba(0,0,0,0.15)]"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* --- 整理されたリスト表示 --- */
                    <div className="space-y-4">
                        {ITEMS.map((item) => (
                            <div key={item.id} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 flex gap-6 items-center shadow-sm">
                                <div className="w-16 h-16 shrink-0" style={{ transform: `rotate(${item.rotation * 0.4}deg)` }}>
                                    <img src={item.imagePath} alt={item.name} className="w-full h-full object-contain drop-shadow-md" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="font-bold text-black uppercase tracking-tight truncate">{item.name}</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.locationName}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* 詳細ポップアップ */}
            {selectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/10 backdrop-blur-md p-6 animate-in fade-in">
                    <div className="bg-white w-full max-w-sm rounded-[3rem] p-8 relative shadow-2xl animate-in zoom-in-95 duration-300">
                        <button onClick={() => setSelectedItem(null)} className="absolute top-6 right-6 p-2 text-gray-300 hover:text-black transition-colors">
                            <X size={24} />
                        </button>

                        <div className="flex flex-col items-center text-center">
                            <div className="w-48 h-48 mb-8" style={{ transform: `rotate(${selectedItem.rotation * 0.3}deg)` }}>
                                <img
                                    src={selectedItem.imagePath}
                                    alt={selectedItem.name}
                                    className="w-full h-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.2)]"
                                />
                            </div>
                            <h2 className="text-2xl font-bold text-black uppercase mb-1 tracking-tighter">{selectedItem.name}</h2>
                            <div className="text-gray-400 mb-6 font-bold uppercase text-[10px] tracking-widest opacity-40">
                                <MapPin size={12} className="inline mr-1" /> {selectedItem.locationName}
                            </div>
                            <div className="w-full bg-gray-50 rounded-[2rem] p-6 text-left">
                                <p className="text-sm font-medium text-gray-600 leading-relaxed italic mb-4">"{selectedItem.description}"</p>
                                <div className="pt-4 border-t border-gray-100 flex justify-between items-center font-mono text-[9px] text-gray-300">
                                    <span>{selectedItem.collectedAt}</span>
                                    <span>{selectedItem.coords}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}