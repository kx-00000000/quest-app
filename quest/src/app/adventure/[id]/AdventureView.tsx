"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
    Navigation, Compass, Target, CheckCircle2,
    MessageCircle, ArrowRight, Shield, AlertTriangle,
    ChevronUp, ChevronDown, MapPin, X
} from "lucide-react";
import { calculateDistance, calculateBearing } from "@/lib/geo";
import { updatePlan } from "@/lib/storage";
import dynamic from "next/dynamic";

// --- ★ LazyMap 用の型定義 ---
interface LazyMapProps {
    items?: any[];
    center?: { lat: number; lng: number };
    userLocation?: { lat: number; lng: number } | null;
    radiusInKm?: number;
    themeColor?: string;
    isLogMode?: boolean;
    isBriefingActive?: boolean;
    isFinalOverview?: boolean;
    planId?: string | null;
    onBriefingStateChange?: (state: boolean) => void;
    onBriefingComplete?: () => void;
}

// --- ★ dynamic インポートに型を適用 ---
const LazyMap = dynamic<LazyMapProps>(
    () => import("@/components/Map/LazyMap").then((mod) => mod.default),
    {
        ssr: false,
        loading: () => <div className="h-full w-full bg-gray-50 animate-pulse flex items-center justify-center text-[10px] font-bold text-gray-300 tracking-widest">CALIBRATING NAV-SYSTEM...</div>
    }
);

interface AdventureViewProps {
    plan: any;
}

export default function AdventureView({ plan: initialPlan }: AdventureViewProps) {
    const router = useRouter();
    const [plan, setPlan] = useState(initialPlan);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
    const [isComplete, setIsComplete] = useState(false);
    const [comment, setComment] = useState("");
    const [showSafeNav, setShowSafeNav] = useState(true);

    // 1. 位置情報の常時監視
    useEffect(() => {
        if (typeof window !== "undefined" && "geolocation" in navigator) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setUserLocation(newLoc);
                    checkCollection(newLoc);
                },
                (err) => console.warn(err),
                { enableHighAccuracy: true }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, [plan]);

    // 2. アイテム収集判定
    const checkCollection = (loc: { lat: number; lng: number }) => {
        let changed = false;
        const updatedItems = plan.items.map((item: any) => {
            if (!item.isCollected) {
                const dist = calculateDistance(loc.lat, loc.lng, item.lat, item.lng);
                if (dist < 0.05) { // 50m以内に近づいたら収集
                    changed = true;
                    return { ...item, isCollected: true, collectedAt: new Date().toISOString() };
                }
            }
            return item;
        });

        if (changed) {
            const updatedPlan = { ...plan, items: updatedItems };
            setPlan(updatedPlan);
            updatePlan(updatedPlan);

            if (updatedItems.every((i: any) => i.isCollected)) {
                setIsComplete(true);
            }
        }
    };

    // 3. 最も近い未収集アイテムの計算
    const nearestItem = useMemo(() => {
        if (!userLocation) return null;
        const uncollected = plan.items.filter((i: any) => !i.isCollected);
        if (uncollected.length === 0) return null;

        return uncollected.map((item: any) => ({
            ...item,
            distance: calculateDistance(userLocation.lat, userLocation.lng, item.lat, item.lng),
            bearing: calculateBearing(userLocation.lat, userLocation.lng, item.lat, item.lng)
        })).sort((a: any, b: any) => a.distance - b.distance)[0];
    }, [userLocation, plan.items]);

    const handleFinish = () => {
        const finalPlan = { ...plan, finishedAt: new Date().toISOString(), comment, status: "completed" };
        updatePlan(finalPlan);
        router.push("/log");
    };

    const items = plan.items || [];

    return (
        <div className="relative h-screen bg-white overflow-hidden flex flex-col">
            {/* 1. 背景地図（固定表示） */}
            <div className="absolute inset-0 z-0">
                {/* ★ 修正ポイント：型定義済みの LazyMap に Props を正しく渡す */}
                <LazyMap
                    items={items}
                    userLocation={userLocation}
                    themeColor="#E6672E"
                    center={plan.center}
                />
                <div className="absolute inset-0 bg-white/20 backdrop-blur-[2px]" />
            </div>

            {/* 2. 上部：ナビゲーションパネル（航空計器風） */}
            <header className="relative z-10 p-6 pt-16">
                <div className="bg-black/90 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-2xl border border-white/10 text-white">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] mb-1">Active Mission</p>
                            <h1 className="text-xl font-black uppercase tracking-tighter truncate w-48">{plan.name}</h1>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Status</p>
                            <div className="flex items-center gap-2 justify-end">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-xs font-black uppercase tracking-tighter">On Course</span>
                            </div>
                        </div>
                    </div>

                    {nearestItem ? (
                        <div className="grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-white/5 rounded-2xl">
                                    <Navigation className="text-pink-500" size={20} style={{ transform: `rotate(${nearestItem.bearing}deg)` }} />
                                </div>
                                <div>
                                    <p className="text-[8px] font-bold text-gray-500 uppercase mb-0.5">Distance</p>
                                    <p className="text-lg font-black tabular-nums">
                                        {(nearestItem.distance < 1) ? `${Math.floor(nearestItem.distance * 1000)}m` : `${nearestItem.distance.toFixed(1)}km`}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 border-l border-white/5 pl-4">
                                <div className="p-3 bg-white/5 rounded-2xl text-gray-400">
                                    <Compass size={20} />
                                </div>
                                <div>
                                    <p className="text-[8px] font-bold text-gray-500 uppercase mb-0.5">Heading</p>
                                    <p className="text-lg font-black tabular-nums">{Math.floor(nearestItem.bearing)}°</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-2 flex flex-col items-center gap-2">
                            <CheckCircle2 className="text-green-500" size={32} />
                            <p className="text-xs font-black uppercase tracking-widest">All Waypoints Cleared</p>
                        </div>
                    )}
                </div>
            </header>

            {/* 3. 完了時のオーバーレイ */}
            {isComplete && (
                <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in fade-in duration-500">
                    <div className="bg-white rounded-[3rem] p-8 w-full max-w-sm shadow-2xl text-center space-y-8">
                        <header>
                            <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 className="text-pink-500" size={32} />
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter">Mission Complete</h2>
                            <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">航路の全記録を完了しました</p>
                        </header>

                        <div className="space-y-2 text-left">
                            <p className="text-[9px] font-black text-pink-500 uppercase tracking-widest px-2">Mission Log Note</p>
                            <textarea
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                placeholder="今回の冒険にコメントを残す..."
                                className="w-full h-32 p-4 bg-gray-50 border-none rounded-3xl text-sm focus:ring-2 focus:ring-pink-500 outline-none transition-all resize-none"
                            />
                        </div>

                        <button
                            onClick={handleFinish}
                            className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
                        >
                            Log and Archive
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}