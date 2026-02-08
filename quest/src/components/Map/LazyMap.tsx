"use client";

import dynamic from "next/dynamic";
import { ComponentType } from "react";

interface MapProps {
    radiusInKm?: number;
    items?: any[];
    path?: any[];
    center?: { lat: number; lng: number };
    userLocation?: { lat: number; lng: number } | null;
    themeColor?: string;
    [key: string]: any;
}

const Map = dynamic(() => import("./Map"), {
    ssr: false,
    loading: () => (
        <div className="h-full w-full bg-gray-100 animate-pulse flex items-center justify-center">
            <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading Map...</p>
        </div>
    ),
}) as ComponentType<MapProps>;

export default function LazyMap(props: MapProps) {
    return <Map {...props} />;
}