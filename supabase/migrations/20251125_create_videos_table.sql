-- Create videos table for gallery
CREATE TABLE public.videos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  video_url text NOT NULL,
  thumbnail_url text,
  duration integer, -- duration in seconds
  view_count integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.videos ENABLE ROW LEVEL SECURITY;

-- Allow everyone to view videos
CREATE POLICY "Videos are viewable by everyone" 
ON public.videos 
FOR SELECT 
USING (true);

-- Only admins can insert videos
CREATE POLICY "Only admins can create videos"
ON public.videos
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Only admins can update videos
CREATE POLICY "Only admins can update videos"
ON public.videos
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Only admins can delete videos
CREATE POLICY "Only admins can delete videos"
ON public.videos
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_videos_updated_at
BEFORE UPDATE ON public.videos
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('videos', 'videos', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for video thumbnails
INSERT INTO storage.buckets (id, name, public)
VALUES ('video-thumbnails', 'video-thumbnails', true)
ON CONFLICT (id) DO NOTHING;

-- Allow everyone to view videos
CREATE POLICY "Videos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'videos');

-- Allow authenticated users to upload videos
CREATE POLICY "Authenticated users can upload videos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'videos' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to delete videos
CREATE POLICY "Authenticated users can delete videos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'videos' AND auth.uid() IS NOT NULL);

-- Allow everyone to view video thumbnails
CREATE POLICY "Video thumbnails are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'video-thumbnails');

-- Allow authenticated users to upload video thumbnails
CREATE POLICY "Authenticated users can upload video thumbnails" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'video-thumbnails' AND auth.uid() IS NOT NULL);

-- Allow authenticated users to delete video thumbnails
CREATE POLICY "Authenticated users can delete video thumbnails" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'video-thumbnails' AND auth.uid() IS NOT NULL);
