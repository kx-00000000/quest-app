"use client";

import { useEffect, useState } from "react";
import { Navigation } from "lucide-react";

interface CompassProps {
    bearing: number;
}

export default function Compass({ bearing }: CompassProps) {
    const [heading, setHeading] = useState(0);

    useEffect(() => {
        // マウントされたら、センサーが反応するかチェック
        const handleOrientation = (event: any) => {
            const h = event.webkitCompassHeading || (event.alpha ? Math.abs(event.alpha - 360) : 0);
            setHeading(h);
        };

        window.addEventListener("deviceorientation", handleOrientation);
        return () => window.removeEventListener("deviceorientation", handleOrientation);
    }, []);

    const rotation = bearing - heading;

    return (
        <div className="relative w-64 h-64 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-pink-200/30 border-dashed animate-[spin_10s_linear_infinite]" />
            <div className="absolute inset-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30" />
            <div className="relative z-10 text-pink-500 transition-transform duration-500 ease-out" style={{ transform: `rotate(${rotation}deg)` }}>
                <Navigation size={80} fill="currentColor" className="drop-shadow-lg" />
            </div>
        </div>
    );
}