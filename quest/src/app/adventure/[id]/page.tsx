"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getPlans } from "@/lib/storage";

export default function AdventurePage() {
    const params = useParams();
    const router = useRouter();
    const [plan, setPlan] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        try {
            const id = params?.id;
            if (!id) return;

            const found = getPlans().find(p => p.id === id);
            if (found) {
                setPlan(found);
            } else {
                setError("Plan not found in storage.");
            }
        } catch (e: any) {
            setError("Storage Error: " + e.message);
        }
    }, [params?.id]);

    if (error) return <div className="p-10 text-red-500 bg-red-50 h-screen">{error}</div>;
    if (!plan) return <div className="p-10 h-screen flex items-center justify-center italic text-pink-500">SYNCING DATA...</div>;

    return (
        <div className="h-screen bg-white p-10 flex flex-col items-center justify-center text-center">
            <h1 className="text-3xl font-black text-gray-800 mb-4">{plan.name}</h1>
            <p className="text-pink-500 font-bold mb-8">スケルトン・テスト中</p>
            <div className="bg-gray-100 p-6 rounded-2xl w-full">
                <p className="text-xs text-gray-400 uppercase font-black">Radius</p>
                <p className="text-xl font-black">{plan.radius} km</p>
            </div>
            <button
                onClick={() => router.back()}
                className="mt-10 px-8 py-3 bg-gray-900 text-white rounded-full font-bold"
            >
                戻る
            </button>
        </div>
    );
}