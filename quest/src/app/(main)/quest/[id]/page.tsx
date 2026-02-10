"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlans, savePlan } from "@/lib/storage";
import { calculateDistance } from "@/lib/geo"; // ★後述のgeo.tsの確認も必要です
import LazyMap from "@/components/Map/LazyMap";
import { CheckCircle2, Navigation, Loader2, Flag, MapPin } from "lucide-react";

export default function QuestActivePage() {
    const { id } = useParams();
    const router = useRouter();
    const [plan, setPlan] = useState<any>(null);
    const [userLoc, setUserLoc] = useState<{ lat: number, lng: number } | null>(null);
    const [isAcquired, setIsAcquired] = useState(false);
    const [acquiredName, setAcquiredName] = useState("");
    const watchId = useRef<number | null>(null);

    useEffect(() => {
        const allPlans = getPlans();
        const currentPlan = allPlans.find((p: any) => p.id === id);
        if (!currentPlan) {
            router.push("/plan");
            return;
        }
        setPlan(currentPlan);
    }, [id, router]);

    useEffect(() => {
        if (!plan) return;

        if ("geolocation" in navigator) {
            watchId.current = navigator.geolocation.watchPosition((pos) => {
                const currentLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLoc(currentLoc);

                const updatedItems = plan.items.map((item: any) => {
                    if (item.isCollected) return item;

                    // 100m (0.1km) 以内に入ったか判定
                    const dist = calculateDistance(currentLoc.lat, currentLoc.lng, item.lat, item.lng);
                    if (dist < 0.1) {
                        setIsAcquired(true);
                        setAcquiredName(item.locationName || "New Area");
                        setTimeout(() => setIsAcquired(false), 3000);
                        return { ...item, isCollected: true, collectedAt: new Date().toISOString() };
                    }
                    return item;
                });

                const hasNewAcquisition = updatedItems.some((it: any, idx: number) => it.isCollected !== plan.items[idx].isCollected);
                if (hasNewAcquisition) {
                    const newPlan = {
                        ...plan,
                        items: updatedItems,
                        collectedCount: updatedItems.filter((i: any) => i.isCollected).length
                    };
                    setPlan(newPlan);
                    savePlan(newPlan);
                }
            }, (err) => console.error(err), { enableHighAccuracy: true });
        }

        return () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); };
    }, [plan]);

    if (!plan) return (
        <div className="h-screen flex items-center justify-center">
            <Loader2 className="animate-spin text-pink-500" />
        </div>
    );

    return (
        <div className="h-screen bg-white flex flex-col relative overflow-hidden">
            {/* 上部：ミッションステータス */}
            <div className="absolute top-0 left-0 right-0 z-20 p-6 bg-gradient-to-b from-white/90 to-transparent">
                <div className="bg-gray-900 rounded-[2rem] p-5 shadow-2xl border border-white/10 flex justify-between items-center">
                    <div>
                        <p className="text-[10px] font-black text-pink-500 uppercase tracking-widest italic">Mission Active</p>
                        <h2 className="text-white font-black text-lg truncate max-w-[150px] uppercase italic">{plan.name}</h2>
                    </div>
                    <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/5 flex flex-col items-center">
                        <span className="text-[8px] font-black text-gray-400 uppercase">Progress</span>
                        <span className="text-white font-black text-sm">{plan.collectedCount} / {plan.itemCount}</span>
                    </div>
                </div>
            </div>

            {/* メイン地図 */}
            <div className="flex-1">
                <LazyMap
                    userLocation={userLoc}
                    items={plan.items}
                    isLogMode={true}
                    themeColor="#F06292"
                />
            </div>

            {/* 下部：ナビゲーションパネル */}
            <div className="p-6 pb-12 bg-white border-t border-gray-100 z-20 shadow-[0_-20px_40px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 bg-gray-900 rounded-2xl flex items-center justify-center">
                        <Navigation size={20} className="text-white animate-pulse" />
                    </div>
                    <div className="flex-1">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Current Objective</p>
                        <p className="text-sm font-black text-gray-900 uppercase truncate">
                            {plan.items.find((i: any) => !i.isCollected)?.locationName || "All Objectives Cleared"}
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => router.push("/plan")}
                    className="w-full py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 active:scale-95 transition-all"
                >
                    <Flag size={14} /> Mission Abort
                </button>
            </div>

            {/* 獲得演出ポップアップ */}
            {isAcquired && (
                <div className="absolute inset-0 z-[3000] flex items-center justify-center p-6 bg-pink-500/10 backdrop-blur-sm animate-in fade-in duration-500">
                    <div className="bg-gray-900 text-white rounded-[3rem] p-10 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-300">
                        <div className="w-20 h-20 bg-pink-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-pink-500/40">
                            <CheckCircle2 size={40} className="text-white" />
                        </div>
                        <h3 className="text-2xl font-black italic uppercase tracking-tighter">Target Secured</h3>
                        <p className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">{acquiredName}</p>
                    </div>
                </div>
            )}
        </div>
    );
}