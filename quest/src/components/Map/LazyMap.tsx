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

    // ★ 解決：Mapに渡す初期位置を「絶対にundefinedにしない」
    const initialCenter = useMemo(() => {
        if (items.length > 0 && items[0].lat) return { lat: items[0].lat, lng: items[0].lng };
        if (userLocation?.lat) return userLocation;
        if (center?.lat) return center;
        return { lat: 35.6812, lng: 139.7671 }; // 東京駅
    }, [items, userLocation, center]);

    // ★ 解決：世界地図問題を物理的に粉砕する fitBounds
    useEffect(() => {
        if (!map || items.length === 0 || isBriefingActive) return;

        const applyBounds = () => {
            const bounds = new google.maps.LatLngBounds();
            let count = 0;
            items.forEach((p: any) => { if (p.lat && p.lng) { bounds.extend(p); count++; } });
            if (userLocation?.lat) { bounds.extend(userLocation); count++; }

            if (count > 0) {
                console.log(`[LazyMap] Auto-fitting ${count} points.`);
                google.maps.event.trigger(map, 'resize');
                map.fitBounds(bounds, { top: 50, right: 50, bottom: 50, left: 50 });
            }
        };

        // コンソール警告を消し、確実に初期化するために初期フィットを複数回実施
        applyBounds();
        const timers = [setTimeout(applyBounds, 500), setTimeout(applyBounds, 1200)];
        const listener = google.maps.event.addListenerOnce(map, 'idle', applyBounds);

        return () => {
            timers.forEach(clearTimeout);
            google.maps.event.removeListener(listener);
        };
    }, [map, items, isBriefingActive, isFinalOverview]);

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
    }, [isBriefingActive, map, items]);

    return (
        <div className="w-full h-full relative bg-[#f5f5f5]">
            {/* ★ 修正：defaultCenterとdefaultZoomを明示的に付与して起動エラーを回避 */}
            <Map
                defaultZoom={12}
                defaultCenter={initialCenter}
                styles={mapStyle}
                disableDefaultUI={true}
                gestureHandling={'greedy'}
            >
                {userLocation && <Marker position={userLocation} />}
                {userLocation && radiusInKm && !isBriefingActive && !isFinalOverview && (
                    <MapCircle center={userLocation} radius={radiusInKm} color={themeColor} />
                )}
                {items.map((item: any, idx: number) => (
                    <Marker key={idx} position={{ lat: item.lat, lng: item.lng }} label={{ text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' }} />
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