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
    const briefingStarted = useRef(false);

    // ★ 解決1：現在地スナップ防止
    // 演出中（ブリーフィングや全表示）は center を null にして、Google Map の自由移動を許可する
    const controlledCenter = useMemo(() => {
        if (isBriefingActive || isFinalOverview || isLogMode) return undefined;
        if (userLocation && userLocation.lat !== 0) return userLocation;
        if (center && center.lat !== 0) return center;
        return { lat: 35.6812, lng: 139.7671 };
    }, [isBriefingActive, isFinalOverview, isLogMode, userLocation, center]);

    // ★ 解決2：プラン画面の全ピン表示
    useEffect(() => {
        if (!map || items.length === 0 || isBriefingActive) return;

        const applyBounds = () => {
            const bounds = new google.maps.LatLngBounds();
            items.forEach(item => bounds.extend({ lat: item.lat, lng: item.lng }));
            if (userLocation) bounds.extend(userLocation);
            map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
        };

        // 初回と、地図が落ち着いたタイミングの両方で実行
        applyBounds();
        const listener = google.maps.event.addListenerOnce(map, 'idle', applyBounds);
        return () => google.maps.event.removeListener(listener);
    }, [map, items, isFinalOverview, isLogMode]);

    // ★ 解決3：滑らかな演出の復元
    useEffect(() => {
        if (!isBriefingActive || !map || items.length === 0 || briefingStarted.current) return;
        briefingStarted.current = true;

        const runBriefing = async () => {
            map.setOptions({ gestureHandling: 'none' });

            for (const item of items) {
                // 上昇
                map.setZoom(12);
                await new Promise(r => setTimeout(r, 600));

                // 滑空移動
                map.panTo({ lat: item.lat, lng: item.lng });
                setActivePlaceName(item.addressName || "WAYPOINT");
                await new Promise(r => setTimeout(r, 1200));

                // 降下
                map.setZoom(17);
                await new Promise(r => setTimeout(r, 2000));
            }

            // 全表示に戻す
            const finalBounds = new google.maps.LatLngBounds();
            items.forEach(i => finalBounds.extend({ lat: i.lat, lng: i.lng }));
            map.fitBounds(finalBounds, 80);

            await new Promise(r => setTimeout(r, 1500));
            setActivePlaceName(null);
            briefingStarted.current = false;
            if (onBriefingStateChange) onBriefingStateChange(true);
            if (onBriefingComplete) onBriefingComplete();
        };

        runBriefing();
    }, [isBriefingActive, map, items]);

    return (
        <div className="w-full h-full relative bg-[#f5f5f5]">
            <Map
                defaultZoom={14}
                center={controlledCenter}
                styles={mapStyle}
                disableDefaultUI={true}
                gestureHandling={'greedy'}
            >
                {userLocation && <Marker position={userLocation} />}
                {userLocation && radiusInKm && <MapCircle center={userLocation} radius={radiusInKm} color={themeColor} />}
                {items.map((item, idx) => (
                    <Marker
                        key={item.id || idx}
                        position={{ lat: item.lat, lng: item.lng }}
                        label={{ text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' }}
                    />
                ))}
            </Map>

            {activePlaceName && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="bg-black/90 px-6 py-2 rounded-full border border-[#F37343]/30 shadow-2xl">
                        <p className="text-white text-[10px] font-black uppercase tracking-[0.3em] whitespace-nowrap text-center">
                            <span className="text-[#F37343]">Scanning:</span> {activePlaceName}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}