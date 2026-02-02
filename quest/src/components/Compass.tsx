"use client";

import { useEffect, useState } from "react";
import { Plane } from "lucide-react";

interface CompassProps {
    bearing: number; // Target bearing (degrees)
}

export default function Compass({ bearing }: CompassProps) {
    const [heading, setHeading] = useState(0);

    useEffect(() => {
        // DeviceOrientationEvent is the standard way, but iOS requires permission request.
        const handleOrientation = (event: DeviceOrientationEvent) => {
            // webkitCompassHeading is for iOS
            const compass = (event as any).webkitCompassHeading || Math.abs(event.alpha! - 360);
            setHeading(compass);
        };

        // Simple fallback or permission request would go here.
        // For prototype on desktop, we might simulate or just show relative to North(0).
        window.addEventListener("deviceorientation", handleOrientation);
        return () => window.removeEventListener("deviceorientation", handleOrientation);
    }, []);

    // Calculate rotation: We want the arrow to point to 'bearing'.
    // If phone is facing 'heading', then arrow should rotate 'bearing - heading'.
    const rotation = bearing - heading;

    return (
        <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Outer Ring/Radar BG */}
            <div className="absolute inset-0 rounded-full border-4 border-quest-green-200 opacity-50 border-dashed animate-spin-slow"></div>
            <div className="absolute inset-4 rounded-full bg-quest-green-900/10 backdrop-blur-sm"></div>

            {/* The Plane Icon (Arrow) */}
            <div
                className="text-quest-green-400 transition-transform duration-300 ease-out"
                style={{ transform: `rotate(${rotation}deg)` }}
            >
                <Plane size={80} fill="currentColor" className="drop-shadow-lg" />
            </div>

            {/* North Indicator */}
            <div className="absolute top-2 text-xs font-bold text-gray-400">N</div>
        </div>
    );
}
