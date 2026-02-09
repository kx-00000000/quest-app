"use client";

import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

// ロジックとUIをすべて含んだ「AdventureView」を、ブラウザ専用として読み込む
const AdventureView = dynamic(() => import("./AdventureView"), {
    ssr: false,
    loading: () => (
        <div className="h-screen bg-white flex items-center justify-center font-black text-pink-500 italic">
            PREPARING ADVENTURE...
        </div>
    ),
});

export default function AdventurePage() {
    const params = useParams();
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    // ブラウザでマウントされるまでは絶対に何も描画しない
    if (!isClient || !params?.id) return null;

    return <AdventureView id={params.id as string} />;
}