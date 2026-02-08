"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, useMap, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MapUpdater({ radiusInKm, center }: any) {
    const map = useMap();

    useEffect(() => {
        if (typeof window === "undefined" || !radiusInKm) return;

        // 現在地、またはデフォルトの東京
        const currentCenter = center || { lat: 35.6812, lng: 139.7671 };

        // スライダーの動きに地図の計算を同期させるためのタイマー
        const timer = setTimeout(() => {
            try {
                const L = require("leaflet");
                const circle = L.circle([currentCenter.lat, currentCenter.lng], { radius: radiusInKm * 1000 });

                // 地図の状態をリセットしてからズーム（これでズームが効かない問題を回避）
                map.invalidateSize();

                map.fitBounds(circle.getBounds(), {
                    paddingTopLeft: [40, 100],     // [左の余白, 上（タイトル入力）の余白]
                    paddingBottomRight: [40, 750], // [右の余白, 下（メニュー）の余白] ※さらに大きくしました
                    animate: true,
                    duration: 0.6
                });
            } catch (e) {
                console.error("Map Update Error:", e);
            }
        }, 100); // 0.1秒待ってから実行

        return () => clearTimeout(timer);
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
            <MapContainer
                center={centerPos}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
                attributionControl={false}
            >
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