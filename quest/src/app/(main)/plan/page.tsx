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

    if (!mounted) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-pink-500" /></div>;

    if (plans.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-screen p-10 text-center text-gray-400">
                <MapPin size={48} className="mb-4 opacity-20" />
                <p className="font-black uppercase tracking-widest text-xs">No active plans</p>
            </div>
        );
    }

    return (
        <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
            {/* 固定ヘッダー */}
            <header className="p-6 pt-10 bg-white">
                <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase leading-none">Plans</h1>
            </header>

            {/* スクロール可能エリア */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 pb-32">
                {plans.map((plan) => (
                    <div key={plan.id} className="bg-white rounded-[2.5rem] shadow-xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4">

                        {/* ミニ地図（数字マーカーあり、円なし） */}
                        <div className="h-52 relative border-b border-gray-50">
                            <LazyMap
                                userLocation={plan.center}
                                radiusInKm={plan.radius}
                                items={plan.items}
                                isLogMode={true}
                                themeColor="#F06292"
                            />
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black text-gray-900 uppercase tracking-tighter italic">{plan.name}</h2>
                                    <div className="flex items-center gap-3 text-gray-400">
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
                                <button onClick={() => handleDelete(plan.id)} className="p-3 text-gray-300 hover:text-red-500 transition-colors">
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            {/* ターゲットリスト（白背景・LOGのUIを参考） */}
                            <div className="space-y-2">
                                {plan.items?.map((item: any, idx: number) => (
                                    <div key={item.id || idx} className="flex items-center gap-4 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                                        <div className="w-8 h-8 bg-pink-500 rounded-lg flex items-center justify-center text-white font-black text-xs italic">
                                            0{idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-black text-gray-800 uppercase truncate">
                                                {item.locationName || "Location Locked"}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-sm shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-widest">
                                <Play size={14} fill="currentColor" />
                                冒険を始める
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}