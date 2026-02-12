"use client";

import { useState, useMemo } from "react";
import { Grid, LayoutList, X, MapPin, Calendar } from "lucide-react";

// --- モックデータ生成 ---
const STICKER_FILES = [
    "/images/items/sticker-ex1.png",
    "/images/items/sticker-ex2.png",
    "/images/items/sticker-ex3.png",
    "/images/items/sticker-ex4.png"
];

const ITEMS = Array.from({ length: 18 }, (_, i) => ({
    id: `item_${i}`,
    name: [
        "Malibu California",
        "Fuji Exploration",
        "Wild Australia",
        "Sydney Opera House"
    ][i % 4],
    locationName: [
        "Malibu Beach",
        "Mount Fuji Base",
        "Outback Trail",
        "Sydney Harbour"
    ][i % 4],
    coords: [
        "34.0259° N, 118.7798° W",
        "35.3606° N, 138.7274° E",
        "25.3444° S, 131.0369° E",
        "33.8568° S, 151.2153° E"
    ][i % 4],
    collectedAt: "2026.02.12",
    description: "旅の記憶を鮮やかに彩るステッカー。手に入れた時の空気感まで思い出させてくれる。",
    imagePath: STICKER_FILES[i % 4],
    // ★ 乱雑さを出すためのパラメータ
    rotation: Math.floor(Math.random() * 40) - 20, // -20度 ~ 20度の広い回転幅
    offsetX: Math.floor(Math.random() * 30) - 15, // 左右に最大15pxずらす
    offsetY: Math.floor(Math.random() * 30) - 15  // 上下に最大15pxずらす
}));

export default function ItemPage() {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedItem, setSelectedItem] = useState<any>(null);

    return (
        <div className="min-h-screen bg-white font-sans pb-32">
            {/* ヘッダー */}
            <header className="p-8 pt-16 border-b border-gray-100 flex justify-between items-end bg-white/80 backdrop-blur-md sticky top-0 z-30">
                <div>
                    <h1 className="text-2xl font-bold tracking-tighter uppercase text-black">Collection</h1>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 text-black opacity-50">Sticker Vault</p>
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
                    /* --- 自由な配置のグリッド表示 --- */
                    <div className="grid grid-cols-3 gap-8 pt-6">
                        {ITEMS.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => setSelectedItem(item)}
                                className="aspect-square relative flex items-center justify-center cursor-pointer group"
                            >
                                {/* ステッカー本体：位置と角度を大きくずらす */}
                                <div
                                    className="w-full h-full p-1 transition-all duration-300 group-hover:scale-110 group-active:scale-95 group-hover:z-10"
                                    style={{
                                        transform: `rotate(${item.rotation}deg) translate(${item.offsetX}px, ${item.offsetY}px)`
                                    }}
                                >
                                    <img
                                        src={item.imagePath}
                                        alt={item.name}
                                        className="w-full h-full object-contain drop-shadow-[0_6px_8px_rgba(0,0,0,0.18)]"
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
                                <div className="w-20 h-20 shrink-0" style={{ transform: `rotate(${item.rotation * 0.5}deg)` }}>
                                    <img src={item.imagePath} alt={item.name} className="w-full h-full object-contain drop-shadow-md" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-bold text-black uppercase tracking-tight">{item.name}</h3>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{item.locationName}</p>
                                    <p className="text-[10px] font-mono text-gray-300 mt-1">{item.coords}</p>
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
                            {/* モーダル内でも少し傾けることで「貼ってある感」を維持 */}
                            <div className="w-48 h-48 mb-8" style={{ transform: `rotate(${selectedItem.rotation * 0.3}deg)` }}>
                                <img
                                    src={selectedItem.imagePath}
                                    alt={selectedItem.name}
                                    className="w-full h-full object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.2)]"
                                />
                            </div>

                            <h2 className="text-2xl font-bold text-black uppercase mb-1 tracking-tighter leading-none">{selectedItem.name}</h2>
                            <div className="flex items-center gap-2 text-gray-400 mb-6 font-bold uppercase text-[10px] tracking-widest text-black opacity-40">
                                <MapPin size={12} /> {selectedItem.locationName}
                            </div>

                            <div className="w-full bg-gray-50 rounded-[2rem] p-6 text-left space-y-4">
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