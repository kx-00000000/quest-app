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
        <div className="flex flex-col h-full min-h-screen pb-24 relative overflow-hidden">
            {/* 1. 地図を背景いっぱいに表示 */}
            <div className="absolute inset-0 z-0">
                <LazyMap
                    radiusInKm={radius}
                    userLocation={userLocation}
                    themeColor="#F48FB1" // ピンクを渡す
                />
                {/* 地図の上に少しグラデーションを重ねて文字を見やすくする */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40 pointer-events-none" />
            </div>

            {/* 2. ヘッダー（地図の上に浮かす） */}
            <div className="relative z-10 p-8 pb-4">
                <h1 className="text-3xl font-black text-white drop-shadow-lg flex items-center gap-3 italic">
                    <MapIcon className="w-8 h-8" />
                    {t("new_quest_title").toUpperCase()}
                </h1>
            </div>

            {/* 3. 設定エリア（下からスライドアップするカード風） */}
            <div className="mt-auto relative z-10 px-6 mb-4">
                <div className="bg-white/40 backdrop-blur-2xl rounded-[3rem] p-8 shadow-2xl border border-white/30 space-y-6">

                    {/* 名前入力 */}
                    <div className="space-y-2">
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder={t("adventure_name_placeholder")}
                            className="w-full px-6 py-4 rounded-2xl bg-white/60 border-none outline-none text-gray-800 font-bold placeholder:text-gray-500"
                        />
                    </div>

                    {/* 半径とアイテム数（横並びにしてスッキリさせる） */}
                    <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <label className="text-[10px] font-black text-pink-900 uppercase tracking-tighter">RADIUS</label>
                                <span className="text-xl font-black text-gray-900">{formatDistance(radius)}</span>
                            </div>
                            <input
                                type="range"
                                min={activeRangeMode.min} max={activeRangeMode.max} step={activeRangeMode.step}
                                value={radius}
                                onChange={(e) => setRadius(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-black/10 rounded-lg appearance-none cursor-pointer accent-pink-600"
                            />
                        </div>
                    </div>

                    {/* 作成ボタン */}
                    <button
                        onClick={handleCreate}
                        disabled={isCreating}
                        className="w-full py-5 bg-gradient-to-r from-[#F06292] to-[#FF8A65] text-white rounded-[2rem] font-black text-lg shadow-xl active:scale-95 transition-all border-b-4 border-black/10"
                    >
                        {isCreating ? "CREATING..." : t("create_button").toUpperCase()}
                    </button>
                </div>
            </div>
        </div>
    );
}