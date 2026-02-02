import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocation } from './useLocation';
import { Item, Letter, Location, ItemHistoryEvent } from '@/types';
import { supabase } from '@/lib/supabase';
import { calculateDestination, haversine, getApproximatedPlaceName, fetchPreciseLocation } from '@/utils/geo';

// TEST MOCK LOCATION (Tokyo Station) - Used if real GPS fails
const TEST_MOCK_LOCATION: Location = { lat: 35.6812, lng: 139.7671 };

const generateUUID = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
};

// Dummy Items for world discovery
// Dummy Items for world discovery
const DUMMY_DROPPED_ITEMS: Item[] = Array.from({ length: 15 }).map((_, i) => {
    const names = ['Cookie', 'Red Glove', 'Maneki Neko', 'Old Key', 'Umbrella', 'Vintage Camera', 'Library Book', 'Train Ticket', 'Fountain Pen', 'Pocket Watch', 'Silver Ring', 'Gold Coin', 'Old Map', 'Brass Compass', 'Paper Lantern'];
    const emojis = ['🍪', '🧤', '🐱', '🗝️', '☂️', '📷', '📚', '🎫', '🖊️', '⌚', '💍', '🪙', '🗺️', '🧭', '🏮'];

    // Random scatter around Tokyo Station (35.6812, 139.7671)
    // 0.002 degrees is roughly 200m
    const latOffset = (Math.random() - 0.5) * 0.002;
    const lngOffset = (Math.random() - 0.5) * 0.002;

    return {
        id: generateUUID(),
        name: names[i % names.length],
        emoji: emojis[i % emojis.length],
        status: 'DROPPED',
        currentLocation: {
            lat: 35.6812 + latOffset,
            lng: 139.7671 + lngOffset
        },
        history: [{ type: 'DROP', date: Date.now() - Math.random() * 864000000, location: { lat: 35.6812, lng: 139.7671 }, holderId: 'system' }],
    };
});

const DUMMY_HELD_ITEMS: Item[] = [
    {
        id: 'item-held-1',
        name: 'Old Key',
        emoji: '🗝️',
        status: 'HELD',
        history: [{ type: 'PICKUP', date: Date.now() - 100000, location: { lat: 0, lng: 0 }, holderId: 'me' }],
    }
];

const DUMMY_COLLECTED_LETTERS: Letter[] = [
    {
        id: 'letter-collected-1',
        content: 'Hello from the past!',
        color: 'sakura',
        createdAt: Date.now() - 9999999,
        originalLocation: { lat: 0, lng: 0 },
        status: 'COLLECTED',
        pickedUpAt: Date.now(),
        isMine: false
    },
    {
        id: 'letter-collected-2',
        content: 'I hope you find this.',
        color: 'wasurenagusa',
        createdAt: Date.now() - 8888888,
        originalLocation: { lat: 0, lng: 0 },
        status: 'COLLECTED',
        pickedUpAt: Date.now(),
        isMine: false
    }
];

export function useGameLogic() {
    const { coords: realCoords, getDistance: realGetDistance } = useLocation();

    // Fallback coords for testing
    const effectiveCoords = realCoords || TEST_MOCK_LOCATION;

    // Helper to calculate distance even with mock coords
    const getEffectiveDistance = useCallback((target: Location) => {
        if (realCoords && realGetDistance) {
            return realGetDistance(target);
        }
        // Simple Haversine for mock fallback
        const dist = haversine(effectiveCoords, target) * 1000; // haversine returns km, convert to meters
        return dist;
    }, [realCoords, realGetDistance, effectiveCoords]);

    // Destination Calculation (Spherical)
    // Removed calculateDestination from here as it is imported from utils/geo


    const [items, setItems] = useState<Item[]>([]);
    const [letters, setLetters] = useState<Letter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [userId, setUserId] = useState<string>('');

    // Initialize User ID
    useEffect(() => {
        let storedId = localStorage.getItem('oki-tegami-user-id');
        if (!storedId) {
            storedId = generateUUID();
            localStorage.setItem('oki-tegami-user-id', storedId);
        }
        setUserId(storedId);
    }, []);

    // Fetch Items from Database
    const fetchItems = useCallback(async () => {
        console.log('[DEBUG] fetchItems triggered');
        try {
            const { data, error } = await supabase
                .from('items')
                .select('*');

            if (error) {
                console.error('[DEBUG] Error fetching items:', error);
                return;
            }

            console.log(`[DEBUG] fetchItems result: ${data?.length} items found`);

            if (data && data.length > 0) {
                // Convert database format to app format
                const loadedItems: Item[] = data.map((dbItem: any) => ({
                    id: dbItem.id,
                    name: dbItem.name,
                    emoji: dbItem.emoji,
                    status: dbItem.status,
                    currentLocation: (dbItem.lat !== null && dbItem.lng !== null)
                        ? { lat: dbItem.lat, lng: dbItem.lng }
                        : undefined,
                    history: typeof dbItem.history === 'string' ? JSON.parse(dbItem.history) : dbItem.history,
                    description: dbItem.description || undefined
                }));
                setItems(loadedItems);
            } else {
                console.log('[DEBUG] No items found. Triggering initialization...');
                // Initialize with dummy data if database is empty
                await initializeDummyItems();
            }
        } catch (err) {
            console.error('[DEBUG] Unexpected error fetching items:', err);
        }
    }, []);

    // Fetch Letters from Database
    const fetchLetters = useCallback(async () => {
        console.log('[DEBUG] fetchLetters triggered');
        try {
            const { data, error } = await supabase
                .from('letters')
                .select('*')
                .or(`recipient_id.is.null,recipient_id.eq.${userId},user_id.eq.${userId}`);

            if (error) {
                console.error('[DEBUG] Error fetching letters:', error);
                return;
            }

            if (data && data.length > 0) {
                console.log(`[DEBUG] Fetched ${data.length} letters from DB`);
                // Convert database format to app format
                const loadedLetters: Letter[] = data.map((dbLetter: any) => ({
                    id: dbLetter.id,
                    content: dbLetter.content,
                    color: dbLetter.color,
                    createdAt: new Date(dbLetter.created_at).getTime(),
                    launchLocation: dbLetter.launch_location || undefined,
                    originalLocation: { lat: dbLetter.lat, lng: dbLetter.lng }, // Destination/Landing
                    status: dbLetter.status,
                    pickedUpAt: (dbLetter.picked_up_at && !isNaN(new Date(dbLetter.picked_up_at).getTime()))
                        ? new Date(dbLetter.picked_up_at).getTime()
                        : undefined,
                    pickedUpLocation: dbLetter.picked_up_location || undefined,
                    isMine: dbLetter.user_id === userId,
                    senderName: dbLetter.sender_name || undefined,
                    launchBearing: dbLetter.launch_bearing || undefined,
                    launchDistance: dbLetter.launch_distance || undefined,
                    originInfo: dbLetter.origin_info || undefined,
                    finderId: dbLetter.finder_id || undefined,
                    finderMessage: dbLetter.finder_message || undefined
                }));
                setLetters(loadedLetters);
                console.log('[DEBUG] Letters state updated');
            } else {
                console.log('[DEBUG] No letters found in DB, using dummy data');
                await initializeDummyLetters();
            }
        } catch (err) {
            console.error('[DEBUG] Unexpected error in fetchLetters:', err);
        }
    }, [userId]);

    // Initialize dummy items in database
    const initializeDummyItems = async () => {
        console.log('[DEBUG] initializeDummyItems START');
        try {
            const allDummyItems = [...DUMMY_DROPPED_ITEMS, ...DUMMY_HELD_ITEMS];
            console.log(`[DEBUG] Preparing to insert ${allDummyItems.length} dummy items`);

            const dbItems = allDummyItems.map(item => ({
                id: item.id,
                name: item.name,
                emoji: item.emoji,
                status: item.status,
                lat: item.currentLocation?.lat || null,
                lng: item.currentLocation?.lng || null,
                current_location: null,
                history: item.history,
                type: 'item'
            }));

            const { error } = await supabase
                .from('items')
                .insert(dbItems as any);

            if (error) {
                console.error('[DEBUG] Error initializing dummy items:', error);
            } else {
                console.log('[DEBUG] Successfully initialized dummy items');
                setItems(allDummyItems);
            }
        } catch (err) {
            console.error('[DEBUG] Unexpected error initializing items:', err);
        }
    };

    // Initialize dummy letters in database
    const initializeDummyLetters = async () => {
        try {
            const { error } = await supabase
                .from('letters')
                .insert(DUMMY_COLLECTED_LETTERS.map(letter => ({
                    id: letter.id,
                    content: letter.content,
                    color: letter.color,
                    created_at: new Date(letter.createdAt).toISOString(),
                    lat: letter.originalLocation.lat,
                    lng: letter.originalLocation.lng,
                    original_location: letter.originalLocation,
                    status: letter.status,
                    picked_up_at: letter.pickedUpAt || null,
                    picked_up_location: letter.pickedUpLocation || null,
                    is_mine: false,
                    user_id: 'dummy-initial-user', // System dummy data
                    finder_id: letter.status === 'COLLECTED' ? 'dummy-initial-user' : null,
                    is_found: letter.status === 'COLLECTED'
                })) as any);

            if (error) {
                console.error('Error initializing dummy letters:', error);
            } else {
                setLetters(DUMMY_COLLECTED_LETTERS);
            }
        } catch (err) {
            console.error('Unexpected error initializing letters:', err);
        }
    };

    // Initialize Data
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await Promise.all([fetchItems(), fetchLetters()]);
            setIsLoading(false);
        };
        loadData();
    }, [fetchItems, fetchLetters]);


    // --- LOGIC UPDATES ---

    // 1. Teleport Logic (Safe)
    useEffect(() => {
        // Find items that need teleporting
        const toTeleportIndexes: number[] = [];
        items.forEach((item, index) => {
            const isDummy = ['item-1', 'item-2', 'item-3'].includes(item.id);
            if (isDummy && item.status === 'DROPPED') {
                // If no location or far away
                if (!item.currentLocation) {
                    toTeleportIndexes.push(index);
                } else {
                    const d = getEffectiveDistance(item.currentLocation);
                    if (d === null || d > 100) {
                        toTeleportIndexes.push(index);
                    }
                }
            }
        });

        if (toTeleportIndexes.length > 0) {
            console.log("Teleporting items (Mock/Real):", toTeleportIndexes);

            const updateTeleportedItems = async () => {
                const updatedItems = items.map((item, index) => {
                    if (toTeleportIndexes.includes(index)) {
                        // Scatter 3-8m
                        const angle = (index * 2);
                        const r = 5 + (index % 3);
                        const latOffset = (r * Math.cos(angle)) * 0.000009;
                        const lngOffset = (r * Math.sin(angle)) * 0.000009;
                        return {
                            ...item,
                            currentLocation: {
                                lat: effectiveCoords.lat + latOffset,
                                lng: effectiveCoords.lng + lngOffset
                            }
                        };
                    }
                    return item;
                });

                // Update in database
                for (const index of toTeleportIndexes) {
                    const item = updatedItems[index];
                    await supabase
                        .from('items')
                        .update({
                            lat: item.currentLocation?.lat || null,
                            lng: item.currentLocation?.lng || null,
                            current_location: item.currentLocation || null
                        } as any)
                        .eq('id', item.id);
                }

                setItems(updatedItems);
            };

            updateTeleportedItems();
        }

    }, [effectiveCoords, items, getEffectiveDistance]);


    // 2. Nearby Calculation
    const nearbyItems = useMemo(() => {
        return items.filter(item => {
            if (item.status !== 'DROPPED') return false;
            if (!item.currentLocation) return false;
            const d = getEffectiveDistance(item.currentLocation);
            return d !== null && d <= 500; // Expanded for 'Mystery' logic
        });
    }, [items, getEffectiveDistance]);

    const nearbyLetters = useMemo(() => {
        return letters.filter(l => {
            if (l.status !== 'DROPPED') return false;
            const d = getEffectiveDistance(l.originalLocation);
            return d !== null && d <= 500; // Expanded for 'Mystery' logic
        });
    }, [letters, getEffectiveDistance]);


    // 3. Drop Action (Using effectiveCoords)
    const dropItem = useCallback(async (itemId: string) => {
        console.log("Dropping item using effective coords:", effectiveCoords);

        const item = items.find(i => i.id === itemId);
        if (!item) return;

        const newHistory: ItemHistoryEvent = {
            type: 'DROP',
            date: Date.now(),
            location: { ...effectiveCoords },
            holderId: 'me'
        };

        const updatedItem = {
            ...item,
            status: 'DROPPED' as const,
            currentLocation: { ...effectiveCoords },
            history: [...item.history, newHistory]
        };

        // Update in database
        try {
            const { error } = await supabase
                .from('items')
                .update({
                    status: 'DROPPED',
                    lat: effectiveCoords.lat,
                    lng: effectiveCoords.lng,
                    current_location: null,
                    history: updatedItem.history
                } as any)
                .eq('id', itemId);

            if (error) {
                console.error('Error dropping item:', error);
                return;
            }

            // Update local state
            setItems(prev => prev.map(i => i.id === itemId ? updatedItem : i));
        } catch (err) {
            console.error('Unexpected error dropping item:', err);
        }
    }, [effectiveCoords, items, userId]);

    const pickItem = useCallback(async (itemId: string) => {
        const heldCount = items.filter(i => i.status === 'HELD').length;
        if (heldCount >= 15) return false;

        const item = items.find(i => i.id === itemId);
        if (!item) return false;

        const newHistory: ItemHistoryEvent = {
            type: 'PICKUP',
            date: Date.now(),
            location: { ...effectiveCoords },
            holderId: 'me'
        };

        const updatedItem = {
            ...item,
            status: 'HELD' as const,
            currentLocation: undefined,
            history: [...item.history, newHistory]
        };

        // Update in database
        try {
            const { error } = await supabase
                .from('items')
                .update({
                    status: 'HELD',
                    lat: null,
                    lng: null,
                    current_location: null,
                    history: updatedItem.history
                } as any)
                .eq('id', itemId);

            if (error) {
                console.error('Error picking item:', error);
                return false;
            }

            // Update local state
            setItems(prev => prev.map(i => i.id === itemId ? updatedItem : i));
            return true;
        } catch (err) {
            console.error('Unexpected error picking item:', err);
            return false;
        }
    }, [items, effectiveCoords, userId]);

    const dropLetter = useCallback(async (content: string, color: string, angle: number, distance: number, senderName: string = 'Anonymous', recipientId?: string, overrideArrivalInfo?: string) => {
        const landingPos = calculateDestination(effectiveCoords, angle, distance);

        // Fix (Round 13): originInfo should be the LAUNCH location Name.
        // We try to get precise location of Launch if possible, otherwise approx.
        // For Async speed, we might use the approx first or await.
        // Let's use getApproximatedPlaceName because fetchPreciseLocation is async and might be slow.
        // Ideally we fetch precise, but let's stick to approx for speed, OR if we want precision (as requested),
        // we should try to fetch precise if available. 
        // User requested "Detail Geocoding resolution".
        // Let's use `fetchPreciseLocation` for the origin if possible?
        // Actually, let's use the new `fetchPreciseLocation` here too if we want "Tokyo -> Sapporo" to be accurate.
        // But `dropLetter` is async, so we can await.

        let originInfo = getApproximatedPlaceName(effectiveCoords);
        try {
            // Try to get precise name for the LETTER card (e.g. "To: Sapporo (from Nihonbashi)")
            const precise = await fetchPreciseLocation(effectiveCoords);
            if (precise) originInfo = precise;
        } catch (e) {
            console.warn("Failed to fetch precise origin:", e);
        }

        // Calculate Arrival Info (Destination Name)
        // If override provided (from Wind Logic), use it. Else calculate.
        let arrivalInfo = overrideArrivalInfo || getApproximatedPlaceName(landingPos);

        if (!overrideArrivalInfo) {
            try {
                const preciseDest = await fetchPreciseLocation(landingPos);
                if (preciseDest && preciseDest !== "Somewhere in the Ocean") {
                    arrivalInfo = preciseDest;
                }
            } catch (e) {
                console.warn("Failed to fetch precise arrival:", e);
            }
        }

        const newLetter: Letter = {
            id: generateUUID(),
            content,
            color,
            createdAt: Date.now(),
            launchLocation: { ...effectiveCoords },
            originalLocation: { ...landingPos },
            status: 'DROPPED',
            isMine: true,
            senderName,
            launchBearing: angle,
            launchDistance: distance,
            originInfo,
            arrivalInfo,
            recipientId // Round 12
        };

        // Insert into database
        console.log('[useGameLogic] Attempting insert letter:', {
            id: newLetter.id,
            cols: {
                sender_name: senderName,
                launch_bearing: angle,
                launch_distance: distance,
                origin_info: originInfo
            }
        });

        try {
            const { data, error } = await supabase
                .from('letters')
                .insert({
                    id: newLetter.id,
                    content: newLetter.content,
                    color: newLetter.color,
                    created_at: new Date(newLetter.createdAt).toISOString(),
                    lat: newLetter.originalLocation.lat,
                    lng: newLetter.originalLocation.lng,
                    launch_location: newLetter.launchLocation,
                    original_location: newLetter.originalLocation,
                    status: 'DROPPED',
                    picked_up_at: null,
                    picked_up_location: null,
                    is_mine: true,
                    user_id: userId,
                    sender_name: senderName || null,
                    recipient_id: recipientId || null, // Round 12
                    launch_bearing: angle,
                    launch_distance: distance,
                    origin_info: originInfo || null,
                    arrival_info: arrivalInfo || null,
                    finder_message: null
                } as any)
                .select(); // Add select to verify return

            if (error) {
                console.error('[useGameLogic] Supabase Insert Error:', error);
                console.error('Error Details:', JSON.stringify(error, null, 2));
                alert(`Error saving letter: ${error.message}`); // Visible alert for user
                return;
            } else {
                console.log('[useGameLogic] Insert Success:', data);
            }

            // Update local state
            setLetters(prev => [...prev, newLetter]);
        } catch (err) {
            console.error('Unexpected error dropping letter:', err);
            if (err instanceof Error) {
                console.error('Stack:', err.stack);
                console.error('Message:', err.message);
            } else {
                console.error('Full Error Object:', JSON.stringify(err, null, 2));
            }
        }
    }, [effectiveCoords, userId, calculateDestination]);

    const collectLetter = useCallback(async (letterId: string, message?: string): Promise<boolean> => {
        console.log(`[DEBUG] collectLetter START: ${letterId}, userId: ${userId}`);
        const letter = letters.find(l => l.id === letterId);
        if (!letter) {
            console.warn(`[DEBUG] Letter ${letterId} not in state`);
            return false;
        }

        try {
            console.log('[DEBUG] Attempting atomic update...');
            // Atomic update: Only update if status is still 'DROPPED'
            const { data, error } = await supabase
                .from('letters')
                .update({
                    status: 'COLLECTED',
                    picked_up_at: Date.now(),
                    picked_up_location: effectiveCoords,
                    finder_id: userId,
                    is_found: true,
                    finder_message: message || null
                } as any)
                .eq('id', letterId)
                .eq('status', 'DROPPED') // Atomic check
                .select();

            if (error) {
                console.error('[DEBUG] DB update error:', error);
                return false;
            }

            // If no data returned, it means the row wasn't updated (condition failed)
            if (!data || data.length === 0) {
                console.warn('[DEBUG] Collection failed: Letter already collected or not found.');
                // Refresh to get latest state
                await fetchLetters();
                return false;
            }

            console.log('[DEBUG] DB update success (Atomic)');

            const updatedLetter: Letter = {
                ...letter,
                status: 'COLLECTED',
                pickedUpAt: Date.now(),
                pickedUpLocation: { ...effectiveCoords },
                finderId: userId,
                finderMessage: message
            };

            // Update local state
            setLetters(prev => prev.map(l => l.id === letterId ? updatedLetter : l));

            // Sync with server
            await fetchLetters();
            return true;

        } catch (err) {
            console.error('[DEBUG] Unexpected error in collectLetter:', err);
            return false;
        }
    }, [effectiveCoords, letters, userId, fetchLetters]);

    const updateLetterMessage = useCallback(async (letterId: string, message: string) => {
        try {
            const { error } = await supabase
                .from('letters')
                .update({ finder_message: message } as any)
                .eq('id', letterId)
                .eq('finder_id', userId); // Security check: only finder can update

            if (error) {
                console.error('Error updating message:', error);
                return;
            }

            setLetters(prev => prev.map(l => l.id === letterId ? { ...l, finderMessage: message } : l));
        } catch (err) {
            console.error('Unexpected error updating message:', err);
        }
    }, [userId]);

    const myItems = useMemo(() => items.filter(i =>
        i.status === 'HELD' && i.history.length > 0 && i.history[i.history.length - 1].holderId === userId
    ), [items, userId]);
    const myLetters = useMemo(() => letters.filter(l =>
        l.isMine || (l.status === 'COLLECTED' && l.finderId === userId)
    ), [letters, userId]);

    return {
        items,
        letters,
        nearbyItems,
        nearbyLetters,
        dropItem,
        pickItem,
        dropLetter,
        collectLetter,
        myItems,
        myLetters,
        isLoading,
        userLocation: effectiveCoords,
        getDistanceFromUser: getEffectiveDistance,
        updateLetterMessage,
        userId // Round 12
    };
}
