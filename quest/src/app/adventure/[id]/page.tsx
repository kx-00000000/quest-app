"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlans, savePlan } from "@/lib/storage";
import { calculateDistance } from "@/lib/geo";
import Compass from "@/components/Compass";
import {
    CheckCircle2, Loader2, Flag, ChevronLeft, ChevronRight, Beaker, ShieldAlert, Eye, Lock
} from "lucide-react";

// --- ヘルパー関数 ---
const formatDistanceDisplay = (meters: number): string => {
    if (meters < 1000) return `${Math.floor(meters).toLocaleString()}m`;
    const km = meters / 1000;
    return `${km.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}km`;
};

function calculateBearing(startLat: number, startLng: number, destLat: number, destLng: number) {
    const startLatRad = (startLat * Math.PI) / 180;
    const startLngRad = (startLng * Math.PI) / 180;
    const destLatRad = (destLat * Math.PI) / 180;
    const destLngRad = (destLng * Math.PI) / 180;
    const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
    const x = Math.cos(startLatRad) * Math.sin(destLatRad) - Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export default function QuestActivePage() {
    const { id } = useParams();
    const router = useRouter();
    const [plan, setPlan] = useState<any>(null);
    const [userLoc, setUserLoc] = useState<{ lat: number, lng: number } | null>(null);
    const [manualTargetId, setManualTargetId] = useState<string | null>(null);
    const [distanceToTarget, setDistanceToTarget] = useState<number>(0);
    const [targetBearing, setTargetBearing] = useState<number>(0);
    const [isAcquired, setIsAcquired] = useState(false);
    const [acquiredName, setAcquiredName] = useState("");
    const [isMissionComplete, setIsMissionComplete] = useState(false);
    const [comment, setComment] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [showSafetyDemo, setShowSafetyDemo] = useState(false);
    const [isTracking, setIsTracking] = useState(false);

    const watchId = useRef<number | null>(null);

    // 1. プランの取得 & 自動開始の判定
    useEffect(() => {
        const allPlans = getPlans();
        const currentPlan = allPlans.find((p: any) => p.id === id);
        if (!currentPlan) {
            router.push("/plan");
            return;
        }
        setPlan(currentPlan);

        // すでに同意済みなら、即座にGPSを開始
        const hasAgreed = localStorage.getItem("safety_demo_agreed");
        if (hasAgreed) {
            startGPS();
        } else {
            setShowSafetyDemo(true);
        }

        return () => {
            if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
        };
    }, [id]);

    // 2. 現在のターゲット特定
    const activeTarget = useMemo(() => {
        const items = plan?.items || [];
        const uncollected = items.filter((i: any) => !i.isCollected);
        if (uncollected.length === 0) return null;

        if (manualTargetId) {
            return uncollected.find((i: any) => i.id === manualTargetId) || uncollected[0];
        }

        if (userLoc) {
            return uncollected.reduce((p: any, c: any) =>
                calculateDistance(userLoc.lat, userLoc.lng, p.lat, p.lng) <
                    calculateDistance(userLoc.lat, userLoc.lng, c.lat, c.lng) ? p : c
            );
        }
        return uncollected[0];
    }, [plan, manualTargetId, userLoc]);

    // 3. 距離と方位の再計算
    useEffect(() => {
        if (userLoc && activeTarget) {
            const distKm = calculateDistance(userLoc.lat, userLoc.lng, activeTarget.lat, activeTarget.lng);
            setDistanceToTarget(distKm * 1000);
            setTargetBearing(calculateBearing(userLoc.lat, userLoc.lng, activeTarget.lat, activeTarget.lng));

            if (distKm < 0.05 && !isAcquired) {
                handleAcquireItem(activeTarget);
            }
        }
    }, [userLoc, activeTarget]);

    const handleAcquireItem = (targetItem: any) => {
        if (!plan?.items) return;
        setAcquiredName(targetItem.locationName || "ポイント");
        setIsAcquired(true);

        const updatedItems = plan.items.map((item: any) =>
            item.id === targetItem.id ? { ...item, isCollected: true, collectedAt: new Date().toISOString() } : item
        );
        const newCollectedCount = updatedItems.filter((i: any) => i.isCollected).length;
        const newPlan = { ...plan, items: updatedItems, collectedCount: newCollectedCount };

        setPlan(newPlan);
        savePlan(newPlan);
        setManualTargetId(null);

        if (newCollectedCount === plan.itemCount) {
            setTimeout(() => { setIsAcquired(false); setIsMissionComplete(true); }, 3000);
        } else {
            setTimeout(() => setIsAcquired(false), 3000);
        }
    };

    const startGPS = () => {
        if (typeof window !== "undefined" && "geolocation" in navigator) {
            setIsTracking(true);
            watchId.current = navigator.geolocation.watchPosition((pos) => {
                setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            }, (err) => console.error("GPS Error:", err), { enableHighAccuracy: true });
        }
    };

    const handleFinishAdventure = async () => {
        setIsSaving(true);
        const updatedPlan = { ...plan, comment, status: "completed", finishedAt: new Date().toISOString() };
        savePlan(updatedPlan);
        setTimeout(() => router.push("/log"), 800);
    };

    if (!plan) return <div className="h-screen bg-white flex items-center justify-center font-black italic text-pink-500 uppercase">Searching Signal...</div>;

    const items = plan?.items || [];
    const uncollectedItems = items.filter((i: any) => !i.isCollected);

    return (
        <div className="h-screen bg-white flex flex-col relative overflow-hidden text-black font-sans">
            {/* 1. ヘッダー */}
            <header className="p-8 pt-14 flex justify-between items-baseline z-20">
                <div className="flex flex-col gap-3">
                    <h2 className="text-2xl font-black tracking-tighter uppercase italic truncate max-w-[200px]">{plan.name}</h2>
                    <div className="flex gap-2.5 items-center h-4">
                        {items.map((item: any, idx: number) => {
                            const isCurrent = activeTarget && item.id === activeTarget.id;
                            return (
                                <div key={item.id || idx} className="relative flex items-center justify-center">
                                    {isCurrent && !item.isCollected && <div className="absolute w-4.5 h-4.5 border-2 border-pink-500/20 rounded-full animate-pulse" />}
                                    {item.isCollected ? <div className="w-2 h-2 bg-pink-500 rounded-full" /> : <div className={`w-2 h-2 rounded-full transition-all ${isCurrent ? 'bg-pink-500 scale-125' : 'bg-gray-100 border border-gray-200'}`} />}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <p className="text-3xl font-black italic tabular-nums text-gray-900">{plan.collectedCount}<span className="text-sm text-gray-200 mx-1">/</span>{plan.itemCount}</p>
            </header>

            {/* 2. メインコンテンツ */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
                {!isMissionComplete ? (
                    <>
                        <div className="mb-12">
                            <Compass targetBearing={targetBearing} />
                        </div>
                        <div className="text-center">
                            <p className="text-8xl font-black tracking-tighter tabular-nums leading-none text-black">
                                {userLoc ? formatDistanceDisplay(distanceToTarget) : "---"}
                            </p>
                            {/* ★ Signal Active 表示を削除しました */}
                        </div>
                    </>
                ) : (
                    <div className="text-center space-y-6 animate-in fade-in duration-1000 w-full px-4">
                        <CheckCircle2 size={80} className="text-pink-500 mx-auto" />
                        <h3 className="text-3xl font-black uppercase italic text-black leading-none tracking-tighter">Mission Complete</h3>
                        <div className="w-full space-y-6">
                            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="今回の冒険はどうでしたか？" className="w-full h-32 bg-gray-50 border border-gray-100 rounded-[1.5rem] p-5 text-sm font-bold resize-none text-black focus:outline-none" />
                            <button onClick={handleFinishAdventure} disabled={isSaving} className="w-full py-5 bg-pink-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">
                                {isSaving ? <Loader2 className="animate-spin" size={16} /> : "Log entry"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. 下部：ターゲット切替 */}
            {!isMissionComplete && (
                <div className="p-8 pb-20 z-20 flex flex-col items-center">
                    <div className="flex items-center gap-8 mb-10">
                        <button onClick={() => { if (uncollectedItems.length > 1) { const idx = uncollectedItems.findIndex((i: any) => i.id === activeTarget?.id); setManualTargetId(uncollectedItems[(idx - 1 + uncollectedItems.length) % uncollectedItems.length].id); } }} className="p-3 bg-gray-50 rounded-full text-gray-300 active:text-pink-500 transition-colors"><ChevronLeft size={24} /></button>
                        <div className="text-center min-w-[160px]">
                            <h4 className="text-xl font-black uppercase tracking-tight text-black">{activeTarget?.locationName || "---"}</h4>
                            {/* ★ Auto Tracking / Manual Lock 表示を削除しました */}
                        </div>
                        <button onClick={() => { if (uncollectedItems.length > 1) { const idx = uncollectedItems.findIndex((i: any) => i.id === activeTarget?.id); setManualTargetId(uncollectedItems[(idx + 1) % uncollectedItems.length].id); } }} className="p-3 bg-gray-50 rounded-full text-gray-200 active:text-pink-500 transition-colors"><ChevronRight size={24} /></button>
                    </div>
                    <button onClick={() => router.push("/plan")} className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em]"><Flag size={14} className="inline mr-2" /> Mission Abort</button>
                </div>
            )}

            {/* テスト用ツールバー */}
            {!isMissionComplete && (
                <div className="fixed bottom-6 left-0 right-0 z-[5000] flex justify-center gap-4 px-8 pointer-events-none">
                    <div className="bg-white/80 backdrop-blur-md border border-gray-100 p-2 rounded-full shadow-lg flex gap-2 pointer-events-auto">
                        <button onClick={() => setDistanceToTarget(48)} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest active:bg-pink-500"><Beaker size={12} /> 近接</button>
                        <button onClick={() => { if (activeTarget) handleAcquireItem(activeTarget); }} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest active:bg-pink-500"><CheckCircle2 size={12} /> 獲得</button>
                    </div>
                </div>
            )}

            {/* Safety Demo */}
            {showSafetyDemo && (
                <div className="absolute inset-0 z-[6000] bg-white p-10 flex flex-col justify-center animate-in fade-in duration-500">
                    <div className="mb-12 text-center">
                        <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] mb-2">Protocol 01</p>
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-black leading-none">Safety Demo</h2>
                    </div>
                    <div className="space-y-10 mb-16">
                        <div className="flex gap-6 items-start"><Eye className="text-pink-500 shrink-0 mt-1" size={24} /><div className="space-y-1"><h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Attention</h4><p className="text-xs font-bold leading-relaxed text-gray-600">移動中の画面操作は危険です。方位の確認は必ず立ち止まり、周囲の安全を確保してください。</p></div></div>
                        <div className="flex gap-6 items-start"><Lock className="text-pink-500 shrink-0 mt-1" size={24} /><div className="space-y-1"><h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Respect</h4><p className="text-xs font-bold leading-relaxed text-gray-600">私有地、線路、立ち入り禁止区域への侵入は厳禁です。現地のルールを最優先してください。</p></div></div>
                        <div className="flex gap-6 items-start"><ShieldAlert className="text-pink-500 shrink-0 mt-1" size={24} /><div className="space-y-1"><h4 className="text-[10px] font-black uppercase tracking-widest text-gray-400">Disclaimer</h4><p className="text-xs font-bold leading-relaxed text-gray-600">本アプリの使用中に発生したトラブルについて、運営は責任を負いかねます。</p></div></div>
                    </div>
                    <button onClick={() => { localStorage.setItem("safety_demo_agreed", "true"); setShowSafetyDemo(false); startGPS(); }} className="w-full py-6 bg-black text-white rounded-[2rem] font-black text-[10px] uppercase tracking-[0.3em] shadow-2xl active:scale-95 transition-all">了解して冒険を開始する</button>
                </div>
            )}
        </div>
    );
}