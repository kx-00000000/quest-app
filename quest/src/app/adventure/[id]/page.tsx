"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlans, savePlan } from "@/lib/storage";
import { calculateDistance } from "@/lib/geo";
import {
    CheckCircle2, Loader2, Flag, ArrowUp, MessageSquare, Send,
    ChevronLeft, ChevronRight, Beaker, Navigation
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

export default function AdventurePage() {
    const params = useParams();
    const router = useRouter();

    // --- ステート管理 ---
    const [plan, setPlan] = useState<any>(null);
    const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [userHeading, setUserHeading] = useState<number>(0);
    const [isTracking, setIsTracking] = useState(false);
    const [manualTargetId, setManualTargetId] = useState<string | null>(null);
    const [distanceToTarget, setDistanceToTarget] = useState<number>(0);
    const [targetBearing, setTargetBearing] = useState<number>(0);
    const [isAcquired, setIsAcquired] = useState(false);
    const [acquiredName, setAcquiredName] = useState("");
    const [isMissionComplete, setIsMissionComplete] = useState(false);
    const [comment, setComment] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    const watchId = useRef<number | null>(null);

    // データ読み込み & コンパス監視
    useEffect(() => {
        const found = getPlans().find(p => p.id === params?.id);
        setPlan(found);

        const handleOrientation = (event: any) => {
            if (event.webkitCompassHeading !== undefined) setUserHeading(event.webkitCompassHeading);
            else if (event.alpha !== null) setUserHeading(360 - event.alpha);
        };
        if (typeof window !== "undefined" && window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleOrientation, true);
        }
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, [params?.id]);

    // ★アイテム獲得ロジック：メタデータの付与
    const handleAcquireItem = (targetItem: any) => {
        // ランダムにカテゴリーとレアリティを決定
        const category = ITEM_CATEGORIES[Math.floor(Math.random() * ITEM_CATEGORIES.length)];
        const rarityRand = Math.random();
        let rarity = RARITIES[0];
        if (rarityRand > 0.95) rarity = RARITIES[2];
        else if (rarityRand > 0.7) rarity = RARITIES[1];

        setAcquiredName(targetItem.locationName || "未確認地点");
        setIsAcquired(true);

        const updatedItems = plan.items.map((item: any) =>
            item.id === targetItem.id ? {
                ...item,
                isCollected: true,
                collectedAt: new Date().toISOString(),
                metadata: {
                    category: category.type,
                    rarity: rarity.level,
                    icon: category.icon
                }
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

    // GPS起動 & 追跡ロジック
    const startGPS = () => {
        if (!navigator.geolocation) {
            setErrorMsg("Geolocation not supported");
            return;
        }
        setIsTracking(true);
        setErrorMsg(null);

        watchId.current = navigator.geolocation.watchPosition((pos) => {
            const currentLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
            setCoords(currentLoc);

            if (plan && !isMissionComplete) {
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

                    // 50m以内で自動獲得
                    if (distKm < 0.05 && !isAcquired) handleAcquireItem(target);
                }
            }
        }, (err) => {
            setErrorMsg(`GPS Error: ${err.message}`);
            setIsTracking(false);
        }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    };

    const handleFinishAdventure = async () => {
        setIsSaving(true);
        const updatedPlan = { ...plan, comment, status: "completed", finishedAt: new Date().toISOString() };
        savePlan(updatedPlan);
        setTimeout(() => router.push("/log"), 800);
    };

    if (!plan) return <div className="h-screen flex items-center justify-center font-black italic text-pink-500">LOADING...</div>;

    const uncollectedItems = plan.items.filter((i: any) => !i.isCollected);
    const activeTarget = manualTargetId
        ? uncollectedItems.find((i: any) => i.id === manualTargetId) || uncollectedItems[0]
        : uncollectedItems.length > 0 && coords ? uncollectedItems.reduce((p: any, c: any) =>
            calculateDistance(coords.lat, coords.lng, p.lat, p.lng) <
                calculateDistance(coords.lat, coords.lng, c.lat, c.lng) ? p : c, uncollectedItems[0]) : null;

    const arrowRotation = isMissionComplete ? 0 : targetBearing - userHeading;

    return (
        <div className="h-screen bg-white flex flex-col relative overflow-hidden text-black font-sans">

            {/* 1. ヘッダー：インジケーター連動 */}
            <header className="p-8 pt-14 flex justify-between items-baseline z-20">
                <div className="flex flex-col gap-3">
                    <h2 className="text-2xl font-black tracking-tighter uppercase italic truncate max-w-[200px]">
                        {plan.name}
                    </h2>
                    <div className="flex gap-2.5 items-center h-4">
                        {plan.items.map((item: any, idx: number) => {
                            const isCurrent = activeTarget && item.id === activeTarget.id;
                            return (
                                <div key={item.id || idx} className="relative flex items-center justify-center">
                                    {isCurrent && !item.isCollected && (
                                        <div className="absolute w-4.5 h-4.5 border-2 border-pink-500/20 rounded-full animate-pulse" />
                                    )}
                                    {item.isCollected ? (
                                        <div className="w-2 h-2 bg-pink-500 rounded-full" />
                                    ) : (
                                        <div className={`w-2 h-2 rounded-full ${isCurrent ? 'bg-pink-500' : 'bg-gray-100 border border-gray-200'}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <p className="text-3xl font-black italic tabular-nums text-gray-900">
                    {plan.collectedCount}<span className="text-sm text-gray-200 mx-1">/</span>{plan.itemCount}
                </p>
            </header>

            {/* 2. メイン：ナビゲーション / GPSモニター */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-10">
                {!isTracking ? (
                    <div className="text-center space-y-10 w-full">
                        <div className="w-full bg-gray-50 rounded-[2.5rem] p-10 border border-gray-100 shadow-inner">
                            <p className="text-[10px] font-black text-gray-300 uppercase mb-4 tracking-widest">System Standby</p>
                            <p className="text-gray-300 italic text-sm">GPS is currently idle.</p>
                            {errorMsg && <p className="text-red-500 font-bold text-xs mt-4">{errorMsg}</p>}
                        </div>
                        <button
                            onClick={startGPS}
                            className="w-full bg-pink-500 text-white font-black py-6 rounded-[2rem] shadow-xl shadow-pink-100 active:scale-95 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest"
                        >
                            <Navigation size={18} fill="currentColor" />
                            Start Tracking
                        </button>
                    </div>
                ) : !isMissionComplete ? (
                    <>
                        <div
                            className="mb-12 transition-transform duration-300 ease-out"
                            style={{ transform: `rotate(${arrowRotation}deg)` }}
                        >
                            <ArrowUp size={140} strokeWidth={2.5} className="text-pink-500" />
                        </div>

                        <div className="text-center">
                            <p className="text-8xl font-black tracking-tighter tabular-nums leading-none text-black">
                                {formatDistanceDisplay(distanceToTarget)}
                            </p>
                            <div className="mt-6 flex items-center justify-center gap-2 text-pink-500">
                                <span className="w-2 h-2 bg-pink-500 rounded-full animate-ping" />
                                <span className="text-[10px] font-black uppercase tracking-widest italic">Signal Active</span>
                            </div>
                        </div>
                    </>
                ) : (
                    /* ミッション完了 */
                    <div className="text-center space-y-6 animate-in fade-in duration-1000 w-full max-w-sm">
                        <CheckCircle2 size={80} className="text-pink-500 mx-auto" />
                        <h3 className="text-3xl font-black uppercase italic text-black leading-none tracking-tighter">Mission Complete</h3>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="今回の冒険はどうでしたか？"
                            className="w-full h-32 bg-gray-50 border border-gray-100 rounded-[1.5rem] p-5 text-sm focus:outline-none focus:border-pink-500/50 transition-all resize-none font-bold placeholder:text-gray-300 text-black"
                        />
                        <button
                            onClick={handleFinishAdventure}
                            disabled={isSaving}
                            className="w-full py-5 bg-pink-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 shadow-lg shadow-pink-500/20 active:scale-95 transition-all"
                        >
                            {isSaving ? <Loader2 className="animate-spin" size={16} /> : "Log entry"}
                        </button>
                    </div>
                )}
            </div>

            {/* 3. 下部：ターゲット切替 & 戻る */}
            {!isMissionComplete && (
                <div className="p-8 pb-20 z-20 flex flex-col items-center">
                    {isTracking && uncollectedItems.length > 0 && (
                        <div className="flex items-center gap-8 mb-10">
                            <button onClick={() => { if (uncollectedItems.length > 1) { const idx = uncollectedItems.findIndex((i: any) => i.id === activeTarget?.id); setManualTargetId(uncollectedItems[(idx - 1 + uncollectedItems.length) % uncollectedItems.length].id); } }} className="p-3 bg-gray-50 rounded-full text-gray-200 active:text-pink-500 transition-colors"><ChevronLeft size={24} /></button>
                            <div className="text-center min-w-[160px]">
                                <h4 className="text-xl font-black uppercase tracking-tight text-black">{activeTarget?.locationName}</h4>
                                <p className="text-[8px] font-bold text-pink-500 uppercase tracking-widest mt-1">{manualTargetId ? "Manual Lock" : "Auto Tracking"}</p>
                            </div>
                            <button onClick={() => { if (uncollectedItems.length > 1) { const idx = uncollectedItems.findIndex((i: any) => i.id === activeTarget?.id); setManualTargetId(uncollectedItems[(idx + 1) % uncollectedItems.length].id); } }} className="p-3 bg-gray-50 rounded-full text-gray-200 active:text-pink-500 transition-colors"><ChevronRight size={24} /></button>
                        </div>
                    )}

                    <button onClick={() => router.back()} className="text-gray-300 font-bold text-[10px] uppercase tracking-[0.3em] underline">
                        Back to Plans
                    </button>
                </div>
            )}

            {/* 4. テスト用ツールバー：最下部に固定 */}
            {isTracking && !isMissionComplete && (
                <div className="fixed bottom-6 left-0 right-0 z-[5000] flex justify-center gap-4 px-8 pointer-events-none">
                    <div className="bg-white/80 backdrop-blur-md border border-gray-100 p-2 rounded-full shadow-lg flex gap-2 pointer-events-auto">
                        <button onClick={() => setDistanceToTarget(48)} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest active:bg-pink-500 transition-colors"><Beaker size={12} /> 近接</button>
                        <button onClick={() => { if (activeTarget) handleAcquireItem(activeTarget); }} className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest active:bg-pink-500 transition-colors"><CheckCircle2 size={12} /> 獲得</button>
                    </div>
                </div>
            )}

            {/* 5. 獲得ポップアップ */}
            {isAcquired && (
                <div className="absolute inset-0 z-[3000] flex items-center justify-center p-6 bg-white/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="text-center space-y-4">
                        <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-pink-500/20">
                            <CheckCircle2 size={40} className="text-white" />
                        </div>
                        <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-black">獲得しました！</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">{acquiredName}</p>
                    </div>
                </div>
            )}
        </div>
    );
}