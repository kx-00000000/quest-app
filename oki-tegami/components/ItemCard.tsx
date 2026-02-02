import React from 'react';
import { Item } from '@/types';
import { MapPin } from 'lucide-react';

interface ItemCardProps {
    item: Item;
    isNearby?: boolean;
    isMystery?: boolean;
    onClick?: () => void;
}

export function ItemCard({ item, isNearby, isMystery, onClick }: ItemCardProps) {
    return (
        <div
            onClick={onClick}
            className={`flex cursor-pointer items-center gap-4 p-4 transition-all border-2 border-black shadow-retro-sm hover:translate-y-[2px] hover:shadow-none ${isNearby ? 'bg-white' : 'bg-white'}`}
        >
            <div className={`flex h-12 w-12 items-center justify-center border-2 border-black bg-[#8FD6E8] text-2xl transition-all duration-500 ${isMystery ? 'opacity-80 grayscale' : ''}`}>
                {isMystery ? '❓' : item.emoji}
            </div>

            <div className="flex-1">
                <h3 className={`font-bold font-heading text-ink tracking-wide ${isMystery ? 'font-mono text-xs tracking-widest opacity-50' : ''}`}>
                    {isMystery ? 'UNKNOWN OBJECT' : item.name}
                </h3>
                <div className="flex items-center text-xs text-ink/50 font-sans font-bold">
                    <MapPin size={12} className="mr-1" />
                    <span>{isNearby ? 'NEARBY' : 'FOUND'}</span>
                </div>
            </div>

            {isNearby && !isMystery && (
                <div className="shrink-0 border-2 border-black bg-[#FF9EAA] px-3 py-1 text-xs font-bold text-black shadow-[2px_2px_0_rgba(0,0,0,1)]">
                    FOUND!
                </div>
            )}
            {isMystery && (
                <div className="shrink-0 text-xs font-heading font-bold text-ink/30 animate-pulse">
                    ???
                </div>
            )}
        </div>
    );
}
