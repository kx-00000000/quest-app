"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, useMap, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MapUpdater({ radiusInKm, center }: any) {
    const map = useMap();
    useEffect(() => {
        if (typeof window === "undefined" || !center || !radiusInKm) return;

        try {
            const L = require("leaflet");
            const circle = L.circle([center.lat, center.lng], { radius: radiusInKm * 1000 });

            // fitBoundsのオプションを修正（[横方向, 縦方向] の順で指定します）
            map.fitBounds(circle.getBounds(), {
                paddingTopLeft: [40, 120],     // [左の余白, 上の余白]
                paddingBottomRight: [40, 380], // [右の余白, 下の余白]
                animate: true
            });
        } catch (e) {
            console.error(e);
        }
    }, [map, radiusInKm, center]);
    return null;
}

export default function MapComponent({ radiusInKm, userLocation, themeColor }: any) {
    const [isReady, setIsReady] = useState(false);
    useEffect(() => { setIsReady(true); }, []);
    if (!isReady) return null;

    const displayColor = themeColor || "#F06292";
    const centerPos: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : [35.6812, 139.7671];

    return (
        <div className="h-full w-full">
            <MapContainer center={centerPos} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={false} attributionControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                <MapUpdater radiusInKm={radiusInKm} center={userLocation} />
                {userLocation && (
                    <>
                        <CircleMarker center={[userLocation.lat, userLocation.lng]} radius={10} pathOptions={{ color: 'white', fillColor: displayColor, fillOpacity: 1, weight: 3 }} />
                        <Circle center={[userLocation.lat, userLocation.lng]} radius={radiusInKm * 1000} pathOptions={{ color: displayColor, fillColor: displayColor, fillOpacity: 0.1, weight: 2 }} />
                    </>
                )}
            </MapContainer>
        </div>
    );
}