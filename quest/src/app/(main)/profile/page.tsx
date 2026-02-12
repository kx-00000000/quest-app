"use client";

import { useEffect, useState } from "react";
import { getPlans } from "@/lib/storage";
import {
    ShieldCheck, ChevronRight, Check, X, CloudUpload, Bell, User,
    Languages, Palette, CreditCard, Award, HelpCircle, LogOut, Clock
} from "lucide-react";
import { useRouter } from "next/navigation";

// --- 時間フォーマット用ヘルパー ---
const formatTotalTime = (mins: number) => {
    const h = Math.floor(mins / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h ${mins % 60}m`;
    return `${mins}m`;
};

export default function ProfilePage() {
    const router = useRouter();
    const [stats, setStats] = useState({
        totalDistance: 0,
        totalMissions: 0,
        totalItems: 0,
        totalMinutes: 0, // ★ 追加
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
        let totalMs = 0; // 時間合算用
        let latestDate: number = 0;

        completedLogs.forEach((plan: any) => {
            // 距離
            dist += plan.totalDistance || 0;

            // アイテム
            const collected = (plan.items || []).filter((i: any) => i.isCollected);
            itemCount += collected.length;

            // 時間計算
            const start = new Date(plan.createdAt).getTime();
            const end = new Date(plan.finishedAt || (collected.length > 0 ? collected[collected.length - 1].collectedAt : plan.createdAt)).getTime();
            if (end > start) totalMs += (end - start);

            // 最終アクティブ
            if (end > latestDate) latestDate = end;
        });

        setStats({
            totalDistance: dist,
            totalMissions: completedLogs.length,
            totalItems: itemCount,
            totalMinutes: Math.floor(totalMs / (1000 * 60)),
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

    const getStatus = (count: number) => {
        if (count >= 50) return { name: "LEGEND VOYAGER", color: "text-purple-600", bg: "bg-purple-50" };
        if (count >= 20) return { name: "ELITE EXPLORER", color: "text-blue-600", bg: "bg-blue-50" };
        if (count >= 5) return { name: "ACTIVE TREKKER", color: "text-pink-600", bg: "bg-pink-50" };
        return { name: "NOVICE ROAMER", color: "text-gray-400", bg: "bg-gray-50" };
    };

    const status = getStatus(stats.totalMissions);

    return (
        <div className="h-screen bg-white text-black font-sans flex flex-col overflow-hidden">

            {/* 1. 固定ヘッダー */}
            <header className="bg-white p-8 pt-16 border-b border-gray-100 flex items-center justify-between shrink-0 z-20">
                <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-black rounded-full flex items-center justify-center text-white shrink-0 shadow-md">
                        <User size={28} />
                    </div>
                    <div className="flex flex-col">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-0.5">Account Holder</p>
                        {isEditing ? (
                            <div className="flex items-center gap-2">
                                <input
                                    type="text"
                                    value={tempName}
                                    onChange={(e) => setTempName(e.target.value)}
                                    className="text-xl font-black uppercase border-b-2 border-pink-500 focus:outline-none bg-transparent w-32"
                                    autoFocus
                                    maxLength={15}
                                />
                                <button onClick={handleSaveNickname} className="text-pink-500"><Check size={18} strokeWidth={3} /></button>
                                <button onClick={() => setIsEditing(false)} className="text-gray-300"><X size={18} /></button>
                            </div>
                        ) : (
                            <h1 onClick={() => { setTempName(nickname); setIsEditing(true); }} className="text-xl font-black uppercase tracking-tighter cursor-pointer hover:text-pink-500 transition-colors">
                                {nickname}
                            </h1>
                        )}
                    </div>
                </div>
                <button className="p-2.5 bg-gray-50 rounded-full text-gray-400 active:scale-90 transition-transform">
                    <Bell size={18} />
                </button>
            </header>

            {/* 2. スクロール可能エリア */}
            <main className="flex-1 overflow-y-auto pb-32">

                {/* 累計ステータスパネル */}
                <section className="p-6 bg-gray-50/50 border-b border-gray-100">
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 text-center">
                        <div className={`inline-block px-3 py-1 rounded-full text-[9px] font-black tracking-widest mb-4 ${status.bg} ${status.color}`}>
                            {status.name}
                        </div>
                        <div>
                            <span className="text-6xl font-black tracking-tighter text-black">{stats.totalMissions}</span>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Missions Completed</p>
                        </div>

                        {/* ★ 3カラムに拡張された統計グリッド */}
                        <div className="grid grid-cols-3 gap-2 mt-8">
                            <div className="text-left bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                                <p className="text-[7px] font-bold text-gray-400 uppercase tracking-tight mb-1">Distance</p>
                                <p className="text-sm font-black text-black leading-tight">{stats.totalDistance.toFixed(1)}<span className="text-[8px] ml-0.5">KM</span></p>
                            </div>
                            <div className="text-left bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                                <p className="text-[7px] font-bold text-gray-400 uppercase tracking-tight mb-1">Total Time</p>
                                <p className="text-sm font-black text-black leading-tight">{formatTotalTime(stats.totalMinutes)}</p>
                            </div>
                            <div className="text-left bg-gray-50/50 p-4 rounded-2xl border border-gray-50">
                                <p className="text-[7px] font-bold text-gray-400 uppercase tracking-tight mb-1">Discoveries</p>
                                <p className="text-sm font-black text-black leading-tight">{stats.totalItems}<span className="text-[8px] ml-0.5">PCS</span></p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* クラウドバックアップバナー */}
                {!isLoggedIn && (
                    <div className="p-6 bg-white">
                        <div className="p-5 bg-pink-50 rounded-2xl border border-pink-100 flex items-center justify-between gap-4 shadow-sm">
                            <div className="flex gap-3 items-center">
                                <CloudUpload size={18} className="text-pink-500" />
                                <div>
                                    <h3 className="text-[10px] font-black text-pink-600 uppercase tracking-wider">Cloud Backup</h3>
                                    <p className="text-[9px] font-bold text-pink-400">データを保護してください</p>
                                </div>
                            </div>
                            <button onClick={() => router.push('/auth')} className="px-3 py-1.5 bg-white border border-pink-200 text-pink-500 rounded-lg font-black text-[9px] uppercase shadow-sm active:scale-95">Enable</button>
                        </div>
                    </div>
                )}

                {/* 設定メニュー：ライン区切り */}
                <section className="bg-white">
                    <p className="px-8 pt-8 pb-4 text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em]">Profile & Preferences</p>

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
                            className="w-full px-8 py-5 flex items-center justify-between active:bg-gray-50 transition-colors border-b border-gray-50"
                        >
                            <div className="flex items-center gap-5">
                                <div className={`${item.color}`}>
                                    <item.icon size={20} strokeWidth={2} />
                                </div>
                                <span className="text-sm font-bold text-gray-700 tracking-tight">{item.label}</span>
                            </div>
                            <ChevronRight size={16} className="text-gray-200" />
                        </button>
                    ))}
                </section>

                {/* サインアウトエリア */}
                <div className="p-8 pb-20 text-center">
                    <button className="w-full py-4 flex items-center justify-center gap-2 text-gray-300 font-bold text-[10px] uppercase tracking-[0.2em] border border-gray-100 rounded-xl active:text-red-400 active:border-red-100 transition-all">
                        <LogOut size={14} /> Sign Out / Exit
                    </button>
                    <p className="mt-8 text-[8px] font-bold text-gray-200 uppercase tracking-[0.4em]">
                        Last Active: {stats.lastActive}
                    </p>
                    <p className="mt-2 text-[8px] font-bold text-gray-100 uppercase tracking-[0.4em]">
                        Multi-Language AI Concierge v1.0
                    </p>
                </div>
            </main>
        </div>
    );
}