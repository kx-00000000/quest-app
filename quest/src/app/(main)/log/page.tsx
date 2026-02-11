"use client";

import { useEffect, useState } from "react";
import { getPlans } from "@/lib/storage";
import { calculateDistance } from "@/lib/geo";
import { MapPin, ChevronDown, ChevronUp, Package, Clock, MessageCircle, Calendar, Footprints } from "lucide-react";
import dynamic from "next/dynamic";

// 地図コンポーネントをクライアントサイドのみで読み込み
const LazyMap = dynamic(() => import("@/components/Map/LazyMap"), {
    ssr: false,
    loading: () => <div className="h-48 w-full bg-gray-50 animate-pulse rounded-2xl" />
});

// 距離のフォーマット関数
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
            // アイテムが1つでも獲得されているプランを表示
            .filter(plan => (plan.items || []).some((i: any) => i.isCollected))
            .map(plan => {
                const collectedItems = (plan.items || [])
                    .filter((i: any) => i.isCollected)
                    .sort((a: any, b: any) => new Date(a.collectedAt || 0).getTime() - new Date(b.collectedAt || 0).getTime());

                // 距離の計算（開始地点から各獲得地点を繋ぐ）
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
        // 最初の一つを展開状態にする
        if (logs.length > 0) setExpandedId(logs[0].id);
    }, []);

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    return (
        <div className="min-h-screen bg-white text-black font-sans pb-32">
            {/* 1. 全体統計：サマリー */}
            <header className="p-8 pt-16 border-b border-gray-100">
                <h1 className="text-2xl font-bold tracking-tighter uppercase mb-6 text-black">Flight Log</h1>
                <div className="flex gap-12">
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black opacity-50">Total Quests</p>
                        <p className="text-3xl font-bold tabular-nums text-black">{completedPlans.length}</p>
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 text-black opacity-50">Items Found</p>
                        <p className="text-3xl font-bold tabular-nums text-black">
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
                            <div key={plan.id} className="bg-white rounded-[2rem] border border-gray-100 overflow-hidden transition-all shadow-sm">

                                {/* カードヘッダー：タップで展開 */}
                                <div
                                    className="p-6 cursor-pointer flex justify-between items-start"
                                    onClick={() => toggleExpand(plan.id)}
                                >
                                    <div className="flex-1 pr-4">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-lg font-bold text-black uppercase tracking-tight leading-tight">{plan.name}</h3>
                                        </div>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            {new Date(plan.completionDate).toLocaleDateString('ja-JP')}
                                        </p>
                                    </div>
                                    <div className="text-gray-300 mt-1">
                                        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                    </div>
                                </div>

                                {/* 詳細セクション */}
                                {isExpanded && (
                                    <div className="animate-in fade-in slide-in-from-top-2 duration-500">

                                        {/* 感想メモ */}
                                        {plan.comment && (
                                            <div className="mx-6 mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                                <div className="flex gap-2 text-pink-500 mb-2">
                                                    <MessageCircle size={14} />
                                                    <span className="text-[9px] font-bold uppercase tracking-widest">Memories</span>
                                                </div>
                                                <p className="text-sm font-medium text-gray-700 leading-relaxed">
                                                    "{plan.comment}"
                                                </p>
                                            </div>
                                        )}

                                        {/* メトリクス：距離とアイテム数 */}
                                        <div className="grid grid-cols-2 gap-3 px-6 mb-6">
                                            <div className="bg-black text-white rounded-2xl p-4">
                                                <div className="text-[9px] font-bold opacity-50 uppercase tracking-widest mb-1">Distance</div>
                                                <div className="text-lg font-bold tabular-nums">{formatDistance(plan.totalDistance)}</div>
                                            </div>
                                            <div className="bg-gray-50 border border-gray-100 rounded-2xl p-4 text-black">
                                                <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Items</div>
                                                <div className="text-lg font-bold tabular-nums">{plan.collectedCount} / {plan.itemCount}</div>
                                            </div>
                                        </div>

                                        {/* 航跡マップ */}
                                        <div className="mx-6 h-52 relative border border-gray-100 rounded-2xl overflow-hidden mb-6">
                                            <LazyMap items={plan.items} themeColor="#f06292" center={plan.center} isLogMode={true} />
                                        </div>

                                        {/* タイムライン：生データの記録 */}
                                        <div className="p-6 pt-0 space-y-6">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-4">Trajectory Details</p>
                                            <div className="space-y-6">
                                                {plan.collectedItems.map((item: any, idx: number) => (
                                                    <div key={item.id || idx} className="flex gap-4">
                                                        <div className="flex flex-col items-center">
                                                            <div className="w-2.5 h-2.5 bg-black rounded-full mt-1.5" />
                                                            {idx !== plan.collectedItems.length - 1 && (
                                                                <div className="w-[1.5px] flex-1 bg-gray-100 my-1" />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 pb-1">
                                                            <div className="flex justify-between items-start">
                                                                <h4 className="text-sm font-bold text-black uppercase tracking-tight">
                                                                    {item.locationName || `POINT 0${idx + 1}`}
                                                                </h4>
                                                                <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 tabular-nums">
                                                                    <Clock size={10} />
                                                                    {new Date(item.collectedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center gap-1 text-[9px] font-bold text-gray-300 tabular-nums mt-1">
                                                                <MapPin size={10} />
                                                                {item.lat.toFixed(4)}°N, {item.lng.toFixed(4)}°E
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* シェア用フッター風デザイン */}
                                        <div className="bg-gray-50 p-4 text-center border-t border-gray-100">
                                            <p className="text-[8px] font-bold text-gray-300 uppercase tracking-[0.3em]">Quest Archive Verified</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-24 border border-dashed border-gray-200 rounded-[2rem]">
                        <Footprints size={48} className="text-gray-100 mx-auto mb-4" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">Ready for takeoff</p>
                    </div>
                )}
            </main>
        </div>
    );
}