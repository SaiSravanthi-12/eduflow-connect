import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface VideoProgress {
  materialId: string;
  watchTimeSeconds: number;
  totalDurationSeconds: number;
  completed: boolean;
  completedAt: string | null;
}

export const useVideoProgress = (courseId: string) => {
  const [videoProgress, setVideoProgress] = useState<Record<string, VideoProgress>>({});
  const [isLoading, setIsLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('student_video_progress')
      .select('*')
      .eq('user_id', user.id)
      .eq('course_id', courseId);

    if (error) {
      console.error('Error fetching video progress:', error);
      setIsLoading(false);
      return;
    }

    const progressMap: Record<string, VideoProgress> = {};
    data?.forEach(p => {
      if (p.material_id) {
        progressMap[p.material_id] = {
          materialId: p.material_id,
          watchTimeSeconds: p.watch_time_seconds,
          totalDurationSeconds: p.total_duration_seconds,
          completed: p.completed,
          completedAt: p.completed_at,
        };
      }
    });

    setVideoProgress(progressMap);
    setIsLoading(false);
  }, [courseId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const isVideoCompleted = useCallback((materialId: string) => {
    return videoProgress[materialId]?.completed || false;
  }, [videoProgress]);

  const getVideoProgress = useCallback((materialId: string) => {
    return videoProgress[materialId] || null;
  }, [videoProgress]);

  const refreshProgress = useCallback(() => {
    fetchProgress();
  }, [fetchProgress]);

  return {
    videoProgress,
    isLoading,
    isVideoCompleted,
    getVideoProgress,
    refreshProgress,
  };
};
