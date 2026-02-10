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
    Beaker // テスト用アイコン
} from "lucide-react";

/**
 * 距離のフォーマット関数
 * 1km未満: m単位・整数
 * 1km以上: km単位・小数点第一位
 */
const formatDistanceDisplay = (meters: number): string => {
    if (meters < 1000) {
        return `${Math.floor(meters).toLocaleString()}m`;
    }
    const km = meters / 1000;
    return `${km.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}km`;
};

function calculateBearing(startLat: number, startLng: number, destLat: number, destLng: number) {
    const startLatRad = (startLat * Math.PI) / 180;
    const startLngRad = (startLng * Math.PI) / 180;
    const destLatRad = (destLat * Math.PI) / 180;
    const destLngRad = (destLng * Math.PI) / 180;

    const y = Math.sin(destLngRad - startLngRad) * Math.cos(destLatRad);
    const x = Math.cos(startLatRad) * Math.sin(destLatRad) -
        Math.sin(startLatRad) * Math.cos(destLatRad) * Math.cos(destLngRad - startLngRad);
    let brng = Math.atan2(y, x);
    brng = (brng * 180) / Math.PI;
    return (brng + 360) % 360;
}

export default function QuestActivePage() {
    const { id } = useParams();
    const router = useRouter();
    const [plan, setPlan] = useState<any>(null);
    const [userLoc, setUserLoc] = useState<{ lat: number, lng: number } | null>(null);
    const [userHeading, setUserHeading] = useState<number>(0);
    const [targetBearing, setTargetBearing] = useState<number>(0);
    const [distanceToTarget, setDistanceToTarget] = useState<number>(0);
    const [isAcquired, setIsAcquired] = useState(false);
    const [acquiredName, setAcquiredName] = useState("");
    const watchId = useRef<number | null>(null);

    useEffect(() => {
        const allPlans = getPlans();
        const currentPlan = allPlans.find((p: any) => p.id === id);
        if (!currentPlan) { router.push("/plan"); return; }
        setPlan(currentPlan);

        const handleOrientation = (event: any) => {
            if (event.webkitCompassHeading !== undefined) {
                setUserHeading(event.webkitCompassHeading);
            } else if (event.alpha !== null) {
                setUserHeading(360 - event.alpha);
            }
        };

        if (typeof window !== "undefined" && window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleOrientation, true);
        }
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, [id, router]);

    // アイテム獲得の共通処理
    const handleAcquireItem = (targetItem: any) => {
        setIsAcquired(true);
        setAcquiredName(targetItem.locationName || "Area Secured");

        const updatedItems = plan.items.map((item: any) =>
            item.id === targetItem.id ? { ...item, isCollected: true, collectedAt: new Date().toISOString() } : item
        );
        const newPlan = { ...plan, items: updatedItems, collectedCount: (plan.collectedCount || 0) + 1 };
        setPlan(newPlan);
        savePlan(newPlan);

        setTimeout(() => setIsAcquired(false), 4000);
    };

    useEffect(() => {
        if (!plan) return;
        const currentTarget = plan.items.find((i: any) => !i.isCollected);

        if (typeof window !== "undefined" && "geolocation" in navigator) {
            watchId.current = navigator.geolocation.watchPosition((pos) => {
                const currentLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLoc(currentLoc);

                if (currentTarget) {
                    const distKm = calculateDistance(currentLoc.lat, currentLoc.lng, currentTarget.lat, currentTarget.lng);
                    setDistanceToTarget(distKm * 1000);
                    setTargetBearing(calculateBearing(currentLoc.lat, currentLoc.lng, currentTarget.lat, currentTarget.lng));

                    // 50m以内に近づいた時の自動獲得
                    if (distKm < 0.05) {
                        handleAcquireItem(currentTarget);
                    }
                }
            }, (err) => console.error(err), { enableHighAccuracy: true });
        }
        return () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); };
    }, [plan]);

    // 【テスト用】50m以内を擬似再現
    const testProximity = () => {
        setDistanceToTarget(48); // 48mに強制設定
    };

    // 【テスト用】獲得を強制実行
    const testAcquisition = () => {
        const currentTarget = plan?.items.find((i: any) => !i.isCollected);
        if (currentTarget) handleAcquireItem(currentTarget);
    };

    if (!plan || !userLoc) return <div className="h-screen bg-black flex items-center justify-center"><Loader2 className="animate-spin text-pink-500" /></div>;

    const currentTarget = plan.items.find((i: any) => !i.isCollected);
    const isAllCleared = !currentTarget;
    const arrowRotation = isAllCleared ? 0 : targetBearing - userHeading;

    return (
        <div className="h-screen bg-black flex flex-col relative overflow-hidden text-white font-sans selection:bg-pink-500">

            {/* ヘッダー：名前と数字のみ */}
            <header className="p-8 pt-14 flex justify-between items-baseline z-20">
                <h2 className="text-2xl font-black tracking-tighter uppercase italic truncate max-w-[70%]">
                    {plan.name}
                </h2>
                <p className="text-3xl font-black italic tabular-nums">
                    {plan.collectedCount}<span className="text-sm text-gray-700 mx-1">/</span>{plan.itemCount}
                </p>
            </header>

            {/* メイン：矢印と距離 */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                {isAllCleared ? (
                    <div className="text-center space-y-4 animate-in zoom-in">
                        <CheckCircle2 size={80} className="text-pink-500 mx-auto" />
                        <h3 className="text-2xl font-black uppercase italic">Mission Cleared</h3>
                        <button onClick={() => router.push("/plan")} className="text-pink-500 font-bold text-xs uppercase tracking-widest pt-4">Back to Plans</button>
                    </div>
                ) : (
                    <>
                        <div
                            className="mb-12 transition-transform duration-300 ease-out"
                            style={{ transform: `rotate(${arrowRotation}deg)` }}
                        >
                            <ArrowUp size={120} strokeWidth={2.5} className="text-pink-500 drop-shadow-[0_0_30px_rgba(240,98,146,0.3)]" />
                        </div>

                        <div className="text-center">
                            <p className="text-8xl font-black tracking-tighter tabular-nums leading-none">
                                {formatDistanceDisplay(distanceToTarget)}
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* 下部：地名と中断 */}
            <div className="p-8 pb-12 z-20 flex flex-col items-center">
                {!isAllCleared && (
                    <h4 className="text-xl font-black uppercase tracking-tight mb-10 text-center px-4">
                        {currentTarget.locationName}
                    </h4>
                )}

                <button
                    onClick={() => router.push("/plan")}
                    className="w-full py-4 bg-white/5 text-gray-600 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em]"
                >
                    <Flag size={14} className="inline mr-2" /> Mission Abort
                </button>

                {/* ★テスト用ツールバー（開発時のみ使用） */}
                <div className="mt-8 flex gap-4 opacity-30 hover:opacity-100 transition-opacity">
                    <button onClick={testProximity} className="flex items-center gap-1 text-[8px] font-bold border border-white/20 px-2 py-1 rounded">
                        <Beaker size={10} /> 近接テスト(50m)
                    </button>
                    <button onClick={testAcquisition} className="flex items-center gap-1 text-[8px] font-bold border border-white/20 px-2 py-1 rounded">
                        <CheckCircle2 size={10} /> 獲得テスト
                    </button>
                </div>
            </div>

            {/* 獲得ポップアップ */}
            {isAcquired && (
                <div className="absolute inset-0 z-[3000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="text-center space-y-4 animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(240,98,146,0.5)]">
                            <CheckCircle2 size={40} />
                        </div>
                        <h3 className="text-3xl font-black italic uppercase tracking-tighter">Target Secured</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.2em]">{acquiredName}</p>
                    </div>
                </div>
            )}
        </div>
    );
}