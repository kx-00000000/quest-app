"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import dynamic from "next/dynamic";

// SSR（サーバー側での計算）を完全に禁止して、ブラウザが落ち着いてから読み込む
const AdventureView = dynamic(() => import("./AdventureView"), {
    ssr: false,
    loading: () => <div className="h-screen bg-white flex items-center justify-center font-black text-pink-500 italic">PREPARING...</div>,
});

export default function AdventurePage() {
    const params = useParams();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient || !params?.id) return null;

    return <AdventureView id={params.id as string} />;
}