"use client";

import dynamic from "next/dynamic";

// 完全にブラウザ側でのみ描画することを強制します
const Map = dynamic(() => import("./Map"), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-gray-100 flex items-center justify-center">
            <p className="text-gray-400 font-bold text-xs">LOADING MAP...</p>
        </div>
    ),
});

export default function LazyMap(props: any) {
    // props（位置情報など）が更新されても地図を壊さないように渡します
    return <Map {...props} />;
}