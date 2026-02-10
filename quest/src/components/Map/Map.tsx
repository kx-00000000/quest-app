"use client";

import { MapContainer, TileLayer, Marker } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { memo } from "react";
import MissionBriefing from "./MissionBriefing";

// 数字アイコン（Discovery Reportと共通スタイル）
const createNumberIcon = (n: number, color: string) => L.divIcon({
    className: "number-icon",
    html: `<div style="background-color: ${color}; width: 22px; height: 22px; border-radius: 8px; border: 2px solid white; color: white; font-size: 11px; font-weight: 900; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2);">${n}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
});

const userIcon = L.divIcon({
    className: "user",
    html: `<div style="background-color: #000; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.2);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

const MapContent = memo(({ items, userLocation, themeColor, isLogMode, isBriefingActive, onBriefingStateChange, onBriefingComplete }: any) => {
    return (
        <>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; CARTO" />

            {/* 現在地表示 */}
            {userLocation?.lat && (
                <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />
            )}

            {/* 目的地表示：ブリーフィング中、またはプラン/ログ画面(isLogMode)では数字を出す */}
            {(isBriefingActive || isLogMode) && items?.map((item: any, idx: number) => (
                <Marker
                    key={item.id || idx}
                    position={[item.lat, item.lng]}
                    icon={createNumberIcon(idx + 1, themeColor)}
                />
            ))}

            {isBriefingActive && <MissionBriefing items={items} onStateChange={onBriefingStateChange} onComplete={onBriefingComplete} />}
        </>
    );
});

MapContent.displayName = "MapContent";

export default function Map(props: any) {
    const center: [number, number] = props.userLocation?.lat ? [props.userLocation.lat, props.userLocation.lng] : [35.6812, 139.7671];
    return (
        <MapContainer center={center} zoom={13} className="w-full h-full z-0" zoomControl={false} preferCanvas={true}>
            <MapContent {...props} />
        </MapContainer>
    );
}