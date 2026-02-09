"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlans } from "@/lib/storage";
import { ArrowLeft, MapPin, CheckCircle, Award, Package, Navigation } from "lucide-react";
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
                    // 型エラー修正: plan.center が無い場合に備えてデフォルト値を設定
                    let prevPoint: [number, number] = Array.isArray(plan.center) ? [plan.center[0], plan.center[1]] : [0, 0];

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
            console.error("Log calculation error", e);
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-32">
            {/* ヘッダー：PLANページ同様、力強いイタリックタイポグラフィ */}
            <header className="p-8 pt-16 flex justify-between items-center sticky top-0 z-30 bg-gray-50/80 backdrop-blur-md">
                <h1 className="text-3xl font-black italic tracking-tighter text-gray-800 uppercase">
                    Adventure <span className="text-pink-500">Log</span>
                </h1>
                <button
                    onClick={() => router.push('/')}
                    className="w-12 h-12 bg-white shadow-sm rounded-2xl flex items-center justify-center border border-gray-100 active:scale-90 transition-all"
                >
                    <ArrowLeft className="text-gray-400" size={20} />
                </button>
            </header>

            <main className="px-6 mt-4 space-y-10">
                {completedPlans.length > 0 ? (
                    completedPlans.map((plan) => (
                        <div key={plan.id} className="bg-white rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden flex flex-col">

                            {/* 1. 上部：PLANページと全く同じタイトル・メトリクス */}
                            <div className="p-8 pb-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-1">Mission Completed</p>
                                        <h2 className="text-3xl font-black italic tracking-tighter text-gray-800 uppercase leading-none">
                                            {plan.name}
                                        </h2>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-2xl">
                                        <Award className="text-pink-500" size={24} />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                                    <div>
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Date</p>
                                        <p className="text-xs font-black italic text-gray-600 leading-none">
                                            {new Date(plan.completionDate).toLocaleDateString('ja-JP')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Travel</p>
                                        <p className="text-xs font-black italic text-gray-600 leading-none">
                                            {plan.totalDistanceKm} <span className="text-[10px]">km</span>
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Items</p>
                                        <p className="text-xs font-black italic text-pink-500 leading-none">
                                            {plan.collectedCount} / {plan.itemCount}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* 2. 地図：ベベルなし、カードの左右端までいっぱい（w-full） */}
                            <div className="w-full h-64 relative border-y border-gray-50">
                                <LazyMap
                                    items={plan.items}
                                    userLocation={null}
                                    themeColor="#f06292"
                                    center={plan.center}
                                />
                            </div>

                            {/* 3. タイムライン：いつどこで獲得したか */}
                            <div className="p-8 space-y-6 bg-gray-50/10">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Discovery Timeline</p>
                                <div className="space-y-4">
                                    {plan.collectedItems.map((item: any, idx: number) => (
                                        <div key={item.id} className="flex gap-4">
                                            <div className="flex flex-col items-center">
                                                <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center shadow-sm border border-gray-100 z-10">
                                                    <CheckCircle size={16} className="text-pink-500" />
                                                </div>
                                                {idx !== plan.collectedItems.length - 1 && (
                                                    <div className="w-[1.5px] flex-1 bg-gray-200/40 my-1" />
                                                )}
                                            </div>
                                            <div className="flex-1 pb-4">
                                                <div className="flex justify-between items-baseline">
                                                    <h4 className="text-sm font-black italic text-gray-700 uppercase tracking-tight">{item.name}</h4>
                                                    <span className="text-[10px] font-bold text-gray-400 tabular-nums">
                                                        {new Date(item.collectedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 text-[9px] font-bold text-gray-300 uppercase tracking-wider mt-0.5">
                                                    <Navigation size={8} className="rotate-45" />
                                                    Lat: {item.lat.toFixed(4)} / Lng: {item.lng.toFixed(4)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                        </div>
                    ))
                ) : (
                    <div className="text-center py-24 bg-white rounded-[4rem] border border-gray-100 shadow-sm">
                        <Package size={64} className="text-gray-100 mx-auto mb-6" />
                        <p className="text-gray-400 font-black italic uppercase tracking-[0.2em] text-sm">No Missions Logged Yet</p>
                    </div>
                )}
            </main>
        </div>
    );
}