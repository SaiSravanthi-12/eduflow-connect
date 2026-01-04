import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface VideoProgressRecord {
  id: string;
  user_id: string;
  course_id: string;
  module_id: string;
  topic_id: string;
  material_id: string | null;
  watch_time_seconds: number;
  total_duration_seconds: number;
  completed: boolean;
  completed_at: string | null;
}

export const useVideoProgress = (userId: string | null, courseId: string | undefined) => {
  const [videoProgress, setVideoProgress] = useState<VideoProgressRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchProgress = useCallback(async () => {
    if (!userId || !courseId) {
      setIsLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from('student_video_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('course_id', courseId);

    if (error) {
      console.error('Error fetching video progress:', error);
      setIsLoading(false);
      return;
    }

    setVideoProgress(data || []);
    setIsLoading(false);
  }, [userId, courseId]);

  useEffect(() => {
    fetchProgress();
  }, [fetchProgress]);

  const refetch = useCallback(() => {
    return fetchProgress();
  }, [fetchProgress]);

  return {
    videoProgress,
    isLoading,
    refetch,
  };
};