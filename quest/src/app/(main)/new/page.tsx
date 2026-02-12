"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRouter } from "next/navigation";
import { savePlan } from "@/lib/storage";
import { generateRandomPoint } from "@/lib/geo";
import { CheckCircle2, Play, Loader2, Target, Navigation, MapPin } from "lucide-react";
import dynamic from "next/dynamic";

// --- ★ LazyMap Props 定義 ---
interface LazyMapProps {
    items?: any[];
    center?: { lat: number; lng: number };
    userLocation?: { lat: number; lng: number } | null;
    radiusInKm?: number;
    themeColor?: string;
    isLogMode?: boolean;
    isBriefingActive?: boolean;
    isFinalOverview?: boolean;
    planId?: string | null;
    onBriefingStateChange?: (state: boolean) => void;
    onBriefingComplete?: () => void;
}

const LazyMap = dynamic<LazyMapProps>(
    () => import("@/components/Map/LazyMap").then((mod) => mod.default),
    {
        ssr: false,
        loading: () => <div className="h-full w-full bg-gray-50 animate-pulse flex items-center justify-center text-[10px] font-bold text-gray-300">INITIALIZING NAVIGATION SYSTEM...</div>
    }
);

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

    // 基本ステート
    const [name, setName] = useState("");
    const [activeMode, setActiveMode] = useState(rangeModes[0]);
    const [radius, setRadius] = useState(1);
    const [itemCount, setItemCount] = useState(3);
    const [isCreating, setIsCreating] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [userLocation, setUserLocation] = useState<{ lat: number, lng: number } | null>(null);

    // ブリーフィング・演出用ステート
    const [briefingItems, setBriefingItems] = useState<any[]>([]);
    const [isBriefingActive, setIsBriefingActive] = useState(false);
    const [isFinalOverview, setIsFinalOverview] = useState(false);
    const [activePlanId, setActivePlanId] = useState<string | null>(null);
    const [discoveredCities, setDiscoveredCities] = useState<string[]>([]); // ★ 追加：複数地名リスト

    // 現在地取得
    useEffect(() => {
        if (typeof window !== "undefined" && "geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                (err) => console.warn(err)
            );
        }
    }, []);

    const handleCreate = async () => {
        setIsCreating(true);
        const center = userLocation || { lat: 35.6812, lng: 139.7671 };
        const validItems: any[] = [];
        const citiesSet = new Set<string>();

        // ★ Google Geocoding API インスタンス
        const geocoder = new google.maps.Geocoder();

        let attempts = 0;
        const maxAttempts = 20; // 精度向上のため試行回数を調整

        while (validItems.length < itemCount && attempts < maxAttempts) {
            attempts++;
            const point = generateRandomPoint(center, radius);

            // ★ Google Geocoder による高精度な地名特定
            await new Promise((resolve) => {
                geocoder.geocode({ location: point }, (results, status) => {
                    if (status === "OK" && results?.[0]) {
                        const addr = results[0].address_components;
                        // 市町村名（locality）または行政区（sublocality）を取得
                        const city = addr.find(c => c.types.includes("locality"))?.long_name ||
                            addr.find(c => c.types.includes("administrative_area_level_2"))?.long_name ||
                            addr.find(c => c.types.includes("administrative_area_level_1"))?.long_name || "Unknown Area";

                        citiesSet.add(city);
                        validItems.push({
                            id: Math.random().toString(36).substr(2, 9),
                            lat: point.lat,
                            lng: point.lng,
                            isCollected: false,
                            addressName: city // ★ LazyMapのポップアップ用
                        });
                    }
                    resolve(null);
                });
            });
        }

        const planId = Math.random().toString(36).substr(2, 9);
        const plan = {
            id: planId,
            name: name.trim() || "NEW QUEST",
            radius,
            itemCount: validItems.length,
            status: "ready",
            createdAt: new Date().toISOString(),
            totalDistance: 0,
            collectedCount: 0,
            center,
            items: validItems
        };

        savePlan(plan);
        setDiscoveredCities(Array.from(citiesSet)); // 発見した全ての地名を保存
        setActivePlanId(planId);
        setBriefingItems(validItems);
        setIsCreating(false);
        setShowConfirm(true);
    };

    return (
        <div className="flex flex-col h-full min-h-screen pb-20 relative overflow-hidden bg-white">
            <div className="absolute inset-0 z-0">
                <LazyMap
                    radiusInKm={radius}
                    userLocation={userLocation}
                    themeColor="#E6672E"
                    items={briefingItems}
                    isBriefingActive={isBriefingActive}
                    isFinalOverview={isFinalOverview}
                    planId={activePlanId}
                    onBriefingStateChange={setIsFinalOverview}
                    onBriefingComplete={() => setIsBriefingActive(false)}
                />
            </div>

            {/* クエスト設定パネル（作成前） */}
            {!isBriefingActive && !showConfirm && !isFinalOverview && (
                <>
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

                    <div className="mt-auto relative z-10 px-4 mb-4 animate-in slide-in-from-bottom-8 duration-500">
                        <div className="bg-white/80 backdrop-blur-xl rounded-[3rem] p-6 shadow-2xl border border-white space-y-5">
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
                                        onChange={(e) => setRadius(parseFloat(e.target.value))}
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

            {/* 生成完了確認 */}
            {showConfirm && (
                <div className="absolute inset-0 z-[2000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] p-8 shadow-2xl w-full max-w-sm text-center space-y-6">
                        <div className="w-16 h-16 bg-pink-50 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 size={32} className="text-pink-500" />
                        </div>
                        <div>
                            <h3 className="text-xl font-black text-gray-800 uppercase tracking-tight leading-none">Quest Ready</h3>
                            <p className="text-[10px] font-bold text-gray-400 mt-3 uppercase tracking-widest leading-relaxed">
                                全目的地の解析が完了しました。<br />ブリーフィングを開始しますか？
                            </p>
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

            {/* ★ 改良：Discovery Report（全発見地名を表示） */}
            {isFinalOverview && (
                <div className="absolute inset-0 z-[3000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-md animate-in zoom-in-95 duration-500">
                    <div className="bg-white rounded-[3rem] p-8 w-full max-w-sm text-center space-y-8 relative overflow-hidden shadow-2xl">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-pink-500 via-orange-400 to-pink-500" />

                        <header>
                            <p className="text-[10px] font-black text-pink-500 uppercase tracking-[0.3em] mb-4">Discovery Report</p>

                            {/* 地名リストの表示エリア */}
                            <div className="max-h-40 overflow-y-auto space-y-2 py-2 px-2 custom-scrollbar">
                                {discoveredCities.length > 0 ? discoveredCities.map((city, idx) => (
                                    <h2 key={idx} className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">
                                        {city}
                                    </h2>
                                )) : (
                                    <h2 className="text-3xl font-black text-gray-900 uppercase tracking-tighter leading-none">NEW AREA</h2>
                                )}
                            </div>

                            <p className="text-[9px] font-bold text-gray-300 uppercase tracking-widest mt-4 italic">Navigation Path Verified</p>
                        </header>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 flex flex-col items-center">
                                <Target size={20} className="text-gray-300 mb-2" />
                                <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Waypoints</p>
                                <p className="text-xl font-black text-gray-900">{briefingItems.length}</p>
                            </div>
                            <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 flex flex-col items-center">
                                <Navigation size={20} className="text-gray-300 mb-2" />
                                <p className="text-[8px] font-bold text-gray-400 uppercase mb-1">Range</p>
                                <p className="text-xl font-black text-gray-900">{formatDistance(radius)}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={() => router.push("/plan")}
                                className="w-full py-5 bg-gray-900 text-white rounded-[2rem] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-3"
                            >
                                <Play size={18} fill="currentColor" />
                                Start Adventure
                            </button>
                            <button
                                onClick={() => { setIsFinalOverview(false); setShowConfirm(true); }}
                                className="w-full py-3 bg-transparent text-gray-300 font-bold text-[9px] uppercase tracking-widest hover:text-gray-500 transition-colors"
                            >
                                Re-run Briefing
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}