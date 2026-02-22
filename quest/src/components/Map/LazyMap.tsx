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
    const containerRef = useRef<HTMLDivElement>(null);

    // 初期表示位置の保証
    const initialCenter = useMemo(() => {
        if (items.length > 0 && items[0].lat) return { lat: items[0].lat, lng: items[0].lng };
        if (userLocation?.lat) return userLocation;
        if (center?.lat) return center;
        return { lat: 35.6812, lng: 139.7671 };
    }, [items, userLocation, center]);

    // ★ 改良版：全地点を確実に収める「粘着フィット」ロジック
    useEffect(() => {
        if (!map || items.length === 0 || isBriefingActive) return;

        const applyBounds = () => {
            // コンテナがまだ表示されていない（高さが0）場合はスキップして再試行を待つ
            if (containerRef.current && containerRef.current.offsetHeight === 0) return;

            const bounds = new google.maps.LatLngBounds();
            let count = 0;

            items.forEach((p: any) => {
                if (p.lat && p.lng) {
                    bounds.extend({ lat: Number(p.lat), lng: Number(p.lng) });
                    count++;
                }
            });

            // 冒険中のみ現在地を含める
            if (!isFinalOverview && userLocation?.lat) {
                bounds.extend(userLocation);
                count++;
            }

            if (count > 0) {
                console.log(`[LazyMap] Fitting ${count} points to container.`);
                // 枠のサイズを再計算させる
                google.maps.event.trigger(map, 'resize');
                // paddingを控えめの40pxにし、小さな枠でも全体が見えるように調整
                map.fitBounds(bounds, { top: 40, right: 40, bottom: 40, left: 40 });
            }
        };

        // タイミングをずらしてしつこく実行（これで枠の認識ミスを物理的に防ぐ）
        const timers = [
            setTimeout(applyBounds, 200),
            setTimeout(applyBounds, 1000),
            setTimeout(applyBounds, 3000)
        ];

        const idleListener = google.maps.event.addListenerOnce(map, 'idle', applyBounds);

        return () => {
            timers.forEach(clearTimeout);
            google.maps.event.removeListener(idleListener);
        };
    }, [map, items, isBriefingActive, isFinalOverview, userLocation]);

    // ブリーフィングロジック
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
            map.fitBounds(finalBounds, 60);

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
        <div ref={containerRef} className="w-full h-full relative bg-[#f5f5f5]">
            <Map
                defaultZoom={12}
                defaultCenter={initialCenter}
                styles={mapStyle}
                disableDefaultUI={true}
                gestureHandling={'greedy'}
                minZoom={2}
                maxZoom={18}
            >
                {userLocation && <Marker position={userLocation} />}
                {items.map((item: any, idx: number) => (
                    <Marker key={item.id || idx} position={{ lat: item.lat, lng: item.lng }} label={{ text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' }} />
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