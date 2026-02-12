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

    // 2. 躍動感のあるブリーフィング演出
    useEffect(() => {
        if (!isBriefingActive || !map || items.length === 0) return;

        const runBriefing = async () => {
            // 最初は広域視点から
            map.setZoom(12);
            await new Promise(r => setTimeout(r, 1000));

            for (const item of items) {
                // A. 目的地へ滑らかに移動
                map.panTo({ lat: item.lat, lng: item.lng });
                setActivePlaceName(item.addressName || "WAYPOINT DETECTED");

                // B. 移動の途中でズームインを開始（躍動感の演出）
                await new Promise(r => setTimeout(r, 800));
                map.setZoom(16);

                // C. 地点での確認待機
                await new Promise(r => setTimeout(r, 1500));
            }

            // D. フィナーレ：全体俯瞰へ
            setActivePlaceName("MISSION LOG VERIFIED");
            const bounds = new google.maps.LatLngBounds();
            items.forEach(i => bounds.extend({ lat: i.lat, lng: i.lng }));
            if (userLocation) bounds.extend(userLocation);

            map.fitBounds(bounds, 80);
            await new Promise(r => setTimeout(r, 2000));
            setActivePlaceName(null);

            if (onBriefingStateChange) onBriefingStateChange(true);
            if (onBriefingComplete) onBriefingComplete();
        };

        runBriefing();
    }, [isBriefingActive, map, items, userLocation, onBriefingStateChange, onBriefingComplete]);

    const controlledCenter = useMemo(() => {
        if (isBriefingActive) return null; // ブリーフィング中は自由移動を許可
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
                        label={{ text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' }}
                    />
                ))}
            </Map>

            {/* 航空アナウンス風ポップアップ */}
            {activePlaceName && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="bg-black/90 px-6 py-2 rounded-full border border-pink-500/30 shadow-[0_0_20px_rgba(236,72,153,0.15)]">
                        <p className="text-white text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap">
                            <span className="text-pink-500">Scanning:</span> {activePlaceName}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}