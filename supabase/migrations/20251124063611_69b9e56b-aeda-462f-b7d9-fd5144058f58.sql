-- Create apps table
CREATE TABLE public.apps (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  platform text NOT NULL CHECK (platform IN ('android', 'windows', 'web')),
  icon_url text,
  file_url text,
  download_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.apps ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view apps
CREATE POLICY "Apps are viewable by everyone" 
ON public.apps 
FOR SELECT 
USING (true);

-- Only authenticated users can insert apps
CREATE POLICY "Authenticated users can create apps" 
ON public.apps 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- Only authenticated users can update apps
CREATE POLICY "Authenticated users can update apps" 
ON public.apps 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Only authenticated users can delete apps
CREATE POLICY "Authenticated users can delete apps" 
ON public.apps 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_apps_updated_at
BEFORE UPDATE ON public.apps
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for app files
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-files', 'app-files', true);

-- Create storage bucket for app icons
INSERT INTO storage.buckets (id, name, public)
VALUES ('app-icons', 'app-icons', true);

-- Allow everyone to view app files
CREATE POLICY "App files are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'app-files');

-- Allow authenticated users to upload app files
CREATE POLICY "Authenticated users can upload app files" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'app-files' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to delete app files
CREATE POLICY "Authenticated users can delete app files" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'app-files' AND auth.uid() IS NOT NULL);

-- Allow everyone to view app icons
CREATE POLICY "App icons are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'app-icons');

-- Allow authenticated users to upload app icons
CREATE POLICY "Authenticated users can upload app icons" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'app-icons' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to delete app icons
CREATE POLICY "Authenticated users can delete app icons" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'app-icons' AND auth.uid() IS NOT NULL);