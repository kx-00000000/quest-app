"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getPlans, savePlan, type Plan, type Item } from "@/lib/storage";
import { ArrowLeft, CheckCircle, Package, Navigation, Trophy } from "lucide-react";
import { calculateBearing, calculateDistance, type LatLng } from "@/lib/geo";
import dynamic from "next/dynamic";

// 地図とコンパスも、さらにブラウザ専用として読み込む
const LazyMap = dynamic(() => import("@/components/Map/LazyMap"), { ssr: false });
const SafeCompass = dynamic(() => import("@/components/Compass"), { ssr: false });

const formatDistance = (m: number | null): string => {
    if (m === null || isNaN(m)) return "--- m";
    if (m < 1000) return `${Math.floor(m).toLocaleString()} m`;
    return `${(m / 1000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
};

export default function AdventureView({ id }: { id: string }) {
    const { t } = useTranslation();
    const router = useRouter();

    const [plan, setPlan] = useState<Plan | null>(null);
    const [userLoc, setUserLoc] = useState<LatLng | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [bearing, setBearing] = useState(0);
    const [collectedItem, setCollectedItem] = useState<Item | null>(null);

    // 1. データ読み込み（ブラウザでのみ実行される）
    useEffect(() => {
        const found = getPlans().find((p) => p.id === id);
        if (found) setPlan(found);
    }, [id]);

    const currentItem = useMemo(() => {
        return plan?.items?.find((i) => !i.isCollected) || null;
    }, [plan?.items]);

    const allCollected = plan && plan.items && plan.items.length > 0 && !currentItem;

    // 2. GPS監視（データの有無を厳格にチェック）
    useEffect(() => {
        if (!currentItem || typeof window === "undefined" || !navigator.geolocation) return;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                if (!currentItem) return;
                const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLoc(newLoc);
                try {
                    const d = calculateDistance(newLoc.lat, newLoc.lng, currentItem.lat, currentItem.lng);
                    const b = calculateBearing(newLoc.lat, newLoc.lng, currentItem.lat, currentItem.lng);
                    if (!isNaN(d)) setDistance(d * 1000);
                    if (!isNaN(b)) setBearing(b);
                } catch (e) {
                    console.error("Geo Calc Error", e);
                }
            },
            (err) => console.warn(err),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [currentItem]);

    const handleAcquire = () => {
        if (!plan || !currentItem) return;
        setCollectedItem(currentItem);
        const now = new Date().toISOString();
        const updatedItems = (plan.items || []).map((i) =>
            i.id === currentItem.id ? { ...i, isCollected: true, collectedAt: now } : i
        );
        const updatedPlan = {
            ...plan,
            items: updatedItems,
            collectedCount: (plan.collectedCount || 0) + 1,
            status: updatedItems.every((i) => i.isCollected) ? "completed" : "active",
        };
        savePlan(updatedPlan as any);
        setPlan(updatedPlan as any);
    };

    if (!plan) return <div className="h-screen bg-white flex items-center justify-center">LOADING...</div>;

    if (allCollected) {
        return (
            <div className="flex flex-col h-screen bg-gradient-to-br from-[#F06292] to-[#FF8A65] text-white items-center justify-center p-8 text-center">
                <Trophy size={80} className="mb-6 mx-auto text-yellow-300" />
                <h1 className="text-4xl font-black mb-8 italic uppercase tracking-tighter">Quest Clear!</h1>
                <button onClick={() => router.push("/log")} className="w-full bg-white text-pink-600 font-black py-4 rounded-2xl">
                    記録を見る
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen relative overflow-hidden bg-white">
            <div className="absolute inset-0 z-0">
                <LazyMap items={plan.items} userLocation={userLoc} themeColor="#F06292" center={plan.center} />
            </div>

            <header className="relative z-10 flex justify-between items-center p-6 pt-12">
                <button onClick={() => router.back()} className="w-12 h-12 bg-white/50 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg">
                    <ArrowLeft size={20} />
                </button>
                <div className="bg-white/50 backdrop-blur-xl px-6 py-2 rounded-2xl shadow-lg font-black text-gray-800">
                    {plan.collectedCount} / {plan.itemCount}
                </div>
            </header>

            <main className="flex-1 flex flex-col items-center justify-center relative z-10">
                <div className="text-center mb-8 bg-white/40 backdrop-blur-md p-6 rounded-[2.5rem] shadow-2xl">
                    <p className="text-[10px] font-black text-pink-600 uppercase mb-1">Target Distance</p>
                    <h1 className="text-5xl font-black text-gray-900 tracking-tighter italic">
                        {formatDistance(distance)}
                    </h1>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 bg-pink-500/20 blur-3xl rounded-full animate-pulse" />
                    <SafeCompass bearing={bearing} />
                </div>

                <button onClick={handleAcquire} className="mt-8 bg-white/20 backdrop-blur-md font-black py-2 px-6 rounded-full text-[10px] uppercase tracking-widest">
                    ⚡ Debug: Simulate Acquire
                </button>
            </main>

            {/* モーダルや下部リストは省略せず以前の「かわいいデザイン」を維持してください */}
            {collectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/40 backdrop-blur-sm">
                    <div className="bg-white rounded-[3rem] p-10 w-full max-w-sm text-center shadow-2xl">
                        <div className="w-20 h-20 bg-gradient-to-tr from-[#F06292] to-[#FF8A65] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl animate-bounce">
                            <Navigation className="text-white w-10 h-10" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 mb-8 italic uppercase">You Found It!</h2>
                        <button onClick={() => setCollectedItem(null)} className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl">
                            NEXT TARGET
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}