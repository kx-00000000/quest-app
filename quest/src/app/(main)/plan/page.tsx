"use client";

import { useEffect, useState } from "react";
import { getPlans, deletePlan } from "@/lib/storage";
import { Trash2, Play, Footprints } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const LazyMap = dynamic<any>(() => import("@/components/Map/LazyMap").then(mod => mod.default), { ssr: false });

export default function PlanPage() {
    const router = useRouter();
    const [plans, setPlans] = useState<any[]>([]);

    useEffect(() => {
        const allPlans = getPlans().filter(p => !p.isArchived);
        setPlans(allPlans);
    }, []);

    const getStatusLabel = (status: string, items: any[]) => {
        if (status === 'completed') return "完了";
        if ((items || []).some(i => i.isCollected)) return "冒険中";
        return "準備中";
    };

    return (
        <div className="min-h-screen bg-white text-black font-sans pb-32">
            <header className="p-8 pt-16 border-b border-gray-100 text-left">
                <h1 className="text-2xl font-bold tracking-tighter uppercase mb-2">Quest Control</h1>
                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.3em]">ミッション管理</p>
            </header>

            <main className="p-4 space-y-6">
                {plans.length > 0 ? (plans.map((plan) => (
                    <div key={plan.id} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm p-6 relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2 bg-[#F37343]/5 px-3 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 bg-[#F37343] rounded-full animate-pulse" />
                                <span className="text-[9px] font-black text-[#F37343] uppercase tracking-widest">{getStatusLabel(plan.status, plan.items)}</span>
                            </div>
                            <button onClick={() => { deletePlan(plan.id); setPlans(plans.filter(p => p.id !== plan.id)); }} className="text-gray-200"><Trash2 size={18} /></button>
                        </div>
                        <h3 className="text-xl font-black uppercase mb-4 truncate text-left">{plan.name}</h3>
                        <div className="h-48 relative rounded-2xl overflow-hidden border border-gray-100 mb-6 bg-gray-50">
                            <LazyMap items={plan.items} center={plan.center} isLogMode={false} isFinalOverview={true} themeColor="#F37343" />
                        </div>
                        <div className="space-y-1 mb-6">
                            {(plan.items || []).map((item: any, idx: number) => (
                                <div key={item.id} className="flex items-baseline gap-2 text-[10px] font-bold text-gray-400 text-left">
                                    <span className={item.isCollected ? "text-[#F37343]" : ""}>#{idx + 1}</span>
                                    <span className={`truncate ${item.isCollected ? "text-gray-900" : ""}`}>{item.addressName || "Waypoint"}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex gap-6 text-left">
                                <div><p className="text-[8px] font-bold text-gray-400 uppercase">Waypoints</p><p className="font-black text-sm">{plan.items?.length || 0}</p></div>
                                <div><p className="text-[8px] font-bold text-gray-400 uppercase">Range</p><p className="font-black text-sm">{plan.radius} km</p></div>
                            </div>
                            <button onClick={() => router.push(`/adventure/${plan.id}`)} className="px-6 py-4 bg-gray-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-lg"><Play size={12} fill="currentColor" />START</button>
                        </div>
                    </div>
                ))) : (
                    <div className="text-center py-24 border-2 border-dashed border-gray-50 rounded-[3rem]">
                        <Footprints size={48} className="text-gray-100 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No Quests</p>
                    </div>
                )}
            </main>
        </div>
    );
}