"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getPlans, savePlan, type Plan, deletePlan } from "@/lib/storage";
import { getLocationName } from "@/lib/geo";
import { Play, RotateCcw, Trash2, MapPin } from "lucide-react";

export default function PlanPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [plans, setPlans] = useState<Plan[]>([]);

    useEffect(() => {
        setPlans(getPlans().filter(p => !p.isArchived));
    }, []);

    const handleDelete = (id: string) => {
        if (confirm(t("delete_confirm_message"))) {
            deletePlan(id);
            setPlans(getPlans().filter(p => !p.isArchived));
        }
    };

    return (
        <div className="min-h-screen bg-quest-green-900 p-6 pb-24">
            <div className="sticky top-0 z-10 bg-quest-green-900 -mx-6 px-6 pb-4 pt-2 mb-2">
                <h1 className="text-2xl font-bold text-white font-puffy flex items-center gap-2">
                    <MapPin className="text-white" />
                    {t("tab_plan")} <span className="text-sm font-normal text-quest-green-200 ml-2">({plans.length})</span>
                </h1>
            </div>

            <div className="space-y-4">
                {plans.map((plan) => (
                    <div key={plan.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 relative overflow-hidden">

                        {/* Header */}
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 font-puffy">{plan.name}</h3>
                                <p className="text-xs text-gray-400 mt-1">Created: {plan.createdAt}</p>
                            </div>

                            {/* Status Badge */}
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${plan.status === 'active' ? 'bg-orange-100 text-orange-600' :
                                plan.status === 'paused' ? 'bg-yellow-100 text-yellow-600' :
                                    plan.status === 'completed' ? 'bg-blue-100 text-blue-600' :
                                        'bg-gray-100 text-gray-500'
                                }`}>
                                {t(`status_${plan.status}`)}
                            </span>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-4 mb-6">
                            <div className="bg-gray-50 rounded-xl p-3">
                                <div className="text-xs text-gray-400 mb-1">{t("radius_label")}</div>
                                <div className="text-lg font-bold text-gray-700">{plan.radius} <span className="text-xs font-normal">km</span></div>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                                <div className="text-xs text-gray-400 mb-1">{t("item_count_label")}</div>
                                <div className="text-lg font-bold text-gray-700">{plan.itemCount} <span className="text-xs font-normal">items</span></div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={async () => {
                                    if (plan.status === 'ready' && !plan.startedAt) {
                                        let startLocName = "Unknown Location";

                                        // Attempt to get start location name
                                        if (navigator.geolocation) {
                                            try {
                                                const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                                                    navigator.geolocation.getCurrentPosition(resolve, reject);
                                                });
                                                startLocName = await getLocationName(pos.coords.latitude, pos.coords.longitude);
                                            } catch (e) {
                                                // Fallback to Plan Center (approx location)
                                                if (plan.center) {
                                                    startLocName = await getLocationName(plan.center.lat, plan.center.lng);
                                                } else if (plan.items && plan.items.length > 0) {
                                                    startLocName = await getLocationName(plan.items[0].lat, plan.items[0].lng);
                                                }
                                            }
                                        }

                                        const updated = {
                                            ...plan,
                                            status: 'active',
                                            startedAt: new Date().toISOString(),
                                            startLocation: startLocName
                                        };
                                        savePlan(updated as any);
                                    }
                                    router.push(`/adventure/${plan.id}`);
                                }}
                                className="flex-1 bg-quest-green-700 hover:bg-quest-green-800 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 shadow-md transition-colors text-sm"
                            >
                                {plan.status === 'active' || plan.status === 'paused' ? (
                                    <>
                                        <RotateCcw size={18} /> {t("resume_adventure")}
                                    </>
                                ) : (
                                    <>
                                        <Play size={18} /> {t("start_adventure")}
                                    </>
                                )}
                            </button>

                            <button
                                onClick={() => handleDelete(plan.id)}
                                className="bg-gray-100 hover:bg-red-50 hover:text-red-500 text-gray-400 p-3 rounded-xl transition-colors"
                                aria-label="Delete"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
}
