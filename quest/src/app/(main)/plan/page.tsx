"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { getPlans, savePlan, type Plan, deletePlan } from "@/lib/storage";
import { getLocationName } from "@/lib/geo";
import { Play, RotateCcw, Trash2, Package } from "lucide-react";

const formatDistance = (km: number): string => {
    if (km < 1) {
        const meters = Math.floor(km * 1000);
        return `${meters.toLocaleString()} m`;
    }
    return `${km.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
};

// Next.jsのページには必ずこの 'export default' が必要です
export default function PlanPage() {
    const router = useRouter();
    const { t } = useTranslation();
    const [plans, setPlans] = useState<Plan[]>([]);

    useEffect(() => {
        // アーカイブされていないプランのみ表示
        setPlans(getPlans().filter(p => !p.isArchived));
    }, []);

    const handleDelete = (id: string) => {
        if (confirm(t("delete_confirm_message"))) {
            deletePlan(id);
            setPlans(getPlans().filter(p => !p.isArchived));
        }
    };

    // アーカイブ機能：削除せず非表示にする
    const handleArchive = (id: string) => {
        const target = getPlans().find(p => p.id === id);
        if (target) {
            const updated = { ...target, isArchived: true };
            savePlan(updated as any);
            setPlans(getPlans().filter(p => !p.isArchived));
        }
    };

    return (
        <div className="min-h-screen bg-gray-50/50 p-6 pb-24 font-sans">
            <div className="pt-8" />

            <div className="space-y-6">
                {plans.map((plan) => (
                    <div key={plan.id} className="bg-white/70 backdrop-blur-xl rounded-[2.5rem] p-6 shadow-xl border border-white/60 relative overflow-hidden">

                        {/* アクションボタン群：右上に配置 */}
                        <div className="absolute top-7 right-7 flex gap-4 z-20">
                            <button
                                onClick={() => handleArchive(plan.id)}
                                className="text-gray-300 hover:text-orange-400 transition-colors"
                                aria-label="Archive"
                            >
                                <Package size={18} strokeWidth={2.5} />
                            </button>
                            <button
                                onClick={() => handleDelete(plan.id)}
                                className="text-gray-300 hover:text-red-400 transition-colors"
                                aria-label="Delete"
                            >
                                <Trash2 size={18} strokeWidth={2.5} />
                            </button>
                        </div>

                        {/* Title & Status Area */}
                        <div className="mb-4 pr-16">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="text-xl font-black text-gray-800 leading-tight">{plan.name}</h3>
                                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-tighter uppercase ${plan.status === 'active' ? 'bg-orange-100 text-orange-600' :
                                        plan.status === 'completed' ? 'bg-blue-100 text-blue-600' : 'bg-pink-50 text-pink-400'
                                    }`}>
                                    {t(`status_${plan.status}`)}
                                </span>
                            </div>
                            <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-widest">{plan.createdAt}</p>
                        </div>

                        {/* Stats Grid */}
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

                        {/* Main Action Button */}
                        <button
                            onClick={() => router.push(`/adventure/${plan.id}`)}
                            className="w-full bg-gradient-to-r from-[#F06292] to-[#FF8A65] text-white font-black py-4 px-6 rounded-2xl flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all text-sm uppercase tracking-widest border-b-4 border-black/10"
                        >
                            {plan.status === 'active' ? <RotateCcw size={18} /> : <Play size={18} />}
                            {plan.status === 'active' ? t("resume_adventure") : t("start_adventure")}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}