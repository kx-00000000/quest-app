import React from 'react';
import { Item } from '@/types';
import { getApproximatedPlaceName } from '@/utils/geo';

interface ItemDetailProps {
    item: Item;
    onClose: () => void;
    onCollect?: () => Promise<boolean>;
    onDiscard?: () => void;
}

export function ItemDetail({ item, onClose, onCollect, onDiscard }: ItemDetailProps) {
    const [status, setStatus] = React.useState<'IDLE' | 'COLLECTING' | 'SUCCESS' | 'FULL'>('IDLE');

    const handleCollect = async () => {
        if (!onCollect) return;
        setStatus('COLLECTING');
        const success = await onCollect();
        if (success) {
            setStatus('SUCCESS');
            setTimeout(onClose, 500); // Quick close
        } else {
            setStatus('FULL');
            setTimeout(() => setStatus('IDLE'), 2000);
        }
    };

    const dropEvent = item.history.find(h => h.type === 'DROP');
    const departurePlace = dropEvent ? getApproximatedPlaceName(dropEvent.location) : "Unknown Origin";

    // Minimalist Design
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/90 p-4" onClick={onClose}>
            <div className="w-full max-w-sm bg-white border-minimal shadow-xl p-8 flex flex-col items-center relative" onClick={e => e.stopPropagation()}>

                {/* Close X */}
                <button onClick={onClose} className="absolute top-4 right-4 text-2xl leading-none text-gray-400 hover:text-black">
                    &times;
                </button>

                {/* Content */}
                <div className="text-6xl mb-6">{item.emoji}</div>
                <h2 className="text-2xl font-bold uppercase tracking-widest mb-2">{item.name}</h2>
                <div className="text-xs font-mono text-gray-400 mb-8">{departurePlace}</div>

                {item.description && (
                    <p className="text-sm text-gray-600 text-center font-serif leading-relaxed mb-8">
                        {item.description}
                    </p>
                )}

                {/* Actions */}
                <div className="flex gap-4 w-full">
                    {onCollect ? (
                        <>
                            <button
                                onClick={onClose}
                                className="flex-1 py-3 text-xs font-bold uppercase border-minimal hover:bg-gray-50"
                            >
                                Leave
                            </button>
                            <button
                                onClick={handleCollect}
                                disabled={status !== 'IDLE'}
                                className="flex-1 py-3 bg-black text-white text-xs font-bold uppercase hover:opacity-80 disabled:opacity-50"
                            >
                                {status === 'COLLECTING' ? '...' : 'Keep'}
                            </button>
                        </>
                    ) : (
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 bg-black text-white text-xs font-bold uppercase hover:opacity-80"
                        >
                            Close
                        </button>
                    )}
                </div>

                {onDiscard && (
                    <button
                        onClick={() => {
                            if (confirm("Release this item?")) {
                                onDiscard();
                                onClose();
                            }
                        }}
                        className="mt-4 text-[10px] uppercase font-bold text-gray-300 hover:text-red-500"
                    >
                        Release
                    </button>
                )}
            </div>
        </div>
    );
}
