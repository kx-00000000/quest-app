"use client";

import React, { useMemo, useEffect, useRef } from 'react';
import { Map, Marker, useMap } from '@vis.gl/react-google-maps';

// --- 🎨 航空計器デザイン：ミニマルな地図スタイル ---
const mapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
    { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e0e0e0" }] }
];

// --- 円を描画するコンポーネント ---
function MapCircle({ center, radius, color }: { center: google.maps.LatLngLiteral, radius: number, color: string }) {
    const map = useMap();
    const circleRef = useRef<google.maps.Circle | null>(null);

    useEffect(() => {
        if (!map) return;
        circleRef.current = new google.maps.Circle({
            map, center, radius,
            fillColor: color, fillOpacity: 0.1,
            strokeColor: color, strokeOpacity: 0.3, strokeWeight: 2,
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
    planId?: string | null;
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

    // オートズーム設定
    useEffect(() => {
        if (!map || items.length === 0 || isBriefingActive) return;
        if (isLogMode || isFinalOverview) {
            const bounds = new google.maps.LatLngBounds();
            items.forEach(item => bounds.extend({ lat: item.lat, lng: item.lng }));
            if (userLocation) bounds.extend(userLocation);
            map.fitBounds(bounds, 60);
        }
    }, [map, items, isLogMode, isFinalOverview, userLocation, isBriefingActive]);

    // ブリーフィング演出
    useEffect(() => {
        if (!isBriefingActive || !map || items.length === 0) return;

        const runBriefing = async () => {
            for (const item of items) {
                map.panTo({ lat: item.lat, lng: item.lng });
                map.setZoom(16);
                await new Promise(r => setTimeout(r, 2000));
            }

            const bounds = new google.maps.LatLngBounds();
            items.forEach(i => bounds.extend({ lat: i.lat, lng: i.lng }));
            if (userLocation) bounds.extend(userLocation);
            map.fitBounds(bounds, 80);

            await new Promise(r => setTimeout(r, 1000));
            if (onBriefingStateChange) onBriefingStateChange(true);
            if (onBriefingComplete) onBriefingComplete();
        };

        runBriefing();
    }, [isBriefingActive, map, items, userLocation, onBriefingStateChange, onBriefingComplete]);

    const mapCenter = useMemo(() => {
        if (userLocation) return userLocation;
        if (center && center.lat !== 0) return center;
        return items.length > 0 ? { lat: items[0].lat, lng: items[0].lng } : { lat: 35.6812, lng: 139.7671 };
    }, [center, userLocation, items]);

    return (
        <div className="w-full h-full relative">
            <Map
                defaultZoom={14}
                center={mapCenter}
                styles={mapStyle}
                disableDefaultUI={true}
                gestureHandling={'greedy'}
            >
                {userLocation && <Marker position={userLocation} />}
                {userLocation && radiusInKm && (
                    <MapCircle center={userLocation} radius={radiusInKm * 1000} color={themeColor} />
                )}
                {items.filter(i => isLogMode ? i.isCollected : true).map((item, idx) => (
                    <Marker key={item.id || idx} position={{ lat: item.lat, lng: item.lng }} />
                ))}
            </Map>
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.03)]" />
        </div>
    );
}