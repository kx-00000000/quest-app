import React from 'react';
import { Item } from '@/types';

interface ItemsTabProps {
    items: Item[];
    onSelect: (item: Item) => void;
    currentUserId?: string;
}

export function ItemsTab({ items, onSelect, currentUserId }: ItemsTabProps) {
    const handleCopyId = () => {
        if (currentUserId) {
            navigator.clipboard.writeText(currentUserId);
        }
    };

    return (
        <div className="h-full bg-white flex flex-col relative text-black">

            {/* Header / ID Section - Minimalist */}
            <div className="p-6 border-b-minimal sticky top-0 bg-white z-10">
                <div className="flex justify-between items-start mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                        Collection
                    </h2>
                    <div className="text-[10px] uppercase font-bold text-gray-400">
                        {items.length} / 15
                    </div>
                </div>

                {/* ID Card - Clean */}
                <div className="flex items-center justify-between border-minimal p-4 bg-gray-50">
                    <div className="flex flex-col overflow-hidden">
                        <span className="text-[10px] uppercase text-gray-400 font-bold tracking-widest mb-1">Passport ID</span>
                        <span className="text-xs font-mono font-bold truncate">{currentUserId || "..."}</span>
                    </div>
                    <button
                        onClick={handleCopyId}
                        className="ml-4 text-[10px] uppercase font-bold text-black border-minimal px-3 py-1 hover:bg-black hover:text-white transition-colors"
                    >
                        Copy
                    </button>
                </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-6 z-0">
                <div className="grid grid-cols-3 gap-4">
                    {items.map(item => (
                        <button
                            key={item.id}
                            onClick={() => onSelect(item)}
                            className="aspect-square bg-gray-50 border-minimal flex flex-col items-center justify-center hover:bg-black hover:text-white transition-all group"
                        >
                            <div className="text-3xl group-hover:scale-110 transition-transform">{item.emoji}</div>
                        </button>
                    ))}

                    {/* Empty Slots */}
                    {Array.from({ length: Math.max(0, 15 - items.length) }).map((_, i) => (
                        <div key={`empty-${i}`} className="aspect-square border-minimal flex items-center justify-center bg-transparent">
                            <span className="text-gray-100 text-lg font-serif italic opacity-30"></span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
