import React, { useState } from 'react';

interface WaxSealProps {
    onClick?: () => void;
    isBroken?: boolean;
}

export function WaxSeal({ onClick, isBroken }: WaxSealProps) {
    return (
        <div
            onClick={onClick}
            className={`relative flex h-24 w-24 cursor-pointer items-center justify-center transition-transform hover:scale-105 active:scale-95 ${isBroken ? 'opacity-0 pointer-events-none duration-700 ease-out' : 'opacity-100'}`}
        >
            {/* Wax Seal SVG */}
            <svg width="100" height="100" viewBox="0 0 100 100" className="drop-shadow-md">
                {/* Irregular outer edge */}
                <path
                    d="M50 5 C 60 4, 70 8, 75 15 C 85 18, 92 25, 95 35 C 98 45, 95 55, 90 65 C 88 75, 80 85, 70 90 C 60 95, 50 96, 40 92 C 30 90, 20 85, 15 75 C 8 65, 5 55, 8 45 C 10 35, 15 25, 25 18 C 35 10, 45 6, 50 5 Z"
                    fill="#d32f2f"
                />
                <circle cx="50" cy="50" r="35" fill="#b71c1c" />
                <path d="M35 50 L65 50 M50 35 L50 65" stroke="#e57373" strokeWidth="2" opacity="0.5" />
                <text x="50" y="55" fontSize="10" fill="rgba(0,0,0,0.2)" textAnchor="middle" fontWeight="bold">SEALED</text>
            </svg>
        </div>
    );
}
