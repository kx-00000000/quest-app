"use client";

import dynamic from "next/dynamic";
import { ComponentType } from "react";

// MapPropsの定義をMap.tsxと合わせる
interface MapProps {
    radiusInKm?: number;
    items?: { lat: number; lng: number }[];
    path?: { lat: number; lng: number }[];
    center?: { lat: number; lng: number };
    userLocation?: { lat: number; lng: number } | null;
}

// Mapコンポーネントを型安全に動的インポート
const Map = dynamic(() => import("./Map"), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">
            <p className="text-gray-400 font-bold">LOADING MAP...</p>
        </div>
    ),
}) as ComponentType<MapProps>;

export default function LazyMap(props: MapProps) {
    return <Map {...props} />;
}