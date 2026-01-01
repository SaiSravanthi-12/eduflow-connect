-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');

-- Create user_roles table for proper role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policy for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Student video progress tracking
CREATE TABLE public.student_video_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    course_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    topic_id TEXT NOT NULL,
    material_id UUID REFERENCES public.course_materials(id) ON DELETE CASCADE,
    watch_time_seconds INTEGER NOT NULL DEFAULT 0,
    total_duration_seconds INTEGER NOT NULL DEFAULT 0,
    completed BOOLEAN NOT NULL DEFAULT false,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, material_id)
);

ALTER TABLE public.student_video_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own video progress"
ON public.student_video_progress FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own video progress"
ON public.student_video_progress FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own video progress"
ON public.student_video_progress FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Student module progress tracking
CREATE TABLE public.student_module_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    course_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    videos_completed INTEGER NOT NULL DEFAULT 0,
    total_videos INTEGER NOT NULL DEFAULT 0,
    quiz_unlocked BOOLEAN NOT NULL DEFAULT false,
    quiz_passed BOOLEAN NOT NULL DEFAULT false,
    quiz_score INTEGER,
    quiz_completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, course_id, module_id)
);

ALTER TABLE public.student_module_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own module progress"
ON public.student_module_progress FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own module progress"
ON public.student_module_progress FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own module progress"
ON public.student_module_progress FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Module quizzes table
CREATE TABLE public.module_quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    passing_score INTEGER NOT NULL DEFAULT 70,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (course_id, module_id)
);

ALTER TABLE public.module_quizzes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view module quizzes"
ON public.module_quizzes FOR SELECT
TO authenticated
USING (true);

-- Quiz attempts table
CREATE TABLE public.quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    quiz_id UUID REFERENCES public.module_quizzes(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,
    module_id TEXT NOT NULL,
    answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    score INTEGER NOT NULL DEFAULT 0,
    total_questions INTEGER NOT NULL DEFAULT 10,
    passed BOOLEAN NOT NULL DEFAULT false,
    started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own quiz attempts"
ON public.quiz_attempts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own quiz attempts"
ON public.quiz_attempts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own quiz attempts"
ON public.quiz_attempts FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Final exams table
CREATE TABLE public.final_exams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id TEXT NOT NULL UNIQUE,
    mcq_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    coding_questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    total_marks INTEGER NOT NULL DEFAULT 100,
    passing_score INTEGER NOT NULL DEFAULT 60,
    time_limit_minutes INTEGER NOT NULL DEFAULT 120,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.final_exams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view final exams"
ON public.final_exams FOR SELECT
TO authenticated
USING (true);

-- Exam attempts with proctoring data
CREATE TABLE public.exam_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    exam_id UUID REFERENCES public.final_exams(id) ON DELETE CASCADE,
    course_id TEXT NOT NULL,
    mcq_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    coding_answers JSONB NOT NULL DEFAULT '[]'::jsonb,
    score INTEGER,
    total_marks INTEGER NOT NULL DEFAULT 100,
    passed BOOLEAN,
    proctoring_violations JSONB NOT NULL DEFAULT '[]'::jsonb,
    violation_count INTEGER NOT NULL DEFAULT 0,
    webcam_enabled BOOLEAN NOT NULL DEFAULT false,
    status TEXT NOT NULL DEFAULT 'not_started',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    auto_submitted BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, exam_id)
);

ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own exam attempts"
ON public.exam_attempts FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own exam attempts"
ON public.exam_attempts FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own exam attempts"
ON public.exam_attempts FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Student course progress (overall)
CREATE TABLE public.student_course_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    course_id TEXT NOT NULL,
    modules_completed INTEGER NOT NULL DEFAULT 0,
    total_modules INTEGER NOT NULL DEFAULT 0,
    current_module_id TEXT,
    current_topic_id TEXT,
    exam_unlocked BOOLEAN NOT NULL DEFAULT false,
    exam_passed BOOLEAN,
    exam_score INTEGER,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, course_id)
);

ALTER TABLE public.student_course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own course progress"
ON public.student_course_progress FOR SELECT
TO authenticated
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own course progress"
ON public.student_course_progress FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own course progress"
ON public.student_course_progress FOR UPDATE
TO authenticated
USING (user_id = auth.uid());

-- Triggers for updated_at
CREATE TRIGGER update_student_video_progress_updated_at
BEFORE UPDATE ON public.student_video_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_module_progress_updated_at
BEFORE UPDATE ON public.student_module_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_module_quizzes_updated_at
BEFORE UPDATE ON public.module_quizzes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_final_exams_updated_at
BEFORE UPDATE ON public.final_exams
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_course_progress_updated_at
BEFORE UPDATE ON public.student_course_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Indexes for performance
CREATE INDEX idx_video_progress_user_course ON public.student_video_progress(user_id, course_id);
CREATE INDEX idx_module_progress_user_course ON public.student_module_progress(user_id, course_id);
CREATE INDEX idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX idx_exam_attempts_user ON public.exam_attempts(user_id);