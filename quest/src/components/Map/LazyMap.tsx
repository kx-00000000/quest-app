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

    // 2. ★ ブリーフィング演出（滑らかな移動を強化）
    useEffect(() => {
        if (!isBriefingActive || !map || items.length === 0) return;

        const runBriefing = async () => {
            // 地図が完全に準備されるまでわずかに待機
            await new Promise(r => setTimeout(r, 500));

            // A. 各地点を順番に巡回
            for (const item of items) {
                // panTo は移動が終わるまで待機しないため、Promiseで待機時間を制御
                map.panTo({ lat: item.lat, lng: item.lng });
                map.setZoom(15); // あまりズームしすぎない（15〜16）

                await new Promise(r => setTimeout(r, 2500)); // 2.5秒ごとに次の地点へ
            }

            // B. 全体俯瞰へズームアウト
            const bounds = new google.maps.LatLngBounds();
            items.forEach(i => bounds.extend({ lat: i.lat, lng: i.lng }));
            if (userLocation) bounds.extend(userLocation);

            map.fitBounds(bounds, 80);

            await new Promise(r => setTimeout(r, 1500));

            // 完了通知（Discovery Reportを表示させる）
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
                {/* 最初から全てのピンを表示 */}
                {userLocation && <Marker position={userLocation} />}

                {userLocation && radiusInKm && (
                    <MapCircle center={userLocation} radius={radiusInKm * 1000} color={themeColor} />
                )}

                {/* ピンの表示：isLogMode に関係なく、items があれば表示するように変更 */}
                {items.map((item, idx) => (
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