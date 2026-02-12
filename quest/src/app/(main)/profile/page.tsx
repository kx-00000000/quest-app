"use client";

import { useEffect, useState } from "react";
import { getPlans } from "@/lib/storage";
import {
    Footprints, Map as MapIcon, Target, Clock, ShieldCheck,
    ChevronRight, Check, X, CloudUpload, Bell, User,
    Languages, Palette, CreditCard, Award, HelpCircle, LogOut
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ProfilePage() {
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

    // ステータス判定（マリオット風のランク分け）
    const getStatus = (count: number) => {
        if (count >= 50) return { name: "LEGEND VOYAGER", color: "text-purple-600", bg: "bg-purple-50" };
        if (count >= 20) return { name: "ELITE EXPLORER", color: "text-blue-600", bg: "bg-blue-50" };
        if (count >= 5) return { name: "ACTIVE TREKKER", color: "text-pink-600", bg: "bg-pink-50" };
        return { name: "NOVICE ROAMER", color: "text-gray-400", bg: "bg-gray-50" };
    };

    const status = getStatus(stats.totalMissions);

    return (
        <div className="min-h-screen bg-gray-50/30 text-black font-sans pb-32">

            {/* 0. ヘッダー：名前と通知 */}
            <header className="bg-white p-8 pt-16 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-5">
                    <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center text-white shrink-0 shadow-lg">
                        <User size={32} />
                    </div>
                    <div className="min-h-[60px] flex flex-col justify-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1">Account Holder</p>
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    className="text-2xl font-black uppercase border-b-2 border-pink-500 focus:outline-none bg-transparent w-40"
                                    autoFocus
                                    maxLength={15}
                                />
                                <button onClick={handleSaveNickname} className="p-1 text-pink-500"><Check size={20} strokeWidth={3} /></button>
                                <button onClick={() => setIsEditing(false)} className="p-1 text-gray-300"><X size={20} /></button>
                            </div>
                        ) : (
                            <h1
                                onClick={() => { setTempName(nickname); setIsEditing(true); }}
                                className="text-2xl font-black uppercase tracking-tighter cursor-pointer hover:text-pink-500 transition-colors"
                            >
                                {nickname}
                            </h1>
                        )}
                    </div>
                </div>
                <button className="p-3 bg-gray-50 rounded-full text-gray-400 active:scale-90 transition-transform">
                    <Bell size={20} />
                </button>
            </header>

            <main className="p-6 space-y-6">

                {/* ① 累計ステータス：マリオット風のメインパネル  */}
                <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 overflow-hidden relative">
                    <div className="text-center relative z-10">
                        <div className={`inline-block px-3 py-1 rounded-full text-[9px] font-black tracking-widest mb-4 ${status.bg} ${status.color}`}>
                            {status.name}
                        </div>
                        <div className="flex flex-col items-center">
                            <span className="text-7xl font-black tracking-tighter text-black">{stats.totalMissions}</span>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Missions Completed</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mt-8">
                        <div className="bg-gray-50/80 p-5 rounded-3xl border border-gray-50">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight mb-1">Total Distance</p>
                            <p className="text-xl font-black text-black">{stats.totalDistance.toFixed(1)} <span className="text-xs">KM</span></p>
                        </div>
                        <div className="bg-gray-50/80 p-5 rounded-3xl border border-gray-50">
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight mb-1">Discoveries</p>
                            <p className="text-xl font-black text-black">{stats.totalItems} <span className="text-xs">PCS</span></p>
                        </div>
                    </div>
                </section>

                {/* クラウドバックアップバナー：デザインを統合 */}
                {!isLoggedIn && (
                    <div className="p-6 bg-pink-50 rounded-[2rem] border border-pink-100 flex items-center justify-between gap-4">
                        <div className="flex gap-4 items-center">
                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm shrink-0">
                                <CloudUpload size={20} className="text-pink-500" />
                            </div>
                            <div>
                                <h3 className="text-[11px] font-black text-pink-600 uppercase tracking-wider">Cloud Sync</h3>
                                <p className="text-[10px] font-bold text-pink-400 leading-tight">データを保護してください</p>
                            </div>
                        </div>
                        <button
                            onClick={() => router.push('/auth')}
                            className="px-4 py-2.5 bg-pink-500 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-md active:scale-95 transition-all"
                        >
                            Enable
                        </button>
                    </div>
                )}

                {/* ② 設定リスト：マリオットの整理された項目群  */}
                <section className="space-y-2">
                    <p className="px-4 text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-3">System Settings</p>

                    {[
                        { icon: ShieldCheck, label: "個人情報・セキュリティ", color: "text-blue-500", path: "/settings/privacy" },
                        { icon: Languages, label: "言語・AI音声設定", color: "text-purple-500", path: "/settings/language" },
                        { icon: Palette, label: "アプリのテーマカラー", color: "text-pink-500", path: "/settings/theme" },
                        { icon: CreditCard, label: "サブスクリプション", color: "text-green-500", path: "/settings/subscription" },
                        { icon: Award, label: "Safety Guidelines", color: "text-orange-500", path: "/safety" },
                        { icon: HelpCircle, label: "カスタマーサポート", color: "text-gray-400", path: "/support" },
                    ].map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => router.push(item.path)}
                            className="w-full bg-white p-5 rounded-[1.5rem] flex items-center justify-between shadow-sm active:bg-gray-50 transition-all border border-transparent active:border-gray-100"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-xl bg-gray-50 ${item.color}`}>
                                    <item.icon size={20} strokeWidth={2} />
                                </div>
                                <span className="text-sm font-bold text-gray-700 uppercase tracking-tight">{item.label}</span>
                            </div>
                            <ChevronRight size={18} className="text-gray-200" />
                        </button>
                    ))}
                </section>

                <button className="w-full py-8 flex items-center justify-center gap-2 text-gray-300 font-bold text-[10px] uppercase tracking-[0.3em] active:text-red-400 transition-colors">
                    <LogOut size={14} /> Sign Out / Exit
                </button>
            </header>

            <p className="mt-4 text-[8px] text-center text-gray-200 font-bold uppercase tracking-[0.4em]">
                Multi-Language AI Concierge v1.0
            </p>
        </div>
    );
}