import React, { useState, useEffect } from 'react';
import { Letter } from '@/types';
import { getApproximatedPlaceName, fetchPreciseLocation } from '@/utils/geo';

interface LetterDetailProps {
    letter: Letter;
    onClose: () => void;
    onCollect?: () => void; // If provided, shows KEEP/LEAVE
    onUpdateMessage?: (letterId: string, msg: string) => void;
    currentUserId?: string;
}

export function LetterDetail({ letter, onClose, onCollect, onUpdateMessage, currentUserId }: LetterDetailProps) {
    const isOwner = letter.isMine;
    const [msg, setMsg] = useState(letter.finderMessage || '');
    const [isEditing, setIsEditing] = useState(false);

    // STRICT DB DISPLAY: No re-calculation / fetch on view.
    // We rely 100% on what was saved at flight time.
    const displayArrival = letter.arrivalInfo || "Unknown Location";

    const handleSave = () => {
        if (onUpdateMessage) {
            onUpdateMessage(letter.id, msg);
            setIsEditing(false);
        }
    };

    const departurePlace = letter.originInfo || (letter.launchLocation ? getApproximatedPlaceName(letter.launchLocation) : "Unknown Origin");

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 p-4" onClick={onClose}>
            <div className="w-full max-w-lg bg-white border-minimal shadow-2xl h-[80vh] flex flex-col relative" onClick={e => e.stopPropagation()}>

                {/* Close */}
                <button onClick={onClose} className="absolute top-6 right-6 text-2xl leading-none text-gray-400 hover:text-black z-10">
                    &times;
                </button>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-12">
                    <div className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-8 border-b-minimal pb-2 flex justify-between">
                        <span>{departurePlace}</span>
                        <span>{new Date(letter.createdAt).toLocaleDateString()}</span>
                    </div>

                    <div className="font-serif text-xl leading-loose whitespace-pre-wrap text-black mb-12">
                        {letter.content}
                    </div>

                    <div className="text-right text-sm font-bold uppercase text-gray-500">
                        — {letter.senderName || 'Anonymous'}
                    </div>

                    {/* Finder Message */}
                    {(letter.finderMessage || (!isOwner && !letter.finderMessage && !onCollect)) && (
                        <div className="mt-12 pt-6 border-t-minimal">
                            {isEditing ? (
                                <div className="flex flex-col gap-4">
                                    <input
                                        className="w-full border-b-minimal p-2 font-serif text-gray-600 outline-none focus:border-black"
                                        placeholder="Add a memory note..."
                                        value={msg}
                                        onChange={e => setMsg(e.target.value)}
                                        autoFocus
                                    />
                                    <button onClick={handleSave} className="self-end px-6 py-2 bg-black text-white text-xs font-bold uppercase transition-opacity hover:opacity-80">
                                        Save Note
                                    </button>
                                </div>
                            ) : (
                                <div
                                    onClick={() => (!isOwner && !letter.finderMessage) && setIsEditing(true)}
                                    className="cursor-pointer text-gray-400 hover:text-gray-600 transition-colors text-sm font-serif italic"
                                >
                                    {letter.finderMessage || (onCollect ? "" : "Add a private note...")}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                {onCollect ? (
                    <div className="border-t-minimal flex">
                        <button
                            onClick={onClose}
                            className="flex-1 py-6 text-xs font-bold uppercase hover:bg-gray-50 transition-colors"
                        >
                            Leave
                        </button>
                        <button
                            onClick={() => { onCollect(); onClose(); }} // Immediate Close
                            className="flex-1 py-6 bg-black text-white text-xs font-bold uppercase hover:opacity-90 transition-opacity"
                        >
                            Keep
                        </button>
                    </div>
                ) : (
                    <div className="p-6 border-t-minimal text-center">
                        {isOwner && (
                            <div className="mb-6 text-left bg-gray-50 p-4 rounded border-minimal">
                                <div className="text-[10px] font-bold uppercase text-gray-400 mb-2">Final Landing Info</div>
                                <div className="text-lg font-bold mb-1">{displayArrival}</div>
                                <div className="text-xs font-mono text-gray-500">
                                    {letter.originalLocation.lat.toFixed(5)}, {letter.originalLocation.lng.toFixed(5)}
                                </div>
                            </div>
                        )}
                        <span className="text-[10px] font-bold uppercase text-gray-300 tracking-[0.2em]">Oki-Tegami</span>
                    </div>
                )}
            </div>
        </div>
    );
}
