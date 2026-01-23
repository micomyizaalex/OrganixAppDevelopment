-- =====================================================
-- Enhanced Case Fields for Better Donor Matching
-- Created: January 20, 2026
-- Description: Add medical information fields to cases table
-- =====================================================

-- Add new fields to cases table for better donor matching
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS blood_type TEXT CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'));
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS patient_age INTEGER;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS latest_lab_results TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS chronic_illnesses TEXT;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS additional_medical_info TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.cases.blood_type IS 'Patient blood type for donor matching';
COMMENT ON COLUMN public.cases.patient_age IS 'Patient age at time of case creation';
COMMENT ON COLUMN public.cases.latest_lab_results IS 'Latest laboratory test results or file reference';
COMMENT ON COLUMN public.cases.chronic_illnesses IS 'Chronic medical conditions that may affect matching';
COMMENT ON COLUMN public.cases.additional_medical_info IS 'Any other relevant medical information for donor matching';

-- Create index for blood type searches (common filter for matching)
CREATE INDEX IF NOT EXISTS idx_cases_blood_type ON public.cases(blood_type);
