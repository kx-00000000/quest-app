"use client";

import dynamic from "next/dynamic";

const Map = dynamic(() => import("./Map"), {
    ssr: false, // サーバー側での読み込みを完全に禁止
    loading: () => (
        <div className="h-full w-full bg-gray-100 flex items-center justify-center">
            <p className="text-gray-400 font-bold text-xs uppercase">Loading Map...</p>
        </div>
    ),
});

export default function LazyMap(props: any) {
    // どんなデータ（props）が来てもそのまま地図へ流す
    return <Map {...props} />;
}