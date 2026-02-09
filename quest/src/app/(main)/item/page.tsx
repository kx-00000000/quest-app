"use client";

import { useTranslation } from "react-i18next";
import { Plane, Package, Award, Sparkles, ChevronRight } from "lucide-react";

export default function ItemPage() {
    const { t } = useTranslation();

    // Mock data (実際のデータ連携は getPlans から取得するよう後で拡張可能です)
    const totalItems = 147;

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 pb-24 font-sans">
            {/* 上部余白：他ページと統一 */}
            <div className="pt-8" />

            {/* Header: PLAN/LOGと同様の力強いタイトル */}
            <div className="flex justify-between items-center mb-8 px-2">
                <h1 className="text-3xl font-black text-gray-800 uppercase tracking-tighter">
                    {t("tab_item")} <span className="text-pink-500">Vault</span>
                </h1>
                <div className="w-12 h-12 bg-white shadow-sm rounded-2xl flex items-center justify-center border border-gray-100">
                    <Award className="text-pink-500" size={24} />
                </div>
            </div>

            {/* Featured Item Card: プレミアムなメイン表示 */}
            <div className="bg-white/70 backdrop-blur-xl rounded-[3rem] p-8 shadow-xl border border-white/60 flex flex-col items-center justify-center mb-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-10">
                    <Sparkles size={120} className="text-pink-500" />
                </div>

                <div className="w-32 h-32 bg-pink-50 rounded-[2.5rem] flex items-center justify-center text-pink-500 mb-6 shadow-inner border border-pink-100">
                    <Plane size={64} />
                </div>

                <div className="text-center">
                    <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] mb-2">Featured Discovery</p>
                    <h2 className="text-2xl font-black text-gray-800 leading-tight mb-1">Paper Plane</h2>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Common Collection</p>
                </div>
            </div>

            {/* Statistics Grid: PLAN/LOGの数値ボックスを完全再現 */}
            <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="bg-black/5 rounded-[2rem] p-5">
                    <div className="text-[9px] font-black text-pink-600 uppercase tracking-widest mb-1">Paper Planes</div>
                    <div className="text-2xl font-black text-gray-800">147</div>
                </div>
                <div className="bg-black/5 rounded-[2rem] p-5">
                    <div className="text-[9px] font-black text-pink-600 uppercase tracking-widest mb-1">Special</div>
                    <div className="text-2xl font-black text-gray-800">0</div>
                    <div className="text-[9px] text-orange-500 font-black mt-1 uppercase tracking-tighter italic">Coming Soon</div>
                </div>
            </div>

            {/* Total Footer: 全体の合計を表示 */}
            <div className="bg-gray-900 rounded-[2rem] p-6 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                        <Package size={20} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Total Collection</p>
                        <p className="text-sm font-black text-white uppercase tracking-tight">Across all missions</p>
                    </div>
                </div>
                <div className="text-3xl font-black text-white italic tracking-tighter">
                    {totalItems}
                </div>
            </div>
        </div>
    );
}