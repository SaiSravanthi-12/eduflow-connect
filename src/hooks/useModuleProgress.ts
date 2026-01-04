import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ModuleProgressRecord {
  id: string;
  user_id: string;
  course_id: string;
  module_id: string;
  videos_completed: number;
  total_videos: number;
  quiz_unlocked: boolean;
  quiz_passed: boolean;
  quiz_score: number | null;
  quiz_completed_at: string | null;
}

export interface CourseProgressRecord {
  id: string;
  user_id: string;
  course_id: string;
  modules_completed: number;
  total_modules: number;
  exam_unlocked: boolean;
  exam_passed: boolean | null;
  exam_score: number | null;
  completed_at: string | null;
}

export const useModuleProgress = (userId: string | null, courseId: string | undefined) => {
  const [moduleProgress, setModuleProgress] = useState<ModuleProgressRecord[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgressRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!userId || !courseId) {
      setIsLoading(false);
      return;
    }

    // Fetch module progress
    const { data: moduleData, error: moduleError } = await supabase
      .from('student_module_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId);

    if (moduleError) {
      console.error('Error fetching module progress:', moduleError);
    } else {
      setModuleProgress(moduleData || []);
    }

    // Fetch course progress
    const { data: courseData, error: courseError } = await supabase
      .from('student_course_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId)
      .maybeSingle();

    if (courseError) {
      console.error('Error fetching course progress:', courseError);
    } else {
      setCourseProgress(courseData);
    }

    setIsLoading(false);
  }, [userId, courseId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const refetch = useCallback(() => {
    return fetchProgress();
  }, [fetchProgress]);

  return {
    moduleProgress,
    courseProgress,
    isLoading,
    refetch,
  };
};