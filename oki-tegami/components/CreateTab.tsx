import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Location } from '@/types';
import { calculateDestination, fetchPreciseLocation, getSafeLandingPoint, calculateBearing, haversine } from '@/utils/geo';

interface CreateTabProps {
    onDrop: (content: string, color: string, angle: number, distance: number, senderName: string, recipientId?: string, arrivalInfo?: string) => void;
    userLocation: Location;
    userId: string;
}

type FlightMode = 'WALK' | 'REGIONAL' | 'INTERNATIONAL';
type RecipientMode = 'EVERYONE' | 'TO_ME' | 'SPECIFIC';

const MODES: { id: FlightMode, label: string, minKm: number, maxKm: number, step: number }[] = [
    { id: 'WALK', label: 'Walk', minKm: 0, maxKm: 15, step: 0.1 },
    { id: 'REGIONAL', label: 'Regional', minKm: 15, maxKm: 3000, step: 10 },
    { id: 'INTERNATIONAL', label: 'International', minKm: 3000, maxKm: 40000, step: 100 }
];

// Memoize MapPreview
const MapPreview = dynamic(() => import('./MapPreview'), { ssr: false, loading: () => <div className="w-full h-full bg-gray-50" /> });
const MemoizedMapPreview = React.memo(MapPreview);

export function CreateTab({ onDrop, userLocation, userId }: CreateTabProps) {
    const [step, setStep] = useState<'WRITE' | 'FLIGHT' | 'ANIM_FLYING' | 'SUCCESS'>('WRITE');
    const [windMessage, setWindMessage] = useState<string | null>(null);

    // Message State
    const [content, setContent] = useState('');
    const [senderName, setSenderName] = useState('My Name');
    const [recipientMode, setRecipientMode] = useState<RecipientMode>('EVERYONE');
    const [specificRecipientId, setSpecificRecipientId] = useState('');

    // Flight State
    const [mode, setMode] = useState<FlightMode>('WALK');

    // Sliders (Visual representation / Fallback)
    const [angle, setAngle] = useState(0);
    const [distance, setDistance] = useState(1);

    // EXACT PIN POSITION (Overrides calculation if set)
    const [customLandingPos, setCustomLandingPos] = useState<Location | null>(null);

    const activeMode = MODES.find(m => m.id === mode) || MODES[0];

    // Effective Destination: Use Custom Pin if set, else Calculator
    const landingPos = useMemo(() => {
        if (customLandingPos) return customLandingPos;
        if (!userLocation) return { lat: 0, lng: 0 };
        return calculateDestination(userLocation, angle, distance);
    }, [userLocation, angle, distance, customLandingPos]);

    // Destination Name - Clean Logic with Debounce
    const [destinationName, setDestinationName] = useState("Locating...");
    const [isDebouncing, setIsDebouncing] = useState(false);

    useEffect(() => {
        if (!landingPos || landingPos.lat === 0) return;

        // Start Debounce
        setIsDebouncing(true);
        setDestinationName("Locating..."); // or keep previous name with spinner?

        const handler = setTimeout(async () => {
            try {
                // Fetch Name
                const name = await fetchPreciseLocation(landingPos);
                if (name) setDestinationName(name);
            } catch (error) {
                console.warn("Geocoding failed", error);
                setDestinationName("Unknown Location");
            } finally {
                setIsDebouncing(false);
            }
        }, 800); // 0.8s Delay

        return () => {
            clearTimeout(handler);
            setIsDebouncing(true); // Keep debouncing if component unmounts/re-runs fast
        };
    }, [landingPos]); // Re-run when pos changes

    // Slider Change Handlers (Reset Custom Pin)
    const handleSliderChange = (type: 'angle' | 'dist', val: number) => {
        setCustomLandingPos(null); // Revert to calculation mode
        if (type === 'angle') setAngle(val);
        else setDistance(val);
    };

    // Bounds check only when mode changes (to reset extreme values)
    useEffect(() => {
        if (distance < activeMode.minKm) handleSliderChange('dist', activeMode.minKm);
        if (distance > activeMode.maxKm) handleSliderChange('dist', activeMode.maxKm);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, activeMode]);

    // MAP CLICK HANDLER (Exact Precision)
    const onMapClick = useCallback((loc: Location) => {
        if (!userLocation) return;

        // 1. Set EXACT coordinates
        setCustomLandingPos(loc);

        // 2. Update sliders to match visually (Approximation)
        const newDist = haversine(userLocation, loc);
        const newAngle = calculateBearing(userLocation, loc);

        // Auto-switch mode
        if (newDist <= 15) setMode('WALK');
        else if (newDist <= 3000) setMode('REGIONAL');
        else setMode('INTERNATIONAL');

        setDistance(newDist);
        setAngle(Math.round(newAngle));
    }, [userLocation]);

    const handleNext = () => {
        if (!content.trim()) return;
        setStep('FLIGHT');
    };

    const handleThrow = () => {
        setStep('ANIM_FLYING');
        setWindMessage(null);

        // 1. Calculate Target (User Input)
        const targetPos = landingPos;

        // 2. Wind Logic (Redirect Check)
        const safeResult = getSafeLandingPoint(targetPos);
        const finalPos = safeResult.location;

        // 3. Prepare Final Recipient
        let finalRecipientId: string | undefined = undefined;
        if (recipientMode === 'TO_ME' && userId) {
            finalRecipientId = userId;
        } else if (recipientMode === 'SPECIFIC' && specificRecipientId.trim()) {
            finalRecipientId = specificRecipientId.trim();
        }

        // 4. Execution Sequence
        // We use a small timeout to allow the 'Flying' animation to start
        setTimeout(async () => {
            // 4a. Resolve Final Name (CRITICAL FIX)
            // We must re-fetch the location name for the FINAL coordinates (safeResult)
            // to ensure the DB stores the actual landing place, not the original input.
            let finalArrivalName = destinationName; // Default fallback

            // If redirected OR just to be safe/accurate, we fetch precise name for finalPos
            try {
                const preciseName = await fetchPreciseLocation(finalPos);
                if (preciseName && preciseName !== "Somewhere in the Ocean") {
                    finalArrivalName = preciseName;
                } else if (safeResult.wasRedirected) {
                    // Fallback for redirected spots if geocoding fails (unlikely with Park)
                    finalArrivalName = "Safe Haven";
                }
            } catch (e) {
                console.warn("Final name fetch failed", e);
            }

            // 4b. Show Success Screen
            setStep('SUCCESS');
            if (safeResult.wasRedirected) {
                setWindMessage(safeResult.message || "A friendly wind carried your letter to safety...");
            }

            // 4c. Recalculate Logic for Storage
            const finalDist = haversine(userLocation, finalPos);
            const finalAngle = calculateBearing(userLocation, finalPos);

            // 4d. Drop (Save to DB) with CORRECTED Name
            setTimeout(() => {
                onDrop(content, 'kit-minimal', finalAngle, finalDist, senderName, finalRecipientId, finalArrivalName);
            }, 3500); // Wait for success screen to be read a bit? Or standard delay.
        }, 1000);
    };

    // --- RENDERERS ---

    if (step === 'ANIM_FLYING') {
        return (
            <div className="h-full flex flex-col items-center justify-center bg-white text-black animate-in fade-in duration-500">
                <div className="text-xl font-bold tracking-[0.2em] uppercase animate-pulse font-sans">Flying...</div>
            </div>
        );
    }

    if (step === 'SUCCESS') {
        // Final destination info
        const DisplayResult = () => {
            const final = getSafeLandingPoint(landingPos);
            const [finalName, setFinalName] = useState(destinationName); // default to input

            useEffect(() => {
                fetchPreciseLocation(final.location).then(n => setFinalName(n || "Location"));
            }, []);

            return (
                <div className="h-full flex flex-col items-center justify-center bg-white text-black p-8 text-center animate-in fade-in zoom-in-95 duration-1000">
                    <div className="text-xs font-bold text-gray-400 mb-6 uppercase tracking-[0.2em] font-sans">
                        {windMessage ? "Redirected Landing" : "Flight Complete"}
                    </div>

                    <div className="text-4xl font-bold mb-4 font-sans tracking-tight">{finalName}</div>

                    {/* Flight Record Style Coords */}
                    <div className="flex flex-col items-center justify-center border-t-minimal border-b-minimal py-2 my-6 px-4 bg-gray-50">
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Flight Record</div>
                        <div className="text-xs font-mono text-gray-600 tracking-wider">
                            LAT: {final.location.lat.toFixed(5)} &nbsp;|&nbsp; LNG: {final.location.lng.toFixed(5)}
                        </div>
                    </div>

                    {windMessage && (
                        <div className="text-sm font-sans italic text-gray-500 mb-8 max-w-xs mx-auto animate-in slide-in-from-bottom-2 fade-in duration-1000 delay-500">
                            &quot;{windMessage}&quot;
                        </div>
                    )}

                    <div className="text-[10px] font-bold uppercase tracking-[0.3em] font-sans text-gray-300 mt-4">Oki-Tegami</div>
                </div>
            );
        };

        return <DisplayResult />;
    }

    if (step === 'FLIGHT') {
        return (
            <div className="h-[100dvh] w-full flex flex-col bg-white text-black overflow-hidden relative animate-in fade-in duration-500">

                {/* 1. Destination Header - Fixed at Top */}
                <div className="flex-none p-4 border-b-minimal text-center bg-white z-20 flex flex-col items-center justify-center min-h-[80px] shadow-sm">
                    <div className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mb-1 font-sans">Landing at</div>
                    <div className={`text-lg font-bold truncate max-w-full px-4 font-sans transition-opacity duration-300 ${isDebouncing ? 'opacity-50' : 'opacity-100'}`}>
                        {destinationName}
                    </div>
                </div>

                {/* 2. Scrollable Content Container */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50 flex flex-col pb-10">

                    {/* Map Area - Fixed Height within Scroll */}
                    <div className="h-[40vh] w-full relative shrink-0 border-b-minimal">
                        {userLocation && (
                            <MemoizedMapPreview
                                center={userLocation}
                                dest={landingPos}
                                zoom={mode === 'INTERNATIONAL' ? 2 : mode === 'REGIONAL' ? 5 : 13}
                                onMapClick={onMapClick}
                            />
                        )}
                    </div>

                    {/* Controls - Below Map */}
                    <div className="flex-1 bg-white p-6 space-y-8 pb-16">

                        {/* Mode Tabs */}
                        <div className="flex border-minimal rounded overflow-hidden mb-2">
                            {MODES.map(m => (
                                <button
                                    key={m.id}
                                    onClick={() => setMode(m.id)}
                                    className={`flex-1 py-3 text-[10px] font-bold uppercase transition-colors font-sans tracking-widest
                                        ${mode === m.id ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'}`}
                                >
                                    {m.label}
                                </button>
                            ))}
                        </div>

                        {/* Sliders Container */}
                        <div className="space-y-6">
                            {/* Direction Slider */}
                            <div>
                                <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-wider font-sans">
                                    <span>Direction</span>
                                    <span>{angle}°</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button onClick={() => handleSliderChange('angle', (angle - 1 + 360) % 360)} className="w-10 h-10 rounded border-minimal flex items-center justify-center bg-white hover:bg-gray-50 text-lg font-sans transition-colors">-</button>
                                    <input
                                        type="range"
                                        min="0"
                                        max="360"
                                        value={angle}
                                        onChange={e => handleSliderChange('angle', Number(e.target.value))}
                                        className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                                    />
                                    <button onClick={() => handleSliderChange('angle', (angle + 1) % 360)} className="w-10 h-10 rounded border-minimal flex items-center justify-center bg-white hover:bg-gray-50 text-lg font-sans transition-colors">+</button>
                                </div>
                            </div>

                            {/* Distance Slider */}
                            <div>
                                <div className="flex justify-between text-[10px] font-bold text-gray-400 mb-3 uppercase tracking-wider font-sans">
                                    <span>Distance</span>
                                    <span>{distance < 1 ? `${(distance * 1000).toFixed(0)}m` : `${distance.toFixed(1)}km`}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <button
                                        onClick={() => handleSliderChange('dist', Math.max(0, distance - activeMode.step))}
                                        className="w-10 h-10 rounded border-minimal flex items-center justify-center bg-white hover:bg-gray-50 text-lg font-sans transition-colors">
                                        -
                                    </button>
                                    <input
                                        type="range"
                                        min={activeMode.minKm}
                                        max={activeMode.maxKm}
                                        step={activeMode.step / 10}
                                        value={distance}
                                        onChange={e => handleSliderChange('dist', Number(e.target.value))}
                                        className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-black"
                                    />
                                    <button
                                        onClick={() => handleSliderChange('dist', Math.min(activeMode.maxKm, distance + activeMode.step))}
                                        className="w-10 h-10 rounded border-minimal flex items-center justify-center bg-white hover:bg-gray-50 text-lg font-sans transition-colors">
                                        +
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-4 pt-4">
                            <button onClick={() => setStep('WRITE')} className="flex-1 py-4 border-minimal text-xs font-bold uppercase hover:bg-gray-50 font-sans tracking-widest transition-colors">Back</button>
                            <button
                                onClick={handleThrow}
                                disabled={isDebouncing} // Prevent throw while locating
                                className={`flex-[2] py-4 bg-black text-white text-xs font-bold uppercase font-sans tracking-widest transition-all ${isDebouncing ? 'opacity-50 cursor-wait' : 'hover:opacity-80'}`}
                            >
                                {isDebouncing ? 'Locating...' : 'Throw Letter'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // WRITE STEP
    return (
        <div className="h-full flex flex-col p-6 bg-white text-black font-sans">
            <h2 className="text-xs font-bold uppercase tracking-widest mb-6 text-gray-400">Compose Letter</h2>

            <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                placeholder="Write something..."
                className="flex-1 w-full resize-none outline-none text-xl leading-relaxed placeholder:text-gray-200 font-serif mb-6"
                maxLength={500}
            />

            <div className="mb-8 border-b-minimal pb-2">
                <input
                    value={senderName}
                    onChange={e => setSenderName(e.target.value)}
                    className="w-full font-serif text-lg outline-none bg-transparent"
                    placeholder="Your Name"
                    maxLength={20}
                />
            </div>

            {/* Recipient Tabs */}
            <div className="mb-6">
                <div className="text-[10px] font-bold uppercase text-gray-400 mb-2">Recipient</div>
                <div className="flex border-minimal rounded overflow-hidden mb-3">
                    {(['EVERYONE', 'TO_ME', 'SPECIFIC'] as RecipientMode[]).map(r => (
                        <button
                            key={r}
                            onClick={() => setRecipientMode(r)}
                            className={`flex-1 py-2 text-[10px] font-bold uppercase transition-colors
                                ${recipientMode === r ? 'bg-black text-white' : 'bg-white text-black hover:bg-gray-50'}`}
                        >
                            {r.replace('_', ' ')}
                        </button>
                    ))}
                </div>

                {recipientMode === 'SPECIFIC' && (
                    <input
                        value={specificRecipientId}
                        onChange={e => setSpecificRecipientId(e.target.value)}
                        className="w-full p-3 font-mono text-sm border-minimal rounded outline-none focus:border-black transition-colors"
                        placeholder="Recipient ID (UUID)"
                    />
                )}
                {recipientMode === 'TO_ME' && (
                    <div className="text-xs text-gray-400 italic">
                        Sending specific letter to yourself ({userId ? 'ID Found' : 'ID Loading...'}).
                    </div>
                )}
            </div>

            <button
                onClick={handleNext}
                disabled={!content.trim() || (recipientMode === 'SPECIFIC' && !specificRecipientId.trim())}
                className="w-full py-4 bg-black text-white font-bold uppercase tracking-widest hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed transition-opacity"
            >
                Next Step
            </button>
        </div>
    );
}
