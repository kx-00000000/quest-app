"use client";

import { useEffect, useState } from "react";
import { getPlans, deletePlan } from "@/lib/storage";
import { calculateDistance } from "@/lib/geo";
import { MapPin, Trash2, Footprints, Check } from "lucide-react";
import dynamic from "next/dynamic";

interface LazyMapProps {
    items?: any[];
    center?: { lat: number; lng: number };
    userLocation?: { lat: number; lng: number } | null;
    radiusInKm?: number;
    themeColor?: string;
    isLogMode?: boolean;
    isBriefingActive?: boolean;
    isFinalOverview?: boolean;
}

const LazyMap = dynamic<LazyMapProps>(
    () => import("@/components/Map/LazyMap").then((mod) => mod.default),
    {
        ssr: false,
        loading: () => <div className="h-48 w-full bg-gray-50 animate-pulse rounded-2xl" />
    }
);

const formatDistance = (km: number): string => {
    if (km < 1) return `${Math.floor(km * 1000).toLocaleString()} m`;
    return `${km.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
};

// ミリ秒を読みやすい時間に変換するヘルパー
const msToDuration = (diffMs: number): string => {
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) return `${diffMins} min`;
    if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m`;
    return `${diffDays}days ${diffHours % 24}h ${diffMins % 60}m`;
};

const formatDuration = (start: string, end: string): string => {
    const diffMs = new Date(end).getTime() - new Date(start).getTime();
    return msToDuration(diffMs);
};

export default function LogPage() {
    const [logs, setLogs] = useState<any[]>([]);
    const [totals, setTotals] = useState({ distance: 0, durationMs: 0, items: 0 });

    useEffect(() => {
        const allPlans = getPlans();
        let ttlDist = 0;
        let ttlMs = 0;
        let ttlItems = 0;

        const processedLogs = allPlans
            .filter(plan => (plan.items || []).some((i: any) => i.isCollected))
            .map((plan: any) => {
                const collectedItems = (plan.items || [])
                    .filter((i: any) => i.isCollected)
                    .sort((a: any, b: any) => new Date(a.collectedAt || 0).getTime() - new Date(b.collectedAt || 0).getTime());

                let planDistance = 0;
                let prevPoint = plan.center ? [plan.center.lat, plan.center.lng] : [0, 0];
                collectedItems.forEach((item: any) => {
                    planDistance += calculateDistance(prevPoint[0], prevPoint[1], item.lat, item.lng);
                    prevPoint = [item.lat, item.lng];
                });

                const endTime = plan.finishedAt || (collectedItems.length > 0 ? collectedItems[collectedItems.length - 1].collectedAt : plan.createdAt);
                const planMs = new Date(endTime).getTime() - new Date(plan.createdAt).getTime();

                ttlDist += planDistance;
                ttlMs += planMs;
                ttlItems += collectedItems.length;

                return {
                    ...plan,
                    collectedItems,
                    totalDistance: planDistance,
                    duration: msToDuration(planMs),
                    completionDate: endTime
                };
            })
            .sort((a, b) => new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime());

        setLogs(processedLogs);
        setTotals({ distance: ttlDist, durationMs: ttlMs, items: ttlItems });
    }, []);

    const handleDelete = (id: string) => {
        if (confirm("このログを削除しますか？")) {
            deletePlan(id);
            setLogs(logs.filter(l => l.id !== id));
        }
    };

    return (
        <div className="flex flex-col h-screen bg-white text-black font-sans">
            <header className="p-8 pt-16 border-b border-gray-50 flex-none">
                {/* 1. 文言変更: LOG BOOK */}
                <h1 className="text-3xl font-bold tracking-tighter uppercase mb-8">Log Book</h1>

                {/* 2. ヘッダー統計の追加 (TTL DISTANCE / TTL DURATION) */}
                <div className="flex gap-x-8 gap-y-4 flex-wrap">
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Quests</p>
                        <p className="text-xl font-bold tabular-nums">{logs.length}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Items</p>
                        <p className="text-xl font-bold tabular-nums">{totals.items}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">TTL Distance</p>
                        <p className="text-xl font-bold tabular-nums">{formatDistance(totals.distance)}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">TTL Duration</p>
                        <p className="text-xl font-bold tabular-nums">{msToDuration(totals.durationMs)}</p>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
                {logs.length > 0 ? (
                    logs.map((plan) => (
                        <div key={plan.id} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm p-6 relative">
                            <div className="flex justify-between items-center mb-5">
                                <div>
                                    <h3 className="text-xl font-black uppercase truncate leading-tight text-left">{plan.name}</h3>
                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                        {new Date(plan.completionDate).toLocaleDateString('ja-JP')}
                                    </p>
                                </div>
                                <button onClick={() => handleDelete(plan.id)} className="text-gray-300 hover:text-red-400 transition-colors">
                                    <Trash2 size={20} />
                                </button>
                            </div>

                            <div className="h-48 relative rounded-2xl overflow-hidden border border-gray-100 mb-6 bg-gray-50">
                                <LazyMap
                                    items={plan.items}
                                    center={plan.center}
                                    isFinalOverview={true}
                                    themeColor="#f06292"
                                />
                            </div>

                            <div className="space-y-4 mb-6 px-1 text-left">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1">
                                    <MapPin size={10} /> Visit Records
                                </p>
                                <div className="grid gap-4">
                                    {plan.collectedItems.map((item: any, idx: number) => (
                                        <div key={item.id || idx} className="flex items-start gap-3">
                                            <div className="w-5 h-5 rounded-full bg-black text-white flex items-center justify-center flex-none mt-0.5 shadow-sm">
                                                <Check size={12} strokeWidth={4} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-[11px] font-bold text-gray-700 block truncate uppercase">
                                                    {item.addressName || item.locationName || `POINT ${idx + 1}`}
                                                </span>
                                                <p className="text-[9px] font-bold text-gray-400 tabular-nums uppercase mt-0.5 tracking-tight">
                                                    {item.lat.toFixed(4)}°N {item.lng.toFixed(4)}°E • {new Date(item.collectedAt).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* 4. カード内統計: ITEMSの追加と 3. REVISITボタンの削除 */}
                            <div className="flex items-center gap-8 border-t border-gray-50 pt-6 text-left">
                                <div>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase">Distance</p>
                                    <p className="font-black text-sm tabular-nums">{formatDistance(plan.totalDistance)}</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase">Duration</p>
                                    <p className="font-black text-sm tabular-nums">{plan.duration}</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-bold text-gray-400 uppercase">Items</p>
                                    <p className="font-black text-sm tabular-nums">{plan.collectedItems.length} PTS</p>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-24 border-2 border-dashed border-gray-50 rounded-[3rem]">
                        <Footprints size={48} className="text-gray-100 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">No Records Found</p>
                    </div>
                )}
            </main>
        </div>
    );
}