"use client";
import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, Polyline, useMap, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Leafletアイコンの設定
delete (L.Icon.Default.prototype as any)._getIconUrl;
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
    userLocation?: { lat: number; lng: number } | null;
    themeColor?: string;
}

function AutoZoom({ radiusInKm, center }: { radiusInKm?: number, center?: { lat: number, lng: number } }) {
    const map = useMap();
    useEffect(() => {
        if (center && radiusInKm) {
            const circle = L.circle([center.lat, center.lng], { radius: radiusInKm * 1000 });
            map.fitBounds(circle.getBounds(), { padding: [40, 40] });
        }
    }, [map, radiusInKm, center]);
    return null;
}

export default function MapComponent({ radiusInKm, items, path, center, userLocation, themeColor }: MapProps) {
    const safeItems = items || [];
    const safePath = path || [];
    const displayColor = themeColor || "#F06292";

    return (
        <MapContainer center={[35.6812, 139.7671]} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={false} attributionControl={false}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

            {userLocation && (
                <>
                    {/* 現在地の青いドット */}
                    <CircleMarker center={[userLocation.lat, userLocation.lng]} radius={10} pathOptions={{ color: 'white', fillColor: '#2196F3', fillOpacity: 1, weight: 3 }} />

                    {/* 探索範囲の円（ピンクの実線） */}
                    {radiusInKm && (
                        <Circle center={[userLocation.lat, userLocation.lng]} radius={radiusInKm * 1000} pathOptions={{ color: displayColor, fillColor: displayColor, fillOpacity: 0.1, weight: 2 }} />
                    )}
                </>
            )}

            {/* 軌跡のライン（実線） */}
            {safePath.length > 0 && (
                <Polyline positions={safePath.map(p => [p.lat, p.lng])} pathOptions={{ color: displayColor, weight: 6, opacity: 0.8 }} />
            )}

            {/* マーカー（アイテム） */}
            {safeItems.map((item, idx) => (
                <Marker key={idx} position={[item.lat, item.lng]} icon={L.divIcon({
                    className: 'custom-map-icon',
                    html: `<div style="background-color: ${displayColor}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-weight: 900; color: white; font-size: 13px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">${idx + 1}</div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                })} />
            ))}

            <AutoZoom radiusInKm={radiusInKm} center={userLocation || center} />
        </MapContainer>
    );
}