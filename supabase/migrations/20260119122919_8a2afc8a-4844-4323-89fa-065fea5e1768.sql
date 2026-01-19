-- Create video_subtitles table for storing subtitle tracks per video/language
CREATE TABLE public.video_subtitles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID REFERENCES public.course_materials(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL DEFAULT 'en',
  language_name TEXT NOT NULL DEFAULT 'English',
  subtitle_url TEXT NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  course_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  UNIQUE(material_id, language_code)
);

-- Create video_language_metadata table for localized video titles/descriptions
CREATE TABLE public.video_language_metadata (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID REFERENCES public.course_materials(id) ON DELETE CASCADE,
  language_code TEXT NOT NULL DEFAULT 'en',
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(material_id, language_code)
);

-- Add language_preference column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS language_preference TEXT DEFAULT 'en';

-- Enable RLS on video_subtitles
ALTER TABLE public.video_subtitles ENABLE ROW LEVEL SECURITY;

-- Anyone can view subtitles
CREATE POLICY "Anyone can view video subtitles" 
ON public.video_subtitles 
FOR SELECT 
USING (true);

-- Teachers and admins can manage subtitles
CREATE POLICY "Teachers and admins can insert video subtitles" 
ON public.video_subtitles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Teachers and admins can update video subtitles" 
ON public.video_subtitles 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Teachers and admins can delete video subtitles" 
ON public.video_subtitles 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

-- Enable RLS on video_language_metadata
ALTER TABLE public.video_language_metadata ENABLE ROW LEVEL SECURITY;

-- Anyone can view metadata
CREATE POLICY "Anyone can view video language metadata" 
ON public.video_language_metadata 
FOR SELECT 
USING (true);

-- Teachers and admins can manage metadata
CREATE POLICY "Teachers and admins can insert video language metadata" 
ON public.video_language_metadata 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Teachers and admins can update video language metadata" 
ON public.video_language_metadata 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

CREATE POLICY "Teachers and admins can delete video language metadata" 
ON public.video_language_metadata 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_video_subtitles_updated_at
BEFORE UPDATE ON public.video_subtitles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_video_language_metadata_updated_at
BEFORE UPDATE ON public.video_language_metadata
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();