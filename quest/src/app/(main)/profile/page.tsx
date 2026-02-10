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

    useEffect(() => {
        const allPlans = getPlans();
        const completedLogs = allPlans.filter(p => (p.items || []).some((i: any) => i.isCollected));

        let dist = 0;
        let itemCount = 0;
        let latestDate: number = 0;

        completedLogs.forEach((plan: any) => {
            dist += plan.totalDistance || 0;
            const items = plan.items || [];
            const collected = items.filter((i: any) => i.isCollected);
            itemCount += collected.length;

            collected.forEach((item: any) => {
                const itemTime = new Date(item.collectedAt).getTime();
                if (itemTime > latestDate) latestDate = itemTime;
            });
        });

        setStats({
            totalDistance: dist,
            totalMissions: completedLogs.length,
            totalItems: itemCount,
            lastActive: latestDate > 0 ? new Date(latestDate).toLocaleDateString('ja-JP') : "-"
        });
    }, []);

    return (
        <div className="min-h-screen bg-white text-black p-8 font-sans pb-32">
            <header className="pt-12 mb-12 text-center">
                <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] mb-2">Navigator Profile</p>
                <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Status</h1>
            </header>

            {/* 統計：無駄を削ぎ落としたグリッド */}
            <div className="grid grid-cols-2 gap-4 mb-12">
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                    <Footprints size={16} className="text-gray-300 mb-4" strokeWidth={1.5} />
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Distance</p>
                    <p className="text-2xl font-black italic">{(stats.totalDistance).toFixed(1)}<span className="text-xs ml-1 font-bold">km</span></p>
                </div>
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                    <MapIcon size={16} className="text-gray-300 mb-4" strokeWidth={1.5} />
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Missions</p>
                    <p className="text-2xl font-black italic">{stats.totalMissions}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                    <Target size={16} className="text-gray-300 mb-4" strokeWidth={1.5} />
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Discoveries</p>
                    <p className="text-2xl font-black italic">{stats.totalItems}</p>
                </div>
                <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                    <Clock size={16} className="text-gray-300 mb-4" strokeWidth={1.5} />
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Last Active</p>
                    <p className="text-lg font-black italic leading-none mt-1">{stats.lastActive}</p>
                </div>
            </div>

            <div className="space-y-3">
                <button
                    onClick={() => router.push('/safety')}
                    className="w-full p-6 bg-white border border-gray-100 rounded-[1.5rem] flex items-center justify-between active:bg-gray-50 transition-all"
                >
                    <div className="flex items-center gap-4">
                        <ShieldCheck size={18} className="text-gray-400" strokeWidth={1.5} />
                        <span className="text-sm font-bold uppercase tracking-tight">Safety Guidelines</span>
                    </div>
                    <ChevronRight size={16} className="text-gray-200" />
                </button>
            </div>

            <p className="mt-20 text-[8px] text-center text-gray-200 font-bold uppercase tracking-[0.4em]">
                Multi-Language AI Concierge Engine
            </p>
        </div>
    );
}