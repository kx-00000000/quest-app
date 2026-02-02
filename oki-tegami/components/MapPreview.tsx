import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Location } from '@/types';

// Fix Leaflet Default Icon issue in Next.js
// using a custom div icon function
const createMinimalIcon = (color: string) => L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [12, 12],
    iconAnchor: [6, 6]
});

interface MapPreviewProps {
    center: Location;
    dest: Location;
    zoom: number;
    onMapClick?: (loc: Location) => void;
}

// Controller to handle Bounds, but careful not to hijack Zoom if user interacts
function MapController({ center, dest, zoom }: { center: Location, dest: Location, zoom: number }) {
    const map = useMap();
    useEffect(() => {
        if (!map) return;
        const bounds = L.latLngBounds([
            [center.lat, center.lng],
            [dest.lat, dest.lng]
        ]);
        // Only fly if needed, using bounds padded.
        map.flyToBounds(bounds, { padding: [50, 50], maxZoom: zoom, duration: 1.5 });
    }, [center, dest, map, zoom]);
    return null;
}

function MapEvents({ onClick }: { onClick?: (loc: Location) => void }) {
    useMapEvents({
        click(e) {
            if (onClick) onClick({ lat: e.latlng.lat, lng: e.latlng.lng });
        },
    });
    return null;
}

export default function MapPreview({ center, dest, zoom, onMapClick }: MapPreviewProps) {
    return (
        <MapContainer
            center={[center.lat, center.lng]}
            zoom={zoom}
            scrollWheelZoom={true} // Enable zoom
            className="w-full h-full"
            style={{ minHeight: '300px' }}
        >
            {/* CARTO VOYAGER TILES (Color, Clean) */}
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />

            <Marker position={[center.lat, center.lng]} icon={createMinimalIcon('#000000')}>
                <Popup>You</Popup>
            </Marker>

            <Marker position={[dest.lat, dest.lng]} icon={createMinimalIcon('#000000')}>
                <Popup>Landing Site</Popup>
            </Marker>

            <MapEvents onClick={onMapClick} />

            {/* 
               User requested "Persistent Zoom" - meaning don't auto-reset aggressively.
               However, without MapController, map won't center on initial load or mode change.
               For now, removing MapController ensures the map doesn't jump around.
               If centering is needed, user can pan. Or we can re-enable with smarter logic.
               Given request "Zoom Fixed", leaving it manual is safer.
               
               <MapController center={center} dest={dest} zoom={zoom} />
            */}
        </MapContainer>
    );
}
