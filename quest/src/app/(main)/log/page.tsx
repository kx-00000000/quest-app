"use client";

import { useEffect, useState } from "react";
import { getPlans } from "@/lib/storage";
import { calculateDistance } from "@/lib/geo";
import { MapPin, ChevronDown, ChevronUp, Package, Clock, MessageCircle, Footprints, Timer } from "lucide-react";
import dynamic from "next/dynamic";

const LazyMap = dynamic(() => import("@/components/Map/LazyMap"), {
    ssr: false,
    loading: () => <div className="h-48 w-full bg-gray-50 animate-pulse rounded-2xl" />
});

// 距離のフォーマット
const formatDistance = (km: number): string => {
    if (km < 1) {
        const meters = Math.floor(km * 1000);
        return `${meters.toLocaleString()} m`;
    }
    return `${km.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
};

// ★時間のフォーマット関数（15min / 2h 10m / 51days 4h 10m）
const formatDuration = (start: string, end: string): string => {
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`;
    return `${diffDays}days ${diffHours % 24}h ${diffMins % 60}m`;
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

                // 冒険の開始・終了時刻の特定
                const startTime = plan.createdAt;
                const endTime = plan.finishedAt || collectedItems[collectedItems.length - 1]?.collectedAt || startTime;

                return {
                    ...plan,
                    collectedItems,
                    totalDistance,
                    duration: formatDuration(startTime, endTime),
                    completionDate: endTime
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
        <div className="min-h-screen bg-white text-black font-sans pb-32">
            {/* 1. ヘッダーサマリー（MyPageとの重複検討箇所） */}
            <header className="p-8 pt-16 border-b border-gray-100">
                <h1 className="text-2xl font-bold tracking-tighter uppercase mb-6">Flight Log</h1>
                <div className="flex gap-10">
                    <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Quests</p>
                        <p className="text-2xl font-bold tabular-nums">{completedPlans.length}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Items</p>
                        <p className="text-2xl font-bold tabular-nums">
                            {completedPlans.reduce((acc, curr) => acc + (curr.collectedCount || 0), 0)}
                        </p>
                    </div>
                </div>
            </header>

            {/* 2. ログリスト */}
            <main className="p-4 space-y-4">
                {completedPlans.length > 0 ? (
                    completedPlans.map((plan) => {
                        const isExpanded = expandedId === plan.id;
                        return (
                            <div key={plan.id} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden shadow-sm transition-all">

                                <div className="p-6 cursor-pointer flex justify-between items-start" onClick={() => toggleExpand(plan.id)}>
                                    <div className="flex-1 pr-4">
                                        <h3 className="text-lg font-bold text-black uppercase tracking-tight leading-tight">{plan.name}</h3>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                            {new Date(plan.completionDate).toLocaleDateString('ja-JP')}
                                        </p>
                                    </div>
                                    <div className="text-gray-300 mt-1">
                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-500">
                                        {/* メトリクス：3カラム構成 */}
                                        <div className="grid grid-cols-3 gap-2 px-6 mb-6">
                                            <div className="bg-black text-white rounded-2xl p-4">
                                                <div className="text-[8px] font-bold opacity-50 uppercase tracking-widest mb-1">Dist</div>
                                                <div className="text-[13px] font-bold tabular-nums truncate">{formatDistance(plan.totalDistance)}</div>
                                            </div>
                                            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-black">
                                                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Time</div>
                                                <div className="text-[13px] font-bold tabular-nums truncate">{plan.duration}</div>
                                            </div>
                                            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-black">
                                                <div className="text-[8px] font-bold text-gray-400 uppercase tracking-widest mb-1">Items</div>
                                                <div className="text-[13px] font-bold tabular-nums truncate">{plan.collectedCount}pts</div>
                                            </div>
                                        </div>

                                        {plan.comment && (
                                            <div className="mx-6 mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                <p className="text-sm font-medium text-gray-700 leading-relaxed italic">"{plan.comment}"</p>
                                            </div>
                                        )}

                                        <div className="mx-6 h-52 relative border border-gray-100 rounded-2xl overflow-hidden mb-6">
                                            <LazyMap items={plan.items} themeColor="#f06292" center={plan.center} isLogMode={true} />
                                        </div>

                                        <div className="p-6 pt-0 space-y-6">
                                            <div className="space-y-6">
                                                {plan.collectedItems.map((item: any, idx: number) => (
                                                    <div key={item.id || idx} className="flex gap-4">
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-2 h-2 bg-black rounded-full mt-2" />
                                                            {idx !== plan.collectedItems.length - 1 && (
                                                                <div className="w-[1px] flex-1 bg-gray-100 my-1" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 pb-1">
                                                            <div className="flex justify-between items-start">
                                                                <h4 className="text-sm font-bold text-black uppercase">{item.locationName || `POINT 0${idx + 1}`}</h4>
                                                                <span className="text-[10px] font-bold text-gray-400 tabular-nums">
                                                                    {new Date(item.collectedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                                                </span>
                                                            </div>
                                                            <p className="text-[9px] font-bold text-gray-300 tabular-nums mt-0.5 uppercase">
                                                                {item.lat.toFixed(4)}°N / {item.lng.toFixed(4)}°E
                                                            </p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                                            <p className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.3em]">Quest Archive Verified</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-24 border border-dashed border-gray-100 rounded-[2rem]">
                        <Footprints size={48} className="text-gray-100 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No Records</p>
                    </div>
                )}
            </main>
        </div>
    );
}