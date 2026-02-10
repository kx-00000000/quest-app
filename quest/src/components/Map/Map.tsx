"use client";

import { MapContainer, TileLayer, Marker, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { memo } from "react";
import MissionBriefing from "./MissionBriefing";

const createNumberIcon = (n: number, color: string) => L.divIcon({
    className: "number-icon",
    html: `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 8px; border: 2px solid white; color: white; font-size: 12px; font-weight: 900; display: flex; align-items: center; justify-content: center;">${n}</div>`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
});

const MapContent = memo(({ items, userLocation, radiusInKm, themeColor, isLogMode, isBriefingActive, isFinalOverview, onBriefingStateChange, onBriefingComplete }: any) => {
    return (
        <>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" attribution="&copy; CARTO" />

            {!isLogMode && userLocation?.lat && (!isBriefingActive || isFinalOverview) && (
                <>
                    <Circle
                        center={[userLocation.lat, userLocation.lng]}
                        radius={radiusInKm * 1000}
                        pathOptions={{
                            fillColor: themeColor,
                            fillOpacity: 0.15, // ★塗りつぶし復活
                            color: themeColor,
                            weight: 2,
                            dashArray: "8, 8"
                        }}
                    />
                    <Marker position={[userLocation.lat, userLocation.lng]} icon={L.divIcon({ className: "user", html: `<div style="background-color: #000; width: 12px; height: 12px; border-radius: 50%; border: 3px solid white;"></div>`, iconSize: [12, 12], iconAnchor: [6, 6] })} />
                </>
            )}

            {(isBriefingActive || isLogMode) && items.map((item: any, idx: number) => (
                <Marker key={item.id} position={[item.lat, item.lng]} icon={isBriefingActive ? createNumberIcon(idx + 1, themeColor) : L.divIcon({ className: "dot", html: `<div style="background-color: ${item.isCollected ? themeColor : '#ccc'}; width: 10px; height: 10px; border-radius: 50%; border: 2px solid white;"></div>`, iconSize: [12, 12], iconAnchor: [6, 6] })} />
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