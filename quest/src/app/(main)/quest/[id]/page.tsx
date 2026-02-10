"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlans, savePlan } from "@/lib/storage";
import { calculateDistance } from "@/lib/geo";
import {
    CheckCircle2, Loader2, Flag, ArrowUp, MessageSquare, Send, ChevronLeft, ChevronRight, Beaker
} from "lucide-react";

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
    const [userHeading, setUserHeading] = useState<number>(0);
    const [manualTargetId, setManualTargetId] = useState<string | null>(null);
    const [distanceToTarget, setDistanceToTarget] = useState<number>(0);
    const [targetBearing, setTargetBearing] = useState<number>(0);
    const [isAcquired, setIsAcquired] = useState(false);
    const [acquiredName, setAcquiredName] = useState("");
    const [isMissionComplete, setIsMissionComplete] = useState(false);
    const [comment, setComment] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const watchId = useRef<number | null>(null);

    useEffect(() => {
        const allPlans = getPlans();
        const currentPlan = allPlans.find((p: any) => p.id === id);
        if (!currentPlan) { router.push("/plan"); return; }
        setPlan(currentPlan);

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
        setAcquiredName(targetItem.locationName || "Secured");
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

    useEffect(() => {
        if (!plan || isMissionComplete) return;

        if (typeof window !== "undefined" && "geolocation" in navigator) {
            watchId.current = navigator.geolocation.watchPosition((pos) => {
                const currentLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLoc(currentLoc);

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
        return () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); };
    }, [plan, isMissionComplete, isAcquired, manualTargetId]);

    const handleFinishAdventure = async () => {
        setIsSaving(true);
        const updatedPlan = { ...plan, comment, status: "completed", finishedAt: new Date().toISOString() };
        savePlan(updatedPlan);
        setTimeout(() => router.push("/log"), 800);
    };

    if (!plan || !userLoc) return <div className="h-screen bg-white flex items-center justify-center"><Loader2 className="animate-spin text-pink-500" /></div>;

    const uncollectedItems = plan.items.filter((i: any) => !i.isCollected);
    const activeTarget = manualTargetId
        ? uncollectedItems.find((i: any) => i.id === manualTargetId) || uncollectedItems[0]
        : uncollectedItems.length > 0 ? uncollectedItems.reduce((p: any, c: any) =>
            calculateDistance(userLoc.lat, userLoc.lng, p.lat, p.lng) <
                calculateDistance(userLoc.lat, userLoc.lng, c.lat, c.lng) ? p : c, uncollectedItems[0]) : null;

    const arrowRotation = isMissionComplete ? 0 : targetBearing - userHeading;

    return (
        <div className="h-screen bg-white flex flex-col relative overflow-hidden text-black font-sans">

            {/* 1. ヘッダー：インジケーターの強化 */}
            <header className="p-8 pt-14 flex justify-between items-baseline z-20">
                <div className="flex flex-col gap-3">
                    <h2 className="text-2xl font-black tracking-tighter uppercase italic truncate max-w-[200px]">
                        {plan.name}
                    </h2>
                    {/* ★進捗ドット：追跡中のアイテムを強調 */}
                    <div className="flex gap-2 items-center h-4">
                        {plan.items.map((item: any, idx: number) => {
                            const isCurrent = activeTarget && item.id === activeTarget.id;
                            return (
                                <div key={item.id || idx} className="relative flex items-center justify-center">
                                    {/* 現在追跡中のアイテムには外側にリングを表示 */}
                                    {isCurrent && !item.isCollected && (
                                        <div className="absolute w-5 h-5 border-2 border-pink-500/30 rounded-full animate-pulse" />
                                    )}
                                    {item.isCollected ? (
                                        <div className="w-2.5 h-2.5 bg-pink-500 rounded-full transition-all duration-500" />
                                    ) : (
                                        <div className={`w-2.5 h-2.5 rounded-full transition-all ${isCurrent ? 'bg-pink-500 scale-125' : 'bg-gray-100 border border-gray-200'}`} />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
                <p className="text-3xl font-black italic tabular-nums text-gray-900">
                    {plan.collectedCount}<span className="text-sm text-gray-300 mx-1">/</span>{plan.itemCount}
                </p>
            </header>

            {/* 2. メイン：ナビゲーション */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                {!isMissionComplete ? (
                    <>
                        <div
                            className="mb-12 transition-transform duration-300 ease-out"
                            style={{ transform: `rotate(${arrowRotation}deg)` }}
                        >
                            <ArrowUp size={120} strokeWidth={2.5} className="text-pink-500" />
                        </div>

                        <div className="text-center">
                            <p className="text-8xl font-black tracking-tighter tabular-nums leading-none text-black">
                                {formatDistanceDisplay(distanceToTarget)}
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="text-center space-y-6 animate-in fade-in duration-700 px-6">
                        <CheckCircle2 size={80} className="text-pink-500 mx-auto" />
                        <h3 className="text-3xl font-black uppercase italic text-black">Mission Complete</h3>
                        <div className="w-full max-w-sm space-y-6">
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
                    </div>
                )}
            </div>

            {/* 3. 下部：ターゲット切替 & 中断 */}
            {!isMissionComplete && (
                <div className="p-8 pb-20 z-20 flex flex-col items-center">
                    <div className="flex items-center gap-8 mb-10">
                        <button
                            onClick={() => { if (uncollectedItems.length > 1) { const idx = uncollectedItems.findIndex((i: any) => i.id === activeTarget?.id); setManualTargetId(uncollectedItems[(idx - 1 + uncollectedItems.length) % uncollectedItems.length].id); } }}
                            className="p-3 bg-gray-50 rounded-full text-gray-300 active:text-pink-500 transition-colors"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <div className="text-center min-w-[160px]">
                            <h4 className="text-xl font-black uppercase tracking-tight text-black">{activeTarget?.locationName}</h4>
                            <p className="text-[8px] font-bold text-pink-500 uppercase tracking-widest mt-1">
                                {manualTargetId ? "Manual Lock" : "Auto Tracking"}
                            </p>
                        </div>
                        <button
                            onClick={() => { if (uncollectedItems.length > 1) { const idx = uncollectedItems.findIndex((i: any) => i.id === activeTarget?.id); setManualTargetId(uncollectedItems[(idx + 1) % uncollectedItems.length].id); } }}
                            className="p-3 bg-gray-50 rounded-full text-gray-300 active:text-pink-500 transition-colors"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    <button
                        onClick={() => router.push("/plan")}
                        className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] active:bg-gray-100 transition-colors"
                    >
                        <Flag size={14} className="inline mr-2" /> Mission Abort
                    </button>
                </div>
            )}

            {/* 4. テスト用ツールバー：最下部に固定表示 */}
            {!isMissionComplete && (
                <div className="fixed bottom-4 left-0 right-0 z-[4000] flex justify-center gap-4 px-8 pointer-events-none">
                    <div className="bg-white/80 backdrop-blur-md border border-gray-100 p-2 rounded-full shadow-lg flex gap-2 pointer-events-auto">
                        <button
                            onClick={() => setDistanceToTarget(48)}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-pink-500 transition-colors"
                        >
                            <Beaker size={12} /> 近接(50m)
                        </button>
                        <button
                            onClick={() => { if (activeTarget) handleAcquireItem(activeTarget); }}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-full text-[9px] font-black uppercase tracking-widest hover:bg-pink-500 transition-colors"
                        >
                            <CheckCircle2 size={12} /> 強制獲得
                        </button>
                    </div>
                </div>
            )}

            {/* 5. 獲得ポップアップ */}
            {isAcquired && (
                <div className="absolute inset-0 z-[3000] flex items-center justify-center p-6 bg-white/90 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="text-center space-y-4 animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-pink-500/20">
                            <CheckCircle2 size={40} className="text-white" />
                        </div>
                        <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-none text-black">Secured</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-2">{acquiredName}</p>
                    </div>
                </div>
            )}
        </div>
    );
}