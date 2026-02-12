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

function MapCircle({ center, radius, color }: { center: google.maps.LatLngLiteral, radius: number, color: string }) {
    const map = useMap();
    const circleRef = useRef<google.maps.Circle | null>(null);
    useEffect(() => {
        if (!map) return;
        if (circleRef.current) circleRef.current.setMap(null);
        circleRef.current = new google.maps.Circle({
            map, center, radius: radius * 1000,
            fillColor: color, fillOpacity: 0.1, strokeColor: color, strokeOpacity: 0.4, strokeWeight: 1,
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

    // ★ 解決：世界地図になる問題の対策（有効な座標のみで計算）
    useEffect(() => {
        if (!map || items.length === 0 || isBriefingActive) return;

        const applyBounds = () => {
            const bounds = new google.maps.LatLngBounds();
            let count = 0;
            items.forEach(item => {
                if (item.lat && item.lng) {
                    bounds.extend({ lat: item.lat, lng: item.lng });
                    count++;
                }
            });
            if (userLocation?.lat) { bounds.extend(userLocation); count++; }

            if (count > 0) {
                map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
            }
        };

        const timer = setTimeout(applyBounds, 800);
        return () => clearTimeout(timer);
    }, [map, items, isLogMode, isFinalOverview, userLocation, isBriefingActive]);

    // ★ 解決：演出を廃止し、地点切り替えのみにする
    useEffect(() => {
        if (!isBriefingActive || !map || items.length === 0) return;

        const runBriefing = async () => {
            map.setZoom(15); // 常に一定の高さ

            for (const item of items) {
                map.panTo({ lat: item.lat, lng: item.lng });
                setActivePlaceName(item.addressName || "Waypoint");
                await new Promise(r => setTimeout(r, 2500)); // 静止して見せる時間
            }

            if (onBriefingStateChange) onBriefingStateChange(true);
            if (onBriefingComplete) onBriefingComplete();
            setActivePlaceName(null);
        };

        runBriefing();
    }, [isBriefingActive, map, items]);

    const initialCenter = useMemo(() => {
        if (userLocation?.lat) return userLocation;
        if (center?.lat) return center;
        if (items[0]?.lat) return { lat: items[0].lat, lng: items[0].lng };
        return { lat: 35.6812, lng: 139.7671 };
    }, [userLocation, center, items]);

    return (
        <div className="w-full h-full relative bg-[#f5f5f5]">
            <Map
                defaultZoom={14}
                center={initialCenter}
                styles={mapStyle}
                disableDefaultUI={true}
                gestureHandling={'greedy'}
            >
                {userLocation && <Marker position={userLocation} />}
                {/* ★ 解決：ブリーフィング中は円を隠す */}
                {userLocation && radiusInKm && !isBriefingActive && (
                    <MapCircle center={userLocation} radius={radiusInKm} color={themeColor} />
                )}
                {items.map((item, idx) => (
                    <Marker key={item.id || idx} position={{ lat: item.lat, lng: item.lng }} label={{ text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' }} />
                ))}
            </Map>
            {activePlaceName && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50">
                    <div className="bg-black/90 px-6 py-2 rounded-full border border-[#F37343]/30 shadow-2xl">
                        <p className="text-white text-[10px] font-black uppercase tracking-[0.3em]">
                            <span className="text-[#F37343]">Scanning:</span> {activePlaceName}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}