"use client";

import { useTranslation } from "react-i18next";
import { Plane, Award, Package, Grid, LayoutList } from "lucide-react";
import { useState } from "react";

export default function ItemPage() {
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Mock data: 実際には収集したアイテムの履歴から生成します
    const totalItems = 147;
    const items = Array.from({ length: 24 }, (_, i) => ({
        id: i,
        name: `Item #${i + 1}`,
        collectedAt: "2026.02.09"
    }));

    return (
        <div className="min-h-screen bg-gray-50/50 font-sans pb-32">
            {/* 1. Header Area: プロフィール風のサマリー */}
            <div className="bg-white border-b border-gray-100 pt-16 pb-8 px-8">
                <div className="flex items-center gap-6 mb-8">
                    {/* アイコン（プロフィール写真に相当） */}
                    <div className="w-20 h-20 bg-gradient-to-br from-[#F06292] to-[#FF8A65] rounded-[2.2rem] flex items-center justify-center text-white shadow-lg shadow-pink-100">
                        <Award size={36} />
                    </div>

                    {/* 統計情報 */}
                    <div className="flex-1 flex justify-around">
                        <div className="text-center">
                            <p className="text-lg font-black text-gray-800 leading-none">{totalItems}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-black text-gray-800 leading-none">12</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Types</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-black text-gray-800 leading-none">A+</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Rank</p>
                        </div>
                    </div>
                </div>

                <div className="px-2">
                    <h1 className="text-xl font-black text-gray-800 uppercase tracking-tight mb-1">Explorer Vault</h1>
                    <p className="text-xs font-bold text-gray-400 leading-relaxed max-w-[240px]">
                        世界の欠片を集めるあなたのパーソナル・コレクション。
                    </p>
                </div>
            </div>

            {/* 2. View Switcher: グリッドとリストの切り替えボタン（Instagram風） */}
            <div className="flex border-b border-gray-100 bg-white">
                <button
                    onClick={() => setViewMode('grid')}
                    className={`flex-1 py-3 flex justify-center items-center border-b-2 transition-all ${viewMode === 'grid' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-300'}`}
                >
                    <Grid size={20} />
                </button>
                <button
                    onClick={() => setViewMode('list')}
                    className={`flex-1 py-3 flex justify-center items-center border-b-2 transition-all ${viewMode === 'list' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-300'}`}
                >
                    <LayoutList size={20} />
                </button>
            </div>

            {/* 3. Main Content: 3カラムグリッド */}
            <main>
                {viewMode === 'grid' ? (
                    <div className="grid grid-cols-3 gap-0.5 bg-gray-100">
                        {items.map((item) => (
                            <div key={item.id} className="aspect-square bg-white flex items-center justify-center relative group active:opacity-70 transition-opacity">
                                <Plane size={32} className="text-pink-200 group-hover:text-pink-500 transition-colors" />
                                {/* バッジなどの情報を入れる場合 */}
                                <div className="absolute bottom-1 right-1">
                                    <div className="w-1.5 h-1.5 bg-pink-500 rounded-full" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-4 space-y-2">
                        {items.map((item) => (
                            <div key={item.id} className="bg-white p-4 rounded-2xl flex items-center gap-4 border border-gray-100">
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-pink-500">
                                    <Plane size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-black text-gray-800 uppercase">{item.name}</p>
                                    <p className="text-[10px] font-bold text-gray-400">{item.collectedAt}</p>
                                </div>
                                <Package size={16} className="text-gray-200" />
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}