-- Add original_filename column to apps table to preserve uploaded file names
ALTER TABLE public.apps 
ADD COLUMN IF NOT EXISTS original_filename text;

-- Add comment for documentation
COMMENT ON COLUMN public.apps.original_filename IS 'Original filename of the uploaded app file (e.g., himigly.apk)';
