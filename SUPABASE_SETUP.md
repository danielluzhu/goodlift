# Supabase Integration Setup

This guide explains how to set up Supabase integration with your weightlifting app.

## Prerequisites

1. A Supabase project (create one at [supabase.com](https://supabase.com))
2. Your Supabase project URL and anon key

## Environment Configuration

1. Copy the example environment file:
   ```bash
   cp env.example .env.local
   ```

2. Edit `.env.local` with your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_USE_SUPABASE=true
   VITE_FALLBACK_TO_MOCK=true
   ```

## Database Schema

Your Supabase database should have the following tables that match the structure of the mockDB:

### Tables Required:
- `federations`
- `weight_classes`
- `competitions`
- `sessions`
- `athletes`
- `entries`
- `attempts`
- `results`
- `videos`
- `records`

### Sample SQL for creating tables:

```sql
-- Federations table
CREATE TABLE federations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT,
  code TEXT,
  level TEXT
);

-- Weight classes table
CREATE TABLE weight_classes (
  id TEXT PRIMARY KEY,
  gender TEXT NOT NULL,
  label TEXT NOT NULL,
  min_kg INTEGER,
  max_kg INTEGER,
  rule_era TEXT
);

-- Competitions table
CREATE TABLE competitions (
  id TEXT PRIMARY KEY,
  federation_id TEXT REFERENCES federations(id),
  name TEXT NOT NULL,
  city TEXT,
  country TEXT,
  start_date DATE,
  end_date DATE,
  level TEXT,
  status TEXT,
  url_slug TEXT
);

-- Sessions table
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  competition_id TEXT REFERENCES competitions(id),
  date_time TIMESTAMPTZ,
  gender TEXT,
  weight_class_id TEXT REFERENCES weight_classes(id),
  group_label TEXT,
  platform_label TEXT,
  sort_order INTEGER
);

-- Athletes table
CREATE TABLE athletes (
  id TEXT PRIMARY KEY,
  full_name TEXT NOT NULL,
  gender TEXT,
  nationality TEXT,
  dob DATE
);

-- Entries table
CREATE TABLE entries (
  id TEXT PRIMARY KEY,
  session_id TEXT REFERENCES sessions(id),
  athlete_id TEXT REFERENCES athletes(id),
  lot INTEGER,
  declared_sn INTEGER,
  declared_cj INTEGER
);

-- Attempts table
CREATE TABLE attempts (
  id TEXT PRIMARY KEY,
  entry_id TEXT REFERENCES entries(id),
  lift_type TEXT,
  attempt_no INTEGER,
  weight_kg INTEGER,
  result TEXT,
  timestamp TIMESTAMPTZ,
  video_id TEXT
);

-- Results table
CREATE TABLE results (
  id TEXT PRIMARY KEY,
  entry_id TEXT REFERENCES entries(id),
  best_sn INTEGER,
  best_cj INTEGER,
  total INTEGER,
  placing INTEGER,
  bodyweight_kg DECIMAL,
  points DECIMAL
);

-- Videos table
CREATE TABLE videos (
  id TEXT PRIMARY KEY,
  source TEXT,
  external_id TEXT,
  start_ms INTEGER,
  end_ms INTEGER
);

-- Records table
CREATE TABLE records (
  id TEXT PRIMARY KEY,
  federation_id TEXT REFERENCES federations(id),
  weight_class_id TEXT REFERENCES weight_classes(id),
  gender TEXT,
  record_type TEXT,
  weight_kg INTEGER,
  holder_athlete_id TEXT REFERENCES athletes(id),
  set_date DATE,
  competition_id TEXT REFERENCES competitions(id)
);
```

## Data Migration

To migrate your mock data to Supabase:

1. Export your mock data from the app
2. Use the Supabase dashboard or SQL editor to insert the data
3. Or create a migration script using the Supabase client

## Configuration Options

### Environment Variables:

- `VITE_USE_SUPABASE`: Set to `true` to use Supabase, `false` to use mock data only
- `VITE_FALLBACK_TO_MOCK`: Set to `true` to fallback to mock data if Supabase fails
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

### Data Service Features:

- **Automatic fallback**: If Supabase is unavailable, the app automatically falls back to mock data
- **Error handling**: Comprehensive error handling with user-friendly messages
- **Loading states**: Proper loading indicators while fetching data
- **Type safety**: Consistent data structure between Supabase and mock data

## Usage

The app will automatically detect your configuration and use the appropriate data source. No code changes are needed - just set your environment variables and the app will work with Supabase data.

## Troubleshooting

1. **Data not loading**: Check your Supabase credentials and network connection
2. **Tables not found**: Ensure your database schema matches the expected structure
3. **Permission errors**: Check your Supabase RLS (Row Level Security) policies
4. **CORS issues**: Verify your Supabase project settings allow your domain

### RLS (Row Level Security) Issues

If you get errors like "new row violates row-level security policy":

**Quick Fix (Recommended for Development):**
1. Go to your Supabase dashboard
2. Navigate to Authentication > Policies
3. Find each table and disable RLS
4. Or run the SQL script: `scripts/fix-rls-policies.sql`

**Alternative Fix (Keep RLS Enabled):**
1. Run the SQL script in `scripts/fix-rls-policies.sql`
2. Uncomment the policy creation lines
3. This creates permissive policies for authenticated users

**Manual Fix:**
```sql
-- Disable RLS for all tables
ALTER TABLE federations DISABLE ROW LEVEL SECURITY;
ALTER TABLE weight_classes DISABLE ROW LEVEL SECURITY;
-- ... repeat for all tables
```

## Development vs Production

- **Development**: Use `VITE_FALLBACK_TO_MOCK=true` for reliable development
- **Production**: Use `VITE_FALLBACK_TO_MOCK=false` to ensure data consistency
