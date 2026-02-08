"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, useMap, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MapUpdater({ radiusInKm, center }: any) {
    const map = useMap();

    useEffect(() => {
        // ブラウザ環境かつ、半径がある程度決まっている時に実行
        if (typeof window === "undefined" || !radiusInKm) return;

        // GPSが取れていない場合は東京（仮）を中心にする
        const currentCenter = center || { lat: 35.6812, lng: 139.7671 };

        try {
            const L = require("leaflet");
            const circle = L.circle([currentCenter.lat, currentCenter.lng], { radius: radiusInKm * 1000 });

            // ⑤ 自動縮尺 & ④ 中心地を上に押し上げる設定
            map.fitBounds(circle.getBounds(), {
                // [左, 上] の余白
                paddingTopLeft: [40, 80],
                // [右, 下] の余白。ここを大きく（500〜600）すると、中心が上に上がります
                paddingBottomRight: [40, 550],
                animate: true,
                duration: 0.8
            });
        } catch (e) {
            console.error("Zoom Error:", e);
        }
    }, [map, radiusInKm, center]); // 半径か中心が変わるたびに実行

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