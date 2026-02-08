"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getPlans, savePlan, type Plan, type Item } from "@/lib/storage";
import { ArrowLeft, CheckCircle, Package, Navigation, Trophy } from "lucide-react";
import Compass from "@/components/Compass";
import { calculateBearing, calculateDistance, getLocationName, type LatLng } from "@/lib/geo";
import LazyMap from "@/components/Map/LazyMap";

// 距離フォーマッター
const formatDistance = (m: number): string => {
    if (m < 1000) return `${Math.floor(m).toLocaleString()} m`;
    const km = m / 1000;
    return `${km.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
};

export default function AdventurePage() {
    const { t } = useTranslation();
    const router = useRouter();
    const params = useParams();

    const [plan, setPlan] = useState<Plan | null>(null);
    const [userLoc, setUserLoc] = useState<LatLng | null>(null);
    const [distance, setDistance] = useState(0);
    const [bearing, setBearing] = useState(0);
    const [currentItem, setCurrentItem] = useState<Item | null>(null);
    const [allCollected, setAllCollected] = useState(false);
    const [collectedItem, setCollectedItem] = useState<Item | null>(null);

    // データ読み込みロジック (既存ロジックを継承)
    useEffect(() => {
        if (!params.id) return;
        const found = getPlans().find(p => p.id === params.id);
        if (found) {
            setPlan(found);
            const next = found.items?.find(i => !i.isCollected);
            if (next) { setCurrentItem(next); setAllCollected(false); }
            else { setAllCollected(true); }
        }
    }, [params.id]);

    // 位置追跡ロジック (既存ロジックを継承)
    useEffect(() => {
        if (!currentItem || typeof window === "undefined") return;
        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLoc(newLoc);
                const d = calculateDistance(newLoc.lat, newLoc.lng, currentItem.lat, currentItem.lng);
                const b = calculateBearing(newLoc.lat, newLoc.lng, currentItem.lat, currentItem.lng);
                setDistance(d * 1000); // メートル変換
                setBearing(b);
            },
            (err) => console.warn(err),
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [currentItem]);

    const handleAcquire = async () => {
        if (!plan || !currentItem) return;
        setCollectedItem(currentItem);
        const now = new Date().toISOString();
        const updatedItems = plan.items?.map(i => i.id === currentItem.id ? { ...i, isCollected: true, collectedAt: now } : i);
        const isCompleted = updatedItems?.every(i => i.isCollected);
        const updatedPlan = { ...plan, items: updatedItems, collectedCount: (plan.collectedCount || 0) + 1, status: isCompleted ? 'completed' : 'active' };
        savePlan(updatedPlan as any);
        setPlan(updatedPlan as any);
        const next = updatedItems?.find(i => !i.isCollected);
        if (next) { setCurrentItem(next); } else { setAllCollected(true); }
    };

    if (!plan) return <div className="h-screen bg-white flex items-center justify-center font-black text-pink-500 italic">LOADING...</div>;

    // --- 全収集完了画面 ---
    if (allCollected) {
        return (
            <div className="flex flex-col h-screen bg-gradient-to-br from-[#F06292] to-[#FF8A65] text-white items-center justify-center p-8 text-center">
                <div className="bg-white/20 backdrop-blur-3xl rounded-[3rem] p-10 shadow-2xl border border-white/30 animate-fade-in-up">
                    <Trophy size={80} className="mb-6 mx-auto text-yellow-300 drop-shadow-lg" />
                    <h1 className="text-4xl font-black mb-2 italic">COMPLETED!</h1>
                    <p className="opacity-80 font-bold mb-8">すべてのアイテムを見つけた！</p>
                    <button onClick={() => router.push('/log')} className="w-full bg-white text-pink-600 font-black py-4 px-8 rounded-2xl shadow-xl active:scale-95 transition-all">
                        冒険の記録を見る
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen relative overflow-hidden bg-white">
            {/* 1. 背景地図：全画面表示 */}
            <div className="absolute inset-0 z-0">
                <LazyMap
                    items={plan.items}
                    userLocation={userLoc}
                    themeColor="#F06292"
                    center={plan.center}
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/10 via-transparent to-black/20 pointer-events-none" />
            </div>

            {/* 2. ヘッダー：すりガラス */}
            <header className="relative z-10 flex justify-between items-center p-6 pt-12">
                <button onClick={() => router.back()} className="w-12 h-12 bg-white/40 backdrop-blur-xl rounded-2xl flex items-center justify-center text-gray-800 shadow-lg border border-white/30 active:scale-90 transition-all">
                    <ArrowLeft size={20} />
                </button>
                <div className="bg-white/40 backdrop-blur-xl px-6 py-2 rounded-2xl border border-white/30 shadow-lg text-right">
                    <p className="text-[9px] font-black text-pink-600 uppercase tracking-widest leading-none mb-1">Items Found</p>
                    <p className="font-black text-gray-800 text-lg leading-none">{plan.collectedCount} / {plan.itemCount}</p>
                </div>
            </header>

            {/* 3. メイン：コンパスと距離 */}
            <main className="flex-1 flex flex-col items-center justify-center relative z-10 px-6">
                <div className="text-center mb-8 bg-white/30 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/20 shadow-2xl">
                    <p className="text-[10px] font-black text-pink-600 uppercase tracking-widest mb-1">Distance to Target</p>
                    <h1 className="text-5xl font-black text-gray-900 tracking-tighter italic drop-shadow-sm">
                        {formatDistance(distance)}
                    </h1>
                </div>

                {/* コンパス本体 (以前のコンポーネントを使用) */}
                <div className="relative group active:scale-95 transition-all">
                    <div className="absolute inset-0 bg-pink-500/20 blur-3xl rounded-full animate-pulse" />
                    <Compass bearing={bearing} />
                </div>

                <div className="mt-8 bg-black/80 backdrop-blur-md px-6 py-2 rounded-full border border-white/10">
                    <p className="text-[10px] font-bold text-white uppercase tracking-widest animate-pulse italic">
                        Keep walking towards the needle...
                    </p>
                </div>

                {/* ⚡ テストボタン：ピンクのデザインに統合 */}
                <button onClick={handleAcquire} className="mt-6 bg-white/20 hover:bg-white/40 backdrop-blur-md text-gray-800 font-black py-2 px-6 rounded-full border border-white/30 shadow-lg active:scale-95 transition-all text-[10px] uppercase tracking-widest">
                    ⚡ Debug: Simulate Acquire
                </button>
            </main>

            {/* 4. ボトム：アイテムリストプレビュー */}
            <div className="relative z-10 px-4 mb-4">
                <div className="bg-white/40 backdrop-blur-3xl rounded-[3rem] p-6 shadow-2xl border border-white/30">
                    <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                        {plan.items?.map((item) => (
                            <div key={item.id} className={`w-14 h-14 flex-shrink-0 rounded-2xl flex items-center justify-center border-2 transition-all ${item.isCollected
                                    ? "bg-pink-100 border-pink-200 text-pink-500"
                                    : item.id === currentItem?.id
                                        ? "bg-white border-pink-500 text-pink-600 shadow-lg scale-105 animate-bounce"
                                        : "bg-white/50 border-gray-100 text-gray-300"
                                }`}>
                                {item.isCollected ? <CheckCircle size={22} /> : <Package size={22} />}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 獲得モーダル：オーバーレイ */}
            {collectedItem && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-8 bg-black/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[3rem] p-10 w-full max-w-sm text-center shadow-2xl animate-scale-up">
                        <div className="w-24 h-24 bg-gradient-to-tr from-[#F06292] to-[#FF8A65] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                            <Navigation className="text-white w-12 h-12" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-800 mb-2 italic uppercase">Got It!</h2>
                        <p className="text-gray-500 font-bold mb-8">{collectedItem.name}</p>
                        <button onClick={() => setCollectedItem(null)} className="w-full bg-gray-900 text-white font-black py-4 rounded-2xl shadow-lg active:scale-95 transition-all">
                            NEXT TARGET
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}