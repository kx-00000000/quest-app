"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { savePlan } from "@/lib/storage";
import { generateRandomPoint } from "@/lib/geo";
import LazyMap from "@/components/Map/LazyMap";
import { Sliders } from "lucide-react";

export default function NewQuestPage() {
    const router = useRouter();
    const { t } = useTranslation();

    const [name, setName] = useState("");
    const [radius, setRadius] = useState(1); // km
    const [activeRangeMode, setActiveRangeMode] = useState({ id: 'neighborhood', min: 0, max: 15, step: 0.1 });
    const [itemCount, setItemCount] = useState(3);
    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        setIsCreating(true);

        // Simulate "Processing"
        await new Promise(r => setTimeout(r, 800));

        // Simple UUID generator for compatibility
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

        // Generate Items using RandomCoordinateGenerator
        const items = [];
        // Dynamic import logic or simple usage since we are in async
        // We can just use the imported functions if they are top-level
        // But we need to make sure we import them at top of file

        for (let i = 0; i < itemCount; i++) {
            // Generate point
            const point = generateRandomPoint(center, radius);
            // TODO: Verify land (skip for now to avoid async/slow loop in prototype UI thread without loading state)
            // In real app, we would do this in a worker or server action.
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
            name: name || `${new Date().getMonth() + 1}月${new Date().getDate()}日の冒険`,
            radius,
            itemCount,
            status: "ready",
            createdAt: new Date().toLocaleDateString(),
            totalDistance: 0,
            collectedCount: 0,
            center,
            items
        };


        savePlan(newPlan);

        setIsCreating(false);
        router.push("/plan");
    };

    return (
        <div className="flex flex-col h-full min-h-screen pb-20 relative">
            <div className="absolute top-0 left-0 right-0 z-10 p-6 bg-gradient-to-b from-white/90 to-transparent pointer-events-none">
                <h1 className="text-2xl font-bold text-quest-green-900 drop-shadow-sm font-puffy flex items-center gap-2">
                    <MapIcon /> {t("new_quest_title")}
                </h1>
            </div>

            {/* Map Background Preview */}
            <div className="absolute inset-0 z-0 h-[60vh] mask-image-b">
                <LazyMap radiusInKm={radius} />
                {/* Gradient Overlay for bottom blending */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-white to-transparent pointer-events-none" />
            </div>

            {/* Content Area (Scrollable overlay) */}
            <div className="mt-[55vh] relative z-10 px-6 pb-6 bg-white rounded-t-3xl shadow-lg border-t border-gray-100 min-h-[45vh]">

                {/* Drag Handle */}
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mt-3 mb-6" />

                <div className="space-y-8">
                    {/* 1. Name Input */}
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">
                            {t("adventure_name_label")}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t("adventure_name_placeholder")}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 focus:border-quest-green-500 focus:ring-2 focus:ring-quest-green-200 outline-none transition-all font-puffy"
                        />
                    </div>

                    {/* 2. Radius Slider with Tabs */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-sm font-bold text-gray-700">{t("radius_label")}</label>
                            <span className="text-2xl font-black text-quest-green-900 font-puffy">{radius} <span className="text-base font-normal text-gray-500">km</span></span>
                        </div>

                        {/* Range Tabs */}
                        <div className="flex gap-2 mb-4">
                            {[
                                { id: 'neighborhood', label: t('range_neighborhood'), min: 0, max: 15, step: 0.1 },
                                { id: 'excursion', label: t('range_excursion'), min: 15, max: 200, step: 5 },
                                { id: 'grand', label: t('range_grand'), min: 200, max: 40000, step: 100 }
                            ].map((range) => (
                                <button
                                    key={range.id}
                                    onClick={() => {
                                        // Set a default value within the new range if current radius is out of bounds
                                        // Or just set to min/mid? Let's auto-clamp or set to min.
                                        if (radius < range.min || radius > range.max) {
                                            setRadius(range.min);
                                        }
                                        // We store the current "active range config" in state or derived?
                                        // Let's just use the radius value to determine active, or explicit state?
                                        // Existing code uses 'radius' state. We need 'activeTab' state to know which bounds to apply?
                                        // Actually user changing tab implies they want to set radius in that band.
                                        // Only tricky part is overlap (e.g. 15km).
                                        // Let's use an explicit state for the active range mode to control the slider props.
                                        setActiveRangeMode(range);
                                        setRadius(range.min);
                                    }}
                                    className={`flex-1 py-2 px-1 rounded-lg text-xs font-bold transition-all border ${activeRangeMode.id === range.id
                                        ? "bg-quest-green-100 text-quest-green-800 border-quest-green-300 shadow-inner"
                                        : "bg-gray-50 text-gray-400 border-transparent hover:bg-gray-100"
                                        }`}
                                >
                                    {range.label.split(' ')[0]}
                                </button>
                            ))}
                        </div>

                        <input
                            type="range"
                            min={activeRangeMode.min}
                            max={activeRangeMode.max}
                            step={activeRangeMode.step}
                            value={radius}
                            onChange={(e) => setRadius(parseFloat(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-quest-green-900"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>{activeRangeMode.min} km</span>
                            <span>{activeRangeMode.max} km</span>
                        </div>
                    </div>

                    {/* 3. Item Count Slider */}
                    <div>
                        <div className="flex justify-between items-end mb-2">
                            <label className="text-sm font-bold text-gray-700">{t("item_count_label")}</label>
                            <span className="text-2xl font-black text-quest-green-900 font-puffy">{itemCount} <span className="text-base font-normal text-gray-500">{t("items_collected_label").replace("Items Collected", "items").replace("収集数", "個")}</span></span>
                        </div>
                        <input
                            type="range"
                            min="1"
                            max="20"
                            step="1"
                            value={itemCount}
                            onChange={(e) => setItemCount(parseInt(e.target.value))}
                            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-quest-green-900"
                        />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>1</span>
                            <span>20</span>
                        </div>
                    </div>

                    {/* Create Button */}
                    <button
                        onClick={handleCreate}
                        disabled={isCreating}
                        className="w-full py-4 bg-quest-green-900 hover:bg-quest-green-800 text-white rounded-2xl font-bold text-lg shadow-lg shadow-quest-green-900/30 transform active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                        {isCreating ? (
                            <span className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></span>
                        ) : (
                            <>
                                {t("create_button")}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

function MapIcon() {
    return (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-map"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21 3 6" /><line x1="9" x2="9" y1="3" y2="18" /><line x1="15" x2="15" y1="6" y2="21" /></svg>
    )
}
