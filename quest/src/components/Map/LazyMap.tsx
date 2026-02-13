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
    const [activeIndex, setActiveIndex] = useState<number>(-1);
    const briefingStarted = useRef(false);

    const mapCenter = useMemo(() => {
        if (isBriefingActive || isFinalOverview || isLogMode) return undefined;
        if (userLocation && userLocation.lat !== 0) return userLocation;
        if (center && center.lat !== 0) return center;
        return { lat: 35.6812, lng: 139.7671 };
    }, [isBriefingActive, isFinalOverview, isLogMode, userLocation, center]);

    useEffect(() => {
        if (!map || items.length === 0 || isBriefingActive) return;
        const applyBounds = () => {
            const bounds = new google.maps.LatLngBounds();
            let hasPoints = false;
            items.forEach(p => { if (p.lat) { bounds.extend(p); hasPoints = true; } });
            if (userLocation?.lat) { bounds.extend(userLocation); hasPoints = true; }
            if (hasPoints) {
                map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
            }
        };
        const timer = setTimeout(applyBounds, 500);
        const listener = google.maps.event.addListenerOnce(map, 'idle', applyBounds);
        return () => { clearTimeout(timer); google.maps.event.removeListener(listener); };
    }, [map, items, isLogMode, isFinalOverview, isBriefingActive, userLocation]);

    useEffect(() => {
        if (!isBriefingActive || !map || items.length === 0 || briefingStarted.current) return;
        briefingStarted.current = true;

        const runBriefing = async () => {
            map.setZoom(15);
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                setActiveIndex(i);
                map.panTo({ lat: item.lat, lng: item.lng });
                setActivePlaceName(item.addressName || "WAYPOINT");
                await new Promise(r => setTimeout(r, 2500));
            }

            // ★ 追加：全地点を表示するためのズームアウト演出
            const bounds = new google.maps.LatLngBounds();
            items.forEach(i => bounds.extend({ lat: i.lat, lng: i.lng }));
            if (userLocation) bounds.extend(userLocation);
            map.fitBounds(bounds, { top: 100, right: 80, bottom: 100, left: 80 });

            setActivePlaceName(null);
            setActiveIndex(-1);

            // 全表示を見せるための「溜め」
            await new Promise(r => setTimeout(r, 2500));

            briefingStarted.current = false;
            if (onBriefingStateChange) onBriefingStateChange(true);
            if (onBriefingComplete) onBriefingComplete();
        };

        runBriefing();
    }, [isBriefingActive, map, items, userLocation, onBriefingStateChange, onBriefingComplete]);

    return (
        <div className="w-full h-full relative bg-[#f5f5f5]">
            <Map defaultZoom={14} center={mapCenter} styles={mapStyle} disableDefaultUI={true} gestureHandling={'greedy'}>
                {userLocation && <Marker position={userLocation} />}
                {userLocation && radiusInKm && !isBriefingActive && <MapCircle center={userLocation} radius={radiusInKm} color={themeColor} />}
                {items.map((item, idx) => (
                    <Marker key={item.id || idx} position={{ lat: item.lat, lng: item.lng }} label={{ text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' }} />
                ))}
            </Map>

            {activePlaceName && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 w-full px-10 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="bg-black/90 px-8 py-3 rounded-full border border-[#F37343]/30 shadow-2xl">
                        <p className="text-white text-xs font-black uppercase tracking-[0.4em] text-center">{activePlaceName}</p>
                    </div>
                    <div className="flex gap-1.5 w-full max-w-[200px] h-1.5 px-2">
                        {items.map((_, idx) => (
                            <div
                                key={idx}
                                className={`flex-1 rounded-full transition-all duration-700 ${idx <= activeIndex ? "bg-[#F37343] shadow-[0_0_12px_rgba(243,115,67,0.6)]" : "bg-black/20 backdrop-blur-sm"}`}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}