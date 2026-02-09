"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlans } from "@/lib/storage";
import { MapPin, CheckCircle, Package, Navigation } from "lucide-react";
import { calculateDistance } from "@/lib/geo";
import dynamic from "next/dynamic";

const LazyMap = dynamic(() => import("@/components/Map/LazyMap"), {
    ssr: false,
    loading: () => <div className="h-48 w-full bg-gray-100 animate-pulse" />
});

export default function LogPage() {
    const router = useRouter();
    const [completedPlans, setCompletedPlans] = useState<any[]>([]);

    useEffect(() => {
        try {
            const allPlans = getPlans();
            const logs = allPlans
                .filter(plan => (plan.items || []).some((i: any) => i.isCollected))
                .map(plan => {
                    const collectedItems = (plan.items || [])
                        .filter((i: any) => i.isCollected)
                        .sort((a: any, b: any) => new Date(a.collectedAt || 0).getTime() - new Date(b.collectedAt || 0).getTime());

                    let totalDistance = 0;
                    let prevPoint: [number, number] = (Array.isArray(plan.center) && plan.center.length >= 2)
                        ? [plan.center[0], plan.center[1]]
                        : [0, 0];

                    collectedItems.forEach((item: any) => {
                        totalDistance += calculateDistance(prevPoint[0], prevPoint[1], item.lat, item.lng);
                        prevPoint = [item.lat, item.lng];
                    });

                    return {
                        ...plan,
                        collectedItems,
                        totalDistanceKm: totalDistance.toFixed(2),
                        completionDate: collectedItems[collectedItems.length - 1]?.collectedAt || new Date().toISOString()
                    };
                })
                .sort((a, b) => new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime());

            setCompletedPlans(logs);
        } catch (e) {
            console.error(e);
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-20">
            {/* タイトルとボタンを削除し、PLANページのようなカードリストから開始 */}
            <main className="px-6 pt-16 space-y-10">
                {completedPlans.length > 0 ? (
                    completedPlans.map((plan) => (
                        <div key={plan.id} className="bg-white rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col">

                            {/* カード上部：NEW/PLANページとフォント・余白を統一 */}
                            <div className="p-8 pb-6">
                                <p className="text-[10px] font-bold text-pink-500 uppercase tracking-widest mb-1">Mission Completed</p>
                                <h2 className="text-xl font-black tracking-tighter text-gray-800 uppercase leading-none mb-6">
                                    {plan.name}
                                </h2>

                                {/* 3カラムメトリクス */}
                                <div className="grid grid-cols-3 gap-4 pt-6 border-t border-gray-100">
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Completed</p>
                                        <p className="text-sm font-bold text-gray-700">
                                            {new Date(plan.completionDate).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Distance</p>
                                        <p className="text-sm font-bold text-gray-700">
                                            {plan.totalDistanceKm}km
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Items</p>
                                        <p className="text-sm font-bold text-pink-500">
                                            {plan.collectedCount}/{plan.itemCount}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 地図：左右端までいっぱい、ベベルなし */}
                            <div className="w-full h-64 relative">
                                <LazyMap
                                    items={plan.items}
                                    userLocation={null}
                                    themeColor="#f06292"
                                    center={plan.center}
                                />
                            </div>

                            {/* タイムライン */}
                            <div className="p-8 space-y-6 bg-gray-50/20">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Discovery Timeline</p>
                                <div className="space-y-5">
                                    {plan.collectedItems.map((item: any, idx: number) => (
                                        <div key={item.id} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-2 h-2 bg-pink-500 rounded-full mt-1.5" />
                                                {idx !== plan.collectedItems.length - 1 && (
                                                    <div className="w-[1px] flex-1 bg-gray-200 my-1" />
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex justify-between items-baseline">
                                                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-tight">{item.name}</h4>
                                                    <span className="text-[10px] font-bold text-gray-400">
                                                        {new Date(item.collectedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 text-[9px] font-bold text-gray-300 uppercase mt-0.5">
                                                    <MapPin size={8} />
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
                    <div className="text-center py-24">
                        <Package size={48} className="text-gray-200 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No Records</p>
                    </div>
                )}
            </main>
        </div>
    );
}