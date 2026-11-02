# Secure Supabase Setup Guide

This guide provides **3 secure approaches** to handle RLS (Row Level Security) in your weightlifting app.

## 🔐 **Approach 1: Service Role for Admin Operations (Recommended)**

This is the most secure and scalable approach. It keeps RLS enabled but uses a service role for admin operations.

### Setup Steps:

1. **Get your service role key:**
   - Go to Supabase Dashboard > Project Settings > API
   - Copy the `service_role` key (not the anon key)

2. **Update your `.env.local`:**
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_SUPABASE_SERVICE_KEY=your-service-role-key-here
   VITE_USE_SUPABASE=true
   VITE_USE_SERVICE_ROLE=true
   VITE_ENABLE_RLS=true
   ```

3. **Set up RLS policies:**
   ```bash
   # Run this SQL in your Supabase SQL editor
   cat scripts/setup-secure-rls.sql
   ```

4. **Migrate data using service role:**
   ```bash
   node scripts/migrate-with-service-role.js
   ```

### Benefits:
- ✅ RLS stays enabled for security
- ✅ Service role can perform admin operations
- ✅ Regular users have controlled access
- ✅ Scalable and production-ready

---

## 🔓 **Approach 2: Disable RLS (Development Only)**

This is the simplest approach but should only be used for development.

### Setup Steps:

1. **Disable RLS for all tables:**
   ```sql
   -- Run this in Supabase SQL editor
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
   ```

2. **Update your `.env.local`:**
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_USE_SUPABASE=true
   VITE_ENABLE_RLS=false
   ```

3. **Migrate data:**
   ```bash
   npm run migrate
   ```

### Benefits:
- ✅ Simple setup
- ✅ No authentication required
- ❌ Not secure for production
- ❌ No access control

---

## 🔒 **Approach 3: Public Read Access with RLS**

This allows public read access while keeping RLS enabled for writes.

### Setup Steps:

1. **Set up RLS policies for public read:**
   ```sql
   -- Run this in Supabase SQL editor
   -- Enable RLS
   ALTER TABLE federations ENABLE ROW LEVEL SECURITY;
   ALTER TABLE weight_classes ENABLE ROW LEVEL SECURITY;
   -- ... repeat for all tables
   
   -- Create public read policies
   CREATE POLICY "Public read access" ON federations FOR SELECT USING (true);
   CREATE POLICY "Public read access" ON weight_classes FOR SELECT USING (true);
   -- ... repeat for all tables
   ```

2. **Update your `.env.local`:**
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_USE_SUPABASE=true
   VITE_ENABLE_RLS=true
   ```

3. **Migrate data using service role:**
   ```bash
   node scripts/migrate-with-service-role.js
   ```

### Benefits:
- ✅ RLS enabled for security
- ✅ Public can read data
- ✅ Only service role can write
- ✅ Good for public applications

---

## 🚀 **Quick Start (Recommended)**

For the most secure and scalable setup:

1. **Get your service role key from Supabase dashboard**

2. **Update `.env.local`:**
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   VITE_SUPABASE_SERVICE_KEY=your-service-role-key-here
   VITE_USE_SUPABASE=true
   VITE_USE_SERVICE_ROLE=true
   VITE_ENABLE_RLS=true
   ```

3. **Run the secure setup:**
   ```bash
   # Set up RLS policies
   cat scripts/setup-secure-rls.sql
   # (Copy and run in Supabase SQL editor)
   
   # Migrate data
   node scripts/migrate-with-service-role.js
   
   # Start the app
   npm run dev
   ```

## 🔧 **Troubleshooting**

### "Service role key not found"
- Get it from: Supabase Dashboard > Project Settings > API > service_role key
- Make sure it's the `service_role` key, not the `anon` key

### "RLS still blocking operations"
- Check that you ran the SQL setup script
- Verify the service role key is correct
- Check that RLS policies are properly created

### "Migration fails"
- Ensure your database schema matches the expected structure
- Check that all tables exist
- Verify your service role key has proper permissions

## 📊 **Production Considerations**

- **Use Approach 1** (Service Role) for production
- **Never disable RLS** in production
- **Use environment-specific keys** for different environments
- **Monitor access patterns** in Supabase dashboard
- **Regular security audits** of RLS policies

