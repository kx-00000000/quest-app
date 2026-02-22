"use client";

import { useEffect, useState } from "react";
import { getPlans, deletePlan } from "@/lib/storage";
import { calculateDistance } from "@/lib/geo";
import { MapPin, Trash2, Play, Footprints, Check } from "lucide-react";
import { useRouter } from "next/navigation";
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
    const router = useRouter();
    const [logs, setLogs] = useState<any[]>([]);

    useEffect(() => {
        const allPlans = getPlans();
        const processedLogs = allPlans
            .filter(plan => (plan.items || []).some((i: any) => i.isCollected))
            .map((plan: any) => {
                const collectedItems = (plan.items || [])
                    .filter((i: any) => i.isCollected)
                    .sort((a: any, b: any) => new Date(a.collectedAt || 0).getTime() - new Date(b.collectedAt || 0).getTime());

                let totalDistance = 0;
                let prevPoint = plan.center ? [plan.center.lat, plan.center.lng] : [0, 0];
                collectedItems.forEach((item: any) => {
                    totalDistance += calculateDistance(prevPoint[0], prevPoint[1], item.lat, item.lng);
                    prevPoint = [item.lat, item.lng];
                });

                const endTime = plan.finishedAt || (collectedItems.length > 0 ? collectedItems[collectedItems.length - 1].collectedAt : plan.createdAt);

                return {
                    ...plan,
                    collectedItems,
                    totalDistance,
                    duration: formatDuration(plan.createdAt, endTime),
                    completionDate: endTime
                };
            })
            .sort((a, b) => new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime());

        setLogs(processedLogs);
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
                <h1 className="text-3xl font-bold tracking-tighter uppercase mb-6">Flight Log</h1>
                <div className="flex gap-10">
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Quests</p>
                        <p className="text-2xl font-bold tabular-nums">{logs.length}</p>
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Items</p>
                        <p className="text-2xl font-bold tabular-nums">
                            {logs.reduce((acc, curr) => acc + (curr.collectedItems?.length || 0), 0)}
                        </p>
                    </div>
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
                {logs.length > 0 ? (
                    logs.map((plan) => (
                        <div key={plan.id} className="bg-white rounded-[2.5rem] border border-gray-100 overflow-hidden shadow-sm p-6 relative">
                            {/* タイトルとゴミ箱 */}
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

                            {/* 地図表示 */}
                            <div className="h-48 relative rounded-2xl overflow-hidden border border-gray-100 mb-6 bg-gray-50">
                                <LazyMap
                                    items={plan.items}
                                    center={plan.center}
                                    isFinalOverview={true}
                                    themeColor="#f06292"
                                />
                            </div>

                            {/* 目的地リスト (PlanページのCompleteタブと同じスタイル) */}
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

                            {/* 下部統計エリア */}
                            <div className="flex items-center justify-between border-t border-gray-50 pt-6">
                                <div className="flex gap-6 text-left">
                                    <div>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase">Distance</p>
                                        <p className="font-black text-sm tabular-nums">{formatDistance(plan.totalDistance)}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] font-bold text-gray-400 uppercase">Duration</p>
                                        <p className="font-black text-sm tabular-nums">{plan.duration}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => router.push(`/adventure/${plan.id}`)}
                                    className="px-8 py-4 bg-[#111827] text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 shadow-lg active:scale-95 transition-all"
                                >
                                    <Play size={12} fill="currentColor" />
                                    <span>REVISIT</span>
                                </button>
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