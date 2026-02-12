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
    themeColor = "#000000", isLogMode = false,
    isBriefingActive = false, isFinalOverview = false,
    onBriefingStateChange, onBriefingComplete
}: LazyMapProps) {
    const map = useMap();

    // ★ 全ピンを画面内に収める (オートズーム)
    useEffect(() => {
        if (!map || items.length === 0 || isBriefingActive) return;

        // ログモード、またはプラン画面(isFinalOverview=true)の時に実行
        if (isLogMode || isFinalOverview) {
            const bounds = new google.maps.LatLngBounds();
            items.forEach(item => bounds.extend({ lat: item.lat, lng: item.lng }));
            if (userLocation) bounds.extend(userLocation);

            // 地図の準備が整ってから実行
            google.maps.event.addListenerOnce(map, 'idle', () => {
                map.fitBounds(bounds, { top: 60, right: 60, bottom: 60, left: 60 });
            });
        }
    }, [map, items, isLogMode, isFinalOverview, userLocation, isBriefingActive]);

    // ブリーフィング演出
    useEffect(() => {
        if (!isBriefingActive || !map || items.length === 0) return;

        const runBriefing = async () => {
            if (userLocation) {
                map.setCenter(userLocation);
                map.setZoom(13);
                await new Promise(r => setTimeout(r, 1000));
            }

            for (const item of items) {
                map.panTo({ lat: item.lat, lng: item.lng });
                await new Promise(r => setTimeout(r, 600));
                map.setZoom(15);
                await new Promise(r => setTimeout(r, 800));
                map.setZoom(17);
                await new Promise(r => setTimeout(r, 1200));
            }

            const bounds = new google.maps.LatLngBounds();
            items.forEach(i => bounds.extend({ lat: i.lat, lng: i.lng }));
            if (userLocation) bounds.extend(userLocation);
            map.fitBounds(bounds, { top: 100, right: 50, bottom: 100, left: 50 });

            await new Promise(r => setTimeout(r, 1500));
            if (onBriefingStateChange) onBriefingStateChange(true);
            if (onBriefingComplete) onBriefingComplete();
        };

        runBriefing();
    }, [isBriefingActive, map, items, userLocation, onBriefingStateChange, onBriefingComplete]);

    const controlledCenter = useMemo(() => {
        if (isBriefingActive || isLogMode || isFinalOverview) return null;
        if (userLocation) return userLocation;
        return center || { lat: 35.6812, lng: 139.7671 };
    }, [isBriefingActive, isLogMode, isFinalOverview, userLocation, center]);

    return (
        <div className="w-full h-full relative">
            <Map defaultZoom={14} center={controlledCenter} styles={mapStyle} disableDefaultUI={true} gestureHandling={'greedy'}>
                {userLocation && <Marker position={userLocation} />}
                {items.map((item, idx) => (
                    <Marker key={item.id || idx} position={{ lat: item.lat, lng: item.lng }} label={{ text: (idx + 1).toString(), color: 'white', fontWeight: 'bold' }} />
                ))}
            </Map>
        </div>
    );
}