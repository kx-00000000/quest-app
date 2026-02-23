"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlans, savePlan } from "@/lib/storage";
import { calculateDistance } from "@/lib/geo";
import Compass from "@/components/Compass";
import {
    Loader2, Flag, ChevronLeft, ChevronRight, ShieldAlert, Eye, Lock, MapPin
} from "lucide-react";
import dynamic from "next/dynamic";

// 地図コンポーネントを動的に読み込み
const LazyMap = dynamic<any>(() => import("@/components/Map/LazyMap").then(mod => mod.default), {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-gray-50 animate-pulse" />
});

// --- 設定：ランダム表示用の画像リスト ---
const ITEM_IMAGES = [
    "/images/items/item-1.png",
    "/images/items/item-2.png",
    "/images/items/item-3.png"
];

const ANIMAL_IMAGES = [
    "/images/animals/animal-1.png",
    "/images/animals/animal-2.png",
    "/images/animals/animal-3.png"
];

// --- 距離表示用ヘルパー ---
const getDistanceParts = (meters: number) => {
    if (meters < 1000) {
        return { integer: Math.floor(meters).toLocaleString(), decimal: null, unit: "m" };
    }
    const km = meters / 1000;
    const fixedKm = km.toFixed(1);
    const [intPart, decPart] = fixedKm.split('.');
    return {
        integer: parseInt(intPart).toLocaleString(),
        decimal: "." + decPart,
        unit: "km"
    };
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
    const [currentAreaName, setCurrentAreaName] = useState<string>(""); // 現在地名
    const [manualTargetId, setManualTargetId] = useState<string | null>(null);
    const [distanceToTarget, setDistanceToTarget] = useState<number>(0);
    const [targetBearing, setTargetBearing] = useState<number>(0);
    const [isAcquired, setIsAcquired] = useState(false);
    const [isMissionComplete, setIsMissionComplete] = useState(false);
    const [comment, setComment] = useState("");
    const [isSaving, setIsSaving] = useState(false);
    const [showSafetyDemo, setShowSafetyDemo] = useState(false);
    const [path, setPath] = useState<{ lat: number; lng: number }[]>([]); // 軌跡データ

    const [randomItemImg, setRandomItemImg] = useState("");
    const [randomAnimalImg, setRandomAnimalImg] = useState("");

    const watchId = useRef<number | null>(null);

    useEffect(() => {
        const allPlans = getPlans();
        const currentPlan = allPlans.find((p: any) => p.id === id);
        if (!currentPlan) {
            router.push("/plan");
            return;
        }
        setPlan(currentPlan);
        setPath(currentPlan.path || []); // 以前の軌跡があれば復元

        if (localStorage.getItem("safety_demo_agreed")) {
            startGPS();
        } else {
            setShowSafetyDemo(true);
        }

        return () => {
            if (watchId.current) navigator.geolocation.clearWatch(watchId.current);
        };
    }, [id, router]);

    // 目的地の特定
    const activeTarget = useMemo(() => {
        const items = plan?.items || [];
        const uncollected = items.filter((i: any) => !i.isCollected);
        if (uncollected.length === 0) return null;

        if (manualTargetId) {
            return uncollected.find((i: any) => i.id === manualTargetId) || uncollected[0];
        }

        if (userLoc) {
            return uncollected.map((item: any) => ({
                ...item,
                dist: calculateDistance(userLoc.lat, userLoc.lng, item.lat, item.lng)
            })).sort((a: any, b: any) => a.dist - b.dist)[0];
        }
        return uncollected[0];
    }, [plan, manualTargetId, userLoc]);

    useEffect(() => {
        if (userLoc && activeTarget) {
            const distKm = calculateDistance(userLoc.lat, userLoc.lng, activeTarget.lat, activeTarget.lng);
            setDistanceToTarget(distKm * 1000);
            setTargetBearing(calculateBearing(userLoc.lat, userLoc.lng, activeTarget.lat, activeTarget.lng));

            if (distKm < 0.05 && !isAcquired) {
                handleAcquireItem(activeTarget);
            }
        }
    }, [userLoc, activeTarget, isAcquired]);

    const handleAcquireItem = (targetItem: any) => {
        if (!plan?.items) return;

        setRandomItemImg(ITEM_IMAGES[Math.floor(Math.random() * ITEM_IMAGES.length)]);
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
            setRandomAnimalImg(ANIMAL_IMAGES[Math.floor(Math.random() * ANIMAL_IMAGES.length)]);
            setTimeout(() => {
                setIsAcquired(false);
                setIsMissionComplete(true);
            }, 3000);
        } else {
            setTimeout(() => setIsAcquired(false), 3000);
        }
    };

    const startGPS = () => {
        if (typeof window !== "undefined" && "geolocation" in navigator) {
            const geocoder = new google.maps.Geocoder();

            watchId.current = navigator.geolocation.watchPosition((pos) => {
                const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLoc(newLoc);

                // 現在地の地名取得
                geocoder.geocode({ location: newLoc }, (res, status) => {
                    if (status === "OK" && res?.[0]) {
                        const clean = res[0].formatted_address
                            .replace(/日本、|〒[0-9-]* |[0-9-]{8} /g, "")
                            .split(',').slice(0, 1).join('').trim();
                        setCurrentAreaName(clean);
                    }
                });

                // ★ 軌跡の保存
                setPath(prevPath => {
                    const lastPoint = prevPath[prevPath.length - 1];
                    if (!lastPoint || calculateDistance(lastPoint.lat, lastPoint.lng, newLoc.lat, newLoc.lng) > 0.01) {
                        const newPath = [...prevPath, newLoc];
                        // 永続化
                        if (plan) savePlan({ ...plan, path: newPath });
                        return newPath;
                    }
                    return prevPath;
                });

            }, (err) => console.error("GPS Error:", err), { enableHighAccuracy: true });
        }
    };

    const handleFinishAdventure = async () => {
        setIsSaving(true);
        const updatedPlan = { ...plan, comment, status: "completed", finishedAt: new Date().toISOString(), path };
        savePlan(updatedPlan);
        setTimeout(() => router.push("/log"), 800);
    };

    if (!plan) return <div className="h-screen bg-white flex items-center justify-center font-bold text-gray-900 uppercase tracking-widest">Searching...</div>;

    const items = plan?.items || [];
    const uncollectedItems = items.filter((i: any) => !i.isCollected);

    return (
        <div className="h-screen bg-white flex flex-col relative overflow-hidden text-black font-sans">

            {/* ★ 地図背景レイヤー */}
            <div className="absolute inset-0 z-0">
                <LazyMap items={plan.items} userLocation={userLoc} center={plan.center} path={path} themeColor="#F37343" />
                <div className="absolute inset-0 bg-white/40 backdrop-blur-[2px]" />
            </div>

            {/* 1. ヘッダー */}
            <header className="p-8 pt-14 flex justify-between items-baseline z-20">
                <div className="flex flex-col gap-1 text-left">
                    <h2 className="text-xl font-black tracking-tight uppercase truncate max-w-[200px]">{plan.name}</h2>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{currentAreaName || "Locating..."}</p>
                </div>
                <p className="text-2xl font-black tabular-nums text-black">{plan.collectedCount}<span className="text-sm text-gray-300 mx-1">/</span>{plan.itemCount}</p>
            </header>

            {/* 2. メインコンテンツ */}
            <div className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
                {!isMissionComplete ? (
                    <>
                        <div className="mb-12 relative">
                            <Compass targetBearing={targetBearing} />
                        </div>
                        <div className="text-center">
                            {userLoc ? (() => {
                                const { integer, decimal, unit } = getDistanceParts(distanceToTarget);
                                return (
                                    <div className="flex flex-col items-center">
                                        <div className="flex items-baseline justify-center font-black tracking-tighter tabular-nums text-black">
                                            <span className="text-7xl">{integer}</span>
                                            {decimal && <span className="text-5xl opacity-30">{decimal}</span>}
                                            <span className="ml-2 text-2xl font-bold text-gray-300">{unit}</span>
                                        </div>
                                    </div>
                                );
                            })() : (
                                <div className="text-xl font-black text-black animate-pulse uppercase tracking-[0.2em]">Searching GPS...</div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="text-center w-full max-w-sm space-y-8 animate-in fade-in zoom-in duration-700 relative z-50">
                        {/* クラッカー */}
                        <div className="absolute inset-0 pointer-events-none overflow-visible z-[100]">
                            {[...Array(40)].map((_, i) => {
                                const isLeft = i % 2 === 0;
                                return (
                                    <div key={i} className="confetti" style={{
                                        '--side-multiplier': isLeft ? '1' : '-1',
                                        '--spread': `${Math.random() * 200 + 100}px`,
                                        '--height': `${Math.random() * -400 - 200}px`,
                                        left: isLeft ? '0%' : '100%',
                                        bottom: '20%',
                                        backgroundColor: ['#000000', '#FFD700', '#FF69B4', '#00BFFF', '#ADFF2F'][Math.floor(Math.random() * 5)],
                                        animationDelay: `${Math.random() * 0.3}s`,
                                        width: `${Math.random() * 10 + 6}px`,
                                        height: `${Math.random() * 8 + 4}px`,
                                    } as any} />
                                );
                            })}
                        </div>

                        <div className="relative mx-auto w-full max-w-[300px] z-10">
                            <img src="/images/bg-congrats.png" alt="Congrats" className="w-full h-auto" />
                            {randomAnimalImg && (
                                <img src={randomAnimalImg} className="absolute top-[78%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[58%] h-auto drop-shadow-lg" alt="Animal" />
                            )}
                        </div>

                        <div className="space-y-4 px-4 pt-4 z-20 relative">
                            <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="冒険の記録を残しましょう" className="w-full h-24 bg-gray-50/80 backdrop-blur-md border border-gray-100 rounded-2xl p-4 text-sm font-medium resize-none text-black focus:outline-none" />
                            <button onClick={handleFinishAdventure} disabled={isSaving} className="w-full py-4 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-all shadow-xl">
                                {isSaving ? <Loader2 className="animate-spin mx-auto" size={16} /> : "Save to Log Book"}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* 3. 下部：ナビゲーション */}
            {!isMissionComplete && (
                <div className="p-8 pb-16 z-20 flex flex-col items-center">
                    <div className="flex items-center gap-6 mb-6">
                        <button onClick={() => { if (uncollectedItems.length > 1) { const idx = uncollectedItems.findIndex((i: any) => i.id === activeTarget?.id); setManualTargetId(uncollectedItems[(idx - 1 + uncollectedItems.length) % uncollectedItems.length].id); } }} className="p-2 text-gray-200 active:text-black transition-colors"><ChevronLeft size={32} /></button>

                        <div className="text-center min-w-[160px] flex flex-col items-center gap-4">
                            {/* ★ 修正: locationName を addressName に変更（プラン画面と同じキー） */}
                            <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-black max-w-[200px] truncate">
                                {activeTarget?.addressName || activeTarget?.locationName || "---"}
                            </h4>

                            <div className="flex gap-2.5 items-center h-4">
                                {items.map((item: any, idx: number) => {
                                    const isCurrent = activeTarget && item.id === activeTarget.id;
                                    return (
                                        <div key={item.id || idx} className="relative flex items-center justify-center">
                                            {isCurrent && !item.isCollected && <div className="absolute w-4 h-4 border-2 border-[#F37343]/20 rounded-full animate-ping" />}
                                            <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${item.isCollected ? 'bg-black' : isCurrent ? 'bg-[#F37343] scale-125' : 'bg-gray-200'}`} />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <button onClick={() => { if (uncollectedItems.length > 1) { const idx = uncollectedItems.findIndex((i: any) => i.id === activeTarget?.id); setManualTargetId(uncollectedItems[(idx + 1) % uncollectedItems.length].id); } }} className="p-2 text-gray-200 active:text-black transition-colors"><ChevronRight size={32} /></button>
                    </div>
                    <button onClick={() => router.push("/plan")} className="text-gray-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2 py-2 px-6 border border-gray-100 rounded-full bg-white/50 backdrop-blur-sm shadow-sm"><Flag size={14} /> Abort</button>
                </div>
            )}

            {/* --- アイテム獲得ポップアップ --- */}
            {isAcquired && (
                <div className="absolute inset-0 z-[3000] flex items-center justify-center p-6 bg-white/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="relative text-center w-full max-w-[300px]">
                        <img src="/images/bg-acquired.png" alt="Acquired Background" className="w-full h-auto" />
                        {randomItemImg && (
                            <img src={randomItemImg} alt="Item" className="absolute top-[78%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[35%] h-auto drop-shadow-2xl animate-bounce" />
                        )}
                    </div>
                </div>
            )}

            {/* デバッグ用ツールバー */}
            {!isMissionComplete && (
                <div className="fixed bottom-4 left-0 right-0 z-[5000] flex justify-center gap-4 px-8 pointer-events-none">
                    <div className="bg-white/90 backdrop-blur-md border border-gray-100 p-1.5 rounded-full shadow-lg flex gap-2 pointer-events-auto">
                        <button onClick={() => setDistanceToTarget(48)} className="px-4 py-1.5 bg-gray-50 text-gray-400 rounded-full text-[9px] font-black uppercase tracking-wider active:bg-black active:text-white transition-all">Test Close</button>
                        <button onClick={() => { if (activeTarget) handleAcquireItem(activeTarget); }} className="px-4 py-1.5 bg-black text-white rounded-full text-[9px] font-black uppercase tracking-wider active:scale-95 transition-all">Force Get</button>
                    </div>
                </div>
            )}

            {/* Safety Demo */}
            {showSafetyDemo && (
                <div className="absolute inset-0 z-[6000] bg-white p-10 flex flex-col justify-center animate-in fade-in duration-500 text-left">
                    <div className="mb-10">
                        <p className="text-[10px] font-black text-[#F37343] uppercase tracking-[0.4em] mb-2">Safety Protocol</p>
                        <h2 className="text-3xl font-black uppercase tracking-tighter text-black">Safety First</h2>
                    </div>
                    <div className="space-y-8 mb-12">
                        <div className="flex gap-5 items-start text-left"><Eye className="text-black shrink-0" size={20} /><p className="text-[11px] font-bold leading-relaxed text-gray-500 uppercase tracking-tight">移動中の画面操作は危険です。方位の確認は必ず立ち止まって行ってください。</p></div>
                        <div className="flex gap-5 items-start text-left"><Lock className="text-black shrink-0" size={20} /><p className="text-[11px] font-bold leading-relaxed text-gray-500 uppercase tracking-tight">私有地や立ち入り禁止区域への侵入は厳禁です。現地のルールを遵守してください。</p></div>
                        <div className="flex gap-5 items-start text-left"><ShieldAlert className="text-black shrink-0" size={20} /><p className="text-[11px] font-bold leading-relaxed text-gray-500 uppercase tracking-tight">本アプリ使用中のトラブルについて、運営は一切の責任を負いかねます。</p></div>
                    </div>
                    <button onClick={() => { localStorage.setItem("safety_demo_agreed", "true"); setShowSafetyDemo(false); startGPS(); }} className="w-full py-5 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl active:scale-95 transition-all">Accept and Start</button>
                </div>
            )}

            <style jsx>{`
                .confetti {
                    position: absolute;
                    opacity: 0;
                    border-radius: 2px;
                    animation: twin-burst 4s ease-out infinite;
                }
                @keyframes twin-burst {
                    0% { transform: translate(0, 0) scale(0) rotate(0deg); opacity: 1; }
                    15% { transform: translate(calc(var(--spread) * var(--side-multiplier)), var(--height)) scale(1.2) rotate(180deg); opacity: 1; }
                    30% { transform: translate(calc(var(--spread) * var(--side-multiplier) * 1.2), calc(var(--height) * 1.2)) scale(1) rotate(360deg); opacity: 1; }
                    100% { transform: translate(calc(var(--spread) * var(--side-multiplier) * 1.5), 100vh) scale(0.8) rotate(720deg); opacity: 0; }
                }
            `}</style>
        </div>
    );
}