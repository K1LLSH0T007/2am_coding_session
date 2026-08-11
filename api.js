import { supabase } from './connection.js';

async function fetchUsers() {
    // 1. Ensure table name matches your exact Postgres casing (e.g. 'Users' vs 'users')
    // 2. Wrap in try...catch to handle unexpected network drops/failures
    try {
        const { data, error } = await supabase.from('Users').select('*');

        if (error) {
            console.error('Error fetching users:', error.message);
            return;
        }

        console.log('Fetched users SUCCESSFULLY:', data);
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

fetchUsers();