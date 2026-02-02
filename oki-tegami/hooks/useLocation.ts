import { useState, useEffect, useCallback } from 'react';

interface Coordinates {
    lat: number;
    lng: number;
}

interface LocationState {
    coords: Coordinates | null;
    error: string | null;
    loading: boolean;
}

export function useLocation() {
    const [state, setState] = useState<LocationState>({
        coords: null,
        error: null,
        loading: true,
    });

    useEffect(() => {
        if (!navigator.geolocation) {
            setState(s => ({ ...s, error: 'Geolocation is not supported', loading: false }));
            return;
        }

        // PWA Note: This geolocation watch requires 'geolocation' permission in PWA manifest params if customizable (standard web API handles it via prompt). 
        // For background usage in future PWA standards, ensure proper permissions policy.
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                setState({
                    coords: {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                    },
                    error: null,
                    loading: false,
                });
            },
            (error) => {
                setState(s => ({ ...s, error: error.message, loading: false }));
            },
            {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 5000,
            }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, []);

    // Calculate distance in meters using Haversine formula
    const getDistance = useCallback((target: Coordinates): number | null => {
        if (!state.coords) return null;

        const R = 6371e3; // Earth radius in meters
        const φ1 = (state.coords.lat * Math.PI) / 180;
        const φ2 = (target.lat * Math.PI) / 180;
        const Δφ = ((target.lat - state.coords.lat) * Math.PI) / 180;
        const Δλ = ((target.lng - state.coords.lng) * Math.PI) / 180;

        const a =
            Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
            Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }, [state.coords]);

    return { ...state, getDistance };
}
