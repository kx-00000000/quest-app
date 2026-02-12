"use client";

import { useEffect, useState } from "react";
import { getPlans } from "@/lib/storage";
import {
    ShieldCheck, ChevronRight, Check, X, CloudUpload, Bell, User,
    Languages, Palette, CreditCard, Award, HelpCircle, LogOut
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
        totalMinutes: 0,
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
        let totalMs = 0;
        let latestDate: number = 0;

        completedLogs.forEach((plan: any) => {
            dist += plan.totalDistance || 0;
            const collected = (plan.items || []).filter((i: any) => i.isCollected);
            itemCount += collected.length;
            const start = new Date(plan.createdAt).getTime();
            const end = new Date(plan.finishedAt || (collected.length > 0 ? collected[collected.length - 1].collectedAt : plan.createdAt)).getTime();
            if (end > start) totalMs += (end - start);
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

    const getStatus = (dist: number) => {
        if (dist >= 100) return { name: "GLOBAL COMMANDER", color: "text-purple-600", bg: "bg-purple-50" };
        if (dist >= 50) return { name: "ELITE NAVIGATOR", color: "text-blue-600", bg: "bg-blue-50" };
        if (dist >= 10) return { name: "ACTIVE VOYAGER", color: "text-pink-600", bg: "bg-pink-50" };
        return { name: "TRAINING CADET", color: "text-gray-400", bg: "bg-gray-50" };
    };

    const status = getStatus(stats.totalDistance);

    return (
        <div className="h-screen bg-white text-black font-sans flex flex-col overflow-hidden">

            {/* --- 【固定エリア：開始】 --- */}
            <div className="shrink-0 z-20 bg-white border-b border-gray-100">
                {/* 1. ヘッダー：名前 */}
                <header className="p-8 pt-16 flex items-center justify-between">
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
                                        className="text-xl font-black uppercase border-b border-pink-500 focus:outline-none bg-transparent w-32"
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
                    <button className="p-2.5 bg-gray-50 rounded-full text-gray-400"><Bell size={18} /></button>
                </header>

                {/* 2. 累計ステータスパネル（ここも固定） */}
                <section className="px-6 pb-6 bg-white">
                    <div className="bg-gray-50/50 rounded-[2rem] p-8 border border-gray-100 text-center relative overflow-hidden">
                        <div className={`inline-block px-3 py-1 rounded-full text-[9px] font-black tracking-widest mb-4 bg-white shadow-sm ${status.color}`}>
                            {status.name}
                        </div>
                        {/* ★ 距離をメインヒーローに変更 */}
                        <div>
                            <span className="text-6xl font-black tracking-tighter text-black">
                                {stats.totalDistance.toFixed(1)}
                            </span>
                            <span className="text-xl font-black ml-1 text-black">KM</span>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Total Exploration Distance</p>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mt-8">
                            <div className="text-left bg-white p-3.5 rounded-2xl shadow-sm border border-gray-50">
                                <p className="text-[7px] font-bold text-gray-300 uppercase mb-0.5">Missions</p>
                                <p className="text-sm font-black text-black">{stats.totalMissions}</p>
                            </div>
                            <div className="text-left bg-white p-3.5 rounded-2xl shadow-sm border border-gray-50">
                                <p className="text-[7px] font-bold text-gray-300 uppercase mb-0.5">Total Time</p>
                                <p className="text-sm font-black text-black">{formatTotalTime(stats.totalMinutes)}</p>
                            </div>
                            <div className="text-left bg-white p-3.5 rounded-2xl shadow-sm border border-gray-50">
                                <p className="text-[7px] font-bold text-gray-300 uppercase mb-0.5">Discoveries</p>
                                <p className="text-sm font-black text-black">{stats.totalItems}</p>
                            </div>
                        </div>
                    </div>
                </section>
            </div>
            {/* --- 【固定エリア：終了】 --- */}

            {/* 3. スクロール可能エリア：メニューリスト */}
            <main className="flex-1 overflow-y-auto pb-32">

                {/* バックアップバナー（スクロール内） */}
                {!isLoggedIn && (
                    <div className="p-6">
                        <div className="p-5 bg-pink-50 rounded-2xl border border-pink-100 flex items-center justify-between gap-4">
                            <div className="flex gap-3 items-center">
                                <CloudUpload size={18} className="text-pink-500" />
                                <div>
                                    <h3 className="text-[10px] font-black text-pink-600 uppercase tracking-wider leading-none mb-1">Cloud Backup</h3>
                                    <p className="text-[9px] font-bold text-pink-400">データを保護してください</p>
                                </div>
                            </div>
                            <button onClick={() => router.push('/auth')} className="px-3 py-1.5 bg-white border border-pink-200 text-pink-500 rounded-lg font-black text-[9px] uppercase shadow-sm">Enable</button>
                        </div>
                    </div>
                )}

                {/* 設定メニュー：グレーアイコン & ライン区切り */}
                <section className="bg-white">
                    <p className="px-8 pt-4 pb-4 text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em]">Profile & Preferences</p>

                    {[
                        { icon: ShieldCheck, label: "個人情報・セキュリティ", path: "/settings/privacy" },
                        { icon: Languages, label: "多言語設定", path: "/settings/language" },
                        { icon: Palette, label: "アプリテーマ設定", path: "/settings/theme" },
                        { icon: CreditCard, label: "サブスクリプション", path: "/settings/subscription" },
                        { icon: Award, label: "安全ガイドライン", path: "/safety" },
                        { icon: HelpCircle, label: "サポートセンター", path: "/support" },
                    ].map((item, idx) => (
                        <button
                            key={idx}
                            onClick={() => router.push(item.path)}
                            className="w-full px-8 py-5 flex items-center justify-between active:bg-gray-50 transition-colors border-b border-gray-50"
                        >
                            <div className="flex items-center gap-5">
                                {/* ★ 全てグレーに統一 */}
                                <div className="text-gray-400">
                                    <item.icon size={20} strokeWidth={2} />
                                </div>
                                <span className="text-sm font-bold text-gray-700 tracking-tight">{item.label}</span>
                            </div>
                            <ChevronRight size={16} className="text-gray-200" />
                        </button>
                    ))}
                </section>

                {/* サインアウト / システム情報 */}
                <div className="p-8 pb-20 text-center">
                    <button className="w-full py-4 flex items-center justify-center gap-2 text-gray-300 font-bold text-[10px] uppercase tracking-[0.2em] border border-gray-100 rounded-xl active:text-red-400 active:border-red-100 transition-all">
                        <LogOut size={14} /> Sign Out / Exit
                    </button>
                    <div className="mt-8 space-y-1">
                        <p className="text-[8px] font-bold text-gray-200 uppercase tracking-[0.4em]">Last Active: {stats.lastActive}</p>
                        <p className="text-[8px] font-bold text-gray-100 uppercase tracking-[0.4em]">Multi-Language AI Concierge Engine v1.0</p>
                    </div>
                </div>
            </main>
        </div>
    );
}