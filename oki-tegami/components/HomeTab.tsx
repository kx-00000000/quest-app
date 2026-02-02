import React, { useMemo, useEffect, useState } from 'react';
import { Item, Letter, Location } from '@/types';
import { calculateBearing, haversine } from '@/utils/geo';

interface HomeTabProps {
    userLocation: Location;
    nearbyItems: Item[];
    nearbyLetters: Letter[];
    onInteractItem: (item: Item) => void;
    onInteractLetter: (letter: Letter) => void;
    getDistance: (loc: Location) => number | null;
}

export function HomeTab({ userLocation, nearbyItems, nearbyLetters, onInteractItem, onInteractLetter }: HomeTabProps) {

    // Internal state for "Organic" updates
    const [windAngle, setWindAngle] = useState(0);

    // Find nearest object
    type NearestObj = { id: string, type: 'item' | 'letter', dist: number, angle: number, original: any };
    const nearestObject = useMemo<NearestObj | null>(() => {
        let nearest: NearestObj | null = null;
        let minDesc = Infinity;

        const checkit = (obj: any, type: 'item' | 'letter', loc: Location) => {
            const distKm = haversine(userLocation, loc);
            const distM = distKm * 1000;

            if (distM < minDesc) {
                minDesc = distM;
                nearest = {
                    id: obj.id,
                    type,
                    dist: distM,
                    angle: calculateBearing(userLocation, loc),
                    original: obj
                };
            }
        };

        nearbyItems.forEach(i => i.currentLocation && checkit(i, 'item', i.currentLocation));
        nearbyLetters.forEach(l => checkit(l, 'letter', l.originalLocation));

        return nearest;
    }, [nearbyItems, nearbyLetters, userLocation]);

    // Smooth wind angle update
    useEffect(() => {
        if (nearestObject) {
            setWindAngle(nearestObject.angle);
        }
    }, [nearestObject]);

    return (
        <div className="flex flex-col items-center justify-center h-full min-h-[60vh] p-8 text-center relative overflow-hidden bg-white text-black">

            {nearestObject ? (
                <>
                    {/* DOG NAVIGATION */}
                    <div
                        className={`relative w-64 h-64 flex items-center justify-center transition-transform duration-[1000ms] ease-out`}
                        style={{ transform: `rotate(${windAngle}deg)` }}
                    >
                        {/* Dog Image - Updated to use png */}
                        <img
                            src="/dog.png"
                            alt="Navigation Dog"
                            className="w-48 h-48 object-contain"
                        />
                    </div>

                    {/* Distance & Info */}
                    <div className="mt-8 space-y-2 z-10 bg-white border-minimal p-4 shadow-minimal max-w-[200px]">
                        <div className="text-4xl font-heading leading-none">
                            {Math.round(nearestObject.dist)}
                            <span className="text-sm ml-1 font-sans">m</span>
                        </div>
                        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500">
                            {nearestObject.type === 'item' ? 'Buried Memory' : 'Drifting Letter'}
                        </div>
                    </div>

                    {/* INTERACTION BUTTON (If close) */}
                    {nearestObject.dist <= 50 && (
                        <button
                            onClick={() => nearestObject.type === 'item' ? onInteractItem(nearestObject.original) : onInteractLetter(nearestObject.original)}
                            className="mt-12 group relative"
                        >
                            <div className="relative w-24 h-24 bg-black text-white rounded-full flex flex-col items-center justify-center hover:scale-105 transition-transform shadow-lg">
                                <span className="text-3xl">
                                    {nearestObject.type === 'item' ? '📦' : '✉️'}
                                </span>
                                <div className="mt-1 text-[10px] font-bold uppercase">
                                    Catch
                                </div>
                            </div>
                        </button>
                    )}
                </>
            ) : (
                <div className="text-gray-400 font-serif italic text-sm">
                    The wind is silent...
                </div>
            )}
        </div>
    );
}
