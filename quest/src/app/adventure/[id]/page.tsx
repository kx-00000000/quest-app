"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlans } from "@/lib/storage";
import { ArrowLeft } from "lucide-react";
import dynamic from "next/dynamic";

// 地図をブラウザ専用で読み込む
const LazyMap = dynamic(() => import("@/components/Map/LazyMap"), {
    ssr: false,
    loading: () => <div className="h-full w-full bg-pink-50 animate-pulse" />
});

export default function AdventurePage() {
    const params = useParams();
    const router = useRouter();
    const [plan, setPlan] = useState<any>(null);
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
        const id = params?.id;
        if (id) {
            const found = getPlans().find(p => p.id === id);
            setPlan(found);
        }
    }, [params?.id]);

    if (!isClient || !plan) return <div className="p-10 text-pink-500 italic">LOADING MAP TEST...</div>;

    return (
        <div className="h-screen bg-white relative overflow-hidden">
            {/* --- 地図を表示 --- */}
            <div className="absolute inset-0 z-0">
                <LazyMap
                    items={plan.items || []}
                    userLocation={null} // 一旦、GPS追跡もオフにして地図の描画だけを確認
                    themeColor="#F06292"
                    center={plan.center}
                />
            </div>

            {/* --- UIを重ねる --- */}
            <div className="relative z-10 p-6 pt-12 flex flex-col h-full pointer-events-none">
                <header className="flex justify-between items-center pointer-events-auto">
                    <button onClick={() => router.back()} className="w-12 h-12 bg-white/50 backdrop-blur-xl rounded-2xl flex items-center justify-center shadow-lg border border-white/40">
                        <ArrowLeft size={20} />
                    </button>
                </header>

                <div className="mt-auto mb-10 pointer-events-auto">
                    <div className="bg-white/50 backdrop-blur-3xl rounded-[3rem] p-8 shadow-2xl border border-white/40 text-center">
                        <h1 className="text-2xl font-black text-gray-800">{plan.name}</h1>
                        <p className="text-pink-500 font-bold">地図の描画テスト中</p>
                    </div>
                </div>
            </div>
        </div>
    );
}