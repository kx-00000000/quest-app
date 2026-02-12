"use client";

import React, { useMemo, useEffect, useRef } from 'react';
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
        circleRef.current = new google.maps.Circle({
            map, center, radius,
            fillColor: color, fillOpacity: 0.1,
            strokeColor: color, strokeOpacity: 0.3, strokeWeight: 2,
        });
        return () => { if (circleRef.current) circleRef.current.setMap(null); };
    }, [map, center, radius, color]);
    return null;
}

interface MapProps {
    items?: any[];
    center?: { lat: number; lng: number };
    userLocation?: { lat: number; lng: number } | null;
    radiusInKm?: number;
    themeColor?: string;
    isLogMode?: boolean;
    isBriefingActive?: boolean;
    isFinalOverview?: boolean; // ★ 追加
    planId?: string | null;     // ★ 追加
    onBriefingStateChange?: (state: any) => void;
    onBriefingComplete?: () => void;
}

export default function LazyMap({
    items = [], center, userLocation, radiusInKm,
    themeColor = "#000000", isLogMode = false,
    isBriefingActive = false,
    isFinalOverview, // ★ 追加
    planId,          // ★ 追加
    onBriefingStateChange,
    onBriefingComplete
}: MapProps) {
    const map = useMap();
    const geocoder = useRef<google.maps.Geocoder | null>(null);

    // オートズーム設定
    useEffect(() => {
        if (!map || items.length === 0 || isBriefingActive) return;
        if (isLogMode || isFinalOverview) {
            const bounds = new google.maps.LatLngBounds();
            items.forEach(item => bounds.extend({ lat: item.lat, lng: item.lng }));
            if (userLocation) bounds.extend(userLocation);
            map.fitBounds(bounds, { padding: 50 });
        }
    }, [map, items, isLogMode, isFinalOverview, userLocation, isBriefingActive]);

    // ブリーフィング演出と地名取得
    useEffect(() => {
        if (!isBriefingActive || !map || items.length === 0) return;
        if (!geocoder.current) geocoder.current = new google.maps.Geocoder();

        const runBriefing = async () => {
            // 1. 地名取得と通知
            if (userLocation && onBriefingStateChange) {
                geocoder.current?.geocode({ location: userLocation }, (results, status) => {
                    if (status === "OK" && results?.[0]) {
                        const city = results[0].address_components.find(c => c.types.includes("locality"))?.long_name ||
                            results[0].address_components.find(c => c.types.includes("administrative_area_level_2"))?.long_name || "";
                        // ★ ここで地名を渡していますが、親の setIsFinalOverview が boolean を期待している場合、
                        // 文字列を渡すと単に「true」として扱われ、地名そのものは表示されません。
                        onBriefingStateChange(city);
                    }
                });
            }

            // 2. 地点を巡回（現在地と重なる地点はスキップ）
            for (const item of items) {
                if (userLocation &&
                    Math.abs(item.lat - userLocation.lat) < 0.0005 &&
                    Math.abs(item.lng - userLocation.lng) < 0.0005) continue;

                map.panTo({ lat: item.lat, lng: item.lng });
                map.setZoom(17);
                await new Promise(r => setTimeout(r, 2000));
            }

            // 3. 全体表示
            const bounds = new google.maps.LatLngBounds();
            items.forEach(i => bounds.extend({ lat: i.lat, lng: i.lng }));
            if (userLocation) bounds.extend(userLocation);
            map.fitBounds(bounds, { padding: 80 });

            await new Promise(r => setTimeout(r, 1500));
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
                    <Marker
                        key={item.id || idx}
                        position={{ lat: item.lat, lng: item.lng }}
                        label={isLogMode ? { text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' } : undefined}
                    />
                ))}
            </Map>
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.03)]" />
        </div>
    );
}