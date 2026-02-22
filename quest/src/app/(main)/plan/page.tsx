"use client";

import { useEffect, useState } from "react";
import { getPlans, deletePlan } from "@/lib/storage";
import { Trash2, Play, Footprints, MapPin } from "lucide-react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const LazyMap = dynamic<any>(() => import("@/components/Map/LazyMap").then(mod => mod.default), { ssr: false });

type TabType = "preparation" | "in_progress" | "complete";

export default function PlanPage() {
    const router = useRouter();
    const [plans, setPlans] = useState<any[]>([]);
    const [activeTab, setActiveTab] = useState<TabType>("preparation");

    useEffect(() => {
        const allPlans = getPlans();
        if (allPlans) {
            setPlans(allPlans.filter(p => !p.isArchived));
        }
    }, []);

    const handleDelete = (id: string) => {
        deletePlan(id);
        setPlans(plans.filter(p => p.id !== id));
    };

    // タブによるフィルタリング
    const filteredPlans = plans.filter(plan => {
        const total = plan.items?.length || 0;
        const collected = plan.items?.filter((i: any) => i.isCollected).length || 0;

        if (activeTab === "complete") return collected === total && total > 0;
        if (activeTab === "in_progress") return collected > 0 && collected < total;
        return collected === 0;
    });

    return (
        <div className="min-h-screen bg-white text-black font-sans pb-32">
            <header className="p-8 pt-16 border-b border-gray-50">
                <h1 className="text-3xl font-bold tracking-tighter uppercase">Plan</h1>
            </header>

            {/* ステータスタブ */}
            <div className="flex border-b border-gray-100 px-4">
                {(["preparation", "in_progress", "complete"] as const).map((tab) => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`flex-1 py-4 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 ${activeTab === tab ? "border-[#F37343] text-[#F37343]" : "border-transparent text-gray-400"
                            }`}
                    >
                        {tab.replace("_", " ")}
                    </button>
                ))}
            </div>

            <main className="p-4 space-y-6 mt-4">
                {filteredPlans.length > 0 ? (filteredPlans.map((plan) => (
                    <div key={plan.id} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-xl p-6 relative">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2 bg-[#F37343]/5 px-3 py-1 rounded-full">
                                <div className="w-1.5 h-1.5 bg-[#F37343] rounded-full animate-pulse" />
                                <span className="text-[9px] font-black text-[#F37343] uppercase tracking-widest">Active</span>
                            </div>
                            <button onClick={() => handleDelete(plan.id)} className="text-gray-200 hover:text-red-400 transition-colors">
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <h3 className="text-xl font-black uppercase mb-4 truncate text-left">{plan.name}</h3>

                        <div className="h-48 relative rounded-2xl overflow-hidden border border-gray-100 mb-6 bg-gray-50">
                            <LazyMap
                                items={plan.items}
                                center={plan.center}
                                isFinalOverview={true}
                                themeColor="#F37343"
                            />
                        </div>

                        {/* 目的地リストの追加 */}
                        <div className="space-y-2 mb-6 px-1">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                                <MapPin size={10} /> Destinations
                            </p>
                            <div className="grid gap-2">
                                {plan.items?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-black text-white ${item.isCollected ? 'bg-green-500' : 'bg-[#F37343]'}`}>
                                            {idx + 1}
                                        </span>
                                        <span className={`text-[10px] font-bold truncate flex-1 ${item.isCollected ? 'text-gray-400 line-through' : 'text-gray-700'}`}>
                                            {item.addressName}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between border-t border-gray-50 pt-6">
                            <div className="flex gap-6 text-left">
                                <div><p className="text-[8px] font-bold text-gray-400 uppercase">Waypoints</p><p className="font-black text-sm">{plan.items?.length || 0}</p></div>
                                <div><p className="text-[8px] font-bold text-gray-400 uppercase">Range</p><p className="font-black text-sm">{plan.radius} km</p></div>
                            </div>
                            <button
                                onClick={() => router.push(`/adventure/${plan.id}`)}
                                className="px-8 py-4 bg-[#111827] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                            >
                                <Play size={12} fill="currentColor" />START
                            </button>
                        </div>
                    </div>
                ))) : (
                    <div className="text-center py-24 border-2 border-dashed border-gray-50 rounded-[3rem]">
                        <Footprints size={48} className="text-gray-100 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No Quests in {activeTab}</p>
                    </div>
                )}
            </main>
        </div>
    );
}