"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlans } from "@/lib/storage";
import { ArrowLeft, Navigation } from "lucide-react";

export default function AdventurePage() {
    const params = useParams();
    const router = useRouter();
    const [plan, setPlan] = useState<any>(null);
    const [coords, setCoords] = useState<{ lat: number, lng: number } | null>(null);
    const [isTracking, setIsTracking] = useState(false);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);

    useEffect(() => {
        const found = getPlans().find(p => p.id === params?.id);
        setPlan(found);
    }, [params?.id]);

    // ボタンを押した時だけGPSを起動する
    const startGPS = () => {
        if (!navigator.geolocation) {
            setErrorMsg("Geolocation not supported");
            return;
        }

        setIsTracking(true);
        setErrorMsg(null);

        navigator.geolocation.watchPosition(
            (pos) => {
                setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            },
            (err) => {
                setErrorMsg(`GPS Error: ${err.message}`);
                setIsTracking(false);
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    };

    if (!plan) return <div className="p-10">LOADING...</div>;

    return (
        <div className="h-screen bg-white flex flex-col items-center justify-center p-10 text-center text-gray-900">
            <h1 className="text-2xl font-black mb-10 italic text-pink-500 uppercase">{plan.name}</h1>

            <div className="w-full bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100 shadow-inner mb-10">
                <p className="text-[10px] font-black text-gray-400 uppercase mb-4 tracking-widest">GPS Monitor</p>

                {coords ? (
                    <div className="space-y-2 animate-fade-in">
                        <p className="text-xl font-mono font-bold">LAT: {coords.lat.toFixed(6)}</p>
                        <p className="text-xl font-mono font-bold">LNG: {coords.lng.toFixed(6)}</p>
                        <div className="mt-4 flex items-center justify-center gap-2 text-pink-500">
                            <span className="w-2 h-2 bg-pink-500 rounded-full animate-ping" />
                            <span className="text-[10px] font-black uppercase">Signal Active</span>
                        </div>
                    </div>
                ) : (
                    <div className="py-4">
                        {errorMsg ? (
                            <p className="text-red-500 font-bold text-sm">{errorMsg}</p>
                        ) : (
                            <p className="text-gray-300 italic">GPS is currently idle.</p>
                        )}
                    </div>
                )}
            </div>

            {!isTracking ? (
                <button
                    onClick={startGPS}
                    className="w-full bg-pink-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-pink-200 active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <Navigation size={20} fill="currentColor" />
                    START TRACKING
                </button>
            ) : (
                <p className="text-pink-300 font-black italic text-sm animate-pulse">
                    TRACKING IN PROGRESS...
                </p>
            )}

            <button onClick={() => router.back()} className="mt-10 text-gray-400 font-bold text-sm underline">
                BACK TO PLANS
            </button>
        </div>
    );
}