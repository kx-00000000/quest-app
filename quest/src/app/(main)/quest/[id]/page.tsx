"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlans, savePlan } from "@/lib/storage";
import { calculateDistance } from "@/lib/geo";
import { CheckCircle2, Navigation, Loader2, Flag, Compass, Target } from "lucide-react";

// コンパスの角度計算（北を0度とする）
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
    const [userHeading, setUserHeading] = useState<number>(0); // ユーザーの向き
    const [targetBearing, setTargetBearing] = useState<number>(0); // ターゲットの方位
    const [distanceToTarget, setDistanceToTarget] = useState<number>(0); // ターゲットまでの距離
    const [isAcquired, setIsAcquired] = useState(false);
    const [acquiredName, setAcquiredName] = useState("");
    const watchId = useRef<number | null>(null);

    // 1. データ読み込み & デバイスの向き取得開始
    useEffect(() => {
        const allPlans = getPlans();
        const currentPlan = allPlans.find((p: any) => p.id === id);
        if (!currentPlan) { router.push("/plan"); return; }
        setPlan(currentPlan);

        // デバイスのコンパス連動
        if (window.DeviceOrientationEvent) {
            window.addEventListener('deviceorientation', (event) => {
                if (event.webkitCompassHeading) {
                    setUserHeading(event.webkitCompassHeading);
                } else if (event.alpha) {
                    setUserHeading(360 - event.alpha);
                }
            });
        }
    }, [id, router]);

    // 2. 位置情報監視 & 計算 & 獲得判定
    useEffect(() => {
        if (!plan) return;
        const currentTarget = plan.items.find((i: any) => !i.isCollected);

        if ("geolocation" in navigator) {
            watchId.current = navigator.geolocation.watchPosition((pos) => {
                const currentLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLoc(currentLoc);

                if (currentTarget) {
                    // 距離と方位を計算
                    const distKm = calculateDistance(currentLoc.lat, currentLoc.lng, currentTarget.lat, currentTarget.lng);
                    setDistanceToTarget(distKm * 1000); // メートルに変換
                    setTargetBearing(calculateBearing(currentLoc.lat, currentLoc.lng, currentTarget.lat, currentTarget.lng));

                    // 50m以内で獲得
                    if (distKm < 0.05) {
                        setIsAcquired(true);
                        setAcquiredName(currentTarget.locationName || "Unknown Target");
                        setTimeout(() => setIsAcquired(false), 4000);

                        // プラン更新
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
        return () => { if (watchId.current) navigator.geolocation.clearWatch(watchId.current); };
    }, [plan]);

    if (!plan || !userLoc) return <div className="h-screen bg-gray-950 flex items-center justify-center"><Loader2 className="animate-spin text-pink-500" /></div>;

    const currentTarget = plan.items.find((i: any) => !i.isCollected);
    const isAllCleared = !currentTarget;
    // コンパスの針の回転角：ターゲットの方位 - ユーザーの向き
    const compassRotation = isAllCleared ? 0 : targetBearing - userHeading;

    return (
        <div className="h-screen bg-gray-950 flex flex-col relative overflow-hidden font-mono text-white">
            {/* 背景のグリッド演出 */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(240,98,146,0.1)0,rgba(0,0,0,0.5)100%)] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

            {/* 上部：ステータス & 進捗 */}
            <div className="absolute top-0 left-0 right-0 z-20 p-6">
                <div className="flex justify-between items-start">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.2em] animate-pulse">Signal Tracking Active</p>
                        <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">{plan.name}</h2>
                    </div>
                    <div className="bg-gray-900/80 backdrop-blur-md px-4 py-2 rounded-full border border-pink-500/30 flex items-center gap-3 shadow-[0_0_15px_rgba(240,98,146,0.3)]">
                        <Target size={16} className="text-pink-500" />
                        <span className="text-lg font-black">{plan.collectedCount} <span className="text-xs text-gray-400">/</span> {plan.itemCount}</span>
                    </div>
                </div>
            </div>

            {/* メイン：コンパス計器盤 */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10">
                {isAllCleared ? (
                    <div className="text-center space-y-4 animate-in zoom-in">
                        <CheckCircle2 size={64} className="text-pink-500 mx-auto animate-bounce" />
                        <h3 className="text-3xl font-black uppercase tracking-tighter italic">Mission Complete</h3>
                    </div>
                ) : (
                    <>
                        {/* コンパスリング */}
                        <div className="relative w-72 h-72 flex items-center justify-center mb-12">
                            <div className="absolute inset-0 rounded-full border-[4px] border-gray-800/50 shadow-[0_0_30px_rgba(0,0,0,1)]"></div>
                            <div className="absolute inset-2 rounded-full border-[2px] border-pink-500/20 animate-[spin_10s_linear_infinite]"></div>

                            {/* ターゲット方向を示す針 */}
                            <div
                                className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out"
                                style={{ transform: `rotate(${compassRotation}deg)` }}
                            >
                                <div className="absolute top-0 w-1 h-12 bg-pink-500 rounded-full shadow-[0_0_15px_rgba(240,98,146,0.8)] after:content-[''] after:absolute after:-top-2 after:-left-1.5 after:border-b-[12px] after:border-x-[8px] after:border-b-pink-500 after:border-x-transparent"></div>
                            </div>
                            <Compass size={32} className="text-gray-500 absolute top-4" />
                            <div className="text-xs font-black text-gray-500 absolute bottom-4 tracking-widest">N</div>
                        </div>

                        {/* 距離計 */}
                        <div className="text-center space-y-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Distance to Target</p>
                            <p className="text-6xl font-black tracking-tighter italic tabular-nums">
                                {distanceToTarget.toFixed(0)} <span className="text-xl text-pink-500">M</span>
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* 下部：ターゲット名と中断ボタン */}
            <div className="p-6 pb-12 bg-gray-900/80 backdrop-blur-md border-t border-white/10 z-20">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 bg-black/50 rounded-2xl flex items-center justify-center border border-pink-500/30">
                        <Navigation size={24} className="text-pink-500 animate-pulse" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Locked Objective</p>
                        <p className="text-xl font-black text-white uppercase truncate tracking-tight italic">
                            {currentTarget?.locationName || "All Objectives Cleared"}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => router.push("/plan")}
                    className="w-full py-5 bg-black/40 text-gray-400 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 transition-all border border-white/10 hover:bg-white/5 hover:text-white"
                >
                    <Flag size={16} /> Mission Abort
                </button>
            </div>

            {/* 獲得演出 */}
            {isAcquired && (
                <div className="absolute inset-0 z-[3000] flex items-center justify-center p-6 bg-pink-500/20 backdrop-blur-xl animate-in fade-in duration-300">
                    <div className="bg-black/80 text-white rounded-[3rem] p-12 shadow-[0_0_80px_rgba(240,98,146,0.6)] text-center space-y-6 animate-in zoom-in-90 border border-pink-500/30">
                        <div className="w-24 h-24 bg-pink-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(240,98,146,0.8)] animate-bounce">
                            <CheckCircle2 size={48} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black italic uppercase tracking-tighter leading-none text-pink-500">Target Secured</h3>
                            <p className="text-sm font-bold text-white mt-3 uppercase tracking-[0.2em]">{acquiredName}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}