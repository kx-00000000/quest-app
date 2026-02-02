"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Circle, Polyline, useMap, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet Default Icon issue in Webpack/Next.js
// @ts-expect-error - _getIconUrl does exist on prototype
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
    iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
    shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MapProps {
    radiusInKm?: number; // Optional now
    items?: { lat: number; lng: number }[];
    path?: { lat: number; lng: number }[]; // New Prop
    interactive?: boolean;
    center?: { lat: number; lng: number }; // Force Center
}

// Component to handle map center update when user moves
function LocationMarker() {
    const [position, setPosition] = useState<L.LatLng | null>(null);
    const map = useMap();

    useEffect(() => {
        map.locate().on("locationfound", function (e) {
            setPosition(e.latlng);
            // map.flyTo(e.latlng, map.getZoom()); // Don't fly automatically if we want to see the path/items
        });
    }, [map]);

    return position === null ? null : (
        <Marker position={position}></Marker>
    );
}

// Component to center on current location initially
function RecenterOnLoad({ initialCenter }: { initialCenter?: { lat: number, lng: number } }) {
    const map = useMap();
    useEffect(() => {
        if (initialCenter) {
            map.setView([initialCenter.lat, initialCenter.lng], 13);
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const { latitude, longitude } = pos.coords;
                map.setView([latitude, longitude], 13);
            },
            (err) => {
                console.warn("Geolocation denied/error", err);
                map.setView([35.6812, 139.7671], 13);
            }
        );
    }, [map, initialCenter]);
    return null;
}

// Component to auto-zoom when radius changes or path exists
function AutoZoom({ radiusInKm, center, path }: { radiusInKm?: number, center?: { lat: number, lng: number }, path?: { lat: number, lng: number }[] }) {
    const map = useMap();
    useEffect(() => {
        if (path && path.length > 0) {
            const bounds = L.latLngBounds(path.map(p => [p.lat, p.lng]));
            map.fitBounds(bounds, { padding: [20, 20] });
            return;
        }

        if (center && radiusInKm) {
            const radiusMeters = radiusInKm * 1000;
            const latDelta = radiusInKm / 111;
            const lngDelta = radiusInKm / (111 * Math.cos(center.lat * Math.PI / 180));

            const bounds = L.latLngBounds(
                [center.lat - latDelta, center.lng - lngDelta],
                [center.lat + latDelta, center.lng + lngDelta]
            );
            map.fitBounds(bounds, { padding: [20, 20], animate: true });
        }
    }, [map, radiusInKm, center, path]);

    return null;
}

const createCustomIcon = (label: string, color: string) => {
    return L.divIcon({
        className: 'custom-map-icon',
        html: `<div style="background-color: ${color}; width: 28px; height: 28px; border-radius: 50%; border: 3px solid white; display: flex; align-items: center; justify-content: center; font-weight: 900; color: white; font-size: 11px; box-shadow: 0 4px 6px rgba(0,0,0,0.2); font-family: sans-serif;">${label}</div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });
}

export default function MapComponent({ radiusInKm, items, path, center }: MapProps) {
    // Default center state if not provided
    const [mapCenter, setMapCenter] = useState<[number, number]>(
        center ? [center.lat, center.lng] : [35.6812, 139.7671]
    );

    const safeItems = items || [];
    const safePath = path || [];

    useEffect(() => {
        if (center) {
            setMapCenter([center.lat, center.lng]);
        } else if (navigator.geolocation && !safePath.length) {
            // Only auto-update center if we are not viewing a static path history
            navigator.geolocation.watchPosition((pos) => {
                setMapCenter([pos.coords.latitude, pos.coords.longitude]);
            });
        }
    }, [center, path]); // Keep path as dependency, but now we rely on prop reference. 
    // If parent passes undefined consistently, 'path' is undefined (stable).

    // Determine start pos for "DEP" marker
    const startPos = safePath.length > 0 ? safePath[0] : (center ? center : null);

    return (
        <MapContainer
            center={mapCenter}
            zoom={13}
            style={{ height: "100%", width: "100%", zIndex: 0 }}
            zoomControl={false}
            attributionControl={false}
        >
            <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            />

            {/* Circle representing the quest radius - Only if radius provided */}
            {radiusInKm && (
                <Circle
                    center={mapCenter}
                    radius={radiusInKm * 1000}
                    pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.1, weight: 1, dashArray: "5, 10" }}
                />
            )}

            {/* Path Polyline */}
            {safePath.length > 0 && (
                <Polyline
                    positions={safePath.map(p => [p.lat, p.lng])}
                    pathOptions={{ color: "#10b981", weight: 4, opacity: 0.8, dashArray: "8, 8", lineCap: "round" }}
                />
            )}

            {/* Start Marker "D" - Only if Log Mode (no radius ring) */}
            {startPos && !radiusInKm && (
                <Marker
                    position={[startPos.lat, startPos.lng]}
                    icon={createCustomIcon("D", "#ef4444")}
                />
            )}

            {/* Items */}
            {safeItems.map((item, idx) => (
                <Marker
                    key={idx}
                    position={[item.lat, item.lng]}
                    icon={createCustomIcon(`${idx + 1}`, "#10b981")}
                />
            ))}

            <AutoZoom radiusInKm={radiusInKm} center={center ? { lat: center.lat, lng: center.lng } : { lat: mapCenter[0], lng: mapCenter[1] }} path={path} />
            <RecenterOnLoad initialCenter={center} />
        </MapContainer>
    );
}
