-- Fix MISSING_RLS: course_materials overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can delete course materials" ON public.course_materials;
DROP POLICY IF EXISTS "Authenticated users can update course materials" ON public.course_materials;
DROP POLICY IF EXISTS "Authenticated users can insert course materials" ON public.course_materials;

-- Create role-restricted policies for course_materials
CREATE POLICY "Teachers and admins can insert course materials"
ON public.course_materials FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'teacher'::app_role)
);

CREATE POLICY "Teachers and admins can update course materials"
ON public.course_materials FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'teacher'::app_role)
);

CREATE POLICY "Teachers and admins can delete course materials"
ON public.course_materials FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'teacher'::app_role)
);

-- Fix MISSING_RLS: video_chapters overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can delete video chapters" ON public.video_chapters;
DROP POLICY IF EXISTS "Authenticated users can update video chapters" ON public.video_chapters;
DROP POLICY IF EXISTS "Authenticated users can insert video chapters" ON public.video_chapters;

-- Create role-restricted policies for video_chapters
CREATE POLICY "Teachers and admins can insert video chapters"
ON public.video_chapters FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'teacher'::app_role)
);

CREATE POLICY "Teachers and admins can update video chapters"
ON public.video_chapters FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'teacher'::app_role)
);

CREATE POLICY "Teachers and admins can delete video chapters"
ON public.video_chapters FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'teacher'::app_role)
);

-- Fix: video_transcripts policies (missing DELETE and fix UPDATE/INSERT)
DROP POLICY IF EXISTS "Authenticated users can insert video transcripts" ON public.video_transcripts;
DROP POLICY IF EXISTS "Authenticated users can update video transcripts" ON public.video_transcripts;

CREATE POLICY "Teachers and admins can insert video transcripts"
ON public.video_transcripts FOR INSERT
TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'teacher'::app_role)
);

CREATE POLICY "Teachers and admins can update video transcripts"
ON public.video_transcripts FOR UPDATE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'teacher'::app_role)
);

CREATE POLICY "Teachers and admins can delete video transcripts"
ON public.video_transcripts FOR DELETE
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'teacher'::app_role)
);

-- Fix STORAGE_EXPOSURE: course-materials bucket policies
DROP POLICY IF EXISTS "Authenticated users can upload course material files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update course material files" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete course material files" ON storage.objects;

-- Create role-restricted storage policies
CREATE POLICY "Teachers and admins can upload course material files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'course-materials' AND (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'teacher'::app_role)
  )
);

CREATE POLICY "Teachers and admins can update course material files"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'course-materials' AND (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'teacher'::app_role)
  )
);

CREATE POLICY "Teachers and admins can delete course material files"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'course-materials' AND (
    public.has_role(auth.uid(), 'admin'::app_role) OR
    public.has_role(auth.uid(), 'teacher'::app_role)
  )
);

-- Create profiles table for proper auth integration
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  name TEXT,
  institution_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (id = auth.uid());

CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (id = auth.uid());

-- Admins and teachers can view all profiles
CREATE POLICY "Admins and teachers can view all profiles"
ON public.profiles FOR SELECT
TO authenticated
USING (
  public.has_role(auth.uid(), 'admin'::app_role) OR
  public.has_role(auth.uid(), 'teacher'::app_role)
);

-- Trigger for profiles updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signups and create profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();