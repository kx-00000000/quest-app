"use client";

import React, { useMemo } from 'react';
import { Map, Marker, useMap, Circle } from '@vis.gl/react-google-maps';

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

// ★ エラーの核：Props の定義を new/page.tsx の要求に合わせて拡張
interface MapProps {
    items: any[];
    center?: { lat: number; lng: number };
    userLocation?: { lat: number; lng: number } | null;
    radiusInKm?: number;
    themeColor?: string;
    isLogMode?: boolean;
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
    isLogMode = false,
    isBriefingActive = false
}: MapProps) {

    // 中心点の決定ロジック
    const mapCenter = useMemo(() => {
        if (userLocation) return userLocation;
        if (center && center.lat !== 0) return center;
        if (items && items.length > 0) return { lat: items[0].lat, lng: items[0].lng };
        return { lat: 35.6812, lng: 139.7671 };
    }, [center, userLocation, items]);

    // 表示する地点のフィルタリング
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
                {/* 1. ユーザーの現在地マーカー（青いドットなど） */}
                {userLocation && (
                    <Marker
                        position={userLocation}
                        title="Current Location"
                    // 必要に応じてアイコンを航空計器風にカスタム可能です
                    />
                )}

                {/* 2. クエスト探索範囲のサークル（半径表示） */}
                {userLocation && radiusInKm && (
                    <Circle
                        center={userLocation}
                        radius={radiusInKm * 1000} // km を m に変換
                        fillColor={themeColor}
                        fillOpacity={0.1}
                        strokeColor={themeColor}
                        strokeOpacity={0.3}
                        strokeWeight={2}
                    />
                )}

                {/* 3. アイテム地点のマーカー */}
                {displayItems.map((item, idx) => (
                    <Marker
                        key={item.id || idx}
                        position={{ lat: item.lat, lng: item.lng }}
                    />
                ))}
            </Map>

            {/* 画面端のシャドウ（計器のベゼル感を演出） */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.03)]" />
        </div>
    );
}