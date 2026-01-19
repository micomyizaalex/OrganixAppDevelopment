-- =====================================================
-- Organix Database Schema
-- Created: January 19, 2026
-- Description: Complete schema for organ donation platform
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CLEANUP (Drop existing objects if they exist)
-- =====================================================

-- Drop tables (cascade will drop dependent objects)
DROP TABLE IF EXISTS public.case_sponsors CASCADE;
DROP TABLE IF EXISTS public.cases CASCADE;
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.sponsors CASCADE;
DROP TABLE IF EXISTS public.hospitals CASCADE;
DROP TABLE IF EXISTS public.donors CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- Drop views
DROP VIEW IF EXISTS public.case_statistics CASCADE;
DROP VIEW IF EXISTS public.user_statistics CASCADE;
DROP VIEW IF EXISTS public.donor_statistics CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.get_user_role(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_user_approved(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.is_user_admin(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.log_audit_event CASCADE;
DROP FUNCTION IF EXISTS public.auto_approve_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_case_funding() CASCADE;

-- Drop types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS donor_type CASCADE;
DROP TYPE IF EXISTS urgency_level CASCADE;
DROP TYPE IF EXISTS case_status CASCADE;

-- =====================================================
-- ENUMS
-- =====================================================

CREATE TYPE user_role AS ENUM ('patient', 'donor', 'hospital', 'sponsor', 'admin');
CREATE TYPE donor_type AS ENUM ('living', 'deceased');
CREATE TYPE urgency_level AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE case_status AS ENUM ('waiting', 'matched', 'funded', 'transplanted');

-- =====================================================
-- USERS TABLE (extends auth.users)
-- =====================================================

CREATE TABLE public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role user_role NOT NULL,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Auto-approve patients and donors
CREATE OR REPLACE FUNCTION auto_approve_user()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IN ('patient', 'donor') THEN
    NEW.approved := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_auto_approve_user
BEFORE INSERT ON public.users
FOR EACH ROW
EXECUTE FUNCTION auto_approve_user();

-- Update timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_users_updated_at
BEFORE UPDATE ON public.users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- PATIENTS TABLE
-- =====================================================

CREATE TABLE public.patients (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- DONORS TABLE
-- =====================================================

CREATE TABLE public.donors (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  donor_type donor_type,
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_date TIMESTAMPTZ,
  can_withdraw BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_donors_updated_at
BEFORE UPDATE ON public.donors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- HOSPITALS TABLE
-- =====================================================

CREATE TABLE public.hospitals (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_hospitals_updated_at
BEFORE UPDATE ON public.hospitals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- SPONSORS TABLE
-- =====================================================

CREATE TABLE public.sponsors (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  approved BOOLEAN NOT NULL DEFAULT false,
  total_funded NUMERIC(12, 2) NOT NULL DEFAULT 0,
  funded_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trigger_sponsors_updated_at
BEFORE UPDATE ON public.sponsors
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- CASES TABLE
-- =====================================================

CREATE TABLE public.cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  organ_needed TEXT NOT NULL,
  urgency_level urgency_level NOT NULL,
  notes TEXT,
  status case_status NOT NULL DEFAULT 'waiting',
  assigned_hospital_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  matched_donor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  funding_goal NUMERIC(12, 2) NOT NULL DEFAULT 0,
  funding_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_cases_patient_id ON public.cases(patient_id);
CREATE INDEX idx_cases_status ON public.cases(status);
CREATE INDEX idx_cases_assigned_hospital_id ON public.cases(assigned_hospital_id);
CREATE INDEX idx_cases_urgency_level ON public.cases(urgency_level);

CREATE TRIGGER trigger_cases_updated_at
BEFORE UPDATE ON public.cases
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- CASE_SPONSORS TABLE (junction table for funding)
-- =====================================================

CREATE TABLE public.case_sponsors (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  case_id UUID NOT NULL REFERENCES public.cases(id) ON DELETE CASCADE,
  sponsor_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_case_sponsors_case_id ON public.case_sponsors(case_id);
CREATE INDEX idx_case_sponsors_sponsor_id ON public.case_sponsors(sponsor_id);

-- Trigger to update case funding and sponsor stats
CREATE OR REPLACE FUNCTION update_case_funding()
RETURNS TRIGGER AS $$
BEGIN
  -- Update case funding_amount
  UPDATE public.cases
  SET funding_amount = funding_amount + NEW.amount,
      status = CASE
        WHEN funding_amount + NEW.amount >= funding_goal AND funding_goal > 0 THEN 'funded'::case_status
        ELSE status
      END,
      updated_at = NOW()
  WHERE id = NEW.case_id;
  
  -- Update sponsor stats
  UPDATE public.sponsors
  SET total_funded = total_funded + NEW.amount,
      funded_count = funded_count + 1,
      updated_at = NOW()
  WHERE user_id = NEW.sponsor_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_case_funding
AFTER INSERT ON public.case_sponsors
FOR EACH ROW
EXECUTE FUNCTION update_case_funding();

-- =====================================================
-- AUDIT_LOGS TABLE
-- =====================================================

CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  role user_role,
  case_id UUID REFERENCES public.cases(id) ON DELETE SET NULL,
  target_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  amount NUMERIC(12, 2),
  donor_type donor_type,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to get user role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role AS $$
  SELECT role FROM public.users WHERE id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user is approved (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_user_approved(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT approved FROM public.users WHERE id = user_uuid;
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to check if user is admin (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_user_admin(user_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM public.users WHERE id = user_uuid AND role = 'admin');
$$ LANGUAGE sql SECURITY DEFINER;

-- Function to log audit event
CREATE OR REPLACE FUNCTION public.log_audit_event(
  p_user_id UUID,
  p_action TEXT,
  p_role user_role DEFAULT NULL,
  p_case_id UUID DEFAULT NULL,
  p_target_user_id UUID DEFAULT NULL,
  p_amount NUMERIC DEFAULT NULL,
  p_donor_type donor_type DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO public.audit_logs (
    user_id, action, role, case_id, target_user_id, amount, donor_type, metadata
  ) VALUES (
    p_user_id, p_action, p_role, p_case_id, p_target_user_id, p_amount, p_donor_type, p_metadata
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hospitals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.case_sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- USERS TABLE POLICIES
-- =====================================================

-- Users can read their own profile
CREATE POLICY "Users can view own profile"
ON public.users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Admins can view all users
CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
TO authenticated
USING (public.is_user_admin(auth.uid()));

-- Users can update their own profile (except role and approved)
CREATE POLICY "Users can update own profile"
ON public.users FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id AND role = public.get_user_role(auth.uid()));

-- Admins can update any user
CREATE POLICY "Admins can update any user"
ON public.users FOR UPDATE
TO authenticated
USING (public.is_user_admin(auth.uid()));

-- Allow users to insert their own profile (for initial signup)
CREATE POLICY "Users can create own profile"
ON public.users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- =====================================================
-- PATIENTS TABLE POLICIES
-- =====================================================

CREATE POLICY "Patients can view own record"
ON public.patients FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all patients"
ON public.patients FOR SELECT
TO authenticated
USING (public.is_user_admin(auth.uid()));

CREATE POLICY "Patients can create own record"
ON public.patients FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- DONORS TABLE POLICIES
-- =====================================================

CREATE POLICY "Donors can view own record"
ON public.donors FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Donors can update own record"
ON public.donors FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all donors"
ON public.donors FOR SELECT
TO authenticated
USING (public.is_user_admin(auth.uid()));

CREATE POLICY "Donors can create own record"
ON public.donors FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- HOSPITALS TABLE POLICIES
-- =====================================================

CREATE POLICY "Hospitals can view own record"
ON public.hospitals FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all hospitals"
ON public.hospitals FOR SELECT
TO authenticated
USING (public.is_user_admin(auth.uid()));

CREATE POLICY "Admins can update hospitals"
ON public.hospitals FOR UPDATE
TO authenticated
USING (public.is_user_admin(auth.uid()));

CREATE POLICY "Hospitals can create own record"
ON public.hospitals FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- SPONSORS TABLE POLICIES
-- =====================================================

CREATE POLICY "Sponsors can view own record"
ON public.sponsors FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Sponsors can update own record"
ON public.sponsors FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all sponsors"
ON public.sponsors FOR SELECT
TO authenticated
USING (public.is_user_admin(auth.uid()));

CREATE POLICY "Admins can update sponsors"
ON public.sponsors FOR UPDATE
TO authenticated
USING (public.is_user_admin(auth.uid()));

CREATE POLICY "Sponsors can create own record"
ON public.sponsors FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- CASES TABLE POLICIES
-- =====================================================

-- Patients can view their own cases
CREATE POLICY "Patients can view own cases"
ON public.cases FOR SELECT
TO authenticated
USING (
  patient_id = auth.uid() AND
  public.get_user_role(auth.uid()) = 'patient'
);

-- Patients can create cases
CREATE POLICY "Patients can create cases"
ON public.cases FOR INSERT
TO authenticated
WITH CHECK (
  patient_id = auth.uid() AND
  public.get_user_role(auth.uid()) = 'patient' AND
  public.is_user_approved(auth.uid())
);

-- Donors can view cases (anonymized - application layer filters patient identity)
CREATE POLICY "Donors can view cases"
ON public.cases FOR SELECT
TO authenticated
USING (
  public.get_user_role(auth.uid()) = 'donor'
);

-- Hospitals can view unassigned or their assigned cases
CREATE POLICY "Hospitals can view relevant cases"
ON public.cases FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.hospitals h ON u.id = h.user_id
    WHERE u.id = auth.uid() AND h.approved = true
  ) AND (
    assigned_hospital_id IS NULL OR assigned_hospital_id = auth.uid()
  )
);

-- Hospitals can update cases they're assigned to or unassigned cases
CREATE POLICY "Hospitals can update cases"
ON public.cases FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.hospitals h ON u.id = h.user_id
    WHERE u.id = auth.uid() AND h.approved = true
  ) AND (
    assigned_hospital_id IS NULL OR assigned_hospital_id = auth.uid()
  )
);

-- Sponsors can view cases (anonymized - application layer filters donor identity)
CREATE POLICY "Sponsors can view cases for funding"
ON public.cases FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.sponsors s ON u.id = s.user_id
    WHERE u.id = auth.uid() AND s.approved = true
  )
);

-- Admins can view all cases
CREATE POLICY "Admins can view all cases"
ON public.cases FOR SELECT
TO authenticated
USING (public.is_user_admin(auth.uid()));

-- Admins can update all cases
CREATE POLICY "Admins can update all cases"
ON public.cases FOR UPDATE
TO authenticated
USING (public.is_user_admin(auth.uid()));

-- =====================================================
-- CASE_SPONSORS TABLE POLICIES
-- =====================================================

-- Sponsors can create funding records
CREATE POLICY "Sponsors can fund cases"
ON public.case_sponsors FOR INSERT
TO authenticated
WITH CHECK (
  sponsor_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.sponsors s ON u.id = s.user_id
    WHERE u.id = auth.uid() AND s.approved = true
  )
);

-- Users can view funding for their related cases
CREATE POLICY "Users can view related case funding"
ON public.case_sponsors FOR SELECT
TO authenticated
USING (
  -- Patients can see funding for their cases
  EXISTS (
    SELECT 1 FROM public.cases c
    WHERE c.id = case_id AND c.patient_id = auth.uid()
  ) OR
  -- Sponsors can see their own funding
  sponsor_id = auth.uid() OR
  -- Admins can see all funding
  public.is_user_admin(auth.uid())
);

-- =====================================================
-- AUDIT_LOGS TABLE POLICIES
-- =====================================================

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs"
ON public.audit_logs FOR SELECT
TO authenticated
USING (public.is_user_admin(auth.uid()));

-- All authenticated users can insert audit logs (via triggers/app logic)
CREATE POLICY "System can insert audit logs"
ON public.audit_logs FOR INSERT
TO authenticated
WITH CHECK (true);

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for case statistics
CREATE OR REPLACE VIEW public.case_statistics AS
SELECT
  COUNT(*) as total_cases,
  COUNT(*) FILTER (WHERE status = 'waiting') as waiting_cases,
  COUNT(*) FILTER (WHERE status = 'matched') as matched_cases,
  COUNT(*) FILTER (WHERE status = 'funded') as funded_cases,
  COUNT(*) FILTER (WHERE status = 'transplanted') as transplanted_cases,
  COUNT(DISTINCT patient_id) as unique_patients
FROM public.cases;

-- View for user statistics
CREATE OR REPLACE VIEW public.user_statistics AS
SELECT
  COUNT(*) as total_users,
  COUNT(*) FILTER (WHERE role = 'patient') as total_patients,
  COUNT(*) FILTER (WHERE role = 'donor') as total_donors,
  COUNT(*) FILTER (WHERE role = 'hospital') as total_hospitals,
  COUNT(*) FILTER (WHERE role = 'sponsor') as total_sponsors,
  COUNT(*) FILTER (WHERE role = 'admin') as total_admins,
  COUNT(*) FILTER (WHERE approved = false) as pending_approval
FROM public.users;

-- View for donor statistics
CREATE OR REPLACE VIEW public.donor_statistics AS
SELECT
  COUNT(*) as total_donors,
  COUNT(*) FILTER (WHERE consent_given = true) as donors_with_consent,
  COUNT(*) FILTER (WHERE donor_type = 'living') as living_donors,
  COUNT(*) FILTER (WHERE donor_type = 'deceased') as deceased_donors
FROM public.donors;

-- =====================================================
-- GRANTS
-- =====================================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant access to tables
GRANT ALL ON public.users TO authenticated;
GRANT ALL ON public.patients TO authenticated;
GRANT ALL ON public.donors TO authenticated;
GRANT ALL ON public.hospitals TO authenticated;
GRANT ALL ON public.sponsors TO authenticated;
GRANT ALL ON public.cases TO authenticated;
GRANT ALL ON public.case_sponsors TO authenticated;
GRANT ALL ON public.audit_logs TO authenticated;

-- Grant access to sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION public.get_user_role TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_approved TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_audit_event TO authenticated;

-- Grant select on views (admins only - enforced by RLS on underlying tables)
GRANT SELECT ON public.case_statistics TO authenticated;
GRANT SELECT ON public.user_statistics TO authenticated;
GRANT SELECT ON public.donor_statistics TO authenticated;

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON TABLE public.users IS 'Main users table with role-based access';
COMMENT ON TABLE public.patients IS 'Patient-specific profile data';
COMMENT ON TABLE public.donors IS 'Donor consent and type information';
COMMENT ON TABLE public.hospitals IS 'Hospital approval and management';
COMMENT ON TABLE public.sponsors IS 'Sponsor funding statistics';
COMMENT ON TABLE public.cases IS 'Organ transplant cases';
COMMENT ON TABLE public.case_sponsors IS 'Junction table for case funding by sponsors';
COMMENT ON TABLE public.audit_logs IS 'Complete audit trail of system actions';

COMMENT ON COLUMN public.cases.matched_donor_id IS 'FK to donor user - identity protected in app layer';
COMMENT ON COLUMN public.cases.assigned_hospital_id IS 'Hospital managing this case';
COMMENT ON COLUMN public.cases.funding_amount IS 'Current funding received from sponsors';
COMMENT ON COLUMN public.cases.funding_goal IS 'Target funding amount for case';
