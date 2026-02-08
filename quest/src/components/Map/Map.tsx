"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, Polyline, useMap, CircleMarker } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// 1. 地図のアイコンと動きを管理するサブ部品
function MapContent({ radiusInKm, center, color }: any) {
    const map = useMap();

    useEffect(() => {
        if (typeof window === "undefined" || !center || !radiusInKm) return;

        // Leaflet本体をブラウザで動的に読み込み
        const L = require("leaflet");

        // アイコンの初期化（これをしないとマーカー表示でエラーが出る）
        delete L.Icon.Default.prototype._getIconUrl;
        L.Icon.Default.mergeOptions({
            iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
            iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
            shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
        });

        // 円の範囲に合わせて地図をズーム
        const circle = L.circle([center.lat, center.lng], { radius: radiusInKm * 1000 });
        map.fitBounds(circle.getBounds(), { padding: [40, 40], animate: true });
    }, [map, radiusInKm, center]);

    return null;
}

export default function MapComponent({ radiusInKm, items, path, center, userLocation, themeColor }: any) {
    const [mounted, setMounted] = useState(false);
    const [L, setL] = useState<any>(null);

    useEffect(() => {
        // コンポーネントがブラウザに表示されてからLeafletを読み込む
        setMounted(true);
        setL(require("leaflet"));
    }, []);

    // ブラウザの準備ができるまでは、エラー回避のために何も表示しない
    if (!mounted || !L) return <div className="h-full w-full bg-gray-50" />;

    const displayColor = themeColor || "#F06292";
    // 中心点の決定
    const mapCenter: [number, number] = userLocation
        ? [userLocation.lat, userLocation.lng]
        : (center ? [center.lat, center.lng] : [35.6812, 139.7671]);

    return (
        <div className="h-full w-full">
            <MapContainer
                center={mapCenter}
                zoom={13}
                style={{ height: "100%", width: "100%" }}
                zoomControl={false}
                attributionControl={false}
            >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />

                <MapContent radiusInKm={radiusInKm} center={userLocation || center} color={displayColor} />

                {userLocation && (
                    <>
                        {/* 現在地のドット */}
                        <CircleMarker
                            center={[userLocation.lat, userLocation.lng]}
                            radius={10}
                            pathOptions={{ color: 'white', fillColor: '#2196F3', fillOpacity: 1, weight: 3 }}
                        />
                        {/* 探索円 */}
                        {radiusInKm && (
                            <Circle
                                center={[userLocation.lat, userLocation.lng]}
                                radius={radiusInKm * 1000}
                                pathOptions={{ color: displayColor, fillColor: displayColor, fillOpacity: 0.1, weight: 2 }}
                            />
                        )}
                    </>
                )}

                {/* 軌跡 */}
                {path && path.length > 0 && (
                    <Polyline
                        positions={path.map((p: any) => [p.lat, p.lng])}
                        pathOptions={{ color: displayColor, weight: 6, opacity: 0.8 }}
                    />
                )}

                {/* マーカー */}
                {items && items.map((item: any, idx: number) => (
                    <Marker
                        key={idx}
                        position={[item.lat, item.lng]}
                        icon={L.divIcon({
                            className: 'custom-map-icon',
                            html: `<div style="background-color: ${displayColor}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-weight: 900; color: white; font-size: 13px; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">${idx + 1}</div>`,
                            iconSize: [32, 32],
                            iconAnchor: [16, 16]
                        })}
                    />
                ))}
            </MapContainer>
        </div>
    );
}