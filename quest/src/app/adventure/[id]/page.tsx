"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlans } from "@/lib/storage";
import { ArrowLeft, Crosshair } from "lucide-react"; // 大文字に修正
import dynamic from "next/dynamic";

const LazyMap = dynamic(() => import("@/components/Map/LazyMap"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-pink-50 animate-pulse" />
});

export default function AdventurePage() {
    const params = useParams();
    const router = useRouter();
    const [plan, setPlan] = useState<any>(null);
    const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        const id = params?.id;
        if (id) {
            const found = getPlans().find(p => p.id === id);
            setPlan(found);
        }
    }, [params?.id]);

    // GPSの生データを取るだけの処理（計算は一切しない）
    useEffect(() => {
        if (typeof window === "undefined" || !navigator.geolocation) {
            setErrorMsg("Geolocation not supported");
            return;
        }

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            },
            (err) => {
                setErrorMsg(`GPS Error: ${err.code} - ${err.message}`);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    if (!plan) return <div className="p-10 text-pink-500 italic">LOADING...</div>;

    return (
        <div className="h-screen bg-white relative overflow-hidden">
            {/* 背景地図 */}
            <div className="absolute inset-0 z-0">
                <LazyMap items={plan.items || []} userLocation={coords} themeColor="#F06292" center={plan.center} />
            </div>

            <div className="relative z-10 p-6 pt-12 flex flex-col h-full pointer-events-none text-gray-900">
                <button onClick={() => router.back()} className="w-12 h-12 bg-white/50 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/40 pointer-events-auto">
                    <ArrowLeft size={20} />
                </button>

                <main className="mt-auto mb-10 pointer-events-auto space-y-4">
                    <div className="bg-white/60 backdrop-blur-3xl rounded-[2.5rem] p-8 shadow-2xl border border-white/40 text-center">
                        <div className="flex justify-center mb-4 text-pink-500">
                            <Crosshair className="animate-spin-slow" />
                        </div>
                        <p className="text-[10px] font-black text-pink-600 uppercase mb-2 tracking-widest font-sans">Raw GPS Status</p>

                        {errorMsg ? (
                            <p className="text-red-500 font-bold text-xs">{errorMsg}</p>
                        ) : coords ? (
                            <div className="space-y-1">
                                <p className="text-sm font-mono font-bold tracking-tight">LAT: {coords.lat.toFixed(6)}</p>
                                <p className="text-sm font-mono font-bold tracking-tight">LNG: {coords.lng.toFixed(6)}</p>
                                <p className="text-pink-500 text-[10px] font-black mt-2 animate-pulse uppercase">GPS Signal Active</p>
                            </div>
                        ) : (
                            <p className="text-gray-400 font-bold animate-pulse italic text-xs uppercase">Wait for GPS...</p>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}