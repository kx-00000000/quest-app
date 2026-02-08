"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { savePlan } from "@/lib/storage";
import { generateRandomPoint } from "@/lib/geo";
import LazyMap from "@/components/Map/LazyMap";
import { Map as MapIcon, Sliders } from "lucide-react";

// 距離表示をフォーマットする関数
const formatDistance = (km: number): string => {
    const meters = km * 1000;
    if (meters < 1000) {
        // 1km未満: m単位、整数、3桁カンマ
        return `${Math.floor(meters).toLocaleString()} m`;
    } else {
        // 1km以上: km単位、小数点第1位、3桁カンマ
        return `${km.toLocaleString(undefined, {
            minimumFractionDigits: 1,
            maximumFractionDigits: 1
        })} km`;
    }
};

export default function NewQuestPage() {
    const router = useRouter();
    const { t } = useTranslation();

    const [name, setName] = useState("");
    const [radius, setRadius] = useState(1); // km
    const [activeRangeMode, setActiveRangeMode] = useState({ id: 'neighborhood', min: 0.5, max: 15, step: 0.1 });
    const [itemCount, setItemCount] = useState(3);
    const [isCreating, setIsCreating] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    // 画面表示時に現在地を取得
    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.warn("Location access denied", err)
            );
        }
    }, []);

    const handleCreate = async () => {
        setIsCreating(true);
        await new Promise(r => setTimeout(r, 800));

        const generateId = () => Math.random().toString(36).substring(2, 15);

        // 現在地が取得できていればそれを使用、できなければデフォルト（東京駅）
        let center = userLocation || { lat: 35.6812, lng: 139.7671 };

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
        <div className="flex flex-col h-full min-h-screen pb-24 relative bg-gradient-to-br from-[#FFF59D] via-[#F48FB1] to-[#CE93D8] overflow-x-hidden">
            {/* ヘッダーエリア */}
            <div className="p-8 pb-4">
                <h1 className="text-3xl font-black text-white drop-shadow-md flex items-center gap-3 italic">
                    <MapIcon className="w-8 h-8" />
                    {t("new_quest_title").toUpperCase()}
                </h1>
            </div>

            {/* 地図プレビュー：グラスモーフィズムな枠組み */}
            <div className="px-6 mb-6">
                <div className="relative h-[35vh] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/40">
                    <LazyMap radiusInKm={radius} userLocation={userLocation} />
                    {/* オーバーレイ */}
                    <div className="absolute top-4 left-4 bg-white/80 backdrop-blur-md px-4 py-1 rounded-full shadow-sm">
                        <span className="text-xs font-bold text-pink-600">PREVIEW</span>
                    </div>
                </div>
            </div>

            {/* 設定エリア：グラスモーフィズム・カード */}
            <div className="px-6 space-y-4">
                <div className="bg-white/30 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-xl border border-white/20 space-y-8">

                    {/* 1. 名前入力 */}
                    <div className="space-y-3">
                        <label className="text-xs font-black text-pink-800/60 uppercase tracking-widest ml-1">
                            {t("adventure_name_label")}
                        </label>
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t("adventure_name_placeholder")}
                            className="w-full px-6 py-4 rounded-2xl bg-white/50 border-none focus:ring-4 focus:ring-white/50 outline-none transition-all text-gray-800 font-bold placeholder:text-gray-400"
                        />
                    </div>

                    {/* 2. 半径選択 */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end px-1">
                            <label className="text-xs font-black text-pink-800/60 uppercase tracking-widest">
                                {t("radius_label")}
                            </label>
                            <span className="text-3xl font-black text-gray-800 tracking-tighter">
                                {formatDistance(radius)}
                            </span>
                        </div>

                        {/* 範囲切り替えタブ */}
                        <div className="flex p-1 bg-black/5 rounded-2xl">
                            {[
                                { id: 'neighborhood', label: t('range_neighborhood'), min: 0.5, max: 15, step: 0.5 },
                                { id: 'excursion', label: t('range_excursion'), min: 15, max: 200, step: 5 },
                                { id: 'grand', label: t('range_grand'), min: 200, max: 40000, step: 100 }
                            ].map((range) => (
                                <button
                                    key={range.id}
                                    onClick={() => {
                                        setActiveRangeMode(range);
                                        setRadius(range.min);
                                    }}
                                    className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${activeRangeMode.id === range.id
                                        ? "bg-white text-pink-600 shadow-sm"
                                        : "text-pink-900/40 hover:text-pink-900/60"
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
                            className="w-full h-2 bg-black/10 rounded-lg appearance-none cursor-pointer accent-pink-600"
                        />
                    </div>

                    {/* 3. アイテム数 */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end px-1">
                            <label className="text-xs font-black text-pink-800/60 uppercase tracking-widest">
                                {t("item_count_label")}
                            </label>
                            <span className="text-3xl font-black text-gray-800 tracking-tighter">
                                {itemCount} <span className="text-sm font-normal text-gray-500">個</span>
                            </span>
                        </div>
                        <input
                            type="range"
                            min="1" max="20" step="1"
                            value={itemCount}
                            onChange={(e) => setItemCount(parseInt(e.target.value))}
                            className="w-full h-2 bg-black/10 rounded-lg appearance-none cursor-pointer accent-pink-600"
                        />
                    </div>

                    {/* 作成ボタン */}
                    <button
                        onClick={handleCreate}
                        disabled={isCreating}
                        className="w-full py-5 bg-gradient-to-r from-[#F06292] to-[#FF8A65] text-white rounded-[2rem] font-black text-lg shadow-xl shadow-pink-500/20 active:scale-95 transition-all flex items-center justify-center gap-3 border-b-4 border-black/10"
                    >
                        {isCreating ? (
                            <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            t("create_button").toUpperCase()
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}