# Supabase Database Schema

-- Clinics Table
CREATE TABLE clinics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Profiles Table (Role-based access)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  clinic_id UUID REFERENCES clinics(id),
  full_name TEXT,
  role TEXT CHECK (role IN ('admin', 'therapist', 'technician')) DEFAULT 'therapist',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patients Table
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clinic_id UUID REFERENCES clinics(id),
  full_name TEXT NOT NULL,
  age INTEGER,
  gender TEXT,
  height DECIMAL,
  weight DECIMAL,
  phone TEXT,
  email TEXT,
  address TEXT,
  diagnosis TEXT,
  medical_condition TEXT,
  doctor_name TEXT,
  notes TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Measurements Table
CREATE TABLE measurements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  therapist_id UUID REFERENCES profiles(id),
  measurement_date DATE DEFAULT CURRENT_DATE,
  body_area TEXT NOT NULL, -- 'Upper Limb', 'Lower Limb', 'Torso'
  side TEXT CHECK (side IN ('left', 'right', 'both')),
  data JSONB NOT NULL, -- Stores all point measurements
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Orders Table
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  measurement_id UUID REFERENCES measurements(id),
  garment_type TEXT NOT NULL,
  status TEXT DEFAULT 'Measurement Taken' CHECK (status IN ('Measurement Taken', 'Approved', 'In Production', 'Quality Check', 'Delivered')),
  config JSONB NOT NULL, -- Garment options (fabric, class, options)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Simple policy: users can see data from their clinic
CREATE POLICY clinic_isolation ON patients 
  USING (clinic_id IN (SELECT clinic_id FROM profiles WHERE id = auth.uid()));
