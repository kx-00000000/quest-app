"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlans } from "@/lib/storage";
import { ArrowLeft, Calendar, MapPin, CheckCircle, Award, Package, Clock, Flag } from "lucide-react";
import dynamic from "next/dynamic";

const LazyMap = dynamic(() => import("@/components/Map/LazyMap"), {
    ssr: false,
    loading: () => <div className="h-48 w-full bg-gray-100 rounded-[2.5rem] animate-pulse" />
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
                        .sort((a: any, b: any) => new Date(a.collectedAt).getTime() - new Date(b.collectedAt).getTime());

                    return {
                        ...plan,
                        collectedItems,
                        // 型エラー回避：空の場合は 1970-01-01 をデフォルト値にする
                        lastActivity: collectedItems[collectedItems.length - 1]?.collectedAt || "1970-01-01T00:00:00.000Z"
                    };
                })
                .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());

            setCompletedPlans(logs);
        } catch (e) {
            console.error("Log sorting error", e);
        }
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-32">
            {/* ヘッダー：NEW/PLANページと同じ
        font-black italic tracking-tighter を使用
      */}
            <header className="p-8 pt-16 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-100">
                <h1 className="text-3xl font-black italic tracking-tighter text-gray-800 uppercase">
                    Adventure <span className="text-pink-500">Log</span>
                </h1>
                <button
                    onClick={() => router.push('/')}
                    className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center active:scale-90 transition-all"
                >
                    <Award className="text-pink-500" size={24} />
                </button>
            </header>

            <main className="px-6 mt-8 space-y-12">
                {completedPlans.length > 0 ? (
                    completedPlans.map((plan) => (
                        <div key={plan.id} className="bg-white rounded-[3.5rem] shadow-xl shadow-gray-200/50 border border-gray-50 overflow-hidden flex flex-col">

                            {/* カード上部：NEW/PLANのカードと同じ余白とスタイル */}
                            <div className="p-8 pb-4">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Completed Journey</p>
                                    <div className="flex items-center gap-1 bg-orange-50 px-3 py-1 rounded-full text-orange-500">
                                        <Clock size={10} />
                                        <span className="text-[9px] font-black uppercase italic">
                                            {new Date(plan.lastActivity).toLocaleDateString('ja-JP')}
                                        </span>
                                    </div>
                                </div>
                                <h2 className="text-3xl font-black italic tracking-tighter text-gray-800 uppercase leading-none mb-4">
                                    {plan.name}
                                </h2>
                            </div>

                            {/* 復活した地図セクション */}
                            <div className="px-6 relative h-60">
                                <div className="w-full h-full rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-inner">
                                    <LazyMap
                                        items={plan.items}
                                        userLocation={null}
                                        themeColor="#f06292"
                                        center={plan.center}
                                    />
                                    <div className="absolute inset-0 z-10 pointer-events-none rounded-[2.5rem] border-[8px] border-white/5" />
                                </div>
                            </div>

                            {/* 詳細な獲得タイムライン */}
                            <div className="p-8 pt-6 space-y-6">
                                <div className="flex items-center gap-2 mb-2">
                                    <Flag size={14} className="text-gray-300" />
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Discovery Timeline</p>
                                </div>

                                <div className="space-y-4">
                                    {plan.collectedItems.map((item: any, idx: number) => (
                                        <div key={item.id} className="flex items-center gap-4 group">
                                            <div className="flex flex-col items-center">
                                                <div className="w-10 h-10 bg-gradient-to-br from-[#f06292] to-[#ff8a65] rounded-xl flex items-center justify-center text-white shadow-md">
                                                    <CheckCircle size={20} />
                                                </div>
                                                {idx !== plan.collectedItems.length - 1 && (
                                                    <div className="w-[2px] h-6 bg-gray-100 mt-2" />
                                                )}
                                            </div>
                                            <div className="flex-1 bg-gray-50 rounded-2xl p-4 border border-gray-100/50">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className="font-black italic text-gray-800 tracking-tight">{item.name}</h4>
                                                    <span className="text-[9px] font-bold text-gray-400 bg-white px-2 py-1 rounded-lg border border-gray-100">
                                                        {new Date(item.collectedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 text-gray-400">
                                                    <MapPin size={10} />
                                                    <span className="text-[9px] font-bold uppercase tracking-wider">
                                                        POINT {idx + 1}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* ボタン：NEW/PLANページと同じアクセントカラーのグラデーション */}
                                <button
                                    onClick={() => router.push(`/adventure/${plan.id}`)}
                                    className="w-full mt-4 bg-gradient-to-r from-[#f06292] to-[#ff8a65] text-white font-black py-5 rounded-3xl shadow-lg shadow-pink-100 active:scale-95 transition-all uppercase tracking-widest text-xs"
                                >
                                    Review This Route
                                </button>
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

            {/* 戻るボタンをフローティングでも配置（使い勝手のため） */}
            <button
                onClick={() => router.push('/')}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-8 py-4 rounded-full shadow-2xl flex items-center gap-3 active:scale-95 transition-all z-40 border border-white/20"
            >
                <ArrowLeft size={18} />
                <span className="text-xs font-black uppercase tracking-widest">Back to Menu</span>
            </button>
        </div>
    );
}