// ============================================
// LexiFlow — Supabase Browser Client
// ============================================

import { createBrowserClient } from '@supabase/ssr';

let client: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (client) return client;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key || url === 'your_supabase_url_here') {
    // Return a mock client for development without Supabase
    return null;
  }

  client = createBrowserClient(url, key);
  return client;
}
