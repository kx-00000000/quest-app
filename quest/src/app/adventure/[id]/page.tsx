"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getPlans, savePlan, type Plan, type Item } from "@/lib/storage";
import { ArrowLeft, CheckCircle, Map as MapIcon, Plane } from "lucide-react";
import Compass from "@/components/Compass";
import { calculateBearing, calculateDistance, getLocationName, type LatLng } from "@/lib/geo";

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

    // Load Plan Logic
    useEffect(() => {
        if (!params.id) return;
        const plans = getPlans();
        const found = plans.find(p => p.id === params.id);
        if (found) {
            setPlan(found);
            checkNextItem(found);
        }
    }, [params.id]);

    // Check for next uncollected item
    const checkNextItem = (currentPlan: Plan) => {
        if (!currentPlan.items) return;
        const next = currentPlan.items.find(i => !i.isCollected);
        if (next) {
            setCurrentItem(next);
            setAllCollected(false);
        } else {
            setCurrentItem(null);
            setAllCollected(true);
        }
    };

    // Real Location Tracking & Calc
    useEffect(() => {
        if (!currentItem) return;

        if (navigator.geolocation) {
            const watchId = navigator.geolocation.watchPosition(
                (pos) => {
                    const newLoc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setUserLoc(newLoc);

                    // Update Path (Throttle? For now, just add if moved significantly or simple push)
                    // In React strict mode or high freq GPS this might be too much, but for prototype it's fine.
                    // We need to update the plan object live? Or just local state?
                    // Let's update local state 'path' and save on acquire events to avoid excessive IO.
                    // Actually, if we want the "Live" path in the end, we should update a ref or state.

                    if (plan) {
                        setPlan(prev => {
                            if (!prev) return null;
                            const currentPath = prev.path || [];
                            const lastPos = currentPath.length > 0 ? currentPath[currentPath.length - 1] : null;

                            let distDelta = 0;
                            if (lastPos) {
                                distDelta = calculateDistance(lastPos.lat, lastPos.lng, newLoc.lat, newLoc.lng);
                            }

                            // Minimal threshold to avoid noise (optional, but good for "accurate" GPS)
                            // But for "test mode" jumps, we accept all.

                            return {
                                ...prev,
                                path: [...currentPath, newLoc],
                                totalDistance: (prev.totalDistance || 0) + distDelta
                            };
                        });
                    }

                    if (currentItem) {
                        const d = calculateDistance(newLoc.lat, newLoc.lng, currentItem.lat, currentItem.lng);
                        const b = calculateBearing(newLoc.lat, newLoc.lng, currentItem.lat, currentItem.lng);
                        setDistance(Math.round(d * 1000));
                        setBearing(b);
                    }
                },
                (err) => console.warn("Geolocation Error/Waiting:", err),
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
            return () => navigator.geolocation.clearWatch(watchId);
        }
    }, [currentItem]); // plan dependency removed to avoid loop, handle inside

    const handleAcquire = async () => {
        if (!plan || !currentItem) return;

        // Show Modal instead of Alert
        setCollectedItem(currentItem);
        // Note: The actual data update happens after user closes modal or immediately?
        // User flow: Click -> Modal "Got It!" -> Close Modal -> Show next item
        // So we should probably update data *after* modal or *during* modal but keep modal open.

        // Let's update data immediately for simplicity, but maybe wait to switch 'currentItem' until modal validation?
        // Actually, if we update state immediately, 'currentItem' changes, and the main view updates.
        // We want to persist the "You found X" modal even if currentItem switches to Y behind the scenes.

        // Get Location Name
        let locName = "Unknown Location";
        let lat = userLoc?.lat;
        let lng = userLoc?.lng;

        if (!lat || !lng) {
            // Try to force get current position
            try {
                const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000, enableHighAccuracy: true });
                });
                lat = pos.coords.latitude;
                lng = pos.coords.longitude;
            } catch (e) {
                console.warn("GPS Force Fail", e);
                // Fallback to Item Location (User suggestion for PC testing)
                // This assumes we are "at" the item location.
                lat = currentItem.lat;
                lng = currentItem.lng;
            }
        }

        if (lat && lng) {
            locName = await getLocationName(lat, lng);
        } else {
            locName = "Unknown Location";
        }

        // Update Data
        const now = new Date().toISOString();
        const updatedItems = plan.items?.map(i => i.id === currentItem.id ? {
            ...i,
            isCollected: true,
            collectedAt: now,
            collectedLocation: locName
        } : i);

        const isCompleted = updatedItems?.every(i => i.isCollected);

        const updatedPlan = {
            ...plan,
            items: updatedItems,
            collectedCount: (plan.collectedCount || 0) + 1,
            // If all collected, complete
            status: isCompleted ? 'completed' : 'active',
            completedAt: isCompleted ? now : undefined,
            // Ensure current path/distance from state is preserved
            path: plan.path,
            totalDistance: plan.totalDistance
        };

        // Save
        savePlan(updatedPlan);
        setPlan(updatedPlan);
        // checkNextItem(updatedPlan); // Delay this until modal close? NO, updatedPlan is needed.
        // If we switch currentItem now, the background compass might swing. That's fine.
        checkNextItem(updatedPlan);
    };

    const handleCloseModal = () => {
        setCollectedItem(null);
    };

    if (!plan) return <div className="p-10 text-white">Loading Adventure...</div>;

    if (allCollected) {
        return (
            <div className="flex flex-col h-screen bg-quest-green-900 text-white items-center justify-center p-6 text-center relative overflow-hidden">
                {/* Left Bottom Burst */}
                {[...Array(30)].map((_, i) => {
                    // Shoot towards top-right
                    const tx = Math.random() * 400 + 100 + "px"; // 100 to 500
                    const ty = -1 * (Math.random() * 600 + 200) + "px"; // -200 to -800
                    const rot = Math.random() * 360 + "deg";
                    const delay = Math.random() * 0.2 + "s";
                    return (
                        <div
                            key={`left-${i}`}
                            className="confetti-piece"
                            style={{
                                bottom: "25%",
                                left: "0",
                                background: ["#FCD34D", "#34D399", "#60A5FA", "#F87171"][Math.floor(Math.random() * 4)],
                                animation: `confetti-burst 1.5s ease-out forwards ${delay}`,
                                ["--tx" as any]: tx,
                                ["--ty" as any]: ty,
                                ["--rot" as any]: rot
                            }}
                        />
                    );
                })}

                {/* Right Bottom Burst */}
                {[...Array(30)].map((_, i) => {
                    // Shoot towards top-left
                    const tx = -1 * (Math.random() * 400 + 100) + "px"; // -100 to -500
                    const ty = -1 * (Math.random() * 600 + 200) + "px"; // -200 to -800
                    const rot = Math.random() * 360 + "deg";
                    const delay = Math.random() * 0.2 + "s";
                    return (
                        <div
                            key={`right-${i}`}
                            className="confetti-piece"
                            style={{
                                bottom: "25%",
                                right: "0",
                                background: ["#FCD34D", "#34D399", "#60A5FA", "#F87171"][Math.floor(Math.random() * 4)],
                                animation: `confetti-burst 1.5s ease-out forwards ${delay}`,
                                ["--tx" as any]: tx,
                                ["--ty" as any]: ty,
                                ["--rot" as any]: rot
                            }}
                        />
                    );
                })}

                <div className="relative z-10 animate-fade-in-up">
                    <CheckCircle size={80} className="mb-6 text-quest-green-400 mx-auto" />
                    <h1 className="text-4xl font-bold font-puffy mb-2">{t("congratulations")}</h1>
                    <p className="text-quest-green-200 mb-8">All items collected!</p>
                    <button onClick={() => router.push('/log')} className="bg-white text-quest-green-900 font-bold py-3 px-8 rounded-full shadow-lg hover:scale-105 transition-transform">
                        {t("go_to_log")}
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-screen bg-quest-green-900 text-white relative overflow-hidden">

            {/* Header */}
            <header className="flex justify-between items-center p-6 z-10">
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full backdrop-blur-md hover:bg-white/20 transition text-sm font-bold"
                >
                    <ArrowLeft size={16} /> {t("back_button")}
                </button>
                <div className="text-right">
                    <div className="text-xs text-quest-green-200">{t("progress_label")}</div>
                    <div className="font-bold font-puffy text-xl">{plan.collectedCount} / {plan.itemCount}</div>
                </div>
            </header>

            {/* Main Content: Info & Compass */}
            <main className="flex-1 flex flex-col items-center justify-center p-6 relative z-10">
                {collectedItem && (
                    <div className="fixed inset-0 bg-quest-green-900/90 backdrop-blur-md flex items-center justify-center p-6 z-50 animate-fade-in">
                        <div className="relative z-10 flex flex-col items-center">
                            <div className="w-24 h-24 bg-quest-green-100 rounded-full flex items-center justify-center mb-6 shadow-inner animate-bounce">
                                <CheckCircle size={48} className="text-quest-green-600" />
                            </div>

                            <h2 className="text-2xl font-black font-puffy mb-2">アイテムを拾った！</h2>
                            <p className="text-quest-green-700 font-medium mb-8 text-lg">{collectedItem.name}</p>

                            <button
                                onClick={handleCloseModal}
                                className="w-full bg-quest-green-600 hover:bg-quest-green-700 text-white font-bold py-4 rounded-xl shadow-lg transform active:scale-95 transition-all text-lg"
                            >
                                次へ
                            </button>
                        </div>
                    </div>
                )}

                <div className="text-center mb-12">
                    <p className="text-quest-green-200 text-sm mb-1">{t("nearest_item_label")}</p>
                    <h1 className="text-6xl font-black font-puffy tracking-tight drop-shadow-lg">
                        {distance} <span className="text-2xl font-medium">m</span>
                    </h1>
                </div>

                <Compass bearing={bearing} />

                <div className="mt-12 text-center text-quest-green-300 text-sm animate-pulse">
                    {t("get_closer_message")}
                </div>

                {/* Test Action */}
                <button
                    onClick={handleAcquire}
                    className="mt-6 bg-yellow-500 hover:bg-yellow-400 text-yellow-950 font-bold py-3 px-8 rounded-full shadow-lg transform active:scale-95 transition-all text-sm"
                >
                    ⚡ {t("test_measure_button")}
                </button>

            </main>

            {/* Bottom Sheet: Item List Preview (Simplified) */}
            <div className="bg-white/10 backdrop-blur-md rounded-t-3xl p-6 pb-12 z-10 border-t border-white/5">
                <h3 className="text-sm font-bold text-quest-green-100 mb-4">{t("item_list_label")}</h3>
                <div className="flex gap-4 overflow-x-auto pb-2">
                    {plan.items?.map((item, idx) => (
                        <div key={item.id} className={`w-16 h-16 flex-shrink-0 rounded-2xl flex items-center justify-center border transition-all ${item.isCollected
                            ? "bg-quest-green-800 text-quest-green-300 border-quest-green-600/50"
                            : item.id === currentItem?.id
                                ? "bg-quest-green-500 text-white shadow-lg shadow-quest-green-500/50 ring-2 ring-white/50 border-transparent scale-110"
                                : "bg-quest-green-800/50 text-quest-green-700 border-quest-green-800"
                            }`}>
                            {item.isCollected ? <CheckCircle size={24} /> : <Plane size={24} />}
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
