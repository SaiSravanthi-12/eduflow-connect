-- Create table for student video notes
CREATE TABLE public.student_video_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  material_id UUID REFERENCES public.course_materials(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  timestamp_seconds INTEGER NOT NULL DEFAULT 0,
  note_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for video chapters (managed by content managers)
CREATE TABLE public.video_chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID REFERENCES public.course_materials(id) ON DELETE CASCADE,
  course_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  title TEXT NOT NULL,
  start_time_seconds INTEGER NOT NULL DEFAULT 0,
  end_time_seconds INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID
);

-- Create table for video transcripts
CREATE TABLE public.video_transcripts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  material_id UUID REFERENCES public.course_materials(id) ON DELETE CASCADE UNIQUE,
  course_id TEXT NOT NULL,
  module_id TEXT NOT NULL,
  topic_id TEXT NOT NULL,
  full_text TEXT,
  segments JSONB NOT NULL DEFAULT '[]'::jsonb,
  language_code TEXT DEFAULT 'en',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  generated_by TEXT DEFAULT 'manual'
);

-- Enable RLS on all tables
ALTER TABLE public.student_video_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_transcripts ENABLE ROW LEVEL SECURITY;

-- RLS policies for student_video_notes (users can only access their own notes)
CREATE POLICY "Users can view their own video notes"
  ON public.student_video_notes
  FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own video notes"
  ON public.student_video_notes
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own video notes"
  ON public.student_video_notes
  FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own video notes"
  ON public.student_video_notes
  FOR DELETE
  USING (user_id = auth.uid());

-- RLS policies for video_chapters (anyone can view, only authenticated can manage)
CREATE POLICY "Anyone can view video chapters"
  ON public.video_chapters
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert video chapters"
  ON public.video_chapters
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update video chapters"
  ON public.video_chapters
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete video chapters"
  ON public.video_chapters
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- RLS policies for video_transcripts (anyone can view)
CREATE POLICY "Anyone can view video transcripts"
  ON public.video_transcripts
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert video transcripts"
  ON public.video_transcripts
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update video transcripts"
  ON public.video_transcripts
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Create indexes for performance
CREATE INDEX idx_student_video_notes_user_material ON public.student_video_notes(user_id, material_id);
CREATE INDEX idx_student_video_notes_timestamp ON public.student_video_notes(timestamp_seconds);
CREATE INDEX idx_video_chapters_material ON public.video_chapters(material_id);
CREATE INDEX idx_video_transcripts_material ON public.video_transcripts(material_id);

-- Add triggers for updated_at
CREATE TRIGGER update_student_video_notes_updated_at
  BEFORE UPDATE ON public.student_video_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_video_chapters_updated_at
  BEFORE UPDATE ON public.video_chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_video_transcripts_updated_at
  BEFORE UPDATE ON public.video_transcripts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();