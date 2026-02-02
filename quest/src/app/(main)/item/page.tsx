"use client";

import { useTranslation } from "react-i18next";
import { Plane } from "lucide-react";

export default function ItemPage() {
    const { t } = useTranslation();

    // Mock items
    const totalItems = 147;
    const items = Array.from({ length: 12 }, (_, i) => ({
        id: i,
        type: "paper_plane",
        name: "Paper Plane"
    }));

    return (
        <div className="min-h-screen bg-quest-green-800 text-white p-6 pb-24">
            {/* Header */}
            <div className="flex justify-between items-end mb-8">
                <h1 className="text-2xl font-bold font-puffy flex items-center gap-2">
                    {/* Icon */}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>
                    {t("tab_item")}
                </h1>
                <div className="bg-white/20 px-4 py-1 rounded-full text-sm font-bold backdrop-blur-sm">
                    {t("items_collected_label")}: {totalItems}
                </div>
            </div>

            {/* Featured Item */}
            <div className="bg-white rounded-3xl p-8 flex flex-col items-center justify-center mb-6 shadow-lg relative overflow-hidden text-gray-800">
                <div className="w-32 h-32 border-4 border-quest-green-100 rounded-3xl flex items-center justify-center text-quest-green-500 mb-4 bg-quest-green-50">
                    <Plane size={64} />
                </div>
                <h2 className="text-xl font-bold font-puffy">Paper Plane</h2>
                <p className="text-gray-400 text-sm">Common Item</p>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-2 gap-4">
                {/* Item Statistics Card */}
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <div className="text-xs text-quest-green-200 mb-1">Paper Planes</div>
                    <div className="text-3xl font-black font-puffy">147</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                    <div className="text-xs text-quest-green-200 mb-1">Others</div>
                    <div className="text-3xl font-black font-puffy">0</div>
                    <div className="text-[10px] text-yellow-400 mt-1">Coming Soon!</div>
                </div>

                {/* Total Item Card */}
                <div className="col-span-2 bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/5 flex justify-between items-center">
                    <div className="text-sm font-bold text-quest-green-100">Total Collection</div>
                    <div className="text-2xl font-black font-puffy">{totalItems}</div>
                </div>
            </div>

        </div>
    );
}
