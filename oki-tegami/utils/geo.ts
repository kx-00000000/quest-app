import { Location } from '@/types';

export const EARTH_RADIUS_KM = 6371;

// Calculate distance between two points in km (Haversine formula)
export function haversine(start: Location, end: Location): number {
    const dLat = (end.lat - start.lat) * Math.PI / 180;
    const dLng = (end.lng - start.lng) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(start.lat * Math.PI / 180) * Math.cos(end.lat * Math.PI / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return EARTH_RADIUS_KM * c;
}

// Calculate destination point given distance and bearing
export function calculateDestination(start: Location, angleDeg: number, distanceKm: number): Location {
    const R = EARTH_RADIUS_KM;
    const d = distanceKm;
    const brng = angleDeg * Math.PI / 180;
    const lat1 = start.lat * Math.PI / 180;
    const lon1 = start.lng * Math.PI / 180;

    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d / R) + Math.cos(lat1) * Math.sin(d / R) * Math.cos(brng));
    const lon2 = lon1 + Math.atan2(Math.sin(brng) * Math.sin(d / R) * Math.cos(lat1), Math.cos(d / R) - Math.sin(lat1) * Math.sin(lat2));

    return {
        lat: lat2 * 180 / Math.PI,
        lng: lon2 * 180 / Math.PI
    };
}

// Calculate initial bearing between two points
export function calculateBearing(start: Location, end: Location): number {
    const startLat = start.lat * Math.PI / 180;
    const startLng = start.lng * Math.PI / 180;
    const endLat = end.lat * Math.PI / 180;
    const endLng = end.lng * Math.PI / 180;

    const dLng = endLng - startLng;
    const y = Math.sin(dLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);
    const brng = Math.atan2(y, x) * 180 / Math.PI;
    return (brng + 360) % 360;
}

// Mock Database of Places - Expanded for Round 11
const PLACES = [
    // --- MICRO: TOKYO ---
    { name: "Odori Park", country: "JP", lat: 43.0600, lng: 141.3500 }, // Sapporo
    { name: "Sapporo TV Tower", country: "JP", lat: 43.0611, lng: 141.3564 },
    { name: "Susukino", country: "JP", lat: 43.0555, lng: 141.3535 },

    { name: "Imperial Palace", country: "JP", lat: 35.6852, lng: 139.7528 }, // Tokyo
    { name: "Tokyo Tower", country: "JP", lat: 35.6586, lng: 139.7454 },
    { name: "Shinjuku Gyoen", country: "JP", lat: 35.6852, lng: 139.7101 },
    { name: "Yoyogi Park", country: "JP", lat: 35.6717, lng: 139.6949 },
    { name: "Shibuya Crossing", country: "JP", lat: 35.6595, lng: 139.7004 },
    { name: "Tokyo Skytree", country: "JP", lat: 35.7100, lng: 139.8107 },
    { name: "Senso-ji", country: "JP", lat: 35.7148, lng: 139.7967 },
    { name: "Ueno Park", country: "JP", lat: 35.7140, lng: 139.7741 },
    { name: "Odaiba", country: "JP", lat: 35.6248, lng: 139.7764 },
    { name: "Chuo-ku", country: "JP", lat: 35.6663, lng: 139.7711 },
    { name: "Ginza", country: "JP", lat: 35.6719, lng: 139.7639 },
    { name: "Roppongi", country: "JP", lat: 35.6641, lng: 139.7345 },

    // --- MICRO: OSAKA ---
    { name: "Osaka Castle", country: "JP", lat: 34.6873, lng: 135.5262 },
    { name: "Dotonbori", country: "JP", lat: 34.6687, lng: 135.5013 },
    { name: "Umeda Sky Bldg", country: "JP", lat: 34.7059, lng: 135.4904 },
    { name: "Universal Studios", country: "JP", lat: 34.6654, lng: 135.4326 },

    // --- CITIES: JAPAN & NEARBY ---
    { name: "Tokyo", country: "JP", lat: 35.6762, lng: 139.6503 },
    { name: "Yokohama", country: "JP", lat: 35.4437, lng: 139.6380 },
    { name: "Osaka", country: "JP", lat: 34.6937, lng: 135.5023 },
    { name: "Nagoya", country: "JP", lat: 35.1815, lng: 136.9066 },
    { name: "Sapporo", country: "JP", lat: 43.0618, lng: 141.3545 },
    { name: "Fukuoka", country: "JP", lat: 33.5902, lng: 130.4017 },
    { name: "Kobe", country: "JP", lat: 34.6901, lng: 135.1955 },
    { name: "Kyoto", country: "JP", lat: 35.0116, lng: 135.7681 },
    { name: "Hiroshima", country: "JP", lat: 34.3853, lng: 132.4553 },
    { name: "Naha", country: "JP", lat: 26.2124, lng: 127.6809 },
    { name: "Sendai", country: "JP", lat: 38.2682, lng: 140.8694 },
    { name: "Kanazawa", country: "JP", lat: 36.5613, lng: 136.6562 },

    // --- ASIA ---
    { name: "Seoul", country: "KR", lat: 37.5665, lng: 126.9780 },
    { name: "Busan", country: "KR", lat: 35.1796, lng: 129.0756 },
    { name: "Beijing", country: "CN", lat: 39.9042, lng: 116.4074 },
    { name: "Shanghai", country: "CN", lat: 31.2304, lng: 121.4737 },
    { name: "Hong Kong", country: "HK", lat: 22.3193, lng: 114.1694 },
    { name: "Taipei", country: "TW", lat: 25.0330, lng: 121.5654 },
    { name: "Manila", country: "PH", lat: 14.5995, lng: 120.9842 },
    { name: "Bangkok", country: "TH", lat: 13.7563, lng: 100.5018 },
    { name: "Singapore", country: "SG", lat: 1.3521, lng: 103.8198 },
    { name: "Ho Chi Minh", country: "VN", lat: 10.8231, lng: 106.6297 },
    { name: "Jakarta", country: "ID", lat: -6.2088, lng: 106.8456 },
    { name: "Delhi", country: "IN", lat: 28.6139, lng: 77.2090 },

    // --- WORLD ---
    { name: "London", country: "UK", lat: 51.5074, lng: -0.1278 },
    { name: "Paris", country: "FR", lat: 48.8566, lng: 2.3522 },
    { name: "Berlin", country: "DE", lat: 52.5200, lng: 13.4050 },
    { name: "Rome", country: "IT", lat: 41.9028, lng: 12.4964 },
    { name: "Madrid", country: "ES", lat: 40.4168, lng: -3.7038 },
    { name: "Moscow", country: "RU", lat: 55.7558, lng: 37.6173 },
    { name: "Cairo", country: "EG", lat: 30.0444, lng: 31.2357 },
    { name: "Dubai", country: "AE", lat: 25.2048, lng: 55.2708 },
    { name: "New York", country: "USA", lat: 40.7128, lng: -74.0060 },
    { name: "Los Angeles", country: "USA", lat: 34.0522, lng: -118.2437 },
    { name: "San Francisco", country: "USA", lat: 37.7749, lng: -122.4194 },
    { name: "Seattle", country: "USA", lat: 47.6062, lng: -122.3321 },
    { name: "Chicago", country: "USA", lat: 41.8781, lng: -87.6298 },
    { name: "Honolulu", country: "USA", lat: 21.3069, lng: -157.8583 },
    { name: "Toronto", country: "CA", lat: 43.6532, lng: -79.3832 },
    { name: "Vancouver", country: "CA", lat: 49.2827, lng: -123.1207 },
    { name: "Mexico City", country: "MX", lat: 19.4326, lng: -99.1332 },
    { name: "Rio de Janeiro", country: "BR", lat: -22.9068, lng: -43.1729 },
    { name: "Sao Paulo", country: "BR", lat: -23.5505, lng: -46.6333 },
    { name: "Buenos Aires", country: "AR", lat: -34.6037, lng: -58.3816 },
    { name: "Sydney", country: "AU", lat: -33.8688, lng: 151.2093 },
    { name: "Melbourne", country: "AU", lat: -37.8136, lng: 144.9631 },
    { name: "Auckland", country: "NZ", lat: -36.8485, lng: 174.7633 },
    { name: "Cape Town", country: "ZA", lat: -33.9249, lng: 18.4241 },
];

export function getApproximatedPlaceName(loc: Location): string {
    let minD = Infinity;
    let nearestCity = null;

    for (const city of PLACES) {
        const d = haversine(loc, city);
        if (d < minD) {
            minD = d;
            nearestCity = city;
        }
    }

    if (!nearestCity) return "Unknown Lands";
    return `${nearestCity.name}, ${nearestCity.country}`;
}

export function getRelativeLocationInfo(loc: Location, thresholdKm: number = 200) {
    let minD = Infinity;
    let nearestCity = null;

    for (const city of PLACES) {
        const d = haversine(loc, city);
        if (d < minD) {
            minD = d;
            nearestCity = city;
        }
    }

    if (!nearestCity) return { name: "Unknown", isOcean: true, label: "Over the Ocean", detail: "" };

    const isOcean = minD > thresholdKm;

    if (isOcean) {
        return {
            name: nearestCity.name,
            isOcean: true,
            label: "Over the Ocean",
            detail: `${Math.round(minD)}km from ${nearestCity.name}`
        };
    }

    const bearing = calculateBearing(nearestCity, loc);
    const dirs = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const dirIdx = Math.round(bearing / 45) % 8;
    const dirStr = dirs[dirIdx];

    if (minD < 5) {
        return {
            name: nearestCity.name,
            isOcean: false,
            label: `Near ${nearestCity.name}`,
            detail: `${nearestCity.country}`
        };
    }

    return {
        name: nearestCity.name,
        isOcean: false,
        label: `${Math.round(minD)}km ${dirStr} of ${nearestCity.name}`,
        detail: `${nearestCity.country}`
    };
}

// --- NO FLY ZONES & WIND LOGIC ---
const NO_FLY_ZONES = [
    {
        name: "Imperial Palace",
        minLat: 35.680,
        maxLat: 35.690,
        minLng: 139.745,
        maxLng: 139.760,
        safeSpot: { lat: 35.676, lng: 139.760 } // Hibiya Park Area
    }
];

export function isNoFlyZone(loc: Location): string | null {
    for (const zone of NO_FLY_ZONES) {
        if (loc.lat >= zone.minLat && loc.lat <= zone.maxLat &&
            loc.lng >= zone.minLng && loc.lng <= zone.maxLng) {
            return zone.name;
        }
    }
    return null;
}

export function getSafeLandingPoint(loc: Location): { location: Location; wasRedirected: boolean; message?: string } {
    const zoneName = isNoFlyZone(loc);
    if (!zoneName) {
        return { location: loc, wasRedirected: false };
    }

    // WIND LOGIC: Redirect
    const randomLat = (Math.random() - 0.5) * 0.01;
    const randomLng = (Math.random() - 0.5) * 0.01;

    const zone = NO_FLY_ZONES.find(z => z.name === zoneName);
    const base = zone?.safeSpot || { lat: loc.lat + 0.02, lng: loc.lng + 0.02 };

    return {
        location: {
            lat: base.lat + randomLat,
            lng: base.lng + randomLng
        },
        wasRedirected: true,
        message: "A friendly wind carried your letter to safety..."
    };
}

// ---------------------
// 3. Geocoding (Nominatim)
// ---------------------
export async function fetchPreciseLocation(loc: Location): Promise<string | null> {
    try {
        const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${loc.lat}&lon=${loc.lng}&zoom=10&addressdetails=1`;

        const res = await fetch(url, { headers: { 'User-Agent': 'OkiTegami/1.0' } });
        if (!res.ok) return "Somewhere in the Ocean";

        const data = await res.json();

        // Ocean / Unknown check (Strict)
        if (data.error || !data.address) {
            return "Somewhere in the Ocean";
        }

        const addr = data.address;
        const countryCode = addr.country_code?.toLowerCase();

        // Japanese Context Strategy: State + City (Strict)
        if (countryCode === 'jp') {
            const state = addr.province || addr.state || ""; // Tokyo
            const city = addr.city || addr.ward || addr.town || addr.village || "";
            const district = addr.city_district || addr.suburb || addr.neighbourhood || "";

            // "Tokyo" + "Chiyoda" -> "東京都 千代田区" (Nominatim usually sends localized)
            // If city is empty, try district (e.g. for some wards acting as cities)
            const locality = city || district;

            if (state && locality) {
                return `${state} ${locality}`;
            }
            if (locality) return locality;
            if (state) return state;
            return "Japan";
        }

        // Global Robust Fallback Chain (Priority Based)
        // 1. City Level
        const city = addr.city || addr.town || addr.village || addr.hamlet || addr.municipality;

        // 2. Suburb Level
        const suburb = addr.suburb || addr.neighbourhood || addr.quarter || addr.borough || addr.city_district;

        // 3. District / County Level
        const district = addr.county || addr.district || addr.state_district;

        // 4. State Level
        const state = addr.state || addr.province || addr.region;

        // 5. Country
        const country = addr.country;

        // Construction Strategy: "City, State, Country"
        if (city) {
            let parts = [city];
            if (state) parts.push(state);
            if (country) parts.push(country);
            return parts.join(', ');
        }

        if (suburb) {
            let parts = [suburb];
            if (city) parts.push(city);
            else if (state) parts.push(state);
            if (country) parts.push(country);
            return parts.join(', ');
        }

        if (district) {
            let parts = [district];
            if (state) parts.push(state);
            if (country) parts.push(country);
            return parts.join(', ');
        }

        if (state) {
            return country ? `${state}, ${country}` : state;
        }

        if (country) {
            return country;
        }

        // Only if absolutely NOTHING is found (no country even), return Ocean
        return "Somewhere in the Ocean";

    } catch (e) {
        console.warn("Geocoding failed:", e);
        return "Somewhere in the Ocean";
    }
}
