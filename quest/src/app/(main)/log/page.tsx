"use client";

import { useEffect, useState } from "react";
import { getPlans } from "@/lib/storage";
import { calculateDistance } from "@/lib/geo";
import { MapPin, ChevronDown, ChevronUp, Package, Clock, MessageCircle } from "lucide-react";
import dynamic from "next/dynamic";

const LazyMap = dynamic(() => import("@/components/Map/LazyMap"), {
    ssr: false,
    loading: () => <div className="h-48 w-full bg-gray-100 animate-pulse" />
});

const formatDistance = (km: number): string => {
    if (km < 1) {
        const meters = Math.floor(km * 1000);
        return `${meters.toLocaleString()} m`;
    }
    return `${km.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
};

export default function LogPage() {
    const [completedPlans, setCompletedPlans] = useState<any[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        const allPlans = getPlans();
        const logs = allPlans
            .filter(plan => (plan.items || []).some((i: any) => i.isCollected))
            .map(plan => {
                const collectedItems = (plan.items || [])
                    .filter((i: any) => i.isCollected)
                    .sort((a: any, b: any) => new Date(a.collectedAt || 0).getTime() - new Date(b.collectedAt || 0).getTime());

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
        if (logs.length > 0) setExpandedId(logs[0].id);
    }, []);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 pb-24">
            <div className="pt-8" />
            <div className="space-y-6">
                {completedPlans.length > 0 ? (
                    completedPlans.map((plan) => {
                        const isExpanded = expandedId === plan.id;
                        return (
                            <div key={plan.id} className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/60 overflow-hidden transition-all">

                                {/* 1. ヘッダー */}
                                <div
                                    className="p-6 cursor-pointer flex justify-between items-start"
                                    onClick={() => toggleExpand(plan.id)}
                                >
                                    <div className="flex-1 pr-4">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <h3 className="text-xl font-black text-gray-800 leading-tight italic uppercase tracking-tighter">{plan.name}</h3>
                                            <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-tighter uppercase bg-pink-100 text-pink-600">
                                                LOG
                                            </span>
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest leading-none">
                                            {new Date(plan.completionDate).toLocaleDateString('ja-JP')}
                                        </p>
                                    </div>
                                    <div className="text-gray-300 mt-1">
                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>

                                {/* 2. 詳細セクション */}
                                {isExpanded && (
                                    <div className="animate-in fade-in duration-500">

                                        {/* ★感想（コメント）表示欄 */}
                                        {plan.comment && (
                                            <div className="mx-6 mb-6 p-5 bg-gray-50/50 rounded-[1.5rem] border border-gray-100 italic">
                                                <div className="flex gap-2 text-pink-500 mb-2">
                                                    <MessageCircle size={14} />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Memories</span>
                                                </div>
                                                <p className="text-sm font-bold text-gray-600 leading-relaxed">
                                                    "{plan.comment}"
                                                </p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-3 px-6 mb-6">
                                            <div className="bg-gray-900/5 rounded-2xl p-4">
                                                <div className="text-[9px] font-black text-pink-600 uppercase tracking-widest mb-1">DISTANCE</div>
                                                <div className="text-lg font-black text-gray-800">{formatDistance(plan.totalDistance)}</div>
                                            </div>
                                            <div className="bg-gray-900/5 rounded-2xl p-4">
                                                <div className="text-[9px] font-black text-pink-600 uppercase tracking-widest mb-1">TOTAL ITEMS</div>
                                                <div className="text-lg font-black text-gray-800">{plan.collectedCount} / {plan.itemCount}</div>
                                            </div>
                                        </div>

                                        <div className="mx-[-1.5rem] h-52 relative border-y border-gray-100">
                                            <LazyMap items={plan.items} themeColor="#f06292" center={plan.center} isLogMode={true} />
                                        </div>

                                        <div className="p-8 space-y-5">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Discovery Timeline</p>
                                            <div className="space-y-6">
                                                {plan.collectedItems.map((item: any, idx: number) => (
                                                    <div key={item.id || idx} className="flex gap-4">
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-3 h-3 bg-pink-500 rounded-full mt-1.5" />
                                                            {idx !== plan.collectedItems.length - 1 && (
                                                                <div className="w-[1.5px] flex-1 bg-gray-100 my-1" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 pb-2">
                                                            <div className="flex justify-between items-start">
                                                                {/* ★修正：固有の地名をタイムラインの見出しに */}
                                                                <h4 className="text-sm font-black text-gray-800 uppercase tracking-tight">
                                                                    {item.locationName || `POINT 0${idx + 1}`}
                                                                </h4>
                                                                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 tabular-nums">
                                                                    <Clock size={10} />
                                                                    {new Date(item.collectedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-[9px] font-bold text-gray-300 uppercase mt-1">
                                                                <MapPin size={10} />
                                                                {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-20 bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/60">
                        <Package size={48} className="text-gray-100 mx-auto mb-4" />
                        <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">No Adventure Records</p>
                    </div>
                )}
            </div>
        </div>
    );
}