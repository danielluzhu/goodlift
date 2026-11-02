import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key'

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database table names (adjust these to match your Supabase schema)
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
