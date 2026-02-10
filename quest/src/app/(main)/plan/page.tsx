"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlans, deletePlan } from "@/lib/storage";
import LazyMap from "@/components/Map/LazyMap";
import {
    Calendar,
    Target,
    Trash2,
    Play,
    MapPin,
    Loader2,
    ChevronRight,
    Circle
} from "lucide-react";

export default function PlanPage() {
    const router = useRouter();
    const [plans, setPlans] = useState<any[]>([]);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setPlans(getPlans());
    }, []);

    const handleDelete = (id: string) => {
        if (confirm("このプランを削除しますか？")) {
            deletePlan(id);
            setPlans(getPlans());
        }
    };

    // ステータス判定ロジック
    const getStatusInfo = (plan: any) => {
        const collected = plan.collectedCount || 0;
        const total = plan.itemCount || 0;

        if (collected === 0) return { label: "準備中", color: "bg-gray-100 text-gray-500" };
        if (collected < total) return { label: "冒険中", color: "bg-pink-50 text-pink-600 border border-pink-100" };
        return { label: "完了", color: "bg-emerald-50 text-emerald-600 border border-emerald-100" };
    };

    if (!mounted) return (
        <div className="flex h-screen items-center justify-center bg-white">
            <Loader2 className="animate-spin text-pink-500" />
        </div>
    );

    if (plans.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-10 text-center text-gray-300 bg-white">
                <MapPin size={48} className="mb-4 opacity-10" />
                <p className="font-black uppercase tracking-[0.3em] text-[10px]">No active intelligence</p>
            </div>
        );
    }

    return (
        <div className="h-screen bg-white flex flex-col overflow-hidden">
            {/* 固定ヘッダー */}
            <header className="p-6 pt-10 border-b border-gray-100 bg-white z-20">
                <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase leading-none">Plans</h1>
            </header>

            {/* スクロール可能エリア */}
            <div className="flex-1 overflow-y-auto bg-gray-50 pb-32 px-2 md:px-4">
                <div className="space-y-6 pt-6">
                    {plans.map((plan) => {
                        const status = getStatusInfo(plan);
                        return (
                            <div key={plan.id} className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden animate-in fade-in duration-500">

                                {/* 1. ヘッダーエリア */}
                                <div className="p-6 pb-4">
                                    <div className="flex justify-between items-start mb-4">
                                        {/* 動的ステータスタグ */}
                                        <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${status.color}`}>
                                            {status.label}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(plan.id)}
                                            className="p-2 text-gray-200 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 size={22} />
                                        </button>
                                    </div>

                                    <div className="space-y-1">
                                        <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic leading-none">{plan.name}</h2>
                                        <div className="flex items-center gap-3 text-gray-400 mt-2">
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                <span className="text-[10px] font-bold">{plan.createdAt}</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Target size={12} />
                                                <span className="text-[10px] font-bold">{plan.items?.length} Targets</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* 2. 地図：エッジ・トゥ・エッジ（カード内一杯）、角丸なし */}
                                <div className="h-64 relative w-full border-y border-gray-100 bg-gray-50">
                                    <LazyMap
                                        userLocation={plan.center}
                                        items={plan.items}
                                        isLogMode={true}
                                        themeColor="#F06292"
                                    />
                                    <div className="absolute top-4 left-4 z-10 bg-gray-900/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/20">
                                        <span className="text-[9px] font-black text-white uppercase italic tracking-widest">{plan.radius}km Range</span>
                                    </div>
                                </div>

                                {/* 3. ターゲットリスト */}
                                <div className="p-6 space-y-6">
                                    <div className="space-y-4">
                                        {plan.items?.map((item: any, idx: number) => (
                                            <div key={item.id || idx} className="flex items-center gap-4 transition-all">
                                                <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center text-white font-black text-xs italic shadow-lg shadow-pink-500/20">
                                                    0{idx + 1}
                                                </div>
                                                <div className="flex-1 min-w-0 border-b border-gray-50 pb-2">
                                                    <p className="text-sm font-black text-gray-800 uppercase truncate tracking-tight">
                                                        {item.locationName || "Area Reconnaissance"}
                                                    </p>
                                                </div>
                                                <ChevronRight size={14} className="text-gray-200" />
                                            </div>
                                        ))}
                                    </div>

                                    {/* 4. アクションボタン */}
                                    <button
                                        onClick={() => router.push(`/quest/${plan.id}`)}
                                        className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] border-b-4 border-black/20"
                                    >
                                        <Play size={14} fill="currentColor" />
                                        冒険を始める
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}