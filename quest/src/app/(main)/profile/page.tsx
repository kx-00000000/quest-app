"use client";

import { useEffect, useState } from "react";
import { getPlans } from "@/lib/storage";
import { Footprints, Map as MapIcon, Target, Clock, ShieldCheck, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MyPage() {
    const router = useRouter();
    const [stats, setStats] = useState({
        totalDistance: 0,
        totalMissions: 0,
        totalItems: 0,
        lastActive: "-"
    });
    const [discoveries, setDiscoveries] = useState<any[]>([]);

    useEffect(() => {
        const allPlans = getPlans();

        // アイテムを1つ以上取得しているものを「ログ」として抽出
        const completedLogs = allPlans.filter(p => (p.items || []).some((i: any) => i.isCollected));

        let dist = 0;
        let itemCount = 0;
        let allCollected: any[] = [];
        let latestDate: number = 0;

        completedLogs.forEach((plan: any) => {
            dist += plan.totalDistance || 0;
            const items = plan.items || [];
            const collected = items.filter((i: any) => i.isCollected);
            itemCount += collected.length;

            // 最新のアクティビティ日を計算
            collected.forEach((item: any) => {
                const itemTime = new Date(item.collectedAt).getTime();
                if (itemTime > latestDate) latestDate = itemTime;
            });

            allCollected = [...allCollected, ...collected];
        });

        setStats({
            totalDistance: dist,
            totalMissions: completedLogs.length,
            totalItems: itemCount,
            lastActive: latestDate > 0 ? new Date(latestDate).toLocaleDateString('ja-JP') : "-"
        });

        // 最新の発見5件
        const sorted = allCollected.sort((a, b) =>
            new Date(b.collectedAt).getTime() - new Date(a.collectedAt).getTime()
        );
        setDiscoveries(sorted.slice(0, 5));
    }, []);

    return (
        <div className="min-h-screen bg-white text-black p-8 font-sans pb-32">
            <header className="pt-12 mb-12">
                <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] mb-2">Navigator Profile</p>
                <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Status</h1>
            </header>

            {/* 統計：フライトログ風グリッド */}
            <div className="grid grid-cols-2 gap-4 mb-12">
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                    <Footprints size={16} className="text-gray-300 mb-4" />
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Distance</p>
                    <p className="text-2xl font-black italic">{(stats.totalDistance).toFixed(1)}<span className="text-xs ml-1 font-bold">km</span></p>
                </div>
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                    <MapIcon size={16} className="text-gray-300 mb-4" />
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Missions</p>
                    <p className="text-2xl font-black italic">{stats.totalMissions}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                    <Target size={16} className="text-gray-300 mb-4" />
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Discoveries</p>
                    <p className="text-2xl font-black italic">{stats.totalItems}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                    <Clock size={16} className="text-gray-300 mb-4" />
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Last Active</p>
                    <p className="text-lg font-black italic leading-none mt-1">{stats.lastActive}</p>
                </div>
            </div>

            {/* 最新の発見（Explorer Vault への入り口） */}
            <section className="mb-12">
                <div className="flex justify-between items-end mb-6 px-1">
                    <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Latest Discoveries</h2>
                    <button onClick={() => router.push('/item')} className="text-[9px] font-black text-pink-500 uppercase tracking-widest">View All</button>
                </div>
                <div className="space-y-3">
                    {discoveries.length > 0 ? discoveries.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-4 bg-white border border-gray-100 p-4 rounded-2xl shadow-sm">
                            <div className="text-2xl">{item.metadata?.icon || "📍"}</div>
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-black uppercase truncate">{item.locationName}</p>
                                <p className="text-[8px] font-bold text-gray-400 uppercase">{item.metadata?.category || "Discovery"}</p>
                            </div>
                        </div>
                    )) : (
                        <p className="text-xs font-bold text-gray-300 italic px-1">No discoveries recorded yet.</p>
                    )}
                </div>
            </section>

            <div className="space-y-3">
                <button
                    onClick={() => router.push('/safety')}
                    className="w-full p-6 bg-white border border-gray-100 rounded-[1.5rem] flex items-center justify-between active:bg-gray-50 transition-colors"
                >
                    <div className="flex items-center gap-4">
                        <ShieldCheck size={18} className="text-gray-400" />
                        <span className="text-sm font-bold uppercase tracking-tight">Safety Guidelines</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-200" />
                </button>
            </div>
        </div>
    );
}