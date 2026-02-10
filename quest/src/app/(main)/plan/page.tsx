"use client";

import { useEffect, useState } from "react";
import { getPlans, deletePlan } from "@/lib/storage";
import LazyMap from "@/components/Map/LazyMap";
import { Calendar, Target, Trash2, Play, MapPin, Loader2, ChevronRight } from "lucide-react";

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
            <header className="p-6 pt-10 border-b border-gray-100 bg-white z-20">
                <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase leading-none">Plans</h1>
            </header>

            <div className="flex-1 overflow-y-auto bg-gray-50 pb-32">
                {plans.map((plan) => (
                    <div key={plan.id} className="bg-white border-b-[8px] border-gray-100 animate-in fade-in duration-500">

                        {/* 1. ヘッダーエリア（地図の上） */}
                        <div className="p-6 pb-4 flex justify-between items-start">
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

                        {/* 2. 地図：ベベル（角丸）なし、エッジ・トゥ・エッジ形式 */}
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

                        {/* 3. ターゲットリスト：枠なし、地名のみの洗練されたリスト */}
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
                            <button className="w-full py-5 bg-gray-900 text-white rounded-[1.5rem] font-black text-xs shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 uppercase tracking-[0.2em] border-b-4 border-black/20">
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