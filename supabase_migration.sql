-- Create job_specs table to store tailoring measurements, image URLs, and notes
CREATE TABLE IF NOT EXISTS public.job_specs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_item_id UUID NOT NULL UNIQUE REFERENCES public.job_items(id) ON DELETE CASCADE,
  measurements JSONB NOT NULL DEFAULT '{}'::jsonb,
  image_urls TEXT[] NOT NULL DEFAULT '{}'::text[],
  note TEXT
);

-- Enable Row-Level Security (RLS)
ALTER TABLE public.job_specs ENABLE ROW LEVEL SECURITY;

-- Create Policy to allow authenticated users full access
CREATE POLICY "Allow authenticated users full access on job_specs"
ON public.job_specs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- Create Policy to allow read-only (SELECT) access for public/anon (Tailor App)
CREATE POLICY "Allow public read-only access on job_specs"
ON public.job_specs
FOR SELECT
TO public
USING (true);

-- Enable storage RLS policies for 'job-specifications' bucket
-- Note: The bucket is created programmatically by the app.
-- These policies grant permissions once the bucket is active.

CREATE POLICY "Allow authenticated users to manage spec images"
ON storage.objects FOR ALL TO authenticated
USING (bucket_id = 'job-specifications')
WITH CHECK (bucket_id = 'job-specifications');

CREATE POLICY "Allow public read access to spec images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'job-specifications');

-- Add opening_balance to bishi_members
ALTER TABLE public.bishi_members ADD COLUMN IF NOT EXISTS opening_balance NUMERIC NOT NULL DEFAULT 0.00;
