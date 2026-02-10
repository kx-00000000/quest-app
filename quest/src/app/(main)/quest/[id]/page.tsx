"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlans, savePlan } from "@/lib/storage";
import { calculateDistance } from "@/lib/geo";
import {
    CheckCircle2,
    Loader2,
    Flag,
    ArrowUp,
    MessageSquare,
    Send,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

// 獲得時のランダムな「物語」演出
const ACQUISITION_ACTIONS = [
    { text: "木の上から落ちてきた！" },
    { text: "茂みの中に隠れていた..." },
    { text: "岩の隙間で光っている！" },
    { text: "風に吹かれて飛んできた！" },
    { text: "足元に埋まっていた！" },
    { text: "どこからか現れた！" }
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
    const [userHeading, setUserHeading] = useState<number>(0);

    // ターゲット管理
    const [manualTargetId, setManualTargetId] = useState<string | null>(null);
    const [distanceToTarget, setDistanceToTarget] = useState<number>(0);
    const [targetBearing, setTargetBearing] = useState<number>(0);

    // 演出・完了用
    const [isAcquired, setIsAcquired] = useState(false);
    const [actionMessage, setActionMessage] = useState("");
    const [acquiredName, setAcquiredName] = useState("");
    const [isMissionComplete, setIsMissionComplete] = useState(false);
    const [comment, setComment] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const watchId = useRef<number | null>(null);

    // データ初期化とコンパス監視
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

    // 獲得処理
    const handleAcquireItem = (targetItem: any) => {
        const randomAction = ACQUISITION_ACTIONS[Math.floor(Math.random() * ACQUISITION_ACTIONS.length)];
        setActionMessage(randomAction.text);
        setAcquiredName(targetItem.locationName || "Secured");
        setIsAcquired(true);

        const updatedItems = plan.items.map((item: any) =>
            item.id === targetItem.id ? { ...item, isCollected: true, collectedAt: new Date().toISOString(), story: randomAction.text } : item
        );
        const newCollectedCount = updatedItems.filter((i: any) => i.isCollected).length;
        const newPlan = { ...plan, items: updatedItems, collectedCount: newCollectedCount };

        setPlan(newPlan);
        savePlan(newPlan);
        setManualTargetId(null); // 獲得したらオートに戻す

        if (newCollectedCount === plan.itemCount) {
            setTimeout(() => { setIsAcquired(false); setIsMissionComplete(true); }, 4000);
        } else {
            setTimeout(() => setIsAcquired(false), 4000);
        }
    };

    // 位置情報とターゲット計算
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
                        // ★修正点：p と c に explicit any 型を付与
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

    // ログ保存と遷移
    const handleFinishAdventure = async () => {
        setIsSaving(true);
        const updatedPlan = { ...plan, comment, status: "completed", finishedAt: new Date().toISOString() };
        savePlan(updatedPlan);
        setTimeout(() => router.push("/log"), 800);
    };

    if (!plan || !userLoc) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-pink-500" /></div>;

    const uncollectedItems = plan.items.filter((i: any) => !i.isCollected);
    const activeTarget = manualTargetId
        ? uncollectedItems.find((i: any) => i.id === manualTargetId) || uncollectedItems[0]
        : uncollectedItems.reduce((p: any, c: any) =>
            calculateDistance(userLoc.lat, userLoc.lng, p.lat, p.lng) <
                calculateDistance(userLoc.lat, userLoc.lng, c.lat, c.lng) ? p : c, uncollectedItems[0]);

    const arrowRotation = isMissionComplete ? 0 : targetBearing - userHeading;

    return (
        <div className="h-screen bg-black flex flex-col relative overflow-hidden text-white font-sans">
            <header className="p-8 pt-14 flex justify-between items-baseline z-20">
                <h2 className="text-2xl font-black tracking-tighter uppercase italic truncate max-w-[70%]">{plan.name}</h2>
                <p className="text-3xl font-black italic tabular-nums">{plan.collectedCount}<span className="text-sm text-gray-800 mx-1">/</span>{plan.itemCount}</p>
            </header>

            <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
                {!isMissionComplete ? (
                    <>
                        <div className="mb-12 transition-transform duration-300 ease-out" style={{ transform: `rotate(${arrowRotation}deg)` }}>
                            <ArrowUp size={120} strokeWidth={2.5} className="text-pink-500 drop-shadow-[0_0_30px_rgba(240,98,146,0.3)]" />
                        </div>
                        <p className="text-8xl font-black tracking-tighter tabular-nums leading-none mb-10">
                            {formatDistanceDisplay(distanceToTarget)}
                        </p>

                        <div className="flex items-center gap-6">
                            <button
                                onClick={() => {
                                    const idx = uncollectedItems.findIndex((i: any) => i.id === activeTarget?.id);
                                    const prevIdx = (idx - 1 + uncollectedItems.length) % uncollectedItems.length;
                                    setManualTargetId(uncollectedItems[prevIdx].id);
                                }}
                                className="p-2 text-gray-700 active:text-pink-500"
                            >
                                <ChevronLeft size={24} />
                            </button>
                            <div className="text-center min-w-[160px]">
                                <h4 className="text-xl font-black uppercase tracking-tight">{activeTarget?.locationName}</h4>
                                <p className="text-[8px] font-bold text-pink-500 uppercase tracking-widest mt-1">
                                    {manualTargetId ? "Manual Lock" : "Auto Tracking"}
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    const idx = uncollectedItems.findIndex((i: any) => i.id === activeTarget?.id);
                                    const nextIdx = (idx + 1) % uncollectedItems.length;
                                    setManualTargetId(uncollectedItems[nextIdx].id);
                                }}
                                className="p-2 text-gray-700 active:text-pink-500"
                            >
                                <ChevronRight size={24} />
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-500 px-6">
                        <div className="text-center">
                            <CheckCircle2 size={60} className="text-pink-500 mx-auto mb-4" />
                            <h3 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Mission Complete</h3>
                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-4">冒険の記録を残しましょう</p>
                        </div>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="今回の冒険はどうでしたか？"
                            className="w-full h-40 bg-white/5 border border-white/10 rounded-[2rem] p-6 text-sm focus:outline-none focus:border-pink-500/50 transition-all resize-none font-bold placeholder:text-gray-700"
                        />
                        <button onClick={handleFinishAdventure} disabled={isSaving} className="w-full py-5 bg-pink-500 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2">
                            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <><Send size={16} /> Log entry</>}
                        </button>
                    </div>
                )}
            </div>

            {!isMissionComplete && (
                <div className="p-8 pb-12 z-20">
                    <button onClick={() => router.push("/plan")} className="w-full py-4 bg-white/5 text-gray-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em]"><Flag size={14} className="inline mr-2" /> Mission Abort</button>
                </div>
            )}

            {isAcquired && (
                <div className="absolute inset-0 z-[3000] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="text-center space-y-4 animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(240,98,146,0.5)] animate-bounce"><CheckCircle2 size={40} /></div>
                        <p className="text-pink-500 font-black text-sm uppercase tracking-[0.3em] animate-pulse">{actionMessage}</p>
                        <h3 className="text-4xl font-black italic uppercase tracking-tighter leading-none">Secured</h3>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-2">{acquiredName}</p>
                    </div>
                </div>
            )}
        </div>
    );
}