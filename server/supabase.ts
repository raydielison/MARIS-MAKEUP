import { createClient, SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;
let supabaseAdminClient: SupabaseClient | null = null;

/**
 * Resolves the Supabase URL. If the user provided a full URL, it uses it.
 * If the user configured an access token or empty URL, it extracts the project reference
 * from the JWT token and resolves to https://<ref>.supabase.co.
 */
export function resolveSupabaseUrl(): string {
  const envUrl = process.env.SUPABASE_URL?.trim();
  if (envUrl && (envUrl.startsWith('http://') || envUrl.startsWith('https://'))) {
    return envUrl.replace(/\/+$/, '');
  }

  // Attempt to decode the project ref from the JWT in ANON or SERVICE_ROLE key
  const token = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        if (payload && typeof payload.ref === 'string') {
          return `https://${payload.ref}.supabase.co`;
        }
      }
    } catch {
      // Ignore decoding failure
    }
  }

  return envUrl || '';
}

/**
 * Lazy initialization of standard Supabase client.
 * Does not crash on application boot if environment variables are missing.
 */
export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const url = resolveSupabaseUrl();
    const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY (ou SUPABASE_SERVICE_ROLE_KEY) devem ser configurados.');
    }
    supabaseClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseClient;
}

/**
 * Lazy initialization of Supabase Admin client with service_role.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminClient) {
    const url = resolveSupabaseUrl();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_ANON_KEY) devem ser configurados.');
    }
    supabaseAdminClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return supabaseAdminClient;
}

/**
 * Checks whether Supabase environment variables are defined or resolvable.
 */
export function isSupabaseConfigured(): boolean {
  const url = resolveSupabaseUrl();
  const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  return Boolean(url && key);
}

/**
 * Returns safe metadata about the Supabase configuration without exposing raw secret keys.
 */
export function getSupabaseStatus() {
  const isConfigured = isSupabaseConfigured();
  const url = resolveSupabaseUrl();
  let maskedUrl = '';
  if (url) {
    try {
      const parsed = new URL(url);
      maskedUrl = `${parsed.protocol}//${parsed.hostname}`;
    } catch {
      maskedUrl = url.substring(0, 20) + '...';
    }
  }

  return {
    configured: isConfigured,
    projectUrl: maskedUrl,
    hasAnonKey: Boolean(process.env.SUPABASE_ANON_KEY),
    hasServiceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    tables: [
      'users',
      'products',
      'batches',
      'customers',
      'suppliers',
      'purchases',
      'sales',
      'financial_transactions',
      'stock_movements',
      'audit_logs',
      'store_settings',
    ],
  };
}
