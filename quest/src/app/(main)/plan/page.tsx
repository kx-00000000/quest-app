"use client";

import { useEffect, useState } from "react";
import { getPlans, deletePlan } from "@/lib/storage";
import { ChevronRight, Trash2, MapPin, Play, Calendar, Target, Footprints } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// --- ★ ここで LazyMap が受け取る Props の型を定義します ---
interface LazyMapProps {
    items?: any[];
    center?: { lat: number; lng: number };
    userLocation?: { lat: number; lng: number } | null;
    radiusInKm?: number;
    themeColor?: string;
    isLogMode?: boolean;
    isBriefingActive?: boolean;
    isFinalOverview?: boolean;
    planId?: string | null;
    onBriefingStateChange?: (state: boolean) => void;
    onBriefingComplete?: () => void;
}

// --- ★ dynamic インポートに型を適用して、TypeScriptにプロパティを認識させます ---
const LazyMap = dynamic<LazyMapProps>(
    () => import("@/components/Map/LazyMap").then((mod) => mod.default),
    {
        ssr: false,
        loading: () => <div className="h-64 w-full bg-gray-50 animate-pulse flex items-center justify-center text-[10px] font-bold text-gray-300">PREPARING NAVIGATION DATA...</div>
    }
);

export default function PlanPage() {
    const router = useRouter();
    const [plans, setPlans] = useState<any[]>([]);

    useEffect(() => {
        // 保存されているプランを取得
        const allPlans = getPlans();
        // 完了していない（まだ冒険中の）プランを抽出
        const activePlans = allPlans.filter(p => !(p.items || []).every((i: any) => i.isCollected));
        setPlans(activePlans);
    }, []);

    const handleDelete = (id: string) => {
        if (confirm("このクエストを破棄しますか？")) {
            deletePlan(id);
            setPlans(plans.filter(p => p.id !== id));
        }
    };

    return (
        <div className="min-h-screen bg-white text-black font-sans pb-32">
            <header className="p-8 pt-16 border-b border-gray-100">
                <h1 className="text-2xl font-bold tracking-tighter uppercase mb-2">Active Quests</h1>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">待機中のフライト・ミッション</p>
            </header>

            <main className="p-4 space-y-6">
                {plans.length > 0 ? (
                    plans.map((plan) => (
                        <div key={plan.id} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm">
                            {/* カードヘッダー */}
                            <div className="p-6 pb-4">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2 bg-pink-50 px-3 py-1 rounded-full">
                                        <div className="w-1.5 h-1.5 bg-pink-500 rounded-full animate-pulse" />
                                        <span className="text-[9px] font-black text-pink-600 uppercase tracking-widest">Ready to Fly</span>
                                    </div>
                                    <button onClick={() => handleDelete(plan.id)} className="text-gray-200 hover:text-red-400 transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                                <h3 className="text-xl font-black text-gray-900 uppercase tracking-tight leading-none mb-1">{plan.name}</h3>
                                <p className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{plan.createdAt}</p>
                            </div>

                            {/* ★ Google Maps セクション：型エラーを修正済み */}
                            <div className="h-64 relative w-full border-y border-gray-100 bg-gray-50">

                                <LazyMap
                                    userLocation={plan.center}
                                    items={plan.items}
                                    isLogMode={true}
                                    themeColor="#E6672E"
                                />
                                <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_60px_rgba(0,0,0,0.03)]" />
                            </div>

                            {/* 下部アクション */}
                            <div className="p-6 flex items-center justify-between">
                                <div className="flex gap-6">
                                    <div>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase mb-0.5">Waypoints</p>
                                        <p className="text-sm font-black">{plan.items?.length || 0}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase mb-0.5">Radius</p>
                                        <p className="text-sm font-black">{plan.radius} km</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push(`/quest?id=${plan.id}`)}
                                    className="px-6 py-3 bg-gray-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all shadow-lg"
                                >
                                    <Play size={12} fill="currentColor" />
                                    Go to Mission
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-24 border-2 border-dashed border-gray-50 rounded-[3rem]">
                        <Footprints size={48} className="text-gray-100 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No Pending Quests</p>
                        <button
                            onClick={() => router.push("/new")}
                            className="mt-6 text-pink-500 font-black text-[11px] uppercase underline underline-offset-8"
                        >
                            Create New Plan
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}