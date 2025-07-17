import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'X-Client-Info': 'grigoent-web'
    }
  }
});

// 간단한 캐시 시스템
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5분

export async function cachedQuery<T>(
  key: string,
  queryFn: () => Promise<{ data: T | null; error: any }>
): Promise<{ data: T | null; error: any }> {
  const now = Date.now();
  const cached = cache.get(key);
  
  if (cached && (now - cached.timestamp) < CACHE_DURATION) {
    return { data: cached.data, error: null };
  }
  
  try {
    const result = await queryFn();
    if (!result.error && result.data) {
      cache.set(key, { data: result.data, timestamp: now });
    }
    return result;
  } catch (error) {
    console.error('Query error:', error);
    return { data: null, error };
  }
}

export default supabase; 