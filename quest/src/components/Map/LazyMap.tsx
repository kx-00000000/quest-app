"use client";

import React, { useMemo, useEffect, useRef, useState } from 'react';
import { Map, Marker, useMap } from '@vis.gl/react-google-maps';

const mapStyle = [
    { "elementType": "geometry", "stylers": [{ "color": "#f5f5f5" }] },
    { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
    { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#ffffff" }] },
    { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#e0e0e0" }] }
];

// 軌跡を描画する内部コンポーネント
function PolylineOverlay({ path, color }: { path: any[], color: string }) {
    const map = useMap();
    useEffect(() => {
        if (!map || path.length < 2) return;
        const polyline = new google.maps.Polyline({
            path, geodesic: true, strokeColor: color, strokeOpacity: 0.8, strokeWeight: 4, map
        });
        return () => polyline.setMap(null);
    }, [map, path, color]);
    return null;
}

// 地図の範囲を調整する内部コンポーネント
function MapController({ items, isBriefingActive }: any) {
    const map = useMap();
    useEffect(() => {
        if (!map || items.length === 0 || isBriefingActive) return;
        const bounds = new google.maps.LatLngBounds();
        items.forEach((p: any) => bounds.extend({ lat: Number(p.lat), lng: Number(p.lng) }));
        map.fitBounds(bounds, { top: 80, right: 80, bottom: 80, left: 80 });
        const timer = setTimeout(() => { if (map.getZoom()! > 15) map.setZoom(14); }, 100);
        return () => clearTimeout(timer);
    }, [map, items, isBriefingActive]);
    return null;
}

export default function LazyMap({
    items = [], center, userLocation, path = [], themeColor = "#F37343",
    isBriefingActive = false, onBriefingStateChange, onBriefingComplete
}: any) {
    const mapRef = useRef<google.maps.Map | null>(null);
    const [activePlaceName, setActivePlaceName] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState<number>(-1);

    const initialPos = useMemo(() => {
        if (userLocation?.lat) return userLocation;
        if (items.length > 0) return { lat: Number(items[0].lat), lng: Number(items[0].lng) };
        return center || { lat: 35.6812, lng: 139.7671 };
    }, [items, center, userLocation]);

    // ブリーフィング演出
    useEffect(() => {
        if (!isBriefingActive || !mapRef.current || items.length === 0) return;
        const run = async () => {
            const map = mapRef.current!;
            map.setZoom(15);
            for (let i = 0; i < items.length; i++) {
                setActiveIndex(i);
                setActivePlaceName(items[i].addressName || "WAYPOINT");
                map.panTo({ lat: Number(items[i].lat), lng: Number(items[i].lng) });
                await new Promise(r => setTimeout(r, 2500));
            }
            setActivePlaceName(null);
            if (onBriefingStateChange) onBriefingStateChange(true);
            if (onBriefingComplete) onBriefingComplete();
        };
        run();
    }, [isBriefingActive, items]);

    return (
        <div className="w-full h-full relative bg-[#f5f5f5]">
            <Map
                defaultZoom={14}
                defaultCenter={initialPos}
                styles={mapStyle}
                disableDefaultUI={true}
                onIdle={(e) => { mapRef.current = e.map; }}
            >
                {userLocation && <Marker position={userLocation} />}
                {items.map((item: any, idx: number) => (
                    <Marker key={idx} position={{ lat: Number(item.lat), lng: Number(item.lng) }} label={{ text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' }} />
                ))}
                <PolylineOverlay path={path} color={themeColor} />
                <MapController items={items} isBriefingActive={isBriefingActive} />
            </Map>

            {activePlaceName && (
                <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-4 w-full px-12">
                    <div className="bg-black/90 px-8 py-3 rounded-full shadow-2xl">
                        <p className="text-white text-[11px] font-black uppercase tracking-[0.4em]">{activePlaceName}</p>
                    </div>
                    <div className="flex gap-1 w-full max-w-[300px] h-1.5 px-1 bg-black/5 rounded-full overflow-hidden">
                        {items.map((_: any, idx: number) => (
                            <div key={idx} className={`flex-1 transition-all duration-1000 ${idx <= activeIndex ? "bg-[#F37343]" : "bg-transparent"}`} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}