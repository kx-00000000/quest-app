"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlans, type Plan } from "@/lib/storage";
import { calculateDistance } from "@/lib/geo";
import { CheckCircle, Navigation, Package, MapPin } from "lucide-react";
import dynamic from "next/dynamic";

const LazyMap = dynamic(() => import("@/components/Map/LazyMap"), {
    ssr: false,
    loading: () => <div className="h-48 w-full bg-gray-100 animate-pulse" />
});

// PlanPage と同じ距離フォーマット関数
const formatDistance = (km: number): string => {
    if (km < 1) {
        const meters = Math.floor(km * 1000);
        return `${meters.toLocaleString()} m`;
    }
    return `${km.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
};

export default function LogPage() {
    const router = useRouter();
    const [completedPlans, setCompletedPlans] = useState<any[]>([]);

    useEffect(() => {
        const allPlans = getPlans();
        const logs = allPlans
            .filter(plan => (plan.items || []).some((i: any) => i.isCollected))
            .map(plan => {
                const collectedItems = (plan.items || [])
                    .filter((i: any) => i.isCollected)
                    .sort((a: any, b: any) => new Date(a.collectedAt || 0).getTime() - new Date(b.collectedAt || 0).getTime());

                let totalDistance = 0;
                // 型安全な初期地点の設定
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
    }, []);

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 pb-24 font-sans">
            {/* 上部余白：PlanPage と統一 */}
            <div className="pt-8" />

            <div className="space-y-6">
                {completedPlans.length > 0 ? (
                    completedPlans.map((plan) => (
                        <div key={plan.id} className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white/60 relative overflow-hidden group">

                            {/* Card Header Section: PlanPage の構成を完全再現 */}
                            <div className="p-6 pb-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                    <h3 className="text-xl font-black text-gray-800 leading-tight">{plan.name}</h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-tighter uppercase bg-blue-100 text-blue-600">
                                        COMPLETED
                                    </span>
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    {new Date(plan.completionDate).toLocaleDateString('ja-JP')}
                                </p>
                            </div>

                            {/* Stats Grid: PlanPage と同じ bg-black/5 ボックス */}
                            <div className="grid grid-cols-2 gap-3 p-6">
                                <div className="bg-black/5 rounded-2xl p-4">
                                    <div className="text-[9px] font-black text-pink-600 uppercase tracking-widest mb-1">Total Travel</div>
                                    <div className="text-lg font-black text-gray-800">{formatDistance(plan.totalDistance)}</div>
                                </div>
                                <div className="bg-black/5 rounded-2xl p-4">
                                    <div className="text-[9px] font-black text-pink-600 uppercase tracking-widest mb-1">Collected</div>
                                    <div className="text-lg font-black text-gray-800">
                                        {plan.collectedCount} <span className="text-xs">ITEMS</span>
                                    </div>
                                </div>
                            </div>

                            {/* 地図：ベベルなし、端から端まで (w-full) */}
                            <div className="w-full h-52 relative border-y border-gray-100">
                                <LazyMap
                                    items={plan.items}
                                    userLocation={null}
                                    themeColor="#f06292"
                                    center={plan.center}
                                />
                            </div>

                            {/* Timeline Section: 清潔感のある詳細リスト */}
                            <div className="p-6 space-y-5">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Discovery Timeline</p>
                                <div className="space-y-4">
                                    {plan.collectedItems.map((item: any, idx: number) => (
                                        <div key={item.id} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2 bg-pink-400 rounded-full mt-1.5" />
                                                {idx !== plan.collectedItems.length - 1 && (
                                                    <div className="w-[1px] flex-1 bg-gray-100 my-1" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-baseline">
                                                    <h4 className="text-sm font-black text-gray-700 uppercase tracking-tight">{item.name}</h4>
                                                    <span className="text-[10px] font-bold text-gray-400 tabular-nums">
                                                        {new Date(item.collectedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 text-[9px] font-bold text-gray-300 uppercase mt-0.5">
                                                    <MapPin size={10} />
                                                    {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-white/70 backdrop-blur-xl rounded-[2.5rem] border border-white/60">
                        <Package size={48} className="text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No Records Found</p>
                    </div>
                )}
            </div>
        </div>
    );
}