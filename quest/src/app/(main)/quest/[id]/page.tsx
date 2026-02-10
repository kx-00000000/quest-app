"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlans, savePlan } from "@/lib/storage";
import { calculateDistance } from "@/lib/geo";
import {
    CheckCircle2,
    Loader2,
    Flag,
    Navigation,
    ArrowUp // シンプルな矢印用
} from "lucide-react";

/**
 * 方位角の計算
 */
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

    // 1. データとコンパス（向き）の監視
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

    // 2. 位置情報の監視
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

                    // 100m以内で獲得
                    if (distKm < 0.1) {
                        setIsAcquired(true);
                        setAcquiredName(currentTarget.locationName || "Area Secured");
                        setTimeout(() => setIsAcquired(false), 4000);

                        const updatedItems = plan.items.map((item: any) =>
                            item.id === currentTarget.id ? { ...item, isCollected: true, collectedAt: new Date().toISOString() } : item
                        );
                        const newPlan = { ...plan, items: updatedItems, collectedCount: (plan.collectedCount || 0) + 1 };
                        setPlan(newPlan);
                        savePlan(newPlan);
                    }
                }
            }, (err) => console.error(err), { enableHighAccuracy: true });
        }
        return () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); };
    }, [plan]);

    if (!plan || !userLoc) return (
        <div className="h-screen bg-black flex items-center justify-center">
            <Loader2 className="animate-spin text-pink-500" />
        </div>
    );

    const currentTarget = plan.items.find((i: any) => !i.isCollected);
    const isAllCleared = !currentTarget;

    // 矢印の回転角度（ターゲットの方位 - 自分の向き）
    const arrowRotation = isAllCleared ? 0 : targetBearing - userHeading;

    return (
        <div className="h-screen bg-black flex flex-col relative overflow-hidden text-white font-sans">

            {/* 上部：進捗状況 */}
            <header className="p-8 pt-12 flex justify-between items-center z-20">
                <div className="space-y-1">
                    <h2 className="text-xl font-black tracking-tight uppercase italic leading-none">{plan.name}</h2>
                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Searching...</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest mb-1">Progress</p>
                    <p className="text-2xl font-black italic leading-none">
                        {plan.collectedCount}<span className="text-sm text-gray-600 mx-1">/</span>{plan.itemCount}
                    </p>
                </div>
            </header>

            {/* メイン：コンパス・ナビゲーション */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-10">
                {isAllCleared ? (
                    <div className="text-center space-y-4 animate-in zoom-in duration-500">
                        <CheckCircle2 size={80} className="text-pink-500 mx-auto" />
                        <h3 className="text-2xl font-black uppercase tracking-tighter italic">Mission Cleared</h3>
                        <button onClick={() => router.push("/plan")} className="text-pink-500 font-bold text-sm uppercase tracking-widest pt-4">Return to Plans</button>
                    </div>
                ) : (
                    <>
                        {/* シンプルな方向指示器 */}
                        <div className="relative w-64 h-64 flex items-center justify-center mb-12">
                            {/* ガイドライン */}
                            <div className="absolute inset-0 rounded-full border border-white/5"></div>
                            <div className="absolute inset-0 rounded-full border border-white/5 scale-75"></div>

                            {/* メイン矢印：iPhoneコンパス風の力強いデザイン */}
                            <div
                                className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
                                style={{ transform: `rotate(${arrowRotation}deg)` }}
                            >
                                <div className="relative flex flex-col items-center">
                                    <ArrowUp size={80} strokeWidth={3} className="text-pink-500 drop-shadow-[0_0_20px_rgba(240,98,146,0.4)]" />
                                    <div className="w-1.5 h-1.5 bg-pink-500 rounded-full mt-2"></div>
                                </div>
                            </div>
                        </div>

                        {/* 距離表示 */}
                        <div className="text-center">
                            <p className="text-7xl font-black tracking-tighter tabular-nums">
                                {distanceToTarget.toFixed(0)}<span className="text-xl text-gray-500 ml-2 font-bold">m</span>
                            </p>
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] mt-2">To Target</p>
                        </div>
                    </>
                )}
            </div>

            {/* 下部：ターゲット情報と中止ボタン */}
            <div className="p-8 pb-12 z-20">
                {!isAllCleared && (
                    <div className="mb-10 text-center">
                        <div className="inline-flex items-center gap-2 mb-2">
                            <Navigation size={12} className="text-pink-500" />
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Locked Target</span>
                        </div>
                        <h4 className="text-lg font-black uppercase truncate">{currentTarget.locationName}</h4>
                    </div>
                )}

                <button
                    onClick={() => router.push("/plan")}
                    className="w-full py-4 bg-white/5 hover:bg-white/10 text-gray-500 hover:text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2"
                >
                    <Flag size={14} /> Mission Abort
                </button>
            </div>

            {/* 獲得演出 */}
            {isAcquired && (
                <div className="absolute inset-0 z-[3000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="text-center space-y-4 animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(240,98,146,0.5)]">
                            <CheckCircle2 size={40} />
                        </div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter">Target Secured</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">{acquiredName}</p>
                    </div>
                </div>
            )}
        </div>
    );
}