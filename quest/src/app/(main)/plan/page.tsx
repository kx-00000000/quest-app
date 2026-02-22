"use client";

import { useEffect, useState } from "react";
import { getPlans, deletePlan } from "@/lib/storage";
import { Trash2, Play, Footprints, MapPin, Check } from "lucide-react";
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
        if (confirm("このプランを削除しますか？")) {
            deletePlan(id);
            setPlans(plans.filter(p => p.id !== id));
        }
    };

    const filteredPlans = plans.filter(plan => {
        const total = plan.items?.length || 0;
        const collected = plan.items?.filter((i: any) => i.isCollected).length || 0;

        if (activeTab === "complete") return collected === total && total > 0;
        if (activeTab === "in_progress") return collected > 0 && collected < total;
        return collected === 0;
    });

    return (
        <div className="flex flex-col h-screen bg-white text-black font-sans">
            {/* ヘッダーセクション（固定） */}
            <div className="flex-none bg-white">
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
            </div>

            {/* スクロールエリア */}
            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
                {filteredPlans.length > 0 ? (filteredPlans.map((plan) => (
                    <div key={plan.id} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm p-6 relative">
                        {/* タイトルとゴミ箱を同じ高さに配置 */}
                        <div className="flex justify-between items-center mb-5">
                            <h3 className="text-xl font-black uppercase truncate flex-1 pr-4 text-left">{plan.name}</h3>
                            <button
                                onClick={() => handleDelete(plan.id)}
                                className="text-gray-300 hover:text-red-400 transition-colors flex-none"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>

                        <div className="h-48 relative rounded-2xl overflow-hidden border border-gray-100 mb-6 bg-gray-50">
                            <LazyMap
                                items={plan.items}
                                center={plan.center}
                                isFinalOverview={true}
                                themeColor="#F37343"
                            />
                        </div>

                        {/* 目的地リスト */}
                        <div className="space-y-3 mb-6 px-1">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-1">
                                <MapPin size={10} /> Destinations
                            </p>
                            <div className="grid gap-2.5">
                                {plan.items?.map((item: any, idx: number) => (
                                    <div key={idx} className="flex items-center gap-3">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black text-white flex-none ${item.isCollected ? 'bg-green-500' : 'bg-[#F37343]'}`}>
                                            {item.isCollected ? <Check size={12} strokeWidth={4} /> : (idx + 1)}
                                        </div>
                                        <span className="text-[11px] font-bold text-gray-700 truncate flex-1 text-left">
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
                                <Play size={12} fill="currentColor" />
                                <span>{activeTab === "complete" ? "REVISIT" : "START"}</span>
                            </button>
                        </div>
                    </div>
                ))) : (
                    <div className="text-center py-24 border-2 border-dashed border-gray-50 rounded-[3rem]">
                        <Footprints size={48} className="text-gray-100 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No Quests found</p>
                    </div>
                )}
            </main>
        </div>
    );
}