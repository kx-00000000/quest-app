"use client";

import { useEffect, useState } from "react";
import { getPlans } from "@/lib/storage";
import { Footprints, Map as MapIcon, Target, Clock, ShieldCheck, ChevronRight, Check, X, cloudUpload } from "lucide-react";
import { useRouter } from "next/navigation";

export default function MyPage() {
    const router = useRouter();
    const [stats, setStats] = useState({
        totalDistance: 0,
        totalMissions: 0,
        totalItems: 0,
        lastActive: "-"
    });

    const [nickname, setNickname] = useState("Navigator");
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState("");

    // ★ ログイン状態の管理（現状はfalse固定。後にSupabaseのセッション確認に変更）
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const savedName = localStorage.getItem("user_nickname");
        if (savedName) setNickname(savedName);

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

    const handleSaveNickname = () => {
        const trimmed = tempName.trim();
        const finalName = trimmed || "Navigator";
        setNickname(finalName);
        localStorage.setItem("user_nickname", finalName);
        setIsEditing(false);
    };

    return (
        <div className="min-h-screen bg-white text-black p-8 font-sans pb-32">

            {/* ヘッダーセクション */}
            <header className="pt-12 mb-8 text-center min-h-[120px] flex flex-col justify-center">
                <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] mb-3">Navigator Profile</p>
                {isEditing ? (
                    <div className="flex flex-col items-center gap-4 animate-in fade-in duration-300">
                        <input
                            type="text"
                            value={tempName}
                            onChange={(e) => setTempName(e.target.value)}
                            className="text-3xl font-black italic uppercase text-center border-b-2 border-pink-500 focus:outline-none bg-transparent w-full max-w-[240px] px-2"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && handleSaveNickname()}
                            maxLength={15}
                        />
                        <div className="flex gap-4">
                            <button onClick={() => setIsEditing(false)} className="p-2 text-gray-300 hover:text-gray-500 transition-colors">
                                <X size={20} />
                            </button>
                            <button onClick={handleSaveNickname} className="p-2 text-black hover:text-pink-500 transition-colors">
                                <Check size={20} strokeWidth={3} />
                            </button>
                        </div>
                    </div>
                ) : (
                    <div onClick={() => { setTempName(nickname); setIsEditing(true); }} className="group cursor-pointer">
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter leading-none group-hover:text-pink-500 transition-colors">
                            {nickname}
                        </h1>
                        <p className="text-[8px] font-bold text-gray-200 uppercase tracking-[0.2em] mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                            Tap to Edit Name
                        </p>
                    </div>
                )}
            </header>

            {/* ★ バックアップ促進バナー：ゲストユーザーにのみ表示 */}
            {!isLoggedIn && (
                <div className="mb-12 p-6 bg-pink-50 rounded-[2.5rem] border border-pink-100 flex flex-col gap-4 shadow-sm animate-in slide-in-from-top duration-500">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center shadow-sm">
                            <ShieldCheck size={18} className="text-pink-500" />
                        </div>
                        <h3 className="text-[10px] font-black text-pink-500 uppercase tracking-widest">Data Protection</h3>
                    </div>
                    <p className="text-[11px] font-bold text-gray-600 leading-relaxed px-1">
                        現在ゲストとして利用中です。機種変更時にログを引き継ぐため、クラウドバックアップを有効にしてください。
                    </p>
                    <button
                        onClick={() => router.push('/auth')}
                        className="w-full py-4 bg-white border border-pink-200 text-pink-500 rounded-2xl font-black text-[9px] uppercase tracking-[0.2em] shadow-sm active:scale-95 transition-all"
                    >
                        Enable Cloud Backup
                    </button>
                </div>
            )}

            {/* 統計グリッド */}
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
                {/* ... 他のステータス項目はそのまま ... */}
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