"use client";
import dynamic from "next/dynamic";

const Map = dynamic(() => import("./Map"), {
    ssr: false, // サーバーサイドレンダリングを完全に無効化
    loading: () => <div className="h-full w-full bg-gray-100 animate-pulse" />,
});

export default function LazyMap(props: any) {
    return <Map {...props} />;
}