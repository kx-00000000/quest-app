"use client";

import { MapContainer, TileLayer, Marker, Polyline, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, memo } from "react";
import MissionBriefing from "./MissionBriefing";

const createNumberIcon = (number: number, color: string) => L.divIcon({
    className: "number-icon",
    html: `<div style="background-color: ${color}; width: 22px; height: 22px; border-radius: 8px; border: 2px solid white; color: white; font-size: 11px; font-weight: 900; display: flex; align-items: center; justify-content: center; shadow: 0 2px 4px rgba(0,0,0,0.3); font-family: sans-serif;">${number}</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
});

const userIcon = L.divIcon({
    className: "user-icon",
    html: `<div style="background-color: #000; width: 12px; height: 12px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6],
});

const MapContent = memo(({
    items, userLocation, radiusInKm, themeColor, isLogMode, isBriefingActive, isFinalOverview, onBriefingStateChange, onBriefingComplete
}: any) => {
    return (
        <>
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://carto.com/">CARTO</a>'
                detectRetina={true}
            />

            {/* ★修正：ブリーフィングがアクティブな時は、isFinalOverviewがTrueの時だけ表示 */}
            {!isLogMode && userLocation && (!isBriefingActive || isFinalOverview) && (
                <>
                    <Circle
                        center={[userLocation.lat, userLocation.lng]}
                        radius={radiusInKm * 1000}
                        pathOptions={{ fillColor: themeColor, fillOpacity: 0.1, color: themeColor, weight: 1, dashArray: "5, 5" }}
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
                <MissionBriefing
                    items={items}
                    onStateChange={onBriefingStateChange} // ★追加
                    onComplete={onBriefingComplete}
                />
            )}
        </>
    );
});

MapContent.displayName = "MapContent";

export default function Map(props: any) {
    const initialCenter: [number, number] = props.userLocation
        ? [props.userLocation.lat, props.userLocation.lng]
        : [35.6812, 139.7671];

    return (
        <MapContainer center={initialCenter} zoom={14} className="w-full h-full z-0" zoomControl={false} preferCanvas={true}>
            <MapContent {...props} />
        </MapContainer>
    );
}