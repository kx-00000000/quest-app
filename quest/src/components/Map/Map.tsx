"use client";

import { MapContainer, TileLayer, Marker, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { memo, useEffect } from "react";
import MissionBriefing from "./MissionBriefing";

// 地図の自動ズーム調整
function AutoFit({ userLocation, radiusInKm, isBriefingActive }: any) {
    const map = useMap();
    useEffect(() => {
        if (!isBriefingActive && userLocation && radiusInKm) {
            // 円の範囲が収まるように Bounds を計算
            const circle = L.circle([userLocation.lat, userLocation.lng], { radius: radiusInKm * 1000 });
            map.fitBounds(circle.getBounds(), { padding: [40, 40], animate: true });
        }
    }, [userLocation, radiusInKm, map, isBriefingActive]);
    return null;
}

// 地図が準備できたら親に通知
function MapTracker({ onReady }: any) {
    const map = useMap();
    useEffect(() => { onReady(map); }, [map, onReady]);
    return null;
}

const createNumberIcon = (number: number, color: string) => L.divIcon({
    className: "number-icon",
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 8px; border: 2px solid white; color: white; font-size: 12px; font-weight: 900; display: flex; align-items: center; justify-content: center; shadow: 0 2px 4px rgba(0,0,0,0.3); font-family: sans-serif;">${number}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

const userIcon = L.divIcon({
    className: "user-icon",
    html: `<div style="background-color: #000; width: 12px; height: 12px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
});

const MapContent = memo(({
    items, userLocation, radiusInKm, themeColor, isLogMode, isBriefingActive, isFinalOverview, onBriefingStateChange, onBriefingComplete, onMapReady
}: any) => {
    return (
        <>
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                detectRetina={true}
            />
            <AutoFit userLocation={userLocation} radiusInKm={radiusInKm} isBriefingActive={isBriefingActive} />
            <MapTracker onReady={onMapReady} />

            {!isLogMode && userLocation && (!isBriefingActive || isFinalOverview) && (
                <>
                    <Circle
                        center={[userLocation.lat, userLocation.lng]}
                        radius={radiusInKm * 1000}
                        pathOptions={{ fillColor: "transparent", fillOpacity: 0, color: themeColor, weight: 2, dashArray: "8, 8" }}
                    />
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon} />
                </>
            )}

            {(isBriefingActive || isLogMode) && items.map((item: any, idx: number) => (
                <Marker
                    key={item.id}
                    position={[item.lat, item.lng]}
                    icon={isBriefingActive
                        ? createNumberIcon(idx + 1, themeColor)
                        : L.divIcon({
                            className: "custom-icon",
                            html: `<div style="background-color: ${item.isCollected ? themeColor : '#ccc'}; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white;"></div>`,
                            iconSize: [12, 12],
                            iconAnchor: [6, 6],
                        })
                    }
                />
            ))}

            {isBriefingActive && (
                <MissionBriefing items={items} onStateChange={onBriefingStateChange} onComplete={onBriefingComplete} />
            )}
        </>
    );
});

MapContent.displayName = "MapContent";

export default function Map(props: any) {
    const initialCenter: [number, number] = props.userLocation ? [props.userLocation.lat, props.userLocation.lng] : [35.6812, 139.7671];
    return (
        <MapContainer center={initialCenter} zoom={14} className="w-full h-full z-0" zoomControl={false} preferCanvas={true}>
            <MapContent {...props} />
        </MapContainer>
    );
}