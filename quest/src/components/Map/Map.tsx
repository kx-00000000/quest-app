"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, useMap, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MapUpdater({ radiusInKm, center }: any) {
    const map = useMap();
    useEffect(() => {
        // 緯度経度が有効な数字であることを厳格にチェック
        if (typeof window === "undefined" || !center || typeof center.lat !== 'number' || !radiusInKm) return;

        try {
            const L = require("leaflet");
            const circle = L.circle([center.lat, center.lng], { radius: radiusInKm * 1000 });
            map.fitBounds(circle.getBounds(), { padding: [40, 40], animate: true });
        } catch (e) {
            console.error("Map calculation error:", e);
        }
    }, [map, radiusInKm, center]);
    return null;
}

export default function MapComponent({ radiusInKm, userLocation, themeColor }: any) {
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        setIsReady(true);
    }, []);

    if (!isReady) return <div className="h-full w-full bg-gray-100" />;

    const displayColor = themeColor || "#F06292";
    const defaultCenter: [number, number] = [35.6812, 139.7671];
    const centerPos: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : defaultCenter;

    return (
        <div className="h-full w-full">
            <MapContainer center={centerPos} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={false} attributionControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                <MapUpdater radiusInKm={radiusInKm} center={userLocation} />
                {userLocation && (
                    <>
                        <CircleMarker center={[userLocation.lat, userLocation.lng]} radius={10} pathOptions={{ color: 'white', fillColor: '#2196F3', fillOpacity: 1, weight: 3 }} />
                        <Circle center={[userLocation.lat, userLocation.lng]} radius={radiusInKm * 1000} pathOptions={{ color: displayColor, fillColor: displayColor, fillOpacity: 0.1, weight: 2 }} />
                    </>
                )}
            </MapContainer>
        </div>
    );
}