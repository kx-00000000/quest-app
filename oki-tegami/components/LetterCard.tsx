import React from 'react';
import { Letter, LetterColorCode } from '@/types';

interface LetterCardProps {
    letter: Letter;
    onClick?: () => void;
    colorClass: LetterColorCode;
    masked?: boolean;
    isMystery?: boolean;
}

export function LetterCard({ letter, onClick, colorClass, masked = false, isMystery = false }: LetterCardProps) {
    const displayContent = isMystery
        ? "Unknown Letter"
        : (masked ? "Dear Stranger..." : letter.content);

    return (
        <div
            onClick={onClick}
            className={`relative cursor-pointer overflow-hidden p-5 transition-transform hover:scale-[1.02] border-2 border-black
                ${isMystery ? 'bg-[#2D2D2D]' : colorClass} 
                ${isMystery ? 'text-white/50' : 'text-ink'} 
                shadow-retro-sm hover:shadow-retro`}
        >
            <p className={`font-hand text-xl leading-relaxed ${masked || isMystery ? 'line-clamp-3' : 'line-clamp-3'}`}>
                {(masked || isMystery) && !isMystery ? (
                    <span className="opacity-30 tracking-[0.2em] font-sans font-bold">
                        ▒▒▒▒▒▒▒▒▒▒▒▒<br />
                        ▒▒▒▒▒▒▒▒▒▒<br />
                        ▒▒▒▒▒▒▒▒
                    </span>
                ) : displayContent}
            </p>
            <div className={`mt-3 text-right text-[10px] opacity-60 font-mono tracking-widest font-bold ${isMystery ? 'text-white' : ''}`}>
                {isMystery ? '????-??-??' : new Date(letter.createdAt).toLocaleDateString()}
            </div>

            {/* Decorative Corner */}
            {!isMystery && <div className="absolute top-0 right-0 w-0 h-0 border-l-[20px] border-l-transparent border-t-[20px] border-t-black/10"></div>}
        </div>
    );
}
