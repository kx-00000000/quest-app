"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, Polyline, useMap, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Leafletのアイコン解決
// @ts-expect-error - _getIconUrl does exist on prototype
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapProps {
    radiusInKm?: number;
    items?: { lat: number; lng: number }[];
    path?: { lat: number; lng: number }[];
    center?: { lat: number; lng: number };
    userLocation?: { lat: number; lng: number } | null; // 親から現在地を受け取る
}

// 自動ズーム機能
function AutoZoom({ radiusInKm, center, path }: { radiusInKm?: number, center?: { lat: number, lng: number }, path?: { lat: number, lng: number }[] }) {
    const map = useMap();
    useEffect(() => {
        if (path && path.length > 0) {
            const bounds = L.latLngBounds(path.map(p => [p.lat, p.lng]));
            map.fitBounds(bounds, { padding: [40, 40] });
            return;
        }

        if (center && radiusInKm) {
            const radiusMeters = radiusInKm * 1000;
            const circle = L.circle([center.lat, center.lng], { radius: radiusMeters });
            map.fitBounds(circle.getBounds(), { padding: [20, 20], animate: true });
        }
    }, [map, radiusInKm, center, path]);

    return null;
}

const createCustomIcon = (label: string, color: string) => {
    return L.divIcon({
        className: 'custom-map-icon',
        html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-weight: 900; color: white; font-size: 13px; box-shadow: 0 4px 10px rgba(0,0,0,0.3); font-family: sans-serif;">${label}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 16]
    });
}

export default function MapComponent({ radiusInKm, items, path, center, userLocation }: MapProps) {
    const [mapCenter, setMapCenter] = useState<[number, number]>(
        center ? [center.lat, center.lng] : [35.6812, 139.7671]
    );

    const safeItems = items || [];
    const safePath = path || [];

    useEffect(() => {
        if (center) {
            setMapCenter([center.lat, center.lng]);
        } else if (userLocation) {
            setMapCenter([userLocation.lat, userLocation.lng]);
        }
    }, [center, userLocation]);

    return (
        <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
            zoomControl={false}
            attributionControl={false}
        >
            {/* 地図タイル：少し落ち着いた明るいトーン */}
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; OSM'
            />

            {/* 1. 現在地の青いドット（NEW：ここを追加） */}
            {userLocation && (
                <CircleMarker
                    center={[userLocation.lat, userLocation.lng]}
                    radius={10}
                    pathOptions={{
                        color: 'white',
                        fillColor: '#2196F3',
                        fillOpacity: 1,
                        weight: 3
                    }}
                />
            )}

            {/* 2. 探索範囲の円（実線化＆ピンクに修正） */}
            {radiusInKm && userLocation && (
                <Circle
                    center={[userLocation.lat, userLocation.lng]}
                    radius={radiusInKm * 1000}
                    pathOptions={{
                        color: "#F48FB1",
                        fillColor: "#F48FB1",
                        fillOpacity: 0.1,
                        weight: 2,
                        dashArray: null // 実線にする
                    }}
                />
            )}

            {/* 3. 軌跡のライン（点線から実線へ