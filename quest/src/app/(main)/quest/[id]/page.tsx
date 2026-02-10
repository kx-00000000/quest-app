"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlans, savePlan } from "@/lib/storage";
import { calculateDistance } from "@/lib/geo";
import {
    CheckCircle2,
    Loader2,
    Flag,
    Target,
    Gauge // 計器っぽいアイコンを追加
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
                    setDistanceToTarget(distKm * 1000);
                    setTargetBearing(calculateBearing(currentLoc.lat, currentLoc.lng, currentTarget.lat, currentTarget.lng));

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
        <div className="h-screen bg-[#121212] flex items-center justify-center">
            <Loader2 className="animate-spin text-orange-500" />
        </div>
    );

    const currentTarget = plan.items.find((i: any) => !i.isCollected);
    const isAllCleared = !currentTarget;

    // 針の回転角度（ターゲットの方位）
    const needleRotation = isAllCleared ? 0 : targetBearing;
    // コンパス盤の回転角度（自分の向きの逆）
    const dialRotation = -userHeading;

    return (
        <div className="h-screen bg-[#121212] flex flex-col relative overflow-hidden font-mono text-gray-200">
            {/* 背景：計器盤のテクスチャ */}
            <div className="absolute inset-0 pointer-events-none bg-[url('/noise.png')] opacity-10 mix-blend-overlay"></div>
            <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle at center, #2a2a2a 0%, #121212 100%)' }}>
            </div>

            {/* 上部：控えめなステータス */}
            <div className="absolute top-0 left-0 right-0 z-20 p-6 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Gauge size={16} className="text-orange-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-orange-500 uppercase tracking-widest">ADF ACTIVE</span>
                </div>
                <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                    TGT: {plan.collectedCount}/{plan.itemCount}
                </div>
            </div>

            {/* メイン：航空計器 (ADF風) */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
                {isAllCleared ? (
                    <div className="text-center space-y-6 animate-in zoom-in">
                        <CheckCircle2 size={64} className="text-orange-500 mx-auto" />
                        <h3 className="text-2xl font-bold uppercase tracking-widest text-orange-500">ALL CLEAR</h3>
                        <button onClick={() => router.push("/plan")} className="px-6 py-2 bg-[#2a2a2a] text-gray-300 rounded border border-gray-700 font-bold text-xs uppercase tracking-widest hover:bg-[#333] hover:text-white transition-colors">RTB</button>
                    </div>
                ) : (
                    <div className="relative w-72 h-72 md:w-96 md:h-96">
                        {/* 計器のベゼル（外枠） */}
                        <div className="absolute inset-0 rounded-full border-[8px] border-[#0a0a0a] shadow-[inset_0_0_20px_rgba(0,0,0,0.8),0_5px_15px_rgba(0,0,0,0.5)] bg-[#1a1a1a]"></div>

                        {/* コンパス盤（回転する文字盤） */}
                        <div
                            className="absolute inset-4 rounded-full bg-[#0a0a0a] border-2 border-[#333] flex items-center justify-center transition-transform duration-300 ease-out"
                            style={{ transform: `rotate(${dialRotation}deg)` }}
                        >
                            {/* 目盛りと文字（SVGで描画） */}
                            <svg className="w-full h-full" viewBox="0 0 100 100">
                                {/* 細かい目盛り */}
                                {[...Array(36)].map((_, i) => (
                                    <line key={i} x1="50" y1="5" x2="50" y2={i % 9 === 0 ? "15" : "10"} stroke={i % 9 === 0 ? "#eab308" : "#555"} strokeWidth={i % 9 === 0 ? "1.5" : "0.5"} transform={`rotate(${i * 10} 50 50)`} />
                                ))}
                                {/* 主要な方位文字 */}
                                <text x="50" y="24" textAnchor="middle" fill="#eab308" fontSize="6" fontWeight="bold">N</text>
                                <text x="80" y="52" textAnchor="middle" fill="#eab308" fontSize="6" fontWeight="bold" transform="rotate(90 80 52)">E</text>
                                <text x="50" y="84" textAnchor="middle" fill="#eab308" fontSize="6" fontWeight="bold">S</text>
                                <text x="20" y="52" textAnchor="middle" fill="#eab308" fontSize="6" fontWeight="bold" transform="rotate(270 20 52)">W</text>
                            </svg>
                        </div>

                        {/* ターゲット指示針（太い矢印） */}
                        <div
                            className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]"
                            style={{ transform: `rotate(${needleRotation}deg)` }}
                        >
                            <svg width="20" height="90" viewBox="0 0 20 90" className="absolute -top-8">
                                <path d="M10 0 L20 20 L14 20 L14 90 L6 90 L6 20 L0 20 Z" fill="#f97316" stroke="#c2410c" strokeWidth="1" />
                            </svg>
                        </div>

                        {/* 中央のキャップ */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-6 h-6 rounded-full bg-[#0a0a0a] border-2 border-[#333] shadow-[inset_0_1px_2px_rgba(255,255,255,0.1)]"></div>
                        </div>

                        {/* 下部：デジタル距離表示（計器内） */}
                        <div className="absolute bottom-10 inset-x-0 text-center">
                            <div className="inline-block bg-[#0a0a0a] border border-[#333] px-4 py-1 rounded shadow-inner">
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-0.5">DIST</p>
                                <p className="text-2xl font-bold text-orange-500 tabular-nums tracking-tighter">
                                    {distanceToTarget.toFixed(0)}<span className="text-xs text-gray-500 ml-1">M</span>
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* 下部：ターゲット情報 & 中断 */}
            <div className="p-6 pb-12 bg-[#121212] border-t border-[#2a2a2a] z-20">
                <div className="flex items-center gap-3 mb-4">
                    <Target size={16} className="text-orange-500" />
                    <p className="text-xs font-bold text-gray-300 uppercase truncate tracking-wider">
                        {currentTarget?.locationName || "---"}
                    </p>
                </div>

                <button
                    onClick={() => router.push("/plan")}
                    className="w-full py-3 bg-[#1a1a1a] text-gray-400 rounded border border-[#333] font-bold text-[10px] uppercase tracking-[0.2em] hover:bg-[#222] hover:text-gray-200 transition-all flex items-center justify-center gap-2"
                >
                    <Flag size={12} /> ABORT
                </button>
            </div>

            {/* 獲得演出（シンプルに） */}
            {isAcquired && (
                <div className="absolute inset-0 z-[3000] flex items-center justify-center p-6 bg-black/80 animate-in fade-in duration-200">
                    <div className="bg-[#1a1a1a] border border-orange-500/50 text-gray-200 rounded p-8 shadow-[0_0_50px_rgba(249,115,22,0.4)] text-center space-y-4">
                        <h3 className="text-xl font-bold uppercase tracking-widest text-orange-500">TARGET ACQUIRED</h3>
                        <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{acquiredName}</p>
                    </div>
                </div>
            )}
        </div>
    );
}