"use client";

import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Map, Marker, useMap } from '@vis.gl/react-google-maps';

const mapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e0e0e0" }] }
];

export default function LazyMap({
    items = [], center, userLocation, path = [],
    isBriefingActive = false, onBriefingStateChange, onBriefingComplete
}: any) {
    const map = useMap();
    const [activePlaceName, setActivePlaceName] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState<number>(-1);
    const briefingRef = useRef(false);

    useEffect(() => {
        if (!isBriefingActive || !map || items.length === 0 || briefingRef.current) return;
        briefingRef.current = true;

        const runBriefing = async () => {
            map.setZoom(15);
            for (let i = 0; i < items.length; i++) {
                setActiveIndex(i);
                setActivePlaceName(items[i].addressName || "WAYPOINT");
                map.panTo({ lat: Number(items[i].lat), lng: Number(items[i].lng) });
                await new Promise(r => setTimeout(r, 2500));
            }
            setActivePlaceName(null);
            setActiveIndex(-1);
            briefingRef.current = false;
            if (onBriefingStateChange) onBriefingStateChange(true);
            if (onBriefingComplete) onBriefingComplete();
        };
        runBriefing();
    }, [isBriefingActive, map, items]);

    return (
        <div className="w-full h-full relative bg-[#f5f5f5]">
            <Map defaultZoom={12} defaultCenter={center} styles={mapStyle} disableDefaultUI={true}>
                {userLocation && <Marker position={userLocation} />}
                {items.map((item: any, idx: number) => (
                    <Marker key={idx} position={{ lat: Number(item.lat), lng: Number(item.lng) }} label={{ text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' }} />
                ))}
            </Map>

            {/* ブリーフィング演出: 横に長いセグメントバー */}
            {activePlaceName && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4 w-full px-12">
                    <div className="bg-black/90 px-8 py-3 rounded-full">
                        <p className="text-white text-[11px] font-black uppercase tracking-[0.4em]">{activePlaceName}</p>
                    </div>
                    {/* ここが横長のバーUIです */}
                    <div className="flex gap-1 w-full max-w-[300px] h-1.5 px-1 bg-black/5 rounded-full overflow-hidden">
                        {items.map((_: any, idx: number) => (
                            <div
                                key={idx}
                                className={`flex-1 transition-all duration-1000 ${idx <= activeIndex ? "bg-[#F37343]" : "bg-transparent"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}