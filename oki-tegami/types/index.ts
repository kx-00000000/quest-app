export type LetterColor = 'sakura' | 'wasurenagusa' | 'kinari' | 'naena' | 'fujimurasaki' | 'hnamigasumi'; // Added 6th color placeholder if needed, or stick to 5 and add one. Prompt said 6.
// "6色のカラーチップ" -> I should add one more. 'sakura' (pink), 'wasurenagusa' (blue), 'kinari' (cream), 'naena' (green), 'fujimurasaki' (purple).
// Let's add 'yamabuki' (yellow/orange) or similar.
// User requirement: "6色のカラーチップ".
// Existing was 5. I will add 'yamabuki'.

export type LetterColorCode =
    | 'kit-antique' | 'kit-airmail' | 'kit-midnight' | 'kit-sakura' | 'kit-botanical' | 'kit-minimal'
    | 'kit-ocean' | 'kit-galaxy' | 'kit-retro' | 'kit-forest' | 'kit-starlight' | 'kit-coffee';

export interface Location {
    lat: number;
    lng: number;
}

export type ItemHistoryType = 'DROP' | 'PICKUP';
export type ItemHistoryEvent = {
    type: ItemHistoryType;
    date: number; // timestamp
    location: Location;
    holderId?: string; // "me" or others (dummy)
};

export interface Item {
    id: string;
    name: string;
    emoji: string;
    history: ItemHistoryEvent[];
    status: 'HELD' | 'DROPPED';
    currentLocation?: Location; // only if DROPPED
    description?: string; // New: Explanation text
}

export interface Letter {
    id: string;
    content: string;
    color: string; // ID of the color
    createdAt: number;
    launchLocation?: Location; // New: Where it was thrown from
    originalLocation: Location; // Where it landed (Destination)
    pickedUpAt?: number;
    pickedUpLocation?: Location;
    status: 'DROPPED' | 'COLLECTED';
    isMine: boolean; // Created by me?
    senderName?: string; // New: Name of the sender
    recipientId?: string; // New: Round 12 Private
    launchBearing?: number;
    launchDistance?: number;
    originInfo?: string; // Origin Name (e.g. "Nihonbashi, Tokyo")
    arrivalInfo?: string; // Arrival Name (e.g. "Sapporo, Hokkaido")
    finderId?: string;
    finderMessage?: string; // New: Message from the finder
}
