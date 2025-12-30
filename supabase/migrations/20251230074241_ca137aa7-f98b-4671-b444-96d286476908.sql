-- Create table for course materials
CREATE TABLE public.course_materials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  material_type TEXT NOT NULL CHECK (material_type IN ('video', 'document')),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_path TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(course_id, topic_id, material_type)
);

-- Enable Row Level Security
ALTER TABLE public.course_materials ENABLE ROW LEVEL SECURITY;

-- Create policy for anyone to view materials (students need to see them)
CREATE POLICY "Anyone can view course materials" 
ON public.course_materials 
FOR SELECT 
USING (true);

-- Create policy for authenticated users to insert materials (content managers)
CREATE POLICY "Authenticated users can insert course materials" 
ON public.course_materials 
FOR INSERT 
WITH CHECK (true);

-- Create policy for authenticated users to update their materials
CREATE POLICY "Authenticated users can update course materials" 
ON public.course_materials 
FOR UPDATE 
USING (true);

-- Create policy for authenticated users to delete materials
CREATE POLICY "Authenticated users can delete course materials" 
ON public.course_materials 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_course_materials_updated_at
BEFORE UPDATE ON public.course_materials
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for course materials
INSERT INTO storage.buckets (id, name, public) VALUES ('course-materials', 'course-materials', true);

-- Storage policies for course materials bucket
CREATE POLICY "Anyone can view course material files"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-materials');

CREATE POLICY "Authenticated users can upload course material files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'course-materials');

CREATE POLICY "Authenticated users can update course material files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'course-materials');

CREATE POLICY "Authenticated users can delete course material files"
ON storage.objects FOR DELETE
USING (bucket_id = 'course-materials');