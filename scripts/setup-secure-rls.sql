-- Secure RLS Setup for Weightlifting App
-- This script sets up proper Row Level Security policies

-- First, let's check if we have the auth schema available
-- If not, we'll create a simple service role approach

-- Option 1: Service Role Approach (Recommended for this use case)
-- This uses the service role key which bypasses RLS for admin operations

-- Create a function to check if the current user is a service role
CREATE OR REPLACE FUNCTION is_service_role()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT current_setting('role') = 'service_role';
$$;

-- Create policies that allow service role to do everything
CREATE POLICY "Service role can do everything" ON federations
  FOR ALL USING (is_service_role());

CREATE POLICY "Service role can do everything" ON weight_classes
  FOR ALL USING (is_service_role());

CREATE POLICY "Service role can do everything" ON competitions
  FOR ALL USING (is_service_role());

CREATE POLICY "Service role can do everything" ON sessions
  FOR ALL USING (is_service_role());

CREATE POLICY "Service role can do everything" ON athletes
  FOR ALL USING (is_service_role());

CREATE POLICY "Service role can do everything" ON entries
  FOR ALL USING (is_service_role());

CREATE POLICY "Service role can do everything" ON attempts
  FOR ALL USING (is_service_role());

CREATE POLICY "Service role can do everything" ON results
  FOR ALL USING (is_service_role());

CREATE POLICY "Service role can do everything" ON videos
  FOR ALL USING (is_service_role());

CREATE POLICY "Service role can do everything" ON records
  FOR ALL USING (is_service_role());

-- Option 2: Public Read Access (if you want public read access)
-- Uncomment these if you want anonymous users to read data

-- CREATE POLICY "Public read access" ON federations
--   FOR SELECT USING (true);

-- CREATE POLICY "Public read access" ON weight_classes
--   FOR SELECT USING (true);

-- CREATE POLICY "Public read access" ON competitions
--   FOR SELECT USING (true);

-- CREATE POLICY "Public read access" ON sessions
--   FOR SELECT USING (true);

-- CREATE POLICY "Public read access" ON athletes
--   FOR SELECT USING (true);

-- CREATE POLICY "Public read access" ON entries
--   FOR SELECT USING (true);

-- CREATE POLICY "Public read access" ON attempts
--   FOR SELECT USING (true);

-- CREATE POLICY "Public read access" ON results
--   FOR SELECT USING (true);

-- CREATE POLICY "Public read access" ON videos
--   FOR SELECT USING (true);

-- CREATE POLICY "Public read access" ON records
--   FOR SELECT USING (true);

-- Option 3: Authenticated User Access (if you want user authentication)
-- Uncomment these if you want to require user authentication

-- CREATE POLICY "Authenticated users can read" ON federations
--   FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Authenticated users can read" ON weight_classes
--   FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Authenticated users can read" ON competitions
--   FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Authenticated users can read" ON sessions
--   FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Authenticated users can read" ON athletes
--   FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Authenticated users can read" ON entries
--   FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Authenticated users can read" ON attempts
--   FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Authenticated users can read" ON results
--   FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Authenticated users can read" ON videos
--   FOR SELECT USING (auth.role() = 'authenticated');

-- CREATE POLICY "Authenticated users can read" ON records
--   FOR SELECT USING (auth.role() = 'authenticated());

