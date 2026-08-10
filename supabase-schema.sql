-- ====================================================================================
-- OPTION 1: 100% SAFE REPAIR SCRIPT (No Data Loss / Koi Data Delete Nahi Hoga)
-- Use this to fix any missing columns or RLS issues on the existing "patients" table.
-- ====================================================================================

-- 1. Ensure the patients table exists
CREATE TABLE IF NOT EXISTS patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Safely add any missing columns if they don't exist
ALTER TABLE patients ADD COLUMN IF NOT EXISTS clinic_id TEXT DEFAULT 'default';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS created_by UUID;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS height DECIMAL;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS weight DECIMAL;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS diagnosis TEXT DEFAULT 'Patient Intake Registration';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS medical_condition TEXT DEFAULT 'General';
ALTER TABLE patients ADD COLUMN IF NOT EXISTS doctor_name TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS hospital TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. Disable Row Level Security (RLS) on patients to allow multi-device live sync
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;


-- ====================================================================================
-- OPTION 2: RESET ONLY "PATIENTS" TABLE (Will delete existing patient data)
-- If you want to completely delete and recreate ONLY the patients table:
-- ====================================================================================
/*
-- Step A: Safely drop measurements & orders as they depend on patients (or you can keep them if empty)
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS measurements CASCADE;

-- Step B: Recreate ONLY the patients table
DROP TABLE IF EXISTS patients CASCADE;

CREATE TABLE patients (
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

-- Step C: Re-create dependent tables
CREATE TABLE measurements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID,
  measurement_date DATE DEFAULT CURRENT_DATE,
  body_area TEXT NOT NULL,
  side TEXT,
  data JSONB NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  measurement_id UUID REFERENCES measurements(id),
  garment_type TEXT NOT NULL,
  status TEXT DEFAULT 'Measurement Taken',
  config JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID
);

-- Disable RLS to sync instantly
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE measurements DISABLE ROW LEVEL SECURITY;
ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
*/

-- ====================================================================================
-- OPTION 3: ASSESSMENTS TABLE (Sync Clinical Assessments Across All Devices)
-- ====================================================================================
CREATE TABLE IF NOT EXISTS assessments (
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

-- Safely add any missing columns to assessments table
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS patient_name TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS age INTEGER;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS garment_type TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS silicone_pasting TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS compression TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS measurements JSONB;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS sub_options JSONB;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS created_by_email TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS created_by_name TEXT;
ALTER TABLE assessments ADD COLUMN IF NOT EXISTS assessor_name TEXT;

-- Disable Row Level Security (RLS) on assessments for real-time multi-device sync
ALTER TABLE assessments DISABLE ROW LEVEL SECURITY;

-- ====================================================================================
-- OPTION 4: PROFILES TABLE SAFE REPAIR (Sync Clinician Logins Across Devices)
-- Run this in Supabase SQL Editor if profiles are not syncing or logins fail.
-- ====================================================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY,
  full_name TEXT,
  role TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Safely add email and password columns for multi-device credentials sharing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password TEXT;

-- Disable Row Level Security (RLS) on profiles so any device can sync and authenticate
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;


