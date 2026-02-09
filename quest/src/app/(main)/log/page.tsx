"use client";

import { useEffect, useState } from "react";
import { getPlans } from "@/lib/storage";
import { calculateDistance } from "@/lib/geo";
import { CheckCircle, MapPin, ChevronDown, ChevronUp } from "lucide-react";
import dynamic from "next/dynamic";

const LazyMap = dynamic(() => import("@/components/Map/LazyMap"), { ssr: false });

export default function LogPage() {
    const [completedPlans, setCompletedPlans] = useState<any[]>([]);
    // 展開されているカードのIDを管理（nullなら全て閉じ、初期値に最新IDを入れることも可能）
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const allPlans = getPlans();
        const logs = allPlans
            .filter(plan => (plan.items || []).some((i: any) => i.isCollected))
            .map(plan => {
                const collectedItems = (plan.items || []).filter((i: any) => i.isCollected);
                let totalDistance = 0;
                let prevPoint: [number, number] = plan.center ? [plan.center.lat, plan.center.lng] : [0, 0];
                collectedItems.forEach((item: any) => {
                    totalDistance += calculateDistance(prevPoint[0], prevPoint[1], item.lat, item.lng);
                    prevPoint = [item.lat, item.lng];
                });
                return {
                    ...plan,
                    collectedItems,
                    totalDistance,
                    completionDate: collectedItems[collectedItems.length - 1]?.collectedAt || plan.createdAt
                };
            })
            .sort((a, b) => new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime());

        setCompletedPlans(logs);
        // 最初の一件だけ展開しておく
        if (logs.length > 0) setExpandedId(logs[0].id);
    }, []);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 pb-24">
            <div className="pt-8" />
            <div className="space-y-4">
                {completedPlans.map((plan) => {
                    const isExpanded = expandedId === plan.id;
                    return (
                        <div key={plan.id} className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/60 overflow-hidden transition-all duration-500">

                            {/* ヘッダー部分：ここをタップして開閉 */}
                            <div
                                className="p-8 cursor-pointer flex justify-between items-start"
                                onClick={() => toggleExpand(plan.id)}
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h3 className="text-xl font-black text-gray-800 leading-tight">{plan.name}</h3>
                                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-tighter uppercase bg-blue-100 text-blue-600">
                                            DONE
                                        </span>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                        {new Date(plan.completionDate).toLocaleDateString('ja-JP')}
                                    </p>
                                </div>
                                <div className="text-gray-300">
                                    {isExpanded ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                </div>
                            </div>

                            {/* 展開されるコンテンツ */}
                            <div className={`transition-all duration-500 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                {/* 数値ボックス */}
                                <div className="grid grid-cols-2 gap-3 px-8 mb-6">
                                    <div className="bg-black/5 rounded-2xl p-4">
                                        <div className="text-[9px] font-black text-pink-600 uppercase tracking-widest mb-1">TRAVEL</div>
                                        <div className="text-lg font-black text-gray-800">
                                            {plan.totalDistance.toFixed(1)} km
                                        </div>
                                    </div>
                                    <div className="bg-black/5 rounded-2xl p-4">
                                        <div className="text-[9px] font-black text-pink-600 uppercase tracking-widest mb-1">ITEMS</div>
                                        <div className="text-lg font-black text-gray-800">{plan.collectedCount}</div>
                                    </div>
                                </div>

                                {/* 地図 */}
                                <div className="w-full h-52 relative border-y border-gray-100">
                                    <LazyMap items={plan.items} themeColor="#f06292" center={plan.center} isLogMode={true} />
                                </div>

                                {/* タイムライン */}
                                <div className="p-8 space-y-5 bg-gray-50/20">
                                    <div className="space-y-4">
                                        {plan.collectedItems.map((item: any, idx: number) => (
                                            <div key={item.id} className="flex gap-4 text-sm font-bold text-gray-700">
                                                <div className="w-2 h-2 bg-pink-400 rounded-full mt-1.5" />
                                                <div className="flex-1 flex justify-between">
                                                    <span>{item.name}</span>
                                                    <span className="text-gray-400 text-[10px]">{new Date(item.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}