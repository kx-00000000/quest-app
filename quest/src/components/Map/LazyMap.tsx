"use client";

import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Map, Marker, useMap } from '@vis.gl/react-google-maps';

const mapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e0e0e0" }] }
];

export default function LazyMap({
    items = [], center, userLocation, radiusInKm,
    themeColor = "#F37343", isLogMode = false,
    isBriefingActive = false, isFinalOverview = false,
    onBriefingStateChange, onBriefingComplete
}: any) {
    const map = useMap();
    const [activePlaceName, setActivePlaceName] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState<number>(-1);
    const briefingRef = useRef(false);

    // ★ 警告解消：Mapコンポーネントの起動を100%保証する初期位置
    const defaultMapCenter = useMemo(() => {
        if (items.length > 0 && items[0].lat) return { lat: items[0].lat, lng: items[0].lng };
        if (userLocation?.lat) return userLocation;
        if (center?.lat) return center;
        return { lat: 35.6812, lng: 139.7671 }; // 東京
    }, [items, userLocation, center]);

    // ★ 強力な全ピン表示ロジック
    useEffect(() => {
        if (!map || items.length === 0 || isBriefingActive) return;

        const applyBounds = () => {
            const bounds = new google.maps.LatLngBounds();
            let count = 0;

            items.forEach((p: any) => {
                if (p.lat && p.lng) {
                    bounds.extend({ lat: Number(p.lat), lng: Number(p.lng) });
                    count++;
                }
            });

            // プラン確認画面以外では現在地も範囲に含める
            if (!isFinalOverview && userLocation?.lat) {
                bounds.extend(userLocation);
                count++;
            }

            if (count > 0) {
                console.log(`[LazyMap] Auto-fitting ${count} points into bounds.`);

                // 1. まず地図の描画領域（コンテナサイズ）を強制的に再認識させる
                google.maps.event.trigger(map, 'resize');

                // 2. 全ピンを収める（paddingをさらに広めの100pxに設定し、端の見切れを防止）
                map.fitBounds(bounds, { top: 100, right: 100, bottom: 100, left: 100 });

                // 3. ズームしすぎ防止（密集地で寄りすぎないように）
                google.maps.event.addListenerOnce(map, 'zoom_changed', () => {
                    const currentZoom = map.getZoom();
                    if (currentZoom && currentZoom > 16) map.setZoom(15);
                });
            }
        };

        // 地図の描画ラグを考慮し、時間差で確実に実行する
        const timers = [
            setTimeout(applyBounds, 300),
            setTimeout(applyBounds, 1000),
            setTimeout(applyBounds, 2500) // 最終的な追い打ち
        ];

        const listener = google.maps.event.addListenerOnce(map, 'idle', applyBounds);

        return () => {
            timers.forEach(clearTimeout);
            google.maps.event.removeListener(listener);
        };
    }, [map, items, isBriefingActive, isFinalOverview, userLocation]);

    // ブリーフィング演出
    useEffect(() => {
        if (!isBriefingActive || !map || items.length === 0 || briefingRef.current) return;
        briefingRef.current = true;

        const startBriefing = async () => {
            map.setZoom(15);
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                setActiveIndex(i);
                map.panTo({ lat: item.lat, lng: item.lng });
                setActivePlaceName(item.addressName || "WAYPOINT");
                await new Promise(r => setTimeout(r, 2500));
            }

            const finalBounds = new google.maps.LatLngBounds();
            items.forEach((p: any) => finalBounds.extend(p));
            map.fitBounds(finalBounds, 80);

            setActivePlaceName(null);
            setActiveIndex(-1);
            await new Promise(r => setTimeout(r, 5000));

            briefingRef.current = false;
            if (onBriefingStateChange) onBriefingStateChange(true);
            if (onBriefingComplete) onBriefingComplete();
        };

        startBriefing();
    }, [isBriefingActive, map, items, onBriefingStateChange, onBriefingComplete]);

    return (
        <div className="w-full h-full relative bg-[#f5f5f5]">
            <Map
                defaultZoom={12}
                defaultCenter={defaultMapCenter}
                styles={mapStyle}
                disableDefaultUI={true}
                gestureHandling={'greedy'}
            >
                {userLocation && <Marker position={userLocation} />}
                {items.map((item: any, idx: number) => (
                    <Marker
                        key={item.id || idx}
                        position={{ lat: item.lat, lng: item.lng }}
                        label={{ text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' }}
                    />
                ))}
            </Map>

            {activePlaceName && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 w-full px-10 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="bg-black/90 px-8 py-3 rounded-full border border-[#F37343]/30 shadow-2xl text-center">
                        <p className="text-white text-xs font-black uppercase tracking-[0.4em]">{activePlaceName}</p>
                    </div>
                    <div className="flex gap-1.5 w-full max-w-[200px] h-1.5 px-2">
                        {items.map((_: any, idx: number) => (
                            <div key={idx} className={`flex-1 rounded-full transition-all duration-700 ${idx <= activeIndex ? "bg-[#F37343] shadow-[0_0_12px_rgba(243,115,67,0.6)]" : "bg-black/20 backdrop-blur-sm"}`} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}