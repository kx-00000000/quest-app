"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlans, savePlan } from "@/lib/storage";
import { calculateDistance } from "@/lib/geo";
import {
    CheckCircle2,
    Navigation,
    Loader2,
    Flag,
    Compass,
    Target
} from "lucide-react";

/**
 * 現在地からターゲットへの方位角（Bearing）を計算する
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

    // 1. データ読み込み & コンパス（デバイスの向き）監視
    useEffect(() => {
        const allPlans = getPlans();
        const currentPlan = allPlans.find((p: any) => p.id === id);
        if (!currentPlan) { router.push("/plan"); return; }
        setPlan(currentPlan);

        // iOSとAndroidの両方のコンパスに対応
        const handleOrientation = (event: any) => {
            // ★TSエラー回避：anyにキャストしてwebkitCompassHeadingを読み取る
            if (event.webkitCompassHeading !== undefined) {
                setUserHeading(event.webkitCompassHeading); // iOS Safari
            } else if (event.alpha !== null) {
                setUserHeading(360 - event.alpha); // Android Chrome 等
            }
        };

        if (typeof window !== "undefined" && window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', handleOrientation, true);
        }
        return () => window.removeEventListener('deviceorientation', handleOrientation);
    }, [id, router]);

    // 2. 位置情報監視 & 距離/方位計算
    useEffect(() => {
        if (!plan) return;
        const currentTarget = plan.items.find((i: any) => !i.isCollected);

        if (typeof window !== "undefined" && "geolocation" in navigator) {
            watchId.current = navigator.geolocation.watchPosition((pos) => {
                const currentLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLoc(currentLoc);

                if (currentTarget) {
                    const distKm = calculateDistance(currentLoc.lat, currentLoc.lng, currentTarget.lat, currentTarget.lng);
                    setDistanceToTarget(distKm * 1000); // メートル換算
                    setTargetBearing(calculateBearing(currentLoc.lat, currentLoc.lng, currentTarget.lat, currentTarget.lng));

                    // 100m以内で獲得（お好みの距離に調整してください）
                    if (distKm < 0.1) {
                        setIsAcquired(true);
                        setAcquiredName(currentTarget.locationName || "Unknown Target");
                        setTimeout(() => setIsAcquired(false), 4000);

                        const updatedItems = plan.items.map((item: any) =>
                            item.id === currentTarget.id ? { ...item, isCollected: true, collectedAt: new Date().toISOString() } : item
                        );
                        const newPlan = { ...plan, items: updatedItems, collectedCount: plan.collectedCount + 1 };
                        setPlan(newPlan);
                        savePlan(newPlan);
                    }
                }
            }, (err) => console.error(err), { enableHighAccuracy: true });
        }
        return () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); };
    }, [plan]);

    if (!plan || !userLoc) return (
        <div className="h-screen bg-gray-950 flex items-center justify-center">
            <Loader2 className="animate-spin text-pink-500" />
        </div>
    );

    const currentTarget = plan.items.find((i: any) => !i.isCollected);
    const isAllCleared = !currentTarget;

    // 針の回転角度 = ターゲットの方位 - 自分の向いている方位
    const compassRotation = isAllCleared ? 0 : targetBearing - userHeading;

    return (
        <div className="h-screen bg-gray-950 flex flex-col relative overflow-hidden font-mono text-white">
            {/* 背景演出：グリッドライン */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(#F06292 1px, transparent 1px), linear-gradient(90deg, #F06292 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
            </div>

            {/* 上部：ミッションステータス */}
            <div className="absolute top-0 left-0 right-0 z-20 p-6 bg-gradient-to-b from-black to-transparent">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] animate-pulse">Tracking Satellite...</p>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{plan.name}</h2>
                    </div>
                    <div className="bg-gray-900 border border-pink-500/30 px-4 py-2 rounded-2xl flex flex-col items-center shadow-[0_0_20px_rgba(240,98,146,0.2)]">
                        <span className="text-[8px] font-black text-gray-500 uppercase">Progress</span>
                        <span className="text-lg font-black">{plan.collectedCount} / {plan.itemCount}</span>
                    </div>
                </div>
            </div>

            {/* メイン：デジタル・コンパス */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
                {isAllCleared ? (
                    <div className="text-center space-y-6 animate-in zoom-in">
                        <div className="w-24 h-24 bg-pink-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(240,98,146,0.5)]">
                            <CheckCircle2 size={48} />
                        </div>
                        <h3 className="text-3xl font-black uppercase tracking-tighter italic">Mission Accomplished</h3>
                        <button onClick={() => router.push("/plan")} className="px-8 py-3 bg-white text-black rounded-full font-black text-xs uppercase tracking-widest">Return to Base</button>
                    </div>
                ) : (
                    <>
                        {/* 計器盤 */}
                        <div className="relative w-64 h-64 flex items-center justify-center mb-10">
                            {/* 外周リング */}
                            <div className="absolute inset-0 rounded-full border-[2px] border-white/10"></div>
                            <div className="absolute inset-[-10px] rounded-full border border-pink-500/10 animate-[ping_3s_linear_infinite]"></div>

                            {/* ターゲットを指す針 */}
                            <div
                                className="absolute inset-0 flex items-center justify-center transition-transform duration-300 ease-out"
                                style={{ transform: `rotate(${compassRotation}deg)` }}
                            >
                                <div className="absolute top-0 w-1.5 h-12 bg-pink-500 shadow-[0_0_20px_rgba(240,98,146,1)] rounded-full after:content-[''] after:absolute after:-top-3 after:-left-2 after:border-b-[15px] after:border-x-[10px] after:border-b-pink-500 after:border-x-transparent"></div>
                            </div>

                            {/* 中央のアイコン */}
                            <div className="bg-gray-900 w-16 h-16 rounded-full border border-white/20 flex items-center justify-center">
                                <Compass size={32} className="text-pink-500" />
                            </div>

                            {/* 東西南北ラベル */}
                            <span className="absolute top-2 text-[10px] font-bold text-gray-500">N</span>
                            <span className="absolute bottom-2 text-[10px] font-bold text-gray-500">S</span>
                            <span className="absolute left-2 text-[10px] font-bold text-gray-500">W</span>
                            <span className="absolute right-2 text-[10px] font-bold text-gray-500">E</span>
                        </div>

                        {/* デジタル距離計 */}
                        <div className="text-center space-y-1">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Distance</p>
                            <p className="text-7xl font-black italic tracking-tighter tabular-nums">
                                {distanceToTarget.toFixed(0)}<span className="text-2xl text-pink-500 ml-1">M</span>
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* 下部：ターゲット情報パネル */}
            <div className="p-6 pb-12 bg-gray-900/90 backdrop-blur-xl border-t border-white/10 z-20">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center border border-pink-500/30">
                        <Target size={24} className="text-pink-500 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">Target Identified</p>
                        <p className="text-xl font-black text-white uppercase truncate tracking-tight italic">
                            {currentTarget?.locationName || "All Cleared"}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => router.push("/plan")}
                    className="w-full py-4 bg-white/5 text-gray-500 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] border border-white/5 hover:text-white transition-all"
                >
                    <Flag size={14} className="mr-2 inline" /> Mission Abort
                </button>
            </div>

            {/* 獲得演出 */}
            {isAcquired && (
                <div className="absolute inset-0 z-[3000] flex items-center justify-center p-6 bg-pink-500/20 backdrop-blur-md animate-in fade-in zoom-in duration-300">
                    <div className="bg-black border border-pink-500/50 text-white rounded-[3rem] p-10 shadow-[0_0_50px_rgba(240,98,146,0.4)] text-center space-y-4">
                        <CheckCircle2 size={64} className="text-pink-500 mx-auto animate-bounce" />
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter">Target Secured</h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{acquiredName}</p>
                    </div>
                </div>
            )}
        </div>
    );
}