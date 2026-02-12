"use client";

import React, { useMemo } from 'react';
// ★ 追加：Google Maps 用のコンポーネント
import { Map, Marker, useMap } from '@vis.gl/react-google-maps';

// --- 🎨 航空計器デザイン：ミニマルな地図スタイル ---
// 建築図面や計器のように、余計な色と情報を削ぎ落としています。
const mapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] }, // 商業アイコンを非表示
    { "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] }, // 文字を薄いグレーに
    { "featureType": "poi", "stylers": [{ "visibility": "off" }] }, // スポット情報を非表示
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] }, // 道を白に
    { "featureType": "transit", "stylers": [{ "visibility": "off" }] }, // 交通機関を非表示
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e0e0e0" }] } // 水域を薄いグレーに
];

interface MapProps {
    items: any[];
    center?: { lat: number; lng: number };
    themeColor?: string;
    isLogMode?: boolean;
}

export default function LazyMap({ items, center, themeColor = "#000000", isLogMode = false }: MapProps) {
    // 中心点のデフォルト設定（東京駅付近）
    const defaultCenter = useMemo(() => {
        if (center && center.lat !== 0) return center;
        if (items && items.length > 0) return { lat: items[0].lat, lng: items[0].lng };
        return { lat: 35.6812, lng: 139.7671 };
    }, [center, items]);

    // 表示する地点のフィルタリング
    const displayItems = useMemo(() =>
        items.filter(item => isLogMode ? item.isCollected : true),
        [items, isLogMode]);

    return (
        <div className="w-full h-full relative">
            <Map
                defaultZoom={15}
                defaultCenter={defaultCenter}
                // ★ Map ID は Google Cloud Console で作成したスタイルを適用する場合に必要です。
                // 未作成の場合は styles プロパティが優先されます。
                styles={mapStyle}
                disableDefaultUI={true} // Googleロゴ以外のUI（ズームボタン等）をすべて隠す
                gestureHandling={'greedy'}
                reuseMaps={true}
            >
                {displayItems.map((item, idx) => (
                    <Marker
                        key={item.id || idx}
                        position={{ lat: item.lat, lng: item.lng }}
                    // ★ マーカーも必要に応じてカスタム可能ですが、まずはデフォルトで表示します
                    />
                ))}
            </Map>

            {/* 地図の上に「Overcast（薄雲）」のようなグラデーションを重ね、
          計器としての質感を高めるオーバーレイ
      */}
            <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_80px_rgba(0,0,0,0.02)]" />
        </div>
    );
}