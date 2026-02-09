"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlans } from "@/lib/storage";
import { ArrowLeft, Calendar, MapPin, CheckCircle, Award, Package, Clock, Flag } from "lucide-react";
import dynamic from "next/dynamic";

// 地図をプレビュー用に読み込み（スクロール等の操作はオフにする設定が望ましい）
const LazyMap = dynamic(() => import("@/components/Map/LazyMap"), {
    ssr: false,
    loading: () => <div className="h-48 w-full bg-gray-100 rounded-[2rem] animate-pulse" />
});

export default function LogPage() {
    const router = useRouter();
    const [completedPlans, setCompletedPlans] = useState<any[]>([]);

    useEffect(() => {
        const allPlans = getPlans();
        // 少なくとも1つ以上アイテムを獲得しているプランだけを抽出
        const logs = allPlans
            .filter(plan => (plan.items || []).some((i: any) => i.isCollected))
            .map(plan => {
                const collectedItems = (plan.items || [])
                    .filter((i: any) => i.isCollected)
                    .sort((a: any, b: any) => new Date(a.collectedAt).getTime() - new Date(b.collectedAt).getTime());

                return {
                    ...plan,
                    collectedItems,
                    lastActivity: collectedItems[collectedItems.length - 1]?.collectedAt
                };
            })
            .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());

        setCompletedPlans(logs);
    }, []);

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans pb-32">
            {/* ヘッダー：力強いデザインを維持 */}
            <header className="p-8 pt-16 flex justify-between items-center bg-white/80 backdrop-blur-md sticky top-0 z-30 border-b border-gray-100">
                <h1 className="text-3xl font-black italic tracking-tighter text-gray-800 uppercase">
                    Adventure <span className="text-pink-500">Log</span>
                </h1>
                <div className="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center">
                    <Award className="text-pink-500" size={24} />
                </div>
            </header>

            <main className="px-6 mt-8 space-y-12">
                {completedPlans.length > 0 ? (
                    completedPlans.map((plan) => (
                        <div key={plan.id} className="bg-white rounded-[3.5rem] shadow-xl shadow-gray-200/50 border border-gray-50 overflow-hidden flex flex-col">

                            {/* カード上部：旅の情報 */}
                            <div className="p-8 pb-4">
                                <div className="flex justify-between items-start mb-2">
                                    <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Completed Journey</p>
                                    <div className="flex items-center gap-1 bg-orange-50 px-3 py-1 rounded-full text-orange-500">
                                        <Clock size={10} />
                                        <span className="text-[9px] font-black uppercase italic">{new Date(plan.lastActivity).toLocaleDateString()}</span>
                                    </div>
                                </div>
                                <h2 className="text-3xl font-black italic tracking-tighter text-gray-800 uppercase leading-none mb-4">
                                    {plan.name}
                                </h2>
                            </div>

                            {/* 地図セクション：軌跡を表示 */}
                            <div className="px-6 relative h-60">
                                <div className="w-full h-full rounded-[2.5rem] overflow-hidden border border-gray-100 shadow-inner">
                                    <LazyMap
                                        items={plan.items}
                                        userLocation={null}
                                        themeColor="#f06292"
                                        center={plan.center}
                                    />
                                    {/* 地図を触れなくして「プレビュー」として扱うための透明レイヤー（任意） */}
                                    <div className="absolute inset-0 z-10 pointer-events-none rounded-[2.5rem] border-[12px] border-white/10" />
                                </div>
                            </div>

                            {/* 獲得アイテム詳細リスト */}
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
                                                        {new Date(item.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 text-gray-400">
                                                    <MapPin size={10} />
                                                    <span className="text-[9px] font-bold uppercase tracking-wider">
                                                        {item.lat.toFixed(4)}, {item.lng.toFixed(4)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* 旅の要約ボタン */}
                                <button className="w-full mt-4 bg-gray-900 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all uppercase tracking-widest text-xs">
                                    Review Full Route
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-24 bg-white rounded-[4rem] border border-gray-100 shadow-sm">
                        <Package size={64} className="text-gray-100 mx-auto mb-6" />
                        <p className="text-gray-400 font-black italic uppercase tracking-[0.2em] text-sm">No Missions Logged Yet</p>
                        <button
                            onClick={() => router.push('/')}
                            className="mt-8 px-8 py-4 bg-pink-500 text-white font-black rounded-2xl shadow-lg shadow-pink-100 uppercase text-xs"
                        >
                            Start New Quest
                        </button>
                    </div>
                )}
            </main>
        </div>
    );
}