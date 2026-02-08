"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, useMap, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MapUpdater({ radiusInKm, center }: any) {
    const map = useMap();
    useEffect(() => {
        if (typeof window === "undefined" || !center || typeof center.lat !== 'number' || !radiusInKm) return;

        try {
            const L = require("leaflet");
            const circle = L.circle([center.lat, center.lng], { radius: radiusInKm * 1000 });
            // 半径に合わせてズームと位置を自動調整（これで現在地が真ん中になります）
            map.fitBounds(circle.getBounds(), { padding: [40, 40], animate: true });
        } catch (e) {
            console.error("Map error:", e);
        }
    }, [map, radiusInKm, center]);
    return null;
}

export default function MapComponent({ radiusInKm, userLocation, themeColor }: any) {
    const [isReady, setIsReady] = useState(false);
    useEffect(() => { setIsReady(true); }, []);

    if (!isReady) return <div className="h-full w-full bg-gray-100" />;

    const displayColor = themeColor || "#F06292";
    // デフォルト（取得前）は東京を表示、取得後は現在地を優先
    const centerPos: [number, number] = userLocation ? [userLocation.lat, userLocation.lng] : [35.6812, 139.7671];

    return (
        <div className="h-full w-full">
            <MapContainer center={centerPos} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={false} attributionControl={false}>
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

                {/* 現在地が真ん中になるように制御 */}
                <MapUpdater radiusInKm={radiusInKm} center={userLocation} />

                {userLocation && (
                    <>
                        {/* 中心地（現在地）のドットを青からピンクに変更 */}
                        <CircleMarker
                            center={[userLocation.lat, userLocation.lng]}
                            radius={10}
                            pathOptions={{
                                color: 'white',
                                fillColor: displayColor, // ピンクに統一
                                fillOpacity: 1,
                                weight: 3
                            }}
                        />
                        <Circle
                            center={[userLocation.lat, userLocation.lng]}
                            radius={radiusInKm * 1000}
                            pathOptions={{ color: displayColor, fillColor: displayColor, fillOpacity: 0.1, weight: 2 }}
                        />
                    </>
                )}
            </MapContainer>
        </div>
    );
}