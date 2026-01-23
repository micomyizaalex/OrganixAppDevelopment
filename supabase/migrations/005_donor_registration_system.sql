-- =====================================================
-- Donor Registration System Migration
-- Created: January 23, 2026
-- Description: Extended tables for comprehensive donor registration
--              Supports living and deceased donor workflows
-- =====================================================

-- =====================================================
-- DONOR MEDICAL INFO TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.donor_medical_info (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID NOT NULL REFERENCES public.donors(user_id) ON DELETE CASCADE,
  blood_type TEXT NOT NULL CHECK (blood_type IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
  age INTEGER CHECK (age >= 18 AND age <= 100),
  gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say')),
  allergies TEXT,
  medical_conditions TEXT,
  medical_history TEXT,
  has_recent_tests BOOLEAN DEFAULT false,
  recent_tests_description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(donor_id)
);

-- =====================================================
-- DONOR ORGANS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.donor_organs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID NOT NULL REFERENCES public.donors(user_id) ON DELETE CASCADE,
  organ_name TEXT NOT NULL CHECK (organ_name IN (
    'kidney', 
    'liver', 
    'partial_liver',
    'heart', 
    'lung', 
    'pancreas', 
    'intestine',
    'bone_marrow',
    'blood',
    'cornea',
    'skin',
    'bone',
    'heart_valves'
  )),
  is_living_donation BOOLEAN NOT NULL DEFAULT false,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'matched', 'donated', 'unavailable')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(donor_id, organ_name)
);

-- =====================================================
-- EMERGENCY CONTACTS TABLE
-- =====================================================

CREATE TABLE IF NOT EXISTS public.emergency_contacts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  donor_id UUID NOT NULL REFERENCES public.donors(user_id) ON DELETE CASCADE,
  contact_type TEXT CHECK (contact_type IN ('next_of_kin', 'emergency', 'legal_representative')),
  full_name TEXT NOT NULL,
  relationship TEXT,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER trigger_donor_medical_info_updated_at
BEFORE UPDATE ON public.donor_medical_info
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_donor_organs_updated_at
BEFORE UPDATE ON public.donor_organs
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trigger_emergency_contacts_updated_at
BEFORE UPDATE ON public.emergency_contacts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE public.donor_medical_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donor_organs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;

-- Donor Medical Info Policies
CREATE POLICY "Donors can view own medical info"
ON public.donor_medical_info FOR SELECT
USING (auth.uid() = donor_id);

CREATE POLICY "Donors can insert own medical info"
ON public.donor_medical_info FOR INSERT
WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Donors can update own medical info"
ON public.donor_medical_info FOR UPDATE
USING (auth.uid() = donor_id)
WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Admins can view all medical info"
ON public.donor_medical_info FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.users
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

-- Donor Organs Policies
CREATE POLICY "Donors can view own organs"
ON public.donor_organs FOR SELECT
USING (auth.uid() = donor_id);

CREATE POLICY "Donors can insert own organs"
ON public.donor_organs FOR INSERT
WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Donors can update own organs"
ON public.donor_organs FOR UPDATE
USING (auth.uid() = donor_id)
WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Donors can delete own organs"
ON public.donor_organs FOR DELETE
USING (auth.uid() = donor_id);

CREATE POLICY "Admins can view all donor organs"
ON public.donor_organs FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.users
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

CREATE POLICY "Hospitals can view available organs"
ON public.donor_organs FOR SELECT
USING (
  status = 'available' AND
  EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid() AND users.role = 'hospital'
  )
);

-- Emergency Contacts Policies
CREATE POLICY "Donors can view own emergency contacts"
ON public.emergency_contacts FOR SELECT
USING (auth.uid() = donor_id);

CREATE POLICY "Donors can insert own emergency contacts"
ON public.emergency_contacts FOR INSERT
WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Donors can update own emergency contacts"
ON public.emergency_contacts FOR UPDATE
USING (auth.uid() = donor_id)
WITH CHECK (auth.uid() = donor_id);

CREATE POLICY "Donors can delete own emergency contacts"
ON public.emergency_contacts FOR DELETE
USING (auth.uid() = donor_id);

CREATE POLICY "Admins can view all emergency contacts"
ON public.emergency_contacts FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.users
  WHERE users.id = auth.uid() AND users.role = 'admin'
));

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

CREATE INDEX idx_donor_medical_info_donor_id ON public.donor_medical_info(donor_id);
CREATE INDEX idx_donor_medical_info_blood_type ON public.donor_medical_info(blood_type);
CREATE INDEX idx_donor_organs_donor_id ON public.donor_organs(donor_id);
CREATE INDEX idx_donor_organs_organ_name ON public.donor_organs(organ_name);
CREATE INDEX idx_donor_organs_status ON public.donor_organs(status);
CREATE INDEX idx_donor_organs_blood_matching ON public.donor_organs(organ_name, status) 
  WHERE status = 'available';
CREATE INDEX idx_emergency_contacts_donor_id ON public.emergency_contacts(donor_id);

-- =====================================================
-- VIEWS FOR DONOR MATCHING
-- =====================================================

CREATE OR REPLACE VIEW public.available_donors AS
SELECT 
  d.user_id as donor_id,
  d.donor_type,
  dmi.blood_type,
  dmi.age,
  dmi.gender,
  dmi.medical_conditions,
  array_agg(DISTINCT dorg.organ_name) as available_organs,
  d.consent_given,
  d.created_at
FROM public.donors d
INNER JOIN public.donor_medical_info dmi ON d.user_id = dmi.donor_id
LEFT JOIN public.donor_organs dorg ON d.user_id = dorg.donor_id
WHERE 
  d.consent_given = true 
  AND dorg.status = 'available'
GROUP BY 
  d.user_id, 
  d.donor_type, 
  dmi.blood_type, 
  dmi.age, 
  dmi.gender,
  dmi.medical_conditions,
  d.consent_given, 
  d.created_at;

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to validate living donor organ selection
CREATE OR REPLACE FUNCTION validate_living_donor_organs()
RETURNS TRIGGER AS $$
DECLARE
  donor_type_val donor_type;
BEGIN
  -- Get donor type
  SELECT donor_type INTO donor_type_val
  FROM public.donors
  WHERE user_id = NEW.donor_id;

  -- If living donor, only allow specific organs
  IF donor_type_val = 'living' AND NEW.is_living_donation = true THEN
    IF NEW.organ_name NOT IN ('kidney', 'partial_liver', 'bone_marrow', 'blood') THEN
      RAISE EXCEPTION 'Living donors can only donate: kidney, partial_liver, bone_marrow, or blood';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_living_donor_organs
BEFORE INSERT OR UPDATE ON public.donor_organs
FOR EACH ROW
EXECUTE FUNCTION validate_living_donor_organs();

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE public.donor_medical_info IS 'Stores comprehensive medical information for donors';
COMMENT ON TABLE public.donor_organs IS 'Tracks organs that donors are willing to donate';
COMMENT ON TABLE public.emergency_contacts IS 'Emergency and next-of-kin contact information for donors';
COMMENT ON VIEW public.available_donors IS 'View for matching available donors with patients';
