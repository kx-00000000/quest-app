"use client";

import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { memo, useEffect } from "react";
import MissionBriefing from "./MissionBriefing";

// 全ターゲットが収まるように自動ズーム調整
function AutoFit({ items, userLocation, isLogMode }: any) {
    const map = useMap();
    useEffect(() => {
        if (isLogMode && items && items.length > 0) {
            const bounds = L.latLngBounds(items.map((i: any) => [i.lat, i.lng]));
            if (userLocation) bounds.extend([userLocation.lat, userLocation.lng]);
            map.fitBounds(bounds, { padding: [50, 50], animate: true });
        }
    }, [items, userLocation, map, isLogMode]);
    return null;
}

const createNumberIcon = (n: number, color: string) => L.divIcon({
    className: "number-icon",
    html: `<div style="background-color: ${color}; width: 22px; height: 22px; border-radius: 8px; border: 2px solid white; color: white; font-size: 11px; font-weight: 900; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 4px rgba(0,0,0,0.2); font-family: sans-serif;">${n}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
});

const userIcon = L.divIcon({
    className: "user",
    html: `<div style="background-color: #000; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white;"></div>`,
    iconSize: [10, 10],
    iconAnchor: [5, 5]
});

const MapContent = memo(({ items, userLocation, radiusInKm, themeColor, isLogMode, isBriefingActive, onBriefingStateChange, onBriefingComplete, planId }: any) => {
    return (
        <>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; CARTO" />
            <AutoFit items={items} userLocation={userLocation} isLogMode={isLogMode} />

            {/* 探索円: 作成画面(ブリーフィング前)のみ表示。プラン/ログ画面では不要 */}
            {userLocation?.lat && !isLogMode && !isBriefingActive && (
                <Circle
                    center={[userLocation.lat, userLocation.lng]}
                    radius={(radiusInKm || 1) * 1000}
                    pathOptions={{ fillColor: "transparent", color: themeColor, weight: 2, dashArray: "8, 8" }}
                />
            )}

            {userLocation?.lat && <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />}

            {(isBriefingActive || isLogMode) && items?.map((item: any, idx: number) => (
                <Marker key={item.id || idx} position={[item.lat, item.lng]} icon={createNumberIcon(idx + 1, themeColor)} />
            ))}

            {isBriefingActive && <MissionBriefing items={items} planId={planId} onStateChange={onBriefingStateChange} onComplete={onBriefingComplete} />}
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