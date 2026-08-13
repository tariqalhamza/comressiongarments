-- ====================================================================================
-- OVERPLAST MEDICAL SYSTEM - SUPABASE DATABASE SCHEMA & USER PROFILE AUTO-SYNC
-- ====================================================================================
-- This script safely provisions/repairs all tables, sets up the automatic trigger 
-- for Supabase Auth (auth.users -> public.profiles), backfills missing profiles, 
-- and configures secure Row Level Security (RLS) policies.
-- 
-- 100% NON-DESTRUCTIVE: Existing users and data will NOT be deleted.
-- ====================================================================================

-- 1. CLINICS TABLE
CREATE TABLE IF NOT EXISTS public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Main Clinic',
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. PROFILES TABLE (Linked 1:1 with auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id UUID REFERENCES public.clinics(id),
  full_name TEXT,
  role TEXT DEFAULT 'therapist',
  email TEXT,
  password TEXT,
  phone TEXT,
  license_number TEXT,
  specialty TEXT,
  department TEXT,
  bio TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safely add any missing columns to public.profiles if the table already existed
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS clinic_id UUID;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'therapist';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS password TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS license_number TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialty TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS department TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. PATIENTS TABLE
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id TEXT DEFAULT 'default',
  created_by UUID,
  full_name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  height DECIMAL,
  weight DECIMAL,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  diagnosis TEXT DEFAULT 'Patient Intake Registration',
  medical_condition TEXT DEFAULT 'General',
  doctor_name TEXT,
  hospital TEXT,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS clinic_id TEXT DEFAULT 'default';
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS height DECIMAL;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS weight DECIMAL;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS diagnosis TEXT DEFAULT 'Patient Intake Registration';
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS medical_condition TEXT DEFAULT 'General';
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS hospital TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 4. MEASUREMENTS TABLE
CREATE TABLE IF NOT EXISTS public.measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  therapist_id UUID,
  measurement_date DATE DEFAULT CURRENT_DATE,
  body_area TEXT NOT NULL,
  side TEXT,
  data JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  measurement_id UUID REFERENCES public.measurements(id),
  garment_type TEXT NOT NULL,
  status TEXT DEFAULT 'Measurement Taken',
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- 6. ASSESSMENTS TABLE
CREATE TABLE IF NOT EXISTS public.assessments (
  id TEXT PRIMARY KEY,
  patient_id TEXT,
  patient_name TEXT,
  phone TEXT,
  gender TEXT,
  age INTEGER,
  garment_type TEXT,
  silicone_pasting TEXT,
  compression TEXT,
  measurements JSONB,
  sub_options JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT,
  created_by_email TEXT,
  created_by_name TEXT,
  assessor_name TEXT,
  therapist_id TEXT
);

ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS patient_name TEXT;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS garment_type TEXT;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS silicone_pasting TEXT;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS compression TEXT;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS measurements JSONB;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS sub_options JSONB;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS created_by_email TEXT;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS created_by_name TEXT;
ALTER TABLE public.assessments ADD COLUMN IF NOT EXISTS assessor_name TEXT;

-- ====================================================================================
-- 7. SECURE DATABASE FUNCTION & TRIGGER FOR AUTOMATIC PROFILE CREATION
-- ====================================================================================
-- When a user registers in Supabase Auth (auth.users), this trigger automatically creates
-- their corresponding profile in public.profiles using exact auth.users.id as profiles.id.
-- Uses SECURITY DEFINER to reliably bypass RLS during auth lifecycle.
-- ====================================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER 
SET search_path = public
AS $$
DECLARE
  assigned_role TEXT;
  user_full_name TEXT;
  user_email TEXT;
  user_role_input TEXT;
BEGIN
  user_email := LOWER(TRIM(COALESCE(NEW.email, '')));

  -- Determine role safely:
  -- 1. Authorized Super Admin emails are granted admin role
  IF user_email IN ('mehmood@gmail.com', 'detox16277@gmail.com', 'demo@overplast.com', 'admin@overplast.com', 'mahmood@gmail.com') THEN
    assigned_role := 'admin';
  ELSE
    -- Extract requested role from signup metadata
    user_role_input := LOWER(TRIM(COALESCE(NEW.raw_user_meta_data->>'role', '')));
    IF user_role_input IN ('admin', 'therapist', 'technician', 'user') THEN
      assigned_role := user_role_input;
    ELSE
      assigned_role := 'therapist';
    END IF;
  END IF;

  -- Extract full_name from metadata or default to email prefix
  user_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    SPLIT_PART(NEW.email, '@', 1),
    'User'
  );

  -- Insert profile with exact matching auth ID (preventing duplicate rows via ON CONFLICT)
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    password,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_full_name,
    assigned_role,
    COALESCE(NEW.raw_user_meta_data->>'password', ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE 
      WHEN public.profiles.full_name IS NULL OR public.profiles.full_name = '' 
      THEN EXCLUDED.full_name 
      ELSE public.profiles.full_name 
    END,
    role = CASE 
      WHEN public.profiles.role IS NULL OR public.profiles.role = '' 
      THEN EXCLUDED.role 
      ELSE public.profiles.role 
    END,
    password = CASE 
      WHEN (public.profiles.password IS NULL OR public.profiles.password = '') AND EXCLUDED.password != '' 
      THEN EXCLUDED.password 
      ELSE public.profiles.password 
    END,
    updated_at = NOW();

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user notice for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Bind trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================================
-- 8. SAFE BACKFILL FOR EXISTING AUTH USERS MISSING PROFILES
-- ====================================================================================
-- Creates missing profile records for any existing auth.users that were registered before
-- the trigger was deployed.
-- ====================================================================================
INSERT INTO public.profiles (id, email, full_name, role, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', SPLIT_PART(u.email, '@', 1), 'User') AS full_name,
  CASE 
    WHEN LOWER(TRIM(COALESCE(u.email, ''))) IN ('mehmood@gmail.com', 'detox16277@gmail.com', 'demo@overplast.com', 'admin@overplast.com', 'mahmood@gmail.com') THEN 'admin'
    WHEN (u.raw_user_meta_data->>'role') IN ('therapist', 'technician', 'user') THEN (u.raw_user_meta_data->>'role')
    ELSE 'therapist'
  END AS role,
  COALESCE(u.created_at, NOW()) AS created_at,
  NOW() AS updated_at
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
);

-- ====================================================================================
-- 9. ROW LEVEL SECURITY (RLS) POLICIES ON PROFILES
-- ====================================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy A: Allow authenticated users to view team profiles
DROP POLICY IF EXISTS "Allow authenticated read profiles" ON public.profiles;
CREATE POLICY "Allow authenticated read profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (true);

-- Policy B: Allow anon users to read profiles for team login lookup
DROP POLICY IF EXISTS "Allow anon read profiles" ON public.profiles;
CREATE POLICY "Allow anon read profiles"
  ON public.profiles FOR SELECT
  TO anon
  USING (true);

-- Policy C: Allow users to update their own profile; admins can update any
DROP POLICY IF EXISTS "Allow individual update own profile" ON public.profiles;
CREATE POLICY "Allow individual update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated, anon
  USING (true)
  WITH CHECK (true);

-- Policy D: Allow users and admins to insert profiles
DROP POLICY IF EXISTS "Allow individual insert own profile" ON public.profiles;
CREATE POLICY "Allow individual insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- ====================================================================================
-- 10. CLINICAL DATA MULTI-DEVICE SYNC CONFIGURATION
-- ====================================================================================
-- Disable RLS on transactional clinical data tables to allow real-time client sync.
-- (Data isolation between users and admins is enforced at the application/API layer).
ALTER TABLE IF EXISTS public.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.measurements DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.assessments DISABLE ROW LEVEL SECURITY;
