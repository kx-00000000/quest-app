"use client";

import { useEffect, useState } from "react";
import { getPlans, deletePlan } from "@/lib/storage";
import LazyMap from "@/components/Map/LazyMap";
import { Calendar, Target, Trash2, Play, MapPin, Loader2 } from "lucide-react";

export default function PlanPage() {
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

    if (!mounted) return <div className="flex h-screen items-center justify-center bg-white"><Loader2 className="animate-spin text-pink-500" /></div>;

    if (plans.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-10 text-center text-gray-300">
                <MapPin size={48} className="mb-4 opacity-10" />
                <p className="font-black uppercase tracking-[0.3em] text-[10px]">No active intelligence</p>
            </div>
        );
    }

    return (
        <div className="h-screen bg-white flex flex-col overflow-hidden">
            <header className="p-6 pt-10">
                <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase leading-none">Plans</h1>
            </header>

            <div className="flex-1 overflow-y-auto p-6 space-y-12 pb-32">
                {plans.map((plan) => (
                    <div key={plan.id} className="space-y-6">
                        {/* 1. タイトル情報 */}
                        <div className="flex justify-between items-start">
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
                            <button onClick={() => handleDelete(plan.id)} className="p-2 text-gray-200 hover:text-red-500 transition-colors">
                                <Trash2 size={22} />
                            </button>
                        </div>

                        {/* 2. 地図（AutoFit機能で全地点を表示） */}
                        <div className="h-56 relative rounded-[2rem] overflow-hidden border border-gray-100 shadow-lg">
                            <LazyMap
                                userLocation={plan.center}
                                items={plan.items}
                                isLogMode={true}
                                themeColor="#F06292"
                            />
                        </div>

                        {/* 3. 目的地リスト（白背景、地名表示） */}
                        <div className="space-y-2">
                            {plan.items?.map((item: any, idx: number) => (
                                <div key={item.id || idx} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-gray-50 shadow-sm">
                                    <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center text-white font-black text-xs italic shadow-lg shadow-pink-500/20">
                                        0{idx + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-black text-gray-800 uppercase truncate">
                                            {item.locationName || "Area Reconnaissance"}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 4. アクションボタン */}
                        <button
                            className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em]"
                            onClick={() => alert("Mission Start Logic Coming Soon...")}
                        >
                            <Play size={14} fill="currentColor" />
                            冒険を始める
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}