import {supabase } from './connection.js';
async function fetchUsers(){
    const { data, error } = await supabase.from('users').select('*');

    if (error) {
        console.error('Error fetching users:', error);
        return;
    }
    console.log('Fetched users SUCCESSFULLY:', data);
}
fetchUsers();