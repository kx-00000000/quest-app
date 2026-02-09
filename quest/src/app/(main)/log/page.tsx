"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlans } from "@/lib/storage";
import { calculateDistance } from "@/lib/geo";
import { CheckCircle, MapPin, Package } from "lucide-react";
import dynamic from "next/dynamic";

const LazyMap = dynamic(() => import("@/components/Map/LazyMap"), {
    ssr: false,
    loading: () => <div className="h-48 w-full bg-gray-100 animate-pulse" />
});

// PlanPage と全く同じフォーマット関数
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
                // PlanPage のデータ構造 (plan.center.lat) に合わせた初期地点
                let prevPoint: [number, number] = plan.center ? [plan.center.lat, plan.center.lng] : [0, 0];

                collectedItems.forEach((item: any) => {
                    totalDistance += calculateDistance(prevPoint[0], prevPoint[1], item.lat, item.lng);
                    prevPoint = [item.lat, item.lng];
                });

                return {
                    ...plan,
                    collectedItems,
                    totalDistance,
                    // 完了日をステータス下の表示に使用
                    completionDate: collectedItems[collectedItems.length - 1]?.collectedAt || plan.createdAt
                };
            })
            .sort((a, b) => new Date(b.completionDate).getTime() - new Date(a.completionDate).getTime());

        setCompletedPlans(logs);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 pb-24">
            {/* 上部余白：PlanPage と統一 */}
            <div className="pt-8" />

            <div className="space-y-6">
                {completedPlans.length > 0 ? (
                    completedPlans.map((plan) => (
                        <div key={plan.id} className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-xl border border-white/60 relative overflow-hidden group">

                            {/* 1. Title & Status Area: PlanPage を完全再現 */}
                            <div className="mb-4 pr-10">
                                <div className="flex items-center gap-2 flex-wrap">
                                    {/* 謎のイタリックや字間詰めを排除し、PlanPage と同じクラスを指定 */}
                                    <h3 className="text-xl font-black text-gray-800 leading-tight">{plan.name}</h3>
                                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-tighter uppercase bg-blue-100 text-blue-600">
                                        COMPLETED
                                    </span>
                                </div>
                                {/* 日付：フォント・太さ・字間を PlanPage に統一 */}
                                <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">
                                    {new Date(plan.completionDate).toLocaleDateString('ja-JP')}
                                </p>
                            </div>

                            {/* 2. Stats Grid: PlanPage と同じ数値ボックスのスタイル */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className="bg-black/5 rounded-2xl p-4">
                                    <div className="text-[9px] font-black text-pink-600 uppercase tracking-widest mb-1">TOTAL TRAVEL</div>
                                    <div className="text-lg font-black text-gray-800">{formatDistance(plan.totalDistance)}</div>
                                </div>
                                <div className="bg-black/5 rounded-2xl p-4">
                                    <div className="text-[9px] font-black text-pink-600 uppercase tracking-widest mb-1">COLLECTED</div>
                                    <div className="text-lg font-black text-gray-800">
                                        {plan.collectedCount} <span className="text-xs">ITEMS</span>
                                    </div>
                                </div>
                            </div>

                            {/* 3. 地図：カードのパディング(p-6)を打ち消して端まで表示 (mx-[-1.5rem]) */}
                            <div className="mx-[-1.5rem] h-52 relative border-y border-gray-100 overflow-hidden">
                                <LazyMap
                                    items={plan.items}
                                    userLocation={null}
                                    themeColor="#f06292"
                                    center={plan.center}
                                />
                            </div>

                            {/* 4. Timeline Section: クリーンなリスト表示 */}
                            <div className="mt-6 space-y-5">
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-1">Discovery Timeline</p>
                                <div className="space-y-4 px-1">
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