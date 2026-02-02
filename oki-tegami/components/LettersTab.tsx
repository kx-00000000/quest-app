import React, { useState } from 'react';
import { Letter } from '@/types';

interface LettersTabProps {
    letters: Letter[]; // All letters (My sent + My found)
    onSelect: (letter: Letter) => void;
}

export function LettersTab({ letters, onSelect }: LettersTabProps) {
    const [filter, setFilter] = useState<'found' | 'sent'>('found');

    const filteredLetters = letters.filter(l => {
        if (filter === 'sent') return l.isMine;
        return l.status === 'COLLECTED';
    });

    return (
        <div className="h-full flex flex-col bg-white relative text-black">

            {/* Header / Filter - Minimalist Text Buttons */}
            <div className="flex border-b-minimal bg-white sticky top-0 z-10">
                <button
                    onClick={() => setFilter('found')}
                    className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors
                        ${filter === 'found' ? 'text-black bg-gray-50' : 'text-gray-400 hover:text-black'}`}
                >
                    Collected
                </button>
                <div className="w-[1px] bg-gray-100"></div>
                <button
                    onClick={() => setFilter('sent')}
                    className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors
                        ${filter === 'sent' ? 'text-black bg-gray-50' : 'text-gray-400 hover:text-black'}`}
                >
                    Sent
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-0 z-0">
                {filteredLetters.length === 0 && (
                    <div className="flex flex-col items-center justify-center mt-20 opacity-30">
                        <div className="text-black font-bold text-xs uppercase tracking-widest">
                            {filter === 'found' ? 'No Letters Collected' : 'No Letters Sent'}
                        </div>
                    </div>
                )}

                {filteredLetters.map(letter => (
                    <button
                        key={letter.id}
                        onClick={() => onSelect(letter)}
                        className="w-full bg-white p-6 text-left border-b-minimal hover:bg-gray-50 transition-colors group"
                    >
                        <div className="flex justify-between items-baseline mb-2">
                            <span className="text-xs font-bold uppercase text-gray-400">
                                {letter.originInfo || "Unknown"}
                            </span>
                            <span className="text-[10px] font-mono text-gray-300 group-hover:text-black transition-colors">
                                {new Date(letter.createdAt).toLocaleDateString()}
                            </span>
                        </div>

                        <div className="text-sm font-serif text-black truncate opacity-80 group-hover:opacity-100">
                            "{letter.content.slice(0, 40)}..."
                        </div>
                    </button>
                ))}
            </div>
        </div>
    );
}
