"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { getPlans, savePlan, type Plan, type Item } from "@/lib/storage";
import { ArrowLeft, CheckCircle, Package, Navigation, Trophy, AlertTriangle } from "lucide-react";
import { calculateBearing, calculateDistance, type LatLng } from "@/lib/geo";
import dynamic from "next/dynamic";

const LazyMap = dynamic(() => import("@/components/Map/LazyMap"), { ssr: false });
const SafeCompass = dynamic(() => import("@/components/Compass"), { ssr: false });

export default function AdventureView({ id }: { id: string }) {
    const router = useRouter();
    const [plan, setPlan] = useState<Plan | null>(null);
    const [userLoc, setUserLoc] = useState<LatLng | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [bearing, setBearing] = useState(0);
    const [collectedItem, setCollectedItem] = useState<Item | null>(null);

    // 【デバッグ用】エラーを画面に表示するためのステート
    const [debugError, setDebugError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const found = getPlans().find((p) => p.id === id);
            if (found) {
                setPlan(found);
            } else {
                setDebugError("Plan not found in storage");
            }
        } catch (e: any) {
            setDebugError("Storage Load Error: " + e.message);
        }
    }, [id]);

    const items = useMemo(() => plan?.items || [], [plan]);
    const currentItem = useMemo(() => items.find((i) => !i.isCollected) || null, [items]);
    const isAllCollected = items.length > 0 && items.every(i => i.isCollected);

    useEffect(() => {
        if (!currentItem || typeof window === "undefined" || !navigator.geolocation) return;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                try {
                    const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setUserLoc(newLoc);

                    if (currentItem) {
                        const d = calculateDistance(newLoc.lat, newLoc.lng, currentItem.lat, currentItem.lng);
                        const b = calculateBearing(newLoc.lat, newLoc.lng, currentItem.lat, currentItem.lng);
                        if (!isNaN(d)) setDistance(d * 1000);
                        if (!isNaN(b)) setBearing(b);
                    }
                } catch (e: any) {
                    setDebugError("GPS Logic Error: " + e.message);
                }
            },
            (err) => console.warn(err),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [currentItem]);

    // --- もしエラーが起きたら、Application Errorの代わりにこれが出る ---
    if (debugError) {
        return (
            <div className="h-screen bg-red-50 p-10 flex flex-col items-center justify-center text-center">
                <AlertTriangle size={48} className="text-red-500 mb-4" />
                <h1 className="text-xl font-bold text-red-800 mb-2">Debug Info</h1>
                <code className="bg-red-100 p-4 rounded text-xs text-red-600 break-all">{debugError}</code>
                <button onClick={() => router.push("/plan")} className="mt-8 bg-red-600 text-white px-6 py-2 rounded-full font-bold">
                    戻る
                </button>
            </div>
        );
    }

    if (!plan) return <div className="h-screen bg-white flex items-center justify-center font-black text-pink-500 italic">SYNCING...</div>;

    return (
        <div className="flex flex-col h-screen relative overflow-hidden bg-white">
            {/* 以前のデザインパーツをそのまま配置 */}
            <div className="absolute inset-0 z-0">
                <LazyMap items={items} userLocation={userLoc} themeColor="#F06292" center={plan.center} />
            </div>

            <header className="relative z-10 flex justify-between items-center p-6 pt-12">
                <button onClick={() => router.back()} className="w-12 h-12 bg-white/50 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg">
                    <ArrowLeft size={20} />
                </button>
                <div className="bg-white/50 backdrop-blur-xl px-6 py-2 rounded-2xl shadow-lg font-black text-gray-800">
                    {plan.collectedCount || 0} / {plan.itemCount || 0}
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative z-10">
                <div className="text-center mb-8 bg-white/40 backdrop-blur-md p-6 rounded-[2.5rem] shadow-2xl">
                    <p className="text-[10px] font-black text-pink-600 uppercase mb-1">Target Distance</p>
                    <h1 className="text-5xl font-black text-gray-900 italic">
                        {distance !== null ? `${Math.floor(distance).toLocaleString()} m` : "--- m"}
                    </h1>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 bg-pink-500/20 blur-3xl rounded-full animate-pulse" />
                    <SafeCompass bearing={bearing} />
                </div>

                {/* テスト用：強制取得ボタン */}
                <button
                    onClick={() => {
                        if (!currentItem) return;
                        setCollectedItem(currentItem);
                        const now = new Date().toISOString();
                        const updatedItems = items.map(i => i.id === currentItem.id ? { ...i, isCollected: true, collectedAt: now } : i);
                        const updatedPlan = { ...plan, items: updatedItems, collectedCount: (plan.collectedCount || 0) + 1 };
                        savePlan(updatedPlan as any);
                        setPlan(updatedPlan as any);
                    }}
                    className="mt-8 bg-white/20 backdrop-blur-md text-gray-500 font-black py-2 px-6 rounded-full text-[10px] uppercase border border-white/30"
                >
                    ⚡ ACQUIRE
                </button>