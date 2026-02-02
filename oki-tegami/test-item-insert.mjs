import { createClient } from '@supabase/supabase-js';
import fs from 'fs';

const env = fs.readFileSync('.env.local', 'utf8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY=(.*)/);

if (!urlMatch || !keyMatch) {
    console.error('Missing credentials');
    process.exit(1);
}

const supabase = createClient(urlMatch[1].trim(), keyMatch[1].trim());

async function testInsert() {
    console.log('Testing item insert (Attempt 4: Add "type" column)...');

    // Generate valid UUID
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });

    const testItem = {
        id: uuid,
        name: 'Test Item Valid',
        emoji: '✅',
        status: 'DROPPED',
        lat: 35.6812,
        lng: 139.7671,
        current_location: null,
        history: [{ type: 'DROP', date: Date.now(), location: { lat: 35.6812, lng: 139.7671 }, holderId: 'system' }],
        type: 'item' // Guessing 'item' is a valid value
    };

    console.log('Inserting with type="item"...');
    const { error } = await supabase.from('items').insert(testItem);

    if (error) {
        console.error('Insert failed:', JSON.stringify(error, null, 2));
    } else {
        console.log('Insert SUCCESS!');
    }
}
testInsert();
