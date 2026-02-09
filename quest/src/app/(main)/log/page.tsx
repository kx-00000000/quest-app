"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getPlans } from "@/lib/storage";
// Package をインポートに追加しました
import { ArrowLeft, Calendar, MapPin, CheckCircle, Award, Package } from "lucide-react";

export default function LogPage() {
    const router = useRouter();
    const [completedItems, setCompletedItems] = useState<any[]>([]);

    useEffect(() => {
        try {
            const allPlans = getPlans();
            const items = allPlans.flatMap(plan =>
                (plan.items || [])
                    .filter((item: any) => item.isCollected)
                    .map((item: any) => ({
                        ...item,
                        planName: plan.name
                    }))
            );

            setCompletedItems(items.sort((a, b) =>
                new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime()
            ));
        } catch (e) {
            console.error("Log loading error:", e);
        }
    }, []);

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-slate-800 font-sans pb-20">
            {/* ヘッダー：品格のあるタイポグラフィ */}
            <header className="p-6 pt-12 flex justify-between items-end">
                <button
                    onClick={() => router.push('/')}
                    className="w-11 h-11 bg-white shadow-sm rounded-2xl flex items-center justify-center border border-gray-100 active:scale-95 transition-all"
                >
                    <ArrowLeft size={18} className="text-slate-400" />
                </button>
                <div className="text-right">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none mb-1">Travel Journal</p>
                    <h1 className="text-2xl font-light text-slate-900 tracking-tight italic">Adventure Log</h1>
                </div>
            </header>

            <main className="px-6 mt-8">
                {/* サマリー：実績のハイライト */}
                <div className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm mb-10 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-400">
                            <Award size={24} />
                        </div>
                        <div>
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Discoveries</p>
                            <p className="text-xl font-light text-slate-800 tracking-tight">
                                {completedItems.length} <span className="text-sm text-slate-400">Items</span>
                            </p>
                        </div>
                    </div>
                    <div className="h-10 w-[1px] bg-slate-100" />
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Status</p>
                        <p className="text-xs font-medium text-pink-500 italic">Active Explorer</p>
                    </div>
                </div>

                {/* 記録のタイムライン */}
                <div className="space-y-6">
                    {completedItems.length > 0 ? (
                        completedItems.map((item, idx) => (
                            <div key={idx} className="relative pl-8 group">
                                <div className="absolute left-[11px] top-0 bottom-[-24px] w-[2px] bg-slate-100 group-last:bg-transparent" />
                                <div className="absolute left-0 top-1 w-6 h-6 bg-white border-2 border-pink-100 rounded-full flex items-center justify-center z-10">
                                    <div className="w-2 h-2 bg-pink-400 rounded-full" />
                                </div>

                                <div className="bg-white p-5 rounded-[1.8rem] border border-gray-50 shadow-sm group-active:scale-[0.98] transition-all">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h3 className="text-base font-medium text-slate-800 leading-tight mb-1">{item.name}</h3>
                                            <div className="flex items-center gap-1 text-slate-400">
                                                <MapPin size={10} />
                                                <span className="text-[10px] font-medium uppercase tracking-wider">{item.planName}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 bg-pink-50 px-3 py-1 rounded-full text-pink-400">
                                            <CheckCircle size={10} />
                                            <span className="text-[9px] font-bold uppercase tracking-tighter italic">Found</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-50 text-slate-300">
                                        <Calendar size={12} />
                                        <span className="text-[10px] font-medium">
                                            {new Date(item.collectedAt).toLocaleDateString('ja-JP', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                                <Package size={24} className="text-gray-200" />
                            </div>
                            <p className="text-slate-400 text-sm font-light italic">記録された冒険はまだありません</p>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}