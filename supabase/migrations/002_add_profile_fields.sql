-- =====================================================
-- Profile Management Schema
-- Created: January 20, 2026
-- Description: Add profile fields for patients, donors, and sponsors
-- =====================================================

-- =====================================================
-- Add profile fields to PATIENTS TABLE
-- =====================================================

ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS residential_address TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS national_id TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS health_insurance_number TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Add trigger for patients updated_at
CREATE TRIGGER trigger_patients_updated_at
BEFORE UPDATE ON public.patients
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- Add profile fields to DONORS TABLE
-- =====================================================

ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));
ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS residential_address TEXT;
ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS national_id TEXT;
ALTER TABLE public.donors ADD COLUMN IF NOT EXISTS health_insurance_number TEXT;

-- =====================================================
-- Add profile fields to SPONSORS TABLE
-- =====================================================

ALTER TABLE public.sponsors ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.sponsors ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE public.sponsors ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));
ALTER TABLE public.sponsors ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE public.sponsors ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.sponsors ADD COLUMN IF NOT EXISTS residential_address TEXT;
ALTER TABLE public.sponsors ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
ALTER TABLE public.sponsors ADD COLUMN IF NOT EXISTS national_id TEXT;
ALTER TABLE public.sponsors ADD COLUMN IF NOT EXISTS health_insurance_number TEXT;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on patients, donors, and sponsors tables
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;

-- Patients: Users can view and update only their own profile
CREATE POLICY "Users can view their own patient profile"
  ON public.patients
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own patient profile"
  ON public.patients
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own patient profile"
  ON public.patients
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Donors: Users can view and update only their own profile
CREATE POLICY "Users can view their own donor profile"
  ON public.donors
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own donor profile"
  ON public.donors
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own donor profile"
  ON public.donors
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Sponsors: Users can view and update only their own profile
CREATE POLICY "Users can view their own sponsor profile"
  ON public.sponsors
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own sponsor profile"
  ON public.sponsors
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sponsor profile"
  ON public.sponsors
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- Helper Function for Profile Updates
-- =====================================================

-- Function to get the table name based on user role
CREATE OR REPLACE FUNCTION get_profile_table_name(role_name TEXT)
RETURNS TEXT AS $$
BEGIN
  CASE role_name
    WHEN 'patient' THEN RETURN 'patients';
    WHEN 'donor' THEN RETURN 'donors';
    WHEN 'sponsor' THEN RETURN 'sponsors';
    ELSE RETURN NULL;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Comments for Documentation
-- =====================================================

COMMENT ON COLUMN public.patients.full_name IS 'Full legal name of the patient';
COMMENT ON COLUMN public.patients.date_of_birth IS 'Date of birth';
COMMENT ON COLUMN public.patients.gender IS 'Gender identity';
COMMENT ON COLUMN public.patients.phone IS 'Primary contact phone number';
COMMENT ON COLUMN public.patients.email IS 'Contact email address';
COMMENT ON COLUMN public.patients.residential_address IS 'Full residential address';
COMMENT ON COLUMN public.patients.emergency_contact IS 'Emergency contact details (name and phone)';
COMMENT ON COLUMN public.patients.national_id IS 'National identification number';
COMMENT ON COLUMN public.patients.health_insurance_number IS 'Health insurance policy number';

COMMENT ON COLUMN public.donors.full_name IS 'Full legal name of the donor';
COMMENT ON COLUMN public.donors.date_of_birth IS 'Date of birth';
COMMENT ON COLUMN public.donors.gender IS 'Gender identity';
COMMENT ON COLUMN public.donors.phone IS 'Primary contact phone number';
COMMENT ON COLUMN public.donors.email IS 'Contact email address';
COMMENT ON COLUMN public.donors.residential_address IS 'Full residential address';
COMMENT ON COLUMN public.donors.emergency_contact IS 'Emergency contact details (name and phone)';
COMMENT ON COLUMN public.donors.national_id IS 'National identification number';
COMMENT ON COLUMN public.donors.health_insurance_number IS 'Health insurance policy number';

COMMENT ON COLUMN public.sponsors.full_name IS 'Full legal name of the sponsor';
COMMENT ON COLUMN public.sponsors.date_of_birth IS 'Date of birth';
COMMENT ON COLUMN public.sponsors.gender IS 'Gender identity';
COMMENT ON COLUMN public.sponsors.phone IS 'Primary contact phone number';
COMMENT ON COLUMN public.sponsors.email IS 'Contact email address';
COMMENT ON COLUMN public.sponsors.residential_address IS 'Full residential address';
COMMENT ON COLUMN public.sponsors.emergency_contact IS 'Emergency contact details (name and phone)';
COMMENT ON COLUMN public.sponsors.national_id IS 'National identification number';
COMMENT ON COLUMN public.sponsors.health_insurance_number IS 'Health insurance policy number';
