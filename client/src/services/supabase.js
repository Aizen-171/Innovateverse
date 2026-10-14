import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://sxhysfbqzhnjpfstdjzc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4aHlzZmJxemhuanBmc3RkanpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE5NTI1MjgsImV4cCI6MjEwNzUyODUyOH0.fDHqNQUs3dxq1marrjBkosxbrCg4CFDr-RcUP8pYXG8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

/**
 * Helper to subscribe to realtime changes on any table
 * @param {string} table - Table name (e.g. 'projects', 'milestones', 'collaborations')
 * @param {Function} callback - Triggered when INSERT, UPDATE, or DELETE occurs
 * @returns {Function} unsubscribe function
 */
export function subscribeToTable(table, callback) {
  const channel = supabase
    .channel(`public:${table}:${Date.now()}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table },
      payload => {
        console.log(`[Supabase Realtime] ${table} event:`, payload.eventType, payload);
        callback(payload);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

export default supabase;
