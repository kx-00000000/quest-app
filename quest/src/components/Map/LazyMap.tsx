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

// --- 探索円を描画するサブコンポーネント ---
function MapCircle({ center, radius, color }: { center: google.maps.LatLngLiteral, radius: number, color: string }) {
    const map = useMap();
    const circleRef = useRef<google.maps.Circle | null>(null);

    useEffect(() => {
        if (!map) return;
        if (circleRef.current) circleRef.current.setMap(null);

        circleRef.current = new google.maps.Circle({
            map,
            center,
            radius: radius * 1000, // kmをmに変換
            fillColor: color,
            fillOpacity: 0.1,
            strokeColor: color,
            strokeOpacity: 0.4,
            strokeWeight: 1,
        });

        return () => { if (circleRef.current) circleRef.current.setMap(null); };
    }, [map, center, radius, color]);

    return null;
}

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
    themeColor = "#F37343", isLogMode = false,
    isBriefingActive = false, isFinalOverview = false,
    onBriefingStateChange, onBriefingComplete
}: LazyMapProps) {
    const map = useMap();
    const [activePlaceName, setActivePlaceName] = useState<string | null>(null);

    // ★ プラン表示・ログ表示のオートズーム (fitBounds)
    useEffect(() => {
        if (!map || items.length === 0 || isBriefingActive) return;

        const bounds = new google.maps.LatLngBounds();
        items.forEach(item => bounds.extend({ lat: item.lat, lng: item.lng }));
        if (userLocation) bounds.extend(userLocation);
        else if (center) bounds.extend(center);

        // 地図がロードされてから枠に収める
        const timeout = setTimeout(() => {
            map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
        }, 500);
        return () => clearTimeout(timeout);
    }, [map, items, isLogMode, isFinalOverview, userLocation, isBriefingActive, center]);

    // ★ 洗練されたブリーフィング演出 (Pan -> Smooth Move -> Focus)
    useEffect(() => {
        if (!isBriefingActive || !map || items.length === 0) return;

        const runBriefing = async () => {
            // 現在地からスタート
            map.setZoom(13);
            await new Promise(r => setTimeout(r, 1000));

            for (const item of items) {
                // 1. 移動開始 (Pan)
                map.panTo({ lat: item.lat, lng: item.lng });
                setActivePlaceName(item.addressName || "Waypoint");

                // 2. 移動中に少し引いて「躍動感」を出す
                await new Promise(r => setTimeout(r, 500));
                map.setZoom(14);

                // 3. 到着に合わせて急降下ズーム (Focus)
                await new Promise(r => setTimeout(r, 1000));
                map.setZoom(17);

                await new Promise(r => setTimeout(r, 2000));
            }

            // フィナーレ
            const bounds = new google.maps.LatLngBounds();
            items.forEach(i => bounds.extend({ lat: i.lat, lng: i.lng }));
            if (userLocation) bounds.extend(userLocation);
            map.fitBounds(bounds, 100);

            await new Promise(r => setTimeout(r, 1500));
            setActivePlaceName(null);
            if (onBriefingStateChange) onBriefingStateChange(true);
            if (onBriefingComplete) onBriefingComplete();
        };

        runBriefing();
    }, [isBriefingActive, map, items, userLocation, onBriefingStateChange, onBriefingComplete]);

    const mapCenter = useMemo(() => {
        if (isBriefingActive || isLogMode || isFinalOverview) return null;
        if (userLocation) return userLocation;
        return center || { lat: 35.6812, lng: 139.7671 };
    }, [isBriefingActive, isLogMode, isFinalOverview, userLocation, center]);

    return (
        <div className="w-full h-full relative">
            <Map defaultZoom={14} center={mapCenter} styles={mapStyle} disableDefaultUI={true} gestureHandling={'greedy'}>
                {userLocation && <Marker position={userLocation} />}
                {userLocation && radiusInKm && <MapCircle center={userLocation} radius={radiusInKm} color={themeColor} />}
                {items.map((item, idx) => (
                    <Marker key={item.id || idx} position={{ lat: item.lat, lng: item.lng }} label={{ text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' }} />
                ))}
            </Map>

            {/* 地名ポップアップ */}
            {activePlaceName && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="bg-black/90 px-6 py-2 rounded-full border border-[#F37343]/30 shadow-2xl">
                        <p className="text-white text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap">
                            <span className="text-[#F37343]">Scanning:</span> {activePlaceName}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}