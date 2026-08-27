import { createClient } from '@supabase/supabase-js'

// Supabase configuration with multiple client options
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_KEY || 'your-service-key'

// Create different clients for different use cases
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Service role client (for admin operations, bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Database table names
export const TABLES = {
  FEDERATIONS: 'federations',
  WEIGHT_CLASSES: 'weight_classes',
  COMPETITIONS: 'competitions',
  SESSIONS: 'sessions',
  ATHLETES: 'athletes',
  ENTRIES: 'entries',
  ATTEMPTS: 'attempts',
  RESULTS: 'results',
  VIDEOS: 'videos',
  RECORDS: 'records'
}

// Configuration flags
export const CONFIG = {
  USE_SUPABASE: import.meta.env.VITE_USE_SUPABASE === 'true',
  FALLBACK_TO_MOCK: import.meta.env.VITE_FALLBACK_TO_MOCK !== 'false',
  USE_SERVICE_ROLE: import.meta.env.VITE_USE_SERVICE_ROLE === 'true',
  ENABLE_RLS: import.meta.env.VITE_ENABLE_RLS !== 'false'
}

