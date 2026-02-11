"use client";

// v2 

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlans, savePlan } from "@/lib/storage";
import { calculateDistance } from "@/lib/geo";
// ★ 1. 新しいコンパスコンポーネントをインポート
import Compass from "@/components/Compass";
import {
    CheckCircle2, Loader2, Flag, MessageSquare, Send, ChevronLeft, ChevronRight, Beaker, ShieldAlert, Eye, Lock
} from "lucide-react";

// --- 定数定義 ---
const ITEM_CATEGORIES = [
    { type: 'Artifact', label: '遺物', icon: '💎' },
    { type: 'Nature', label: '自然', icon: '🌿' },
    { type: 'Urban', label: '都市', icon: '🏢' },
    { type: 'Landmark', label: '名所', icon: '🏛️' },
];

const RARITIES = [
    { level: 'Common', label: '通常', weight: 0.7 },
    { level: 'Rare', label: '希少', weight: 0.25 },
    { level: 'Legendary', label: '伝説', weight: 0.05 },
];

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
    // ★ 以前の矢印用HeadingステートはCompass内で管理するため、ここでは最小限に留めます
    const [userHeading, setUserHeading] = useState<number>(0);
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

    useEffect(() => {
        const allPlans = getPlans();
        const currentPlan = allPlans.find((p: any) => p.id === id);
        if (!currentPlan) { router.push("/plan"); return; }
        setPlan(currentPlan);

        // 方位情報の取得（ページ全体でも必要であれば残しますが、基本はCompassコンポーネントに任せます）
        const handleOrientation = (event: any) => {
            if (event.webkitCompassHeading !== undefined) setUserHeading(event.webkitCompassHeading);
            else if (event.alpha !== null) setUserHeading(360 - event.alpha);
        };
        if (typeof window !== "undefined" && window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleOrientation, true);
        }
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, [id, router]);

    const handleAcquireItem = (targetItem: any) => {
        const category = ITEM_CATEGORIES[Math.floor(Math.random() * ITEM_CATEGORIES.length)];
        const rarityRand = Math.random();
        let rarity = RARITIES[0];
        if (rarityRand > 0.95) rarity = RARITIES[2];
        else if (rarityRand > 0.7) rarity = RARITIES[1];

        setAcquiredName(targetItem.locationName || "ポイント");
        setIsAcquired(true);

        const updatedItems = plan.items.map((item: any) =>
            item.id === targetItem.id ? {
                ...item,
                isCollected: true,
                collectedAt: new Date().toISOString(),
                metadata: { category: category.type, rarity: rarity.level, icon: category.icon }
            } : item
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
                const currentLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLoc(currentLoc);

                if (!plan) return;
                const uncollected = plan.items.filter((i: any) => !i.isCollected);
                if (uncollected.length > 0) {
                    let target = uncollected[0];
                    if (manualTargetId) {
                        target = uncollected.find((i: any) => i.id === manualTargetId) || uncollected[0];
                    } else {
                        target = uncollected.reduce((p: any, c: any) =>
                            calculateDistance(currentLoc.lat, currentLoc.lng, p.lat, p.lng) <
                                calculateDistance(currentLoc.lat, currentLoc.lng, c.lat, c.lng) ? p : c
                        );
                    }

                    const distKm = calculateDistance(currentLoc.lat, currentLoc.lng, target.lat, target.lng);
                    setDistanceToTarget(distKm * 1000);
                    setTargetBearing(calculateBearing(currentLoc.lat, currentLoc.lng, target.lat, target.lng));

                    if (distKm < 0.05 && !isAcquired) handleAcquireItem(target);
                }
            }, (err) => console.error(err), { enableHighAccuracy: true });
        }
    };

    const initiateTracking = () => {
        const hasAgreed = localStorage.getItem("safety_demo_agreed");
        if (hasAgreed) startGPS();
        else setShowSafetyDemo(true);
    };

    const handleFinishAdventure = async () => {
        setIsSaving(true);
        const updatedPlan = { ...plan, comment, status: "completed", finishedAt: new Date().toISOString() };
        savePlan(updatedPlan);
        setTimeout(() => router.push("/log"), 800);
    };

    if (!plan) return <div className="h-screen bg-white flex items-center justify-center font-black italic text-pink-500">LOADING...</div>;

    const uncollectedItems = plan.items.filter((i: any) => !i.isCollected);
    const activeTarget = manualTargetId
        ? uncollectedItems.find((i: any) => i.id === manualTargetId) || uncollectedItems[0]
        : uncollectedItems.length > 0 && userLoc ? uncollectedItems.reduce((p: any, c: any) =>
            calculateDistance(userLoc.lat, userLoc.lng, p.lat, p.lng) <
                calculateDistance(userLoc.lat, userLoc.lng, c.lat, c.lng) ? p : c, uncollectedItems[0]) : null;

    return (
        <div className="h-screen bg-white flex flex-col relative overflow-hidden text-black font-sans">

            {/* 1. ヘッダー */}
            <header className="p-8 pt-14 flex justify-between items-baseline z-20">
                <div className="flex flex-col gap-3">
                    <h2 className="text-2xl font-black tracking-tighter uppercase italic truncate max-w-[200px]">{plan.name}</h2>
                    <div className="flex gap-2.5 items-center h-4">
                        {plan.items.map((item: any, idx: number) => {
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

            {/* 2. メインコンテンツ：ここを新しいコンパスに差し替え */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
                {!isTracking ? (
                    <div className="text-center space-y-8 w-full max-w-xs">
                        <div className="bg-gray-50 rounded-[2.5rem] p-10 border border-gray-100">
                            <p className="text-[10px] font-black text-gray-300 uppercase mb-4 tracking-widest">Pre-flight Status</p>
                            <p className="text-gray-400 italic font-bold">GPS is currently idle.</p>
                        </div>
                        <button onClick={initiateTracking} className="w-full bg-pink-500 text-white font-black py-6 rounded-3xl shadow-xl shadow-pink-100 active:scale-95 transition-all uppercase text-[10px] tracking-[0.2em]">Start Tracking</button>
                    </div>
                ) : !isMissionComplete ? (
                    <>
                        {/* ★ 修正ポイント：画像ベースのコンパスコンポーネントに置き換え */}
                        <div className="mb-12">
                            <Compass targetBearing={targetBearing} />
                        </div>

                        <div className="text-center">
                            <p className="text-8xl font-black tracking-tighter tabular-nums leading-none text-black">
                                {userLoc ? formatDistanceDisplay(distanceToTarget) : "---"}
                            </p>
                            <div className="mt-6 flex items-center justify-center gap-2 text-pink-500">
                                <span className="w-2 h-2 bg-pink-500 rounded-full animate-ping" />
                                <span className="text-[10px] font-black uppercase tracking-widest italic">Signal Active</span>
                            </div>
                        </div>
                    </>
                ) : (
                    /* ミッション完了画面 */
                    <div className="text-center space-y-6 animate-in fade-in duration-1000 w-full px-4">
                        <CheckCircle2 size={80} className="text-pink-500 mx-auto" />
                        <h3 className="text-3xl font-black uppercase italic text-black leading-none tracking-tighter">Mission Complete</h3>
                        <div className="w-full space-y-6">
                            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="今回の冒険はどうでしたか？" className="w-full h-32 bg-gray-50 border border-gray-100 rounded-[1.5rem] p-5 text-sm font-bold resize-none text-black" />
                            <button onClick={handleFinishAdventure} disabled={isSaving} className="w-full py-5 bg-pink-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-lg active:scale-95 transition-all">
                                {isSaving ? <Loader2 className="animate-spin" size={16} /> : "Log entry"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. 下部：ターゲット切替 */}
            {isTracking && !isMissionComplete && (
                <div className="p-8 pb-20 z-20 flex flex-col items-center">
                    <div className="flex items-center gap-8 mb-10">
                        <button onClick={() => { if (uncollectedItems.length > 1) { const idx = uncollectedItems.findIndex((i: any) => i.id === activeTarget?.id); setManualTargetId(uncollectedItems[(idx - 1 + uncollectedItems.length) % uncollectedItems.length].id); } }} className="p-3 bg-gray-50 rounded-full text-gray-300 active:text-pink-500"><ChevronLeft size={24} /></button>
                        <div className="text-center min-w-[160px]">
                            <h4 className="text-xl font-black uppercase tracking-tight text-black">{activeTarget?.locationName}</h4>
                            <p className="text-[8px] font-bold text-pink-500 uppercase tracking-widest mt-1">{manualTargetId ? "Manual Lock" : "Auto Tracking"}</p>
                        </div>
                        <button onClick={() => { if (uncollectedItems.length > 1) { const idx = uncollectedItems.findIndex((i: any) => i.id === activeTarget?.id); setManualTargetId(uncollectedItems[(idx + 1) % uncollectedItems.length].id); } }} className="p-3 bg-gray-50 rounded-full text-gray-200 active:text-pink-500"><ChevronRight size={24} /></button>
                    </div>
                    <button onClick={() => router.push("/plan")} className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em]"><Flag size={14} className="inline mr-2" /> Mission Abort</button>
                </div>
            )}

            {/* テスト用ツールバー */}
            {isTracking && !isMissionComplete && (
                <div className="fixed bottom-6 left-0 right-0 z-[5000] flex justify-center gap-4 px-8 pointer-events-none">
                    <div className="bg-white/80 backdrop-blur-md border border-gray-100 p-2 rounded-full shadow-lg flex gap-2 pointer-events-auto">
                        <button onClick={() => setDistanceToTarget(48)} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-[9px] font-black tracking-widest uppercase active:bg-pink-500 transition-colors"><Beaker size={12} /> 近接</button>
                        <button onClick={() => { if (activeTarget) handleAcquireItem(activeTarget); }} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-[9px] font-black tracking-widest uppercase active:bg-pink-500 transition-colors"><CheckCircle2 size={12} /> 獲得</button>
                    </div>
                </div>
            )}

            {/* 獲得ポップアップ & Safety Demo は変更なし */}
            {isAcquired && (
                <div className="absolute inset-0 z-[3000] flex items-center justify-center p-6 bg-white/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center mx-auto shadow-xl">
                            <CheckCircle2 size={40} className="text-white" />
                        </div>
                        <h3 className="text-4xl font-black italic uppercase tracking-tighter text-black">獲得しました！</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">{acquiredName}</p>
                    </div>
                </div>
            )}

            {showSafetyDemo && (
                <div className="absolute inset-0 z-[6000] bg-white p-10 flex flex-col justify-center animate-in fade-in duration-500">
                    <div className="mb-12">
                        <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] mb-2 text-center">Protocol 01</p>
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-black text-center leading-none">Safety Demo</h2>
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