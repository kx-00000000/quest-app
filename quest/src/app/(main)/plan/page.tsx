"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getPlans, savePlan, type Plan, deletePlan } from "@/lib/storage";
import { getLocationName } from "@/lib/geo";
import { Play, RotateCcw, Trash2, MapPin, ChevronRight } from "lucide-react";

// 距離をきれいに表示するフォーマッター
const formatDistance = (km: number): string => {
    if (km < 1) {
        const meters = Math.floor(km * 1000);
        return `${meters.toLocaleString()} m`;
    }
    return `${km.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
};

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
        <div className="min-h-screen bg-gray-50/50 p-6 pb-24">
            {/* ヘッダー：デザインをNew画面と統一 */}
            <div className="sticky top-0 z-10 bg-gray-50/80 backdrop-blur-md -mx-6 px-6 pb-4 pt-6 mb-2">
                <h1 className="text-2xl font-black text-gray-800 flex items-center gap-2 italic">
                    <MapPin className="text-pink-600" />
                    {t("tab_plan").toUpperCase()}
                    <span className="text-sm font-black text-pink-300 ml-2">({plans.length})</span>
                </h1>
            </div>

            <div className="space-y-6">
                {plans.map((plan) => (
                    <div key={plan.id} className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-xl border border-white/60 relative overflow-hidden">

                        {/* Status Badge */}
                        <div className="absolute top-0 right-0">
                            <span className={`px-4 py-1.5 rounded-bl-3xl text-[10px] font-black tracking-tighter uppercase ${plan.status === 'active' ? 'bg-orange-100 text-orange-600' :
                                    plan.status === 'completed' ? 'bg-blue-100 text-blue-600' :
                                        'bg-pink-50 text-pink-400'
                                }`}>
                                {t(`status_${plan.status}`)}
                            </span>
                        </div>

                        {/* Title & Info */}
                        <div className="mb-4 pt-2">
                            <h3 className="text-xl font-black text-gray-800 leading-tight">{plan.name}</h3>
                            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">Created: {plan.createdAt}</p>
                        </div>

                        {/* Stats Grid: 新しい距離表示を適用 */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-black/5 rounded-2xl p-4">
                                <div className="text-[9px] font-black text-pink-600 uppercase tracking-widest mb-1">{t("radius_label")}</div>
                                <div className="text-lg font-black text-gray-800">{formatDistance(plan.radius)}</div>
                            </div>
                            <div className="bg-black/5 rounded-2xl p-4">
                                <div className="text-[9px] font-black text-pink-600 uppercase tracking-widest mb-1">{t("item_count_label")}</div>
                                <div className="text-lg font-black text-gray-800">{plan.itemCount} <span className="text-xs">ITEMS</span></div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={async () => {
                                    if (plan.status === 'ready' && !plan.startedAt) {
                                        let startLocName = "Unknown Location";
                                        if (navigator.geolocation) {
                                            try {
                                                const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
                                                    navigator.geolocation.getCurrentPosition(resolve, reject);
                                                });
                                                startLocName = await getLocationName(pos.coords.latitude, pos.coords.longitude);
                                            } catch (e) {
                                                if (plan.center) startLocName = await getLocationName(plan.center.lat, plan.center.lng);
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
                                className="flex-[3] bg-gradient-to-r from-[#F06292] to-[#FF8A65] text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all text-sm uppercase tracking-widest border-b-4 border-black/10"
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
                                className="flex-1 bg-black/5 hover:bg-red-50 hover:text-red-500 text-gray-400 p-4 rounded-2xl transition-all flex items-center justify-center"
                                aria-label="Delete"
                            >
                                <Trash2 size={20} />
                            </button>
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
}