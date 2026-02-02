"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { getPlans, type Plan } from "@/lib/storage";
import LazyMap from "@/components/Map/LazyMap";
import { Map, Clock, CheckCircle } from "lucide-react";

export default function LogPage() {
    const { t } = useTranslation();
    const [history, setHistory] = useState<Plan[]>([]);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        // Load only completed or active plans with progress
        const allPlans = getPlans();
        const storedHistory = allPlans.filter(p => p.collectedCount > 0 || p.status === 'completed');
        // Sort by Newest First
        storedHistory.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setHistory(storedHistory);
        if (storedHistory.length > 0) {
            setExpandedId(storedHistory[0].id);
        }
    }, []);

    const totalKm = history.reduce((acc, plan) => acc + (plan.totalDistance || 0), 0).toFixed(1);

    const getDuration = (start?: string, end?: string) => {
        if (!start || !end) return "--:--";
        const diff = new Date(end).getTime() - new Date(start).getTime();
        const hrs = Math.floor(diff / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        return `${hrs}:${mins.toString().padStart(2, '0')}`;
    };

    const formatDateTime = (dateStr?: string) => {
        if (!dateStr) return "---";
        const d = new Date(dateStr);
        return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
    };

    const getOrdinal = (n: number) => {
        const s = ["th", "st", "nd", "rd"];
        const v = n % 100;
        return n + (s[(v - 20) % 10] || s[v] || s[0]);
    };

    return (
        <div className="min-h-screen bg-quest-green-900 p-6 pb-24">
            <div className="sticky top-0 z-50 bg-quest-green-900 -mx-6 px-6 pb-4 pt-2 mb-2 shadow-lg shadow-quest-green-900/50">
                <h1 className="text-2xl font-bold text-white mb-6 font-puffy flex items-center gap-2">
                    <Clock className="text-white" />
                    {t("tab_log")}
                </h1>

                {/* Header with Total Stats */}
                <div className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 text-quest-green-900 mb-2">
                        <Map size={20} />
                        <span className="text-sm font-bold" suppressHydrationWarning>{t("total_distance_history_label")}</span>
                    </div>
                    <div className="text-4xl font-black text-gray-800 font-puffy">
                        {totalKm} <span className="text-lg font-medium text-gray-400">km</span>
                    </div>
                </div>
            </div>

            <div className="mt-8 pb-32">
                {history.map((plan, index) => {
                    const collectedItems = plan.items?.filter(i => i.isCollected).sort((a, b) =>
                        (new Date(a.collectedAt || 0).getTime() - new Date(b.collectedAt || 0).getTime())
                    ) || [];

                    const isExpanded = expandedId === plan.id;
                    // Removed Stack/Overlap Logic as requested.
                    // Cards will simply stack vertically (normal flow).

                    return (
                        <div
                            key={plan.id}
                            onClick={() => setExpandedId(isExpanded ? null : plan.id)}
                            className={`bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 transition-all duration-300 ease-out cursor-pointer mb-4 ${isExpanded ? 'ring-2 ring-quest-green-400 shadow-md' : 'hover:bg-gray-50'}`}
                        >
                            {/* Log Header */}
                            <div className="p-5 border-b border-gray-50 flex justify-between items-center h-[100px]">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-800 font-puffy flex items-center gap-2">
                                        {plan.status === 'completed' && <CheckCircle size={24} className="text-quest-green-900" />}
                                        {plan.name}
                                    </h3>
                                    <div className="text-xs text-gray-400 mt-1">
                                        <div>{plan.createdAt.split('T')[0]}</div>
                                        {plan.startedAt && (
                                            <div>
                                                {getDuration(plan.startedAt, plan.completedAt || collectedItems[collectedItems.length - 1]?.collectedAt)}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Collapsable Content */}
                            <div className={`transition-all duration-500 ease-in-out overflow-hidden ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
                                {/* Log Body */}
                                <div className="p-4 grid grid-cols-2 gap-4">
                                    <div>
                                        <div className="text-xs text-gray-400 mb-1">{t("item_count_label")}</div>
                                        <div className="text-2xl font-bold text-gray-800">{plan.collectedCount} / {plan.itemCount} <span className="text-xs font-normal text-gray-500">{t("items_collected_label").replace("収集数", "個").replace("Items Collected", "items")}</span></div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-gray-400 mb-1">{t("distance_label")}</div>
                                        <div className="text-2xl font-bold text-gray-800">{plan.totalDistance || 2.2} <span className="text-xs font-normal text-gray-500">km</span></div>
                                    </div>
                                </div>

                                {/* Map Track Preview */}
                                <div className="h-48 bg-gray-50 relative border-t border-gray-100">
                                    <LazyMap
                                        items={plan.items}
                                        path={plan.path}
                                        center={plan.path?.[0] || plan.center}
                                        radiusInKm={0}
                                    />
                                </div>

                                {/* Timeline */}
                                {(plan.startedAt || collectedItems.length > 0) && (
                                    <div className="p-6 bg-white border-t border-dashed border-gray-200">
                                        {/* Departure */}
                                        {plan.startedAt && (
                                            <div className="flex gap-4 items-start relative pb-5">
                                                <div className="flex flex-col items-start w-12 shrink-0">
                                                    <div className="text-xs font-bold text-gray-800">出発</div>
                                                </div>
                                                <div>
                                                    <div className="flex items-baseline gap-3">
                                                        <div className="text-xs font-bold text-gray-800">{formatDateTime(plan.startedAt)}</div>
                                                        <div className="text-xs text-gray-500">{plan.startLocation || "Unknown Location"}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Collected Items */}
                                        {collectedItems.map((item, idx) => (
                                            <div className="flex gap-4 items-start relative" key={item.id}>
                                                <div className="flex flex-col items-start w-12 shrink-0">
                                                    <div className="text-xs font-bold text-gray-800 mb-1">{getOrdinal(idx + 1)}</div>
                                                    {/* Line connects to next unless it's the last one */}
                                                    {idx < collectedItems.length - 1 && <div className="w-1 flex-1 bg-quest-green-900 rounded-full my-1 ml-1"></div>}
                                                </div>
                                                <div className="pb-5 last:pb-0">
                                                    <div className="flex items-baseline gap-3">
                                                        <div className="text-xs font-bold text-gray-800">{formatDateTime(item.collectedAt)}</div>
                                                        <div className="text-xs text-gray-500">{item.collectedLocation || "Unknown Location"}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
