"use client";

import { Navigation } from "lucide-react";

interface CompassProps {
    rotation: number; // 親から計算済みの角度をもらう
}

export default function Compass({ rotation }: CompassProps) {
    return (
        <div className="relative w-64 h-64 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-pink-200/30 border-dashed animate-[spin_10s_linear_infinite]" />
            <div className="absolute inset-8 rounded-full bg-white/20 backdrop-blur-md border border-white/30" />
            <div
                className="relative z-10 text-pink-500 transition-transform duration-500 ease-out"
                style={{ transform: `rotate(${rotation}deg)` }}
            >
                <div className="drop-shadow-[0_0_15px_rgba(240,98,146,0.4)]">
                    <Navigation size={80} fill="currentColor" />
                </div>
            </div>
        </div>
    );
}