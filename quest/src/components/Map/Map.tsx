"use client";

import { MapContainer, TileLayer, Marker, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import MissionBriefing from "./MissionBriefing"; // ★新規作成するコンポーネント

// アイコンのセットアップ
const createIcon = (color: string, isStart = false) => L.divIcon({
    className: "custom-icon",
    html: `<div style="background-color: ${color}; width: ${isStart ? '12px' : '10px'}; height: ${isStart ? '12px' : '10px'}; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.2);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
});

// 地図の表示範囲を自動調整する部品
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

// プロップスに isBriefingActive と onBriefingComplete を追加
export default function Map({
    items = [],
    center,
    themeColor = "#f06292",
    isLogMode = false,
    isBriefingActive = false,    // ★追加
    onBriefingComplete           // ★追加
}: any) {

    // 1. 軌跡用のポイント配列を作成
    const trackPoints = useMemo(() => {
        if (!isLogMode) return [];

        const start: [number, number] = center ? [center.lat, center.lng] : [0, 0];
        const collected = items
            .filter((i: any) => i.isCollected)
            .sort((a: any, b: any) => new Date(a.collectedAt).getTime() - new Date(b.collectedAt).getTime())
            .map((i: any) => [i.lat, i.lng] as [number, number]);

        return [start, ...collected];
    }, [items, center, isLogMode]);

    const mapCenter: [number, number] = center ? [center.lat, center.lng] : [35.6812, 139.7671];

    return (
        <MapContainer center={mapCenter} zoom={15} className="w-full h-full z-0" zoomControl={false}>
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
            />

            {/* 2. 出発地点のプロット（ログモード時） */}
            {isLogMode && center && (
                <Marker position={[center.lat, center.lng]} icon={createIcon("#333", true)} />
            )}

            {/* 3. 軌跡（線）の描画（ログモード時） */}
            {isLogMode && trackPoints.length > 1 && (
                <Polyline
                    positions={trackPoints}
                    pathOptions={{
                        color: themeColor,
                        weight: 3,
                        opacity: 0.6,
                        dashArray: "5, 10"
                    }}
                />
            )}

            {/* 4. アイテム地点のプロット */}
            {items.map((item: any) => (
                <Marker
                    key={item.id}
                    position={[item.lat, item.lng]}
                    icon={createIcon(item.isCollected ? themeColor : (isBriefingActive ? themeColor : "#ccc"))}
                />
            ))}

            {/* 5. ミッション・ブリーフィング演出（アクティブ時のみ） */}
            {isBriefingActive && (
                <MissionBriefing
                    items={items}
                    onComplete={onBriefingComplete}
                />
            )}

            {/* 自動ズーム調整 */}
            {isLogMode && <MapBounds points={trackPoints} />}
        </MapContainer>
    );
}