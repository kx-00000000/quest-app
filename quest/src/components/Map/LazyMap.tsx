"use client";

import React, { useMemo, useEffect, useState, useRef } from 'react';
import { Map, Marker, useMap } from '@vis.gl/react-google-maps';

// --- 🎨 航空計器デザイン：ミニマルな地図スタイル ---
const mapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
    { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "transit", "stylers": [{ "visibility": "off" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e0e0e0" }] }
];

// --- ★ Circle コンポーネントの自作 (ビルドエラー解消の鍵) ---
// ライブラリに Circle がないため、Google Maps API を直接叩いて描画します。
function MapCircle(props: { center: google.maps.LatLngLiteral, radius: number, color: string }) {
    const map = useMap();
    const circleRef = useRef<google.maps.Circle | null>(null);

    useEffect(() => {
        if (!map) return;

        // 円のインスタンス作成
        circleRef.current = new google.maps.Circle({
            map,
            center: props.center,
            radius: props.radius,
            fillColor: props.color,
            fillOpacity: 0.1,
            strokeColor: props.color,
            strokeOpacity: 0.3,
            strokeWeight: 2,
        });

        return () => {
            if (circleRef.current) {
                circleRef.current.setMap(null);
            }
        };
    }, [map, props.center, props.radius, props.color]);

    return null;
}

interface MapProps {
    items: any[];
    center?: { lat: number; lng: number };
    userLocation?: { lat: number; lng: number } | null;
    radiusInKm?: number;
    themeColor?: string;
    isLogMode?: boolean;
    // new/page.tsx から渡される追加プロパティを受け取れるように定義
    isBriefingActive?: boolean;
    isFinalOverview?: boolean;
    planId?: string | null;
    onBriefingStateChange?: (state: string) => void;
    onBriefingComplete?: () => void;
}

export default function LazyMap({
    items,
    center,
    userLocation,
    radiusInKm,
    themeColor = "#000000",
    isLogMode = false
}: MapProps) {

    // マップの中心を決定
    const mapCenter = useMemo(() => {
        if (userLocation) return userLocation;
        if (center && center.lat !== 0) return center;
        if (items && items.length > 0) return { lat: items[0].lat, lng: items[0].lng };
        return { lat: 35.6812, lng: 139.7671 };
    }, [center, userLocation, items]);

    const displayItems = useMemo(() =>
        items.filter(item => isLogMode ? item.isCollected : true),
        [items, isLogMode]);

    return (
        <div className="w-full h-full relative">
            <Map
                defaultZoom={14}
                center={mapCenter}
                styles={mapStyle}
                disableDefaultUI={true}
                gestureHandling={'greedy'}
            >
                {/* 1. ユーザーの現在地 */}
                {userLocation && (
                    <Marker position={userLocation} />
                )}

                {/* 2. 探索範囲の円 (自作コンポーネント) */}
                {userLocation && radiusInKm && (
                    <MapCircle
                        center={userLocation}
                        radius={radiusInKm * 1000}
                        color={themeColor}
                    />
                )}

                {/* 3. アイテム地点 */}
                {displayItems.map((item, idx) => (
                    <Marker
                        key={item.id || idx}
                        position={{ lat: item.lat, lng: item.lng }}
                    />
                ))}
            </Map>

            {/* 計器の質感を出すベゼルシャドウ */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.03)]" />
        </div>
    );
}