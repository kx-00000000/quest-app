"use client";

import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Map, Marker, useMap } from '@vis.gl/react-google-maps';

const mapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
    { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e0e0e0" }] }
];

interface LazyMapProps {
    items?: any[];
    center?: { lat: number; lng: number };
    userLocation?: { lat: number; lng: number } | null;
    radiusInKm?: number;
    themeColor?: string;
    isLogMode?: boolean;
    isBriefingActive?: boolean;
    isFinalOverview?: boolean;
    onBriefingStateChange?: (state: boolean) => void;
    onBriefingComplete?: () => void;
}

export default function LazyMap({
    items = [], center, userLocation, radiusInKm,
    themeColor = "#000000", isLogMode = false,
    isBriefingActive = false, isFinalOverview = false,
    onBriefingStateChange, onBriefingComplete
}: LazyMapProps) {
    const map = useMap();
    const [activePlaceName, setActivePlaceName] = useState<string | null>(null);

    // 1. オートズーム (fitBounds)
    useEffect(() => {
        if (!map || items.length === 0 || isBriefingActive) return;
        if (isLogMode || isFinalOverview) {
            const bounds = new google.maps.LatLngBounds();
            items.forEach(item => bounds.extend({ lat: item.lat, lng: item.lng }));
            if (userLocation) bounds.extend(userLocation);
            map.fitBounds(bounds, 60);
        }
    }, [map, items, isLogMode, isFinalOverview, userLocation, isBriefingActive]);

    // 2. ブリーフィング演出（ panTo で滑らかに移動 ）
    useEffect(() => {
        if (!isBriefingActive || !map || items.length === 0) return;

        const runBriefing = async () => {
            // 初期待機
            await new Promise(r => setTimeout(r, 1000));

            for (const item of items) {
                // 地点へ移動
                map.panTo({ lat: item.lat, lng: item.lng });
                map.setZoom(15);

                // 地名ポップアップ表示（アイテム名があれば表示）
                setActivePlaceName(item.addressName || "Waypoint Detected");

                await new Promise(r => setTimeout(r, 2500));
            }

            setActivePlaceName("Mission Finalizing...");
            const bounds = new google.maps.LatLngBounds();
            items.forEach(i => bounds.extend({ lat: i.lat, lng: i.lng }));
            if (userLocation) bounds.extend(userLocation);
            map.fitBounds(bounds, 80);

            await new Promise(r => setTimeout(r, 1500));
            setActivePlaceName(null);

            if (onBriefingStateChange) onBriefingStateChange(true);
            if (onBriefingComplete) onBriefingComplete();
        };

        runBriefing();
    }, [isBriefingActive, map, items, userLocation, onBriefingStateChange, onBriefingComplete]);

    // ★ 修正：ブリーフィング中は中心を固定しない（移動を妨げない）
    const controlledCenter = useMemo(() => {
        if (isBriefingActive) return null; // ブリーフィング中は panTo に任せる
        if (userLocation) return userLocation;
        return center || { lat: 35.6812, lng: 139.7671 };
    }, [isBriefingActive, userLocation, center]);

    return (
        <div className="w-full h-full relative">
            <Map
                defaultZoom={14}
                center={controlledCenter}
                styles={mapStyle}
                disableDefaultUI={true}
                gestureHandling={'greedy'}
            >
                {userLocation && <Marker position={userLocation} />}
                {items.map((item, idx) => (
                    <Marker
                        key={item.id || idx}
                        position={{ lat: item.lat, lng: item.lng }}
                        label={isLogMode ? { text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' } : undefined}
                    />
                ))}
            </Map>

            {/* 地名ポップアップ：航空機内のアナウンス風 */}
            {activePlaceName && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-24 z-50 animate-in fade-in zoom-in duration-500">
                    <div className="bg-black/80 backdrop-blur-md px-6 py-2 rounded-full border border-white/20 shadow-2xl">
                        <p className="text-white text-[10px] font-black uppercase tracking-[0.2em] whitespace-nowrap">
                            Scanning: <span className="text-pink-400">{activePlaceName}</span>
                        </p>
                    </div>
                </div>
            )}

            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.03)]" />
        </div>
    );
}