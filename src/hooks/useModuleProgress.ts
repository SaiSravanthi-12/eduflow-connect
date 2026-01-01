import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ModuleProgress {
  moduleId: string;
  videosCompleted: number;
  totalVideos: number;
  quizUnlocked: boolean;
  quizPassed: boolean;
  quizScore: number | null;
}

export const useModuleProgress = (courseId: string) => {
  const [moduleProgress, setModuleProgress] = useState<Record<string, ModuleProgress>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('student_module_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId);

    if (error) {
      console.error('Error fetching module progress:', error);
      setIsLoading(false);
      return;
    }

    const progressMap: Record<string, ModuleProgress> = {};
    data?.forEach(p => {
      progressMap[p.module_id] = {
        moduleId: p.module_id,
        videosCompleted: p.videos_completed,
        totalVideos: p.total_videos,
        quizUnlocked: p.quiz_unlocked,
        quizPassed: p.quiz_passed,
        quizScore: p.quiz_score,
      };
    });

    setModuleProgress(progressMap);
    setIsLoading(false);
  }, [courseId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const isModuleUnlocked = useCallback((moduleId: string, moduleIndex: number, allModuleIds: string[]) => {
    // First module is always unlocked
    if (moduleIndex === 0) return true;
    
    // Check if previous module's quiz is passed
    const prevModuleId = allModuleIds[moduleIndex - 1];
    return moduleProgress[prevModuleId]?.quizPassed || false;
  }, [moduleProgress]);

  const isQuizUnlocked = useCallback((moduleId: string) => {
    return moduleProgress[moduleId]?.quizUnlocked || false;
  }, [moduleProgress]);

  const isQuizPassed = useCallback((moduleId: string) => {
    return moduleProgress[moduleId]?.quizPassed || false;
  }, [moduleProgress]);

  const getModuleProgress = useCallback((moduleId: string) => {
    return moduleProgress[moduleId] || null;
  }, [moduleProgress]);

  const updateModuleProgress = useCallback(async (
    moduleId: string, 
    videosCompleted: number, 
    totalVideos: number,
    quizUnlocked: boolean
  ) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('student_module_progress')
      .upsert({
        user_id: user.id,
        course_id: courseId,
        module_id: moduleId,
        videos_completed: videosCompleted,
        total_videos: totalVideos,
        quiz_unlocked: quizUnlocked,
      }, {
        onConflict: 'user_id,course_id,module_id'
      });

    fetchProgress();
  }, [courseId, fetchProgress]);

  const refreshProgress = useCallback(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    moduleProgress,
    isLoading,
    isModuleUnlocked,
    isQuizUnlocked,
    isQuizPassed,
    getModuleProgress,
    updateModuleProgress,
    refreshProgress,
  };
};
