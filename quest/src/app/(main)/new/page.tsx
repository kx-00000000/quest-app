"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { savePlan } from "@/lib/storage";
import { generateRandomPoint } from "@/lib/geo";
import { formatQuestDistance } from "@/lib/format";
import { Sliders } from "lucide-react";

export default function NewQuestPage() {
    const router = useRouter();
    const { t } = useTranslation();

    const [radius, setRadius] = useState(1); // km
    const [isCreating, setIsCreating] = useState(false);

    // Default range for the simple slider
    const minRadius = 0.5;
    const maxRadius = 10;
    const step = 0.5;

    const handleCreate = async () => {
        setIsCreating(true);

        // Simulate "Processing"
        await new Promise(r => setTimeout(r, 800));

        const generateId = () => {
            return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
                var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
                return v.toString(16);
            });
        };

        // Determine center (current location or Tokyo default)
        let center = { lat: 35.6812, lng: 139.7671 };

        try {
            const position = await new Promise<GeolocationPosition>((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            center = { lat: position.coords.latitude, lng: position.coords.longitude };
        } catch (e) {
            console.warn("Could not get location, using default", e);
        }

        // Generate Items
        const itemCount = 5; // Default item count for simple UI
        const items = [];

        for (let i = 0; i < itemCount; i++) {
            const point = generateRandomPoint(center, radius);
            items.push({
                id: generateId(),
                lat: point.lat,
                lng: point.lng,
                isCollected: false,
                name: `Item #${i + 1}`
            });
        }

        const newPlan = {
            id: generateId(),
            name: `${new Date().getMonth() + 1}月${new Date().getDate()}日の冒険`,
            radius,
            itemCount,
            status: "ready",
            createdAt: new Date().toLocaleDateString(),
            totalDistance: 0, // This will be tracked during the quest
            collectedCount: 0,
            center,
            items
        };

        savePlan(newPlan);

        setIsCreating(false);
        router.push("/plan");
    };

    const distanceMeters = radius * 1000;

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#FFF59D] via-[#F48FB1] to-[#CE93D8] text-gray-800 flex flex-col">

            <div className="flex-1 flex flex-col items-center justify-center p-6 space-y-6">

                {/* Distance Card */}
                <div className="w-full max-w-sm p-8 bg-white/40 backdrop-blur-xl rounded-[2rem] border border-white/20 shadow-xl text-center relative overflow-hidden group">
                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    <h2 className="text-sm font-bold tracking-widest text-pink-600 uppercase mb-4">Target Distance</h2>
                    <p className="text-5xl font-extrabold tracking-tighter text-gray-900 drop-shadow-sm">
                        {formatQuestDistance(distanceMeters)}
                    </p>

                    {/* Slider Input embedded in card */}
                    <div className="mt-8">
                        <input
                            type="range"
                            min={minRadius}
                            max={maxRadius}
                            step={step}
                            value={radius}
                            onChange={(e) => setRadius(parseFloat(e.target.value))}
                            className="w-full h-3 bg-white/50 rounded-full appearance-none cursor-pointer accent-pink-500 hover:accent-pink-600 transition-all"
                        />
                        <div className="flex justify-between text-xs font-medium text-gray-600 mt-2">
                            <span>{minRadius}km</span>
                            <span>{maxRadius}km</span>
                        </div>
                    </div>
                </div>

                {/* Subtext or additional info could go here */}
                <p className="text-white/80 font-medium text-sm drop-shadow-md">
                    Items to find: <span className="font-bold text-white">5</span>
                </p>

            </div>

            {/* Bottom Action Area */}
            <div className="p-6 pb-10">
                <button
                    onClick={handleCreate}
                    disabled={isCreating}
                    className="w-full py-5 bg-gradient-to-r from-pink-500 to-orange-400 text-white text-xl font-bold rounded-full shadow-lg shadow-pink-500/30 transform active:scale-95 transition-all flex items-center justify-center"
                >
                    {isCreating ? (
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    ) : (
                        "冒険をはじめる"
                    )}
                </button>
            </div>
        </div>
    );
}

// Simple placeholder for validation if needed
function MapIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6" /><line x1="9" x2="9" y1="3" y2="18" /><line x1="15" x2="15" y1="6" y2="21" /></svg>
    )
}
