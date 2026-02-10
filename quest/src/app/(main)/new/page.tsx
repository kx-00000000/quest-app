"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { savePlan } from "@/lib/storage";
import { generateRandomPoint } from "@/lib/geo";
import LazyMap from "@/components/Map/LazyMap";
import { CheckCircle2, Play, Loader2 } from "lucide-react";

const rangeModes = [
    { id: 'neighborhood', label: 'NEIGHBORHOOD', min: 0.5, max: 15, step: 0.1 },
    { id: 'excursion', label: 'EXCURSION', min: 15, max: 200, step: 1 },
    { id: 'grand', label: 'GRAND', min: 200, max: 40000, step: 100 }
];

const formatDistance = (km: number): string => {
    const meters = km * 1000;
    if (meters < 1000) return `${Math.floor(meters).toLocaleString()} m`;
    return `${km.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`;
};

export default function NewQuestPage() {
    const router = useRouter();
    const { t } = useTranslation();

    // ステート管理
    const [name, setName] = useState(""); // 空文字から開始
    const [activeMode, setActiveMode] = useState(rangeModes[0]);
    const [radius, setRadius] = useState(1);
    const [itemCount, setItemCount] = useState(3);
    const [isCreating, setIsCreating] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    const [briefingItems, setBriefingItems] = useState<any[]>([]);
    const [isBriefingActive, setIsBriefingActive] = useState(false);
    const [isFinalOverview, setIsFinalOverview] = useState(false);

    // 初期位置取得
    useEffect(() => {
        if (typeof window !== "undefined" && "geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.warn(err)
            );
        }
    }, []);

    const handleRadiusChange = (val: number) => {
        setRadius(val);
    };

    const handleCreate = async () => {
        setIsCreating(true);
        let center = userLocation || { lat: 35.6812, lng: 139.7671 };
        const validItems: any[] = [];
        let attempts = 0;

        // 陸地優先の生成ロジック
        while (validItems.length < itemCount && attempts < 25) {
            attempts++;
            const point = generateRandomPoint(center, radius);
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${point.lat}&lon=${point.lng}&format=json&zoom=10`);
                const data = await res.json();

                // 住所情報があるか、水域でないかを確認
                const hasPlace = data.address && (data.address.country || data.address.city || data.address.state);
                const isWater = data.type === "water" || data.class === "natural";

                if (hasPlace && !isWater) {
                    validItems.push({
                        id: Math.random().toString(36).substr(2, 9),
                        lat: point.lat,
                        lng: point.lng,
                        isCollected: false,
                        name: `Item #${validItems.length + 1}`
                    });
                }
            } catch (e) { /* ignore */ }
        }

        // 陸地が見つからなかった場合のフォールバック
        if (validItems.length === 0) {
            const p = generateRandomPoint(center, radius * 0.2);
            validItems.push({ id: 'f1', lat: p.lat, lng: p.lng, isCollected: false, name: "Recon Target" });
        }

        const plan = {
            id: Math.random().toString(36).substr(2, 9),
            name: name.trim() || "NEW QUEST", // 未入力ならデフォルト名
            radius,
            itemCount: validItems.length,
            status: "ready",
            createdAt: new Date().toLocaleDateString(),
            totalDistance: 0,
            collectedCount: 0,
            center,
            items: validItems
        };

        savePlan(plan);
        setBriefingItems(validItems);
        setIsCreating(false);
        setShowConfirm(true); // 確認ダイアログを表示
    };

    return (
        <div className="flex flex-col h-full min-h-screen pb-20 relative overflow-hidden bg-white">
            {/* 地図背景 */}
            <div className="absolute inset-0 z-0">
                <LazyMap
                    radiusInKm={radius}
                    userLocation={userLocation}
                    themeColor="#F06292"
                    items={briefingItems}
                    isBriefingActive={isBriefingActive}
                    isFinalOverview={isFinalOverview}
                    onBriefingStateChange={setIsFinalOverview}
                    onBriefingComplete={() => router.push("/plan")}
                />
            </div>

            {/* メインUIレイヤー */}
            {!isBriefingActive && !showConfirm && (
                <>
                    {/* 名前入力ヘッダー */}
                    <div className="absolute top-8 left-6 right-6 z-20 animate-in fade-in duration-500">
                        <div className="bg-white/40 backdrop-blur-2xl rounded-[2rem] border border-white/40 shadow-xl px-6 py-3">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="冒険の名前を入力"
                                className="w-full bg-transparent border-none outline-none text-gray-800 font-black text-center placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* 下部設定カード */}
                    <div className="mt-auto relative z-10 px-4 mb-4 animate-in slide-in-from-bottom-8 duration-500">
                        <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-6 shadow-2xl border border-white space-y-5">
                            {/* モード切替 */}
                            <div className="flex p-1 bg-black/5 rounded-2xl gap-1">
                                {rangeModes.map((mode) => (
                                    <button
                                        key={mode.id}
                                        onClick={() => { setActiveMode(mode); setRadius(mode.min); }}
                                        className={`flex-1 py-2 text-[9px] font-black rounded-xl transition-all ${activeMode.id === mode.id ? 'bg-white text-pink-600 shadow-sm' : 'text-gray-500'}`}
                                    >
                                        {mode.label}
                                    </button>
                                ))}
                            </div>

                            {/* スライダーエリア */}
                            <div className="space-y-4 px-1">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm font-black text-pink-600 uppercase tracking-widest">
                                        <span>Radius</span>
                                        <span className="text-gray-800">{formatDistance(radius)}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min={activeMode.min}
                                        max={activeMode.max}
                                        step={activeMode.step}
                                        value={radius}
                                        onChange={(e) => handleRadiusChange(parseFloat(e.target.value))}
                                        className="w-full h-1.5 accent-pink-500 bg-black/10 rounded-full appearance-none cursor-pointer"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between text-sm font-black text-pink-600 uppercase tracking-widest">
                                        <span>Items Count</span>
                                        <span className="text-gray-800">{itemCount}</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="7"
                                        step="1"
                                        value={itemCount}
                                        onChange={(e) => setItemCount(parseInt(e.target.value))}
                                        className="w-full h-1.5 accent-pink-500 bg-black/10 rounded-full appearance-none cursor-pointer"
                                    />
                                </div>
                            </div>

                            {/* 作成ボタン */}
                            <button
                                onClick={handleCreate}
                                disabled={isCreating}
                                className="w-full py-4 bg-gray-900 text-white rounded-[2rem] font-black shadow-lg flex items-center justify-center gap-2 active:scale-95 transition-all border-b-4 border-black/20"
                            >
                                {isCreating ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        <span>クエスト生成中...</span>
                                    </>
                                ) : "クエストを作成"}
                            </button>
                        </div>
                    </div>
                </>
            )}

            {/* クエスト開始確認ダイアログ */}
            {showConfirm && (
                <div className="absolute inset-0 z-[2000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300 pointer-events-auto">
                    <div className="bg-white rounded-[3rem] p-8 shadow-2xl w-full max-w-sm text-center space-y-6">
                        <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 size={32} className="text-pink-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight leading-none">Quest Ready</h3>
                            <p className="text-[10px] font-bold text-gray-400 mt-3 uppercase tracking-widest leading-relaxed">全目的地の解析が完了しました。<br />ブリーフィングを開始しますか？</p>
                        </div>
                        <button
                            onClick={() => { setShowConfirm(false); setIsBriefingActive(true); }}
                            className="w-full py-4 bg-gray-900 text-white rounded-[2rem] font-black flex items-center justify-center gap-2 shadow-xl active:scale-95 transition-all"
                        >
                            <Play size={16} fill="currentColor" />
                            START BRIEFING
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}