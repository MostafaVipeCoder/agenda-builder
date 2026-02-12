/**
 * Supabase Health Check Utility
 */
import { supabase } from './supabase';
import { getEvents } from './api';

export const runHealthCheck = async () => {
    console.log('--- STARTING SUPABASE HEALTH CHECK ---');
    console.log('Timestamp:', new Date().toISOString());

    try {
        console.log('1. Testing Connection to Supabase...');
        const events = await getEvents();

        if (Array.isArray(events)) {
            console.log('✅ Success! Supabase is returning an array of events.');
            console.log(`Count: ${events.length}`);
            return { status: 'ok', data: events };
        } else {
            console.warn('⚠️ Warning: Supabase returned data, but it is not an array.', events);
            return { status: 'unexpected_format', data: events };
        }
    } catch (error) {
        console.error('❌ Connection Failed!');
        console.error('DIAGNOSIS:', error.message);

        if (error.message.includes('Fetch API')) {
            console.error('Check your internet connection and Supabase URL.');
        } else if (error.message.includes('API key')) {
            console.error('Verify your Supabase Anon Key.');
        }

        return { status: 'error', message: error.message };
    } finally {
        console.log('--- SUPABASE HEALTH CHECK FINISHED ---');
    }
};

if (typeof window !== 'undefined') {
    window.runApiHealthCheck = runHealthCheck;
    console.log('💡 Supabase Tester Loaded! Run `await runApiHealthCheck()` in the console to test connection.');
}
