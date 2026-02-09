"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlans } from "@/lib/storage";
import { ArrowLeft, Navigation } from "lucide-react";
import { calculateBearing, calculateDistance } from "@/lib/geo";
import dynamic from "next/dynamic";

const LazyMap = dynamic(() => import("@/components/Map/LazyMap"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-pink-50" />
});

export default function AdventurePage() {
    const params = useParams();
    const router = useRouter();
    const [plan, setPlan] = useState<any>(null);
    const [userLoc, setUserLoc] = useState<{ lat: number, lng: number } | null>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [bearing, setBearing] = useState(0);

    // 1. データ取得
    useEffect(() => {
        const id = params?.id;
        if (id) {
            const found = getPlans().find(p => p.id === id);
            setPlan(found);
        }
    }, [params?.id]);

    const currentItem = useMemo(() => {
        return plan?.items?.find((i: any) => !i.isCollected) || null;
    }, [plan]);

    // 2. GPS監視（センサーは使わない）
    useEffect(() => {
        if (!currentItem || typeof window === "undefined" || !navigator.geolocation) return;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                setUserLoc(newLoc);

                try {
                    const d = calculateDistance(newLoc.lat, newLoc.lng, currentItem.lat, currentItem.lng);
                    const b = calculateBearing(newLoc.lat, newLoc.lng, currentItem.lat, currentItem.lng);
                    setDistance(d * 1000); // メートル換算
                    setBearing(b);
                } catch (e) {
                    console.error("Calc Error");
                }
            },
            (err) => console.warn(err),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, [currentItem]);

    if (!plan) return <div className="p-10 text-pink-500 italic">FINAL TEST...</div>;

    return (
        <div className="h-screen bg-white relative overflow-hidden text-gray-900">
            <div className="absolute inset-0 z-0">
                <LazyMap items={plan.items || []} userLocation={userLoc} themeColor="#F06292" center={plan.center} />
            </div>

            <div className="relative z-10 p-6 pt-12 flex flex-col h-full pointer-events-none">
                <header className="pointer-events-auto">
                    <button onClick={() => router.back()} className="w-12 h-12 bg-white/50 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/40">
                        <ArrowLeft size={20} />
                    </button>
                </header>

                <main className="flex-1 flex flex-col items-center justify-center space-y-8">
                    {/* 距離表示 */}
                    <div className="bg-white/40 backdrop-blur-md p-6 rounded-[2.5rem] border border-white/30 shadow-2xl pointer-events-auto">
                        <p className="text-[10px] font-black text-pink-600 uppercase mb-1 text-center">Distance</p>
                        <h1 className="text-5xl font-black italic">
                            {distance !== null ? `${Math.floor(distance)} m` : "--- m"}
                        </h1>
                    </div>

                    {/* 方位磁石の代わりの「ただの矢印」 */}
                    <div
                        className="w-48 h-48 bg-white/20 backdrop-blur-md rounded-full border border-white/30 flex items-center justify-center shadow-2xl transition-transform duration-500 ease-out"
                        style={{ transform: `rotate(${bearing}deg)` }}
                    >
                        <Navigation size={80} className="text-pink-500 fill-current drop-shadow-lg" />
                    </div>

                    <p className="bg-black/80 text-white text-[10px] px-4 py-2 rounded-full font-bold uppercase tracking-widest animate-pulse">
                        GPS Tracking Test
                    </p>
                </main>
            </div>
        </div>
    );
}