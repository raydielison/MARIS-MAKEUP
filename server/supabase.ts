import { createClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

let supabaseClient: SupabaseClient | null = null;
let supabaseAdminClient: SupabaseClient | null = null;

export function resolveSupabaseUrl(): string {
  const envUrl = process.env.SUPABASE_URL?.trim();
  if (envUrl && (envUrl.startsWith('http://') || envUrl.startsWith('https://'))) return envUrl.replace(/\/+$/, '');
  const token = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (token) {
    try {
      const parts = token.split('.');
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        if (payload && typeof payload.ref === 'string') return `https://${payload.ref}.supabase.co`;
      }
    } catch {}
  }
  return envUrl || '';
}

export function getSupabase(): SupabaseClient {
  if (!supabaseClient) {
    const url = resolveSupabaseUrl();
    const key = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY (ou SUPABASE_SERVICE_ROLE_KEY) devem ser configurados.');
    supabaseClient = createClient(url, key, { auth: { persistSession:false, autoRefreshToken:false } });
  }
  return supabaseClient;
}

export function getSupabaseAdmin(): SupabaseClient {
  if (!supabaseAdminClient) {
    const url = resolveSupabaseUrl();
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY (ou SUPABASE_ANON_KEY) devem ser configurados.');
    supabaseAdminClient = createClient(url, key, { auth: { persistSession:false, autoRefreshToken:false } });
  }
  return supabaseAdminClient;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(resolveSupabaseUrl() && (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));
}

export function getSupabaseStatus() {
  const url = resolveSupabaseUrl();
  let maskedUrl='';
  if(url){ try{const parsed=new URL(url); maskedUrl=`${parsed.protocol}//${parsed.hostname}`;}catch{maskedUrl=url.substring(0,20)+'...';} }
  return { configured:isSupabaseConfigured(), projectUrl:maskedUrl, hasAnonKey:Boolean(process.env.SUPABASE_ANON_KEY), hasServiceRoleKey:Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY), tables:['users','products','batches','customers','suppliers','purchases','sales','financial_transactions','stock_movements','audit_logs','store_settings'] };
}
