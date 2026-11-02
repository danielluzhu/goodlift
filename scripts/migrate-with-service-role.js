#!/usr/bin/env node

/**
 * Migration script using service role for admin operations
 * This bypasses RLS for data migration while keeping security for regular users
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
const envFile = readFileSync(join(__dirname, '..', '.env.local'), 'utf8')
const envVars = {}
envFile.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) {
    envVars[key.trim()] = value.trim()
  }
})

const supabaseUrl = envVars.VITE_SUPABASE_URL
const supabaseServiceKey = envVars.VITE_SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Please set VITE_SUPABASE_URL and VITE_SUPABASE_SERVICE_KEY')
  console.error('💡 Get your service key from: Project Settings > API > service_role key')
  process.exit(1)
}

// Use service role client (bypasses RLS)
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Mock data (same as in App.jsx)
const mockData = {
  federations: [
    { id: "iwf", name: "International Weightlifting Federation", region: "World", code: "IWF", level: "international" },
  ],
  weightClasses: [
    { id: "W45-2018", gender: "F", label: "45 kg", min_kg: 0, max_kg: 45, rule_era: "2018+" },
    { id: "W49-2018", gender: "F", label: "49 kg", min_kg: 45, max_kg: 49, rule_era: "2018+" },
    { id: "W55-2018", gender: "F", label: "55 kg", min_kg: 49, max_kg: 55, rule_era: "2018+" },
    { id: "W59-2018", gender: "F", label: "59 kg", min_kg: 55, max_kg: 59, rule_era: "2018+" },
    { id: "W64-2018", gender: "F", label: "64 kg", min_kg: 59, max_kg: 64, rule_era: "2018+" },
    { id: "M55-2018", gender: "M", label: "55 kg", min_kg: 0, max_kg: 55, rule_era: "2018+" },
    { id: "M61-2018", gender: "M", label: "61 kg", min_kg: 55, max_kg: 61, rule_era: "2018+" },
    { id: "M73-2018", gender: "M", label: "73 kg", min_kg: 69, max_kg: 73, rule_era: "2018+" },
    { id: "M81-2018", gender: "M", label: "81 kg", min_kg: 73, max_kg: 81, rule_era: "2018+" },
    { id: "W64-legacy", gender: "F", label: "64 kg", min_kg: 59, max_kg: 64, rule_era: "2018+" },
  ],
  competitions: [
    {
      id: "cmp_awc_2025",
      federation_id: "iwf",
      name: "2025 Asian Weightlifting Championships",
      city: "Jiangshan",
      country: "China",
      start_date: "2025-05-06",
      end_date: "2025-05-16",
      level: "continental",
      status: "finished",
      url_slug: "asian-championships-2025",
    },
    {
      id: "cmp_worlds_2024",
      federation_id: "iwf",
      name: "IWF World Championships 2024",
      city: "Doha",
      country: "Qatar",
      start_date: "2024-11-02",
      end_date: "2024-11-17",
      level: "international",
      status: "finished",
      url_slug: "iwf-worlds-2024",
    },
    {
      id: "cmp_continental_2025",
      federation_id: "iwf",
      name: "European Championships 2025",
      city: "Sofia",
      country: "Bulgaria",
      start_date: "2025-04-10",
      end_date: "2025-04-20",
      level: "international",
      status: "finished",
      url_slug: "euro-2025",
    },
  ],
  sessions: [],
  athletes: [],
  entries: [],
  attempts: [],
  results: [],
  videos: [],
  records: []
}

async function migrateData() {
  console.log('🚀 Starting secure migration to Supabase...')
  console.log('🔐 Using service role (bypasses RLS for admin operations)')
  
  try {
    // Test connection with service role
    const { data, error } = await supabase.from('federations').select('count')
    if (error) throw error
    console.log('✅ Connected to Supabase with service role')
    
    // Migrate each table
    const tables = Object.keys(mockData)
    
    for (const tableName of tables) {
      const data = mockData[tableName]
      if (data.length === 0) {
        console.log(`⏭️  Skipping ${tableName} (no data)`)
        continue
      }
      
      console.log(`📤 Migrating ${tableName} (${data.length} records)...`)
      
      const { error } = await supabase
        .from(tableName)
        .upsert(data, { onConflict: 'id' })
      
      if (error) {
        console.error(`❌ Error migrating ${tableName}:`, error.message)
        continue
      }
      
      console.log(`✅ Migrated ${tableName}`)
    }
    
    console.log('🎉 Migration completed successfully!')
    console.log('💡 You can now set VITE_USE_SUPABASE=true in your .env.local')
    console.log('🔒 RLS is still enabled for regular users - only service role can modify data')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

migrateData()

