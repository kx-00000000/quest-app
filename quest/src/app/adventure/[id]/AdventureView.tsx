"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { getPlans } from "@/lib/storage";
import { ArrowLeft, Navigation, Sparkles, Loader2 } from "lucide-react";
import { calculateBearing, calculateDistance } from "@/lib/geo";

export default function AdventureView({ id }: { id: string }) {
    const router = useRouter();
    const [plan, setPlan] = useState<any>(null);
    const [distance, setDistance] = useState<number | null>(null);
    const [heading, setHeading] = useState(0);
    const [bearing, setBearing] = useState(0);
    const [status, setStatus] = useState<"idle" | "active">("idle");
    const lastUpdate = useRef(0);

    useEffect(() => {
        const found = getPlans().find((p) => p.id === id);
        if (found) setPlan(found);
    }, [id]);

    const currentItem = plan?.items?.find((i: any) => !i.isCollected) || null;

    // センサー処理：極限まで間引く（200ms = 1秒に5回）
    const handleOrientation = (event: any) => {
        const now = Date.now();
        if (now - lastUpdate.current < 200) return;
        lastUpdate.current = now;
        const h = event.webkitCompassHeading || (event.alpha ? Math.abs(event.alpha - 360) : 0);
        setHeading(h);
    };

    const startAdventure = async () => {
        const DeviceEvt = (window as any).DeviceOrientationEvent;
        if (DeviceEvt && typeof DeviceEvt.requestPermission === 'function') {
            try {
                const res = await DeviceEvt.requestPermission();
                if (res !== 'granted') return;
            } catch (e) { console.error(e); }
        }

        window.addEventListener("deviceorientation", handleOrientation);

        navigator.geolocation.watchPosition(
            (pos) => {
                if (currentItem) {
                    const d = calculateDistance(pos.coords.latitude, pos.coords.longitude, currentItem.lat, currentItem.lng);
                    const b = calculateBearing(pos.coords.latitude, pos.coords.longitude, currentItem.lat, currentItem.lng);
                    setDistance(d * 1000);
                    setBearing(b);
                }
            },
            (err) => console.error(err),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );

        setStatus("active");
    };

    if (!plan) return null;

    return (
        <div className="flex flex-col h-screen bg-pink-50 items-center justify-center p-6 text-center">
            {status === "idle" ? (
                <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-pink-100">
                    <Sparkles className="w-12 h-12 text-pink-500 mx-auto mb-4 animate-pulse" />
                    <h1 className="text-2xl font-black text-gray-800 mb-6 italic uppercase tracking-tighter">Sensor Test</h1>
                    <button
                        onClick={startAdventure}
                        className="w-full bg-pink-500 text-white font-black py-5 px-10 rounded-2xl shadow-lg active:scale-95 transition-all uppercase tracking-widest text-sm"
                    >
                        Start Test
                    </button>
                    <button onClick={() => router.back()} className="mt-6 text-gray-400 text-xs underline block w-full">BACK</button>
                </div>
            ) : (
                <div className="space-y-12 animate-in fade-in zoom-in duration-500">
                    <div className="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-pink-100">
                        <p className="text-[10px] font-black text-pink-600 uppercase mb-2 tracking-widest">Target Distance</p>
                        <h2 className="text-5xl font-black text-gray-900 italic tracking-tighter">
                            {distance !== null ? `${Math.floor(distance).toLocaleString()} m` : <Loader2 className="animate-spin mx-auto text-pink-200" />}
                        </h2>
                    </div>

                    <div className="relative w-64 h-64 flex items-center justify-center">
                        <div className="absolute inset-0 rounded-full border-4 border-pink-200 border-dashed animate-[spin_20s_linear_infinite]" />
                        <div
                            className="relative text-pink-500 transition-transform duration-300 ease-out"
                            style={{ transform: `rotate(${bearing - heading}deg)` }}
                        >
                            <Navigation size={100} fill="currentColor" className="drop-shadow-2xl" />
                        </div>
                    </div>

                    <button onClick={() => window.location.reload()} className="text-pink-300 font-bold text-xs uppercase tracking-widest border-b border-pink-200 pb-1">Reset Session</button>
                </div>
            )}
        </div>
    );
}