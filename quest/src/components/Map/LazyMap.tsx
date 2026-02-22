"use client";

import React, { useMemo, useEffect, useRef } from 'react';
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
    const containerRef = useRef<HTMLDivElement>(null);

    const initialPos = useMemo(() => {
        if (items.length > 0 && items[0].lat) return { lat: Number(items[0].lat), lng: Number(items[0].lng) };
        if (center?.lat) return { lat: Number(center.lat), lng: Number(center.lng) };
        if (userLocation?.lat) return userLocation;
        return { lat: 35.6812, lng: 139.7671 };
    }, [items, center, userLocation]);

    useEffect(() => {
        if (!map || items.length === 0 || isBriefingActive) return;

        const applyBounds = () => {
            if (!containerRef.current || containerRef.current.offsetWidth === 0) return;

            const bounds = new google.maps.LatLngBounds();
            let count = 0;
            items.forEach((p: any) => { if (p.lat && p.lng) { bounds.extend({ lat: Number(p.lat), lng: Number(p.lng) }); count++; } });
            path.forEach((p: any) => { bounds.extend(p); count++; });

            if (count > 0) {
                google.maps.event.trigger(map, 'resize');
                map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
                // 1点に寄りすぎるのを防止
                const checkZoom = () => {
                    if (map.getZoom()! > 15) map.setZoom(14);
                };
                google.maps.event.addListenerOnce(map, 'zoom_changed', checkZoom);
            }
        };

        const timers = [setTimeout(applyBounds, 300), setTimeout(applyBounds, 1500), setTimeout(applyBounds, 3000)];
        const listener = google.maps.event.addListenerOnce(map, 'idle', applyBounds);
        return () => { timers.forEach(clearTimeout); google.maps.event.removeListener(listener); };
    }, [map, items, path, isBriefingActive]);

    return (
        <div ref={containerRef} className="w-full h-full relative bg-[#f5f5f5]">
            <Map defaultZoom={12} defaultCenter={initialPos} styles={mapStyle} disableDefaultUI={true} gestureHandling={'greedy'}>
                {userLocation && <Marker position={userLocation} />}
                {items.map((item: any, idx: number) => (
                    <Marker key={idx} position={{ lat: Number(item.lat), lng: Number(item.lng) }} label={{ text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' }} />
                ))}
                <Polyline path={path} color={themeColor} />
            </Map>
        </div>
    );
}