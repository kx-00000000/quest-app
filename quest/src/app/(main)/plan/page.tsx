"use client";

import { useEffect, useState } from "react";
import { getPlans } from "@/lib/storage";
import LazyMap from "@/components/Map/LazyMap";
import {
    Target,
    Navigation,
    Calendar,
    Layers,
    ChevronRight,
    CircleDot,
    Play // ★ここに追加しました
} from "lucide-react";
import Link from "next/link";

export default function PlanPage() {
    const [plans, setPlans] = useState<any[]>([]);

    useEffect(() => {
        // クライアントサイドでのみ実行
        setPlans(getPlans());
    }, []);

    if (plans.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-10 text-center space-y-6 bg-white">
                <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                    <Layers size={48} />
                </div>
                <div className="space-y-2">
                    <p className="text-gray-900 font-black uppercase tracking-tighter text-xl italic">No Active Intelligence</p>
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Create a new quest to begin reconnaissance</p>
                </div>
                <Link href="/new" className="px-8 py-3 bg-gray-900 text-white rounded-full font-black text-xs uppercase tracking-widest active:scale-95 transition-all">
                    Generate Mission
                </Link>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-8 pb-32 bg-white min-h-screen">
            {/* ヘッダー：ログと共通のスタイル */}
            <header className="space-y-1">
                <div className="flex items-center gap-2">
                    <CircleDot size={14} className="text-pink-500 animate-pulse" />
                    <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em]">Operational Status: Active</p>
                </div>
                <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase leading-none">Plans</h1>
            </header>

            <div className="space-y-6">
                {plans.map((plan) => (
                    <div key={plan.id} className="bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">

                        {/* 1. ミニ地図セクション */}
                        <div className="h-56 relative border-b border-gray-50">
                            <LazyMap
                                userLocation={plan.center}
                                radiusInKm={plan.radius}
                                items={plan.items}
                                isLogMode={true}
                                themeColor="#F06292"
                            />
                            {/* オーバーレイタグ */}
                            <div className="absolute top-4 left-4 z-10 bg-gray-900/90 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                                <span className="text-[9px] font-black text-white uppercase tracking-widest italic">{plan.radius}km Range</span>
                            </div>
                        </div>

                        {/* 2. ミッション詳細エリア */}
                        <div className="p-6 space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter leading-none italic">{plan.name}</h2>
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center gap-1 text-gray-400">
                                            <Calendar size={12} />
                                            <span className="text-[10px] font-bold uppercase">{plan.createdAt}</span>
                                        </div>
                                        <div className="flex items-center gap-1 text-gray-400">
                                            <Target size={12} />
                                            <span className="text-[10px] font-bold uppercase">{plan.itemCount} Targets</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* 3. ターゲットリスト：ログの『詳細』と共通の黒背景UI */}
                            <div className="bg-gray-900 rounded-[2rem] p-5 space-y-3 shadow-2xl">
                                <div className="flex items-center justify-between mb-2 border-b border-white/5 pb-2">
                                    <div className="flex items-center gap-2">
                                        <Navigation size={14} className="text-pink-500" />
                                        <span className="text-[9px] font-black text-white uppercase tracking-widest italic">Mission Intelligence</span>
                                    </div>
                                    <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Confidential</span>
                                </div>

                                <div className="space-y-2">
                                    {plan.items.map((item: any, idx: number) => (
                                        <div key={item.id} className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5 group active:bg-white/10 transition-all">
                                            <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center text-white font-black text-xs italic shadow-[0_0_15px_rgba(240,98,146,0.3)]">
                                                0{idx + 1}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-[11px] font-black text-white uppercase truncate tracking-tight">
                                                    {item.locationName || "Locating..."}
                                                </p>
                                                <div className="flex gap-2 text-[8px] font-bold text-gray-500 tracking-tighter uppercase">
                                                    <span>Lat: {item.lat.toFixed(3)}</span>
                                                    <span>Lng: {item.lng.toFixed(3)}</span>
                                                </div>
                                            </div>
                                            <ChevronRight size={14} className="text-gray-700 group-active:text-pink-500 transition-colors" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 4. アクションボタン */}
                            <button className="w-full py-5 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-[1.5rem] font-black text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-[0.2em] border-b-4 border-black/20">
                                <Play size={14} fill="currentColor" />
                                Deploy to Mission
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}