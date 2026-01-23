INSERT INTO storage.buckets (id, name, public)
VALUES ('case-files', 'case-files', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for case-files bucket

-- Policy: Patients can upload files to their own cases
CREATE POLICY "Patients can upload files to their cases"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'case-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Patients can view their own case files
CREATE POLICY "Patients can view their own case files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'case-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Hospitals can view case files for assigned cases
CREATE POLICY "Hospitals can view assigned case files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'case-files' 
  AND EXISTS (
    SELECT 1 FROM public.cases c
    JOIN public.hospitals h ON h.user_id = auth.uid()
    WHERE c.assigned_hospital_id = auth.uid()
    AND (storage.foldername(name))[1] = c.patient_id::text
  )
);

-- Policy: Admins can view all case files
CREATE POLICY "Admins can view all case files"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'case-files' 
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Patients can delete their own case files
CREATE POLICY "Patients can delete their own case files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'case-files' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Add file URL columns to cases table
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS lab_results_files JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.cases ADD COLUMN IF NOT EXISTS medical_info_files JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.cases.lab_results_files IS 'Array of file objects for lab results: [{name, url, size, type}]';
COMMENT ON COLUMN public.cases.medical_info_files IS 'Array of file objects for other medical documents: [{name, url, size, type}]';

-- Create index for file searches
CREATE INDEX IF NOT EXISTS idx_cases_lab_files ON public.cases USING GIN (lab_results_files);
CREATE INDEX IF NOT EXISTS idx_cases_medical_files ON public.cases USING GIN (medical_info_files);
