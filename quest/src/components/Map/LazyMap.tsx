"use client";

import dynamic from "next/dynamic";

interface MapProps {
    radiusInKm?: number;
    items?: { lat: number; lng: number }[];
    path?: { lat: number; lng: number }[];
    center?: { lat: number; lng: number };
}

const Map = dynamic<MapProps>(() => import("./Map"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-full bg-gray-100 animate-pulse flex items-center justify-center text-gray-400">
            Loading Map...
        </div>
    ),
});

export default Map;
