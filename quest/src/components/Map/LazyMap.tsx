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

export default function LazyMap({
    items = [], center, userLocation, radiusInKm,
    themeColor = "#F37343", isLogMode = false,
    isBriefingActive = false, isFinalOverview = false,
    onBriefingStateChange, onBriefingComplete
}: any) {
    const map = useMap();
    const [activePlaceName, setActivePlaceName] = useState<string | null>(null);
    const briefingRef = useRef(false);

    // ★ 解決：現在地スナップを物理的に遮断
    // ブリーフィング中や全体表示中は、center プロパティに「何も渡さない」ことで勝手に戻るのを防ぎます
    const mapCenter = useMemo(() => {
        if (isBriefingActive || isFinalOverview || isLogMode) return undefined;
        if (userLocation?.lat) return userLocation;
        if (center?.lat) return center;
        return { lat: 35.6812, lng: 139.7671 };
    }, [isBriefingActive, isFinalOverview, isLogMode, userLocation, center]);

    // ★ 解決：全ピン表示の縮尺を強制適用
    useEffect(() => {
        if (!map || items.length === 0 || isBriefingActive) return;

        const applyBounds = () => {
            const bounds = new google.maps.LatLngBounds();
            let count = 0;
            items.forEach((p: any) => { if (p.lat) { bounds.extend(p); count++; } });
            if (userLocation?.lat) { bounds.extend(userLocation); count++; }

            if (count > 0) {
                map.fitBounds(bounds, { top: 70, right: 70, bottom: 70, left: 70 });
            }
        };

        const timer = setTimeout(() => {
            google.maps.event.addListenerOnce(map, 'idle', applyBounds);
            applyBounds(); // 即時実行
        }, 300);
        return () => clearTimeout(timer);
    }, [map, items, isBriefingActive]);

    // ★ 解決：演出なし・地点切り替えのみのブリーフィング
    useEffect(() => {
        if (!isBriefingActive || !map || items.length === 0 || briefingRef.current) return;
        briefingRef.current = true;

        const startBriefing = async () => {
            map.setZoom(15);
            for (const item of items) {
                map.panTo({ lat: item.lat, lng: item.lng });
                setActivePlaceName(item.addressName || "WAYPOINT");
                await new Promise(r => setTimeout(r, 2500));
            }
            setActivePlaceName(null);
            briefingRef.current = false;
            if (onBriefingStateChange) onBriefingStateChange(true);
            if (onBriefingComplete) onBriefingComplete();
        };
        startBriefing();
    }, [isBriefingActive, map, items]);

    return (
        <div className="w-full h-full relative bg-[#f5f5f5]">
            <Map defaultZoom={14} center={mapCenter} styles={mapStyle} disableDefaultUI={true} gestureHandling={'greedy'}>
                {userLocation && <Marker position={userLocation} />}
                {items.map((item: any, idx: number) => (
                    <Marker key={idx} position={{ lat: item.lat, lng: item.lng }} label={{ text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' }} />
                ))}
            </Map>
            {activePlaceName && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50">
                    <div className="bg-black/90 px-6 py-2 rounded-full border border-[#F37343]/30 shadow-2xl">
                        <p className="text-white text-[10px] font-black uppercase tracking-[0.3em]"><span className="text-[#F37343]">Scanning:</span> {activePlaceName}</p>
                    </div>
                </div>
            )}
        </div>
    );
}