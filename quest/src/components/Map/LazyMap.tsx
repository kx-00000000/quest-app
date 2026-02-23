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

function Polyline({ path, color }: { path: google.maps.LatLngLiteral[], color: string }) {
    const map = useMap();
    const polylineRef = useRef<google.maps.Polyline | null>(null);
    useEffect(() => {
        if (!map || path.length < 2) return;
        if (polylineRef.current) polylineRef.current.setMap(null);
        polylineRef.current = new google.maps.Polyline({
            path, geodesic: true, strokeColor: color, strokeOpacity: 0.8, strokeWeight: 4, map: map
        });
        return () => { if (polylineRef.current) polylineRef.current.setMap(null); };
    }, [map, path, color]);
    return null;
}

export default function LazyMap({
    items = [], center, userLocation, radiusInKm, path = [],
    themeColor = "#F37343", isLogMode = false,
    isBriefingActive = false, isFinalOverview = false,
    onBriefingStateChange, onBriefingComplete
}: any) {
    const map = useMap();
    const [activePlaceName, setActivePlaceName] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState<number>(-1);
    const briefingRef = useRef(false);

    const initialPos = useMemo(() => {
        if (items.length > 0 && items[0].lat) return { lat: Number(items[0].lat), lng: Number(items[0].lng) };
        if (center?.lat) return { lat: Number(center.lat), lng: Number(center.lng) };
        if (userLocation?.lat) return userLocation;
        return { lat: 35.6812, lng: 139.7671 };
    }, [items, center, userLocation]);

    // 縮尺の自動調整
    useEffect(() => {
        if (!map || items.length === 0 || isBriefingActive) return;
        const applyBounds = () => {
            const bounds = new google.maps.LatLngBounds();
            let count = 0;
            items.forEach((p: any) => { if (p.lat && p.lng) { bounds.extend({ lat: Number(p.lat), lng: Number(p.lng) }); count++; } });
            if (count > 0) {
                map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
                if (map.getZoom()! > 15) map.setZoom(14);
            }
        };
        const timer = setTimeout(applyBounds, 600);
        return () => clearTimeout(timer);
    }, [map, items, isBriefingActive, isFinalOverview]);

    // ブリーフィング演出
    useEffect(() => {
        if (!isBriefingActive || !map || items.length === 0 || briefingRef.current) return;
        briefingRef.current = true;

        const runBriefing = async () => {
            map.setZoom(15);
            for (let i = 0; i < items.length; i++) {
                const item = items[i];
                setActiveIndex(i);
                setActivePlaceName(item.addressName || "WAYPOINT");
                map.panTo({ lat: Number(item.lat), lng: Number(item.lng) });
                await new Promise(r => setTimeout(r, 2500));
            }
            const finalBounds = new google.maps.LatLngBounds();
            items.forEach((p: any) => finalBounds.extend({ lat: Number(p.lat), lng: Number(p.lng) }));
            map.fitBounds(finalBounds, 80);
            setActivePlaceName(null);
            setActiveIndex(-1);
            await new Promise(r => setTimeout(r, 5000));
            briefingRef.current = false;
            if (onBriefingStateChange) onBriefingStateChange(true);
            if (onBriefingComplete) onBriefingComplete();
        };
        runBriefing();
    }, [isBriefingActive, map, items, onBriefingStateChange, onBriefingComplete]);

    return (
        <div className="w-full h-full relative bg-[#f5f5f5]">
            <Map defaultZoom={12} defaultCenter={initialPos} styles={mapStyle} disableDefaultUI={true} gestureHandling={'greedy'}>
                {userLocation && <Marker position={userLocation} />}
                {items.map((item: any, idx: number) => (
                    <Marker key={idx} position={{ lat: Number(item.lat), lng: Number(item.lng) }} label={{ text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' }} />
                ))}
                <Polyline path={path} color={themeColor} />
            </Map>

            {/* ★ 以前の「横に長いセグメントバー」UIを完全復元 */}
            {activePlaceName && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-[200] flex flex-col items-center gap-4 w-full px-12 text-center animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="bg-black/90 px-8 py-3 rounded-full border border-[#F37343]/30 shadow-2xl">
                        <p className="text-white text-[11px] font-black uppercase tracking-[0.4em]">{activePlaceName}</p>
                    </div>

                    <div className="flex gap-1.5 w-full max-w-[300px] h-1.5 px-1">
                        {items.map((_: any, idx: number) => (
                            <div
                                key={idx}
                                className={`flex-1 rounded-full transition-all duration-1000 ${idx <= activeIndex
                                        ? "bg-[#F37343] shadow-[0_0_15px_rgba(243,115,67,0.7)]"
                                        : "bg-black/20 backdrop-blur-sm"
                                    }`}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}