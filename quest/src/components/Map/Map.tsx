"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Circle, useMap, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function MapUpdater({ radiusInKm, center }: any) {
    const map = useMap();
    useEffect(() => {
        // 緯度経度と半径が揃っているときだけ実行
        if (typeof window === "undefined" || !center || !radiusInKm) return;

        try {
            const L = require("leaflet");
            // 半径に基づいた円の範囲を計算
            const circle = L.circle([center.lat, center.lng], { radius: radiusInKm * 1000 });

            // 円全体が収まるように地図を動かす
            map.fitBounds(circle.getBounds(), {
                paddingTopLeft: [40, 100],     // ③ タイトル入力欄を避ける余白
                paddingBottomRight: [40, 500], // ④ メニューパネルを避けるための余白（ここを増やすと中心が上がります）
                animate: true,
                duration: 0.5 // スルスルと動くアニメーションの時間
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
                {/* ⑤ 縮尺と位置を自動調整する部品 */}
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