"use client";

import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import MissionBriefing from "./MissionBriefing";

// アイコン設定
const createIcon = (color: string, isStart = false) => L.divIcon({
    className: "custom-icon",
    html: `<div style="background-color: ${color}; width: ${isStart ? '14px' : '10px'}; height: ${isStart ? '14px' : '10px'}; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
});

// 現在地用ブルーアイコン（航空計器風）
const userIcon = L.divIcon({
    className: "user-icon",
    html: `<div style="background-color: #3B82F6; width: 12px; height: 12px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(59,130,246,0.5);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
});

function MapBounds({ points }: { points: [number, number][] }) {
    const map = useMap();
    useEffect(() => {
        if (points.length > 0) {
            const bounds = L.latLngBounds(points);
            map.fitBounds(bounds, { padding: [30, 30] });
        }
    }, [points, map]);
    return null;
}

export default function Map({
    items = [],
    center,
    userLocation,     // NEWページから渡される現在地
    radiusInKm = 1,   // NEWページから渡される探索半径
    themeColor = "#f06292",
    isLogMode = false,
    isBriefingActive = false,
    onBriefingComplete
}: any) {

    // 軌跡用ポイント
    const trackPoints = useMemo(() => {
        if (!isLogMode) return [];
        const start: [number, number] = center ? [center.lat, center.lng] : [0, 0];
        const collected = items
            .filter((i: any) => i.isCollected)
            .sort((a: any, b: any) => new Date(a.collectedAt).getTime() - new Date(b.collectedAt).getTime())
            .map((i: any) => [i.lat, i.lng] as [number, number]);
        return [start, ...collected];
    }, [items, center, isLogMode]);

    // 地図の初期中心点（ユーザーがいればそこを、いなければ東京を）
    const initialCenter: [number, number] = userLocation
        ? [userLocation.lat, userLocation.lng]
        : [35.6812, 139.7671];

    return (
        <MapContainer center={initialCenter} zoom={14} className="w-full h-full z-0" zoomControl={false}>

            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                detectRetina={true} // ★高解像度ディスプレイ（Retina）対応を強制
                keepBuffer={8}      // ★周囲のタイルを多めに保持して、ボケを防止
            />

            {/* A. NEWページ用：探索範囲の円 */}
            {!isLogMode && userLocation && (
                <>
                    <Circle
                        center={[userLocation.lat, userLocation.lng]}
                        radius={radiusInKm * 1000}
                        pathOptions={{
                            fillColor: themeColor,
                            fillOpacity: 0.1,
                            color: themeColor,
                            weight: 1,
                            dashArray: "5, 5"
                        }}
                    />
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />
                </>
            )}

            {/* B. LOGモード：出発地点と軌跡 */}
            {isLogMode && center && (
                <Marker position={[center.lat, center.lng]} icon={createIcon("#333", true)} />
            )}
            {isLogMode && trackPoints.length > 1 && (
                <Polyline
                    positions={trackPoints}
                    pathOptions={{ color: themeColor, weight: 3, opacity: 0.6, dashArray: "5, 10" }}
                />
            )}

            {/* C. アイテム地点（ブリーフィング中、またはログモードで表示） */}
            {(isBriefingActive || isLogMode) && items.map((item: any) => (
                <Marker
                    key={item.id}
                    position={[item.lat, item.lng]}
                    icon={createIcon(item.isCollected ? themeColor : (isBriefingActive ? themeColor : "#ccc"))}
                />
            ))}

            {/* D. ブリーフィング演出 */}
            {isBriefingActive && (
                <MissionBriefing items={items} onComplete={onBriefingComplete} />
            )}

            {isLogMode && <MapBounds points={trackPoints} />}
        </MapContainer>
    );
}