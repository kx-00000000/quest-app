"use client";

import { useTranslation } from "react-i18next";
import { Package, Grid, LayoutList } from "lucide-react";
import { useState } from "react";

export default function ItemPage() {
    const { t } = useTranslation();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

    // Mock data: 実際には収集したアイテムの履歴から生成します
    const items = Array.from({ length: 24 }, (_, i) => ({
        id: i,
        name: `Item #${i + 1}`,
        collectedAt: "2026.02.09"
    }));

    return (
        <div className="min-h-screen bg-white font-sans pb-32">
            {/* 1. View Switcher: ページ最上部に配置 */}
            <div className="flex border-b border-gray-100 bg-white sticky top-0 z-10">
                <button
                    onClick={() => setViewMode('grid')}
                    className={`flex-1 py-4 flex justify-center items-center border-b-2 transition-all ${viewMode === 'grid' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-300'}`}
                >
                    <Grid size={20} />
                </button>
                <button
                    onClick={() => setViewMode('list')}
                    className={`flex-1 py-4 flex justify-center items-center border-b-2 transition-all ${viewMode === 'list' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-300'}`}
                >
                    <LayoutList size={20} />
                </button>
            </div>

            {/* 2. Main Content */}
            <main>
                {viewMode === 'grid' ? (
                    /* 3カラムグリッド：アイコンを削除し、真っ白なタイルのみを表示 */
                    <div className="grid grid-cols-3 gap-0.5 bg-gray-100">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                className="aspect-square bg-white active:opacity-70 transition-opacity cursor-pointer"
                            >
                                {/* タイル内は現在空の状態です。将来的に画像を配置できます */}
                            </div>
                        ))}
                    </div>
                ) : (
                    /* リスト表示：飛行機アイコンをPackageアイコン（より汎用的）に変更し、シンプルに */
                    <div className="p-4 space-y-2">
                        {items.map((item) => (
                            <div key={item.id} className="bg-white p-5 rounded-2xl flex items-center gap-4 border border-gray-50 shadow-sm">
                                <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-300">
                                    <Package size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-gray-800">{item.name}</p>
                                    <p className="text-[10px] font-medium text-gray-400">{item.collectedAt}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
}