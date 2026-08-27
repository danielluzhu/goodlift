-- SQL script to fix RLS policies for weightlifting app
-- Run this in your Supabase SQL editor

-- Option 1: Disable RLS for all tables (simplest for development)
ALTER TABLE federations DISABLE ROW LEVEL SECURITY;
ALTER TABLE weight_classes DISABLE ROW LEVEL SECURITY;
ALTER TABLE competitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE athletes DISABLE ROW LEVEL SECURITY;
ALTER TABLE entries DISABLE ROW LEVEL SECURITY;
ALTER TABLE attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE results DISABLE ROW LEVEL SECURITY;
ALTER TABLE videos DISABLE ROW LEVEL SECURITY;
ALTER TABLE records DISABLE ROW LEVEL SECURITY;

-- Option 2: Enable RLS but create permissive policies (if you want to keep RLS enabled)
-- Uncomment the following lines if you prefer to keep RLS enabled:

-- Enable RLS
-- ALTER TABLE federations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE weight_classes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE competitions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE athletes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE entries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE results ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE records ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all operations for authenticated users
-- CREATE POLICY "Allow all operations for authenticated users" ON federations
--   FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Allow all operations for authenticated users" ON weight_classes
--   FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Allow all operations for authenticated users" ON competitions
--   FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Allow all operations for authenticated users" ON sessions
--   FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Allow all operations for authenticated users" ON athletes
--   FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Allow all operations for authenticated users" ON entries
--   FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Allow all operations for authenticated users" ON attempts
--   FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Allow all operations for authenticated users" ON results
--   FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Allow all operations for authenticated users" ON videos
--   FOR ALL USING (auth.role() = 'authenticated');
-- CREATE POLICY "Allow all operations for authenticated users" ON records
--   FOR ALL USING (auth.role() = 'authenticated');

-- Option 3: Create policies that allow all operations for anonymous users (for public read access)
-- Uncomment the following lines if you want public read access:

-- CREATE POLICY "Allow all operations for anonymous users" ON federations
--   FOR ALL USING (true);
-- CREATE POLICY "Allow all operations for anonymous users" ON weight_classes
--   FOR ALL USING (true);
-- CREATE POLICY "Allow all operations for anonymous users" ON competitions
--   FOR ALL USING (true);
-- CREATE POLICY "Allow all operations for anonymous users" ON sessions
--   FOR ALL USING (true);
-- CREATE POLICY "Allow all operations for anonymous users" ON athletes
--   FOR ALL USING (true);
-- CREATE POLICY "Allow all operations for anonymous users" ON entries
--   FOR ALL USING (true);
-- CREATE POLICY "Allow all operations for anonymous users" ON attempts
--   FOR ALL USING (true);
-- CREATE POLICY "Allow all operations for anonymous users" ON results
--   FOR ALL USING (true);
-- CREATE POLICY "Allow all operations for anonymous users" ON videos
--   FOR ALL USING (true);
-- CREATE POLICY "Allow all operations for anonymous users" ON records
--   FOR ALL USING (true);

