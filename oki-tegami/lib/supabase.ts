import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.warn("Supabase credentials missing! Make sure .env.local is set.");
}

// Database row types
export type DbItem = {
    id: string;
    name: string;
    emoji: string;
    status: 'DROPPED' | 'HELD';
    lat: number | null;
    lng: number | null;
    current_location: { lat: number; lng: number } | null;
    history: Array<{
        type: 'DROP' | 'PICKUP';
        date: number;
        location: { lat: number; lng: number };
        holderId: string;
    }>;
    created_at?: string;
    updated_at?: string;
    description?: string | null;
};

export type DbLetter = {
    id: string;
    content: string;
    color: string;
    created_at: string; // ISO string
    lat: number;
    lng: number;
    launch_location: { lat: number; lng: number } | null; // Where it started
    original_location: { lat: number; lng: number }; // Where it landed (redundant with lat/lng but kept for structure)
    status: 'DROPPED' | 'COLLECTED';
    picked_up_at: number | null;
    picked_up_location: { lat: number; lng: number } | null;
    is_mine: boolean;
    sender_name: string | null;
    launch_bearing: number | null;
    launch_distance: number | null;
    origin_info: string | null;
    user_id: string;
    finder_id: string | null;
    finder_message: string | null;
    is_found: boolean;
};

// Database schema type
export interface Database {
    public: {
        Tables: {
            items: {
                Row: DbItem;
                Insert: Omit<DbItem, 'created_at' | 'updated_at'>;
                Update: Partial<Omit<DbItem, 'created_at' | 'updated_at'>>;
            };
            letters: {
                Row: DbLetter;
                Insert: DbLetter;
                Update: Partial<DbLetter>;
            };
        };
    };
}

export const supabase = createClient(supabaseUrl, supabaseKey);

