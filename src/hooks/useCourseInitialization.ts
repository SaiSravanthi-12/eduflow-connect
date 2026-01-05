import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { CourseSyllabus } from '@/data/coursesSyllabusData';

export const useCourseInitialization = () => {
  const initializeCourseProgress = useCallback(async (
    userId: string,
    course: CourseSyllabus
  ) => {
    try {
      // Check if course progress already exists
      const { data: existingProgress } = await supabase
        .from('student_course_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', course.id)
        .maybeSingle();

      if (existingProgress) {
        // Progress already initialized
        return true;
      }

      // Initialize course progress
      const { error: courseError } = await supabase
        .from('student_course_progress')
        .insert([{
          user_id: userId,
          course_id: course.id,
          modules_completed: 0,
          total_modules: course.modules.length,
          exam_unlocked: false,
          current_module_id: course.modules[0]?.id || null,
          current_topic_id: course.modules[0]?.topics[0]?.id || null,
        }] as any);

      if (courseError) {
        console.error('Error initializing course progress:', courseError);
        return false;
      }

      // Initialize module progress for all modules
      const moduleProgressData = course.modules.map((module, index) => ({
        user_id: userId,
        course_id: course.id,
        module_id: module.id,
        videos_completed: 0,
        total_videos: module.topics.length,
        quiz_unlocked: false,
        quiz_passed: false,
      }));

      const { error: moduleError } = await supabase
        .from('student_module_progress')
        .insert(moduleProgressData as any);

      if (moduleError) {
        console.error('Error initializing module progress:', moduleError);
        return false;
      }

      console.log('Course progress initialized successfully');
      return true;
    } catch (error) {
      console.error('Error in course initialization:', error);
      return false;
    }
  }, []);

  const updateVideoCompletion = useCallback(async (
    userId: string,
    courseId: string,
    moduleId: string,
    course: CourseSyllabus
  ) => {
    try {
      // Count completed videos in this module
      const { data: completedVideos } = await supabase
        .from('student_video_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('module_id', moduleId)
        .eq('completed', true);

      const videosCompleted = completedVideos?.length || 0;
      const module = course.modules.find(m => m.id === moduleId);
      const totalVideos = module?.topics.length || 0;
      const quizUnlocked = videosCompleted >= totalVideos;

      // Update module progress
      await supabase
        .from('student_module_progress')
        .upsert([{
          user_id: userId,
          course_id: courseId,
          module_id: moduleId,
          videos_completed: videosCompleted,
          total_videos: totalVideos,
          quiz_unlocked: quizUnlocked,
        }] as any, {
          onConflict: 'user_id,course_id,module_id'
        });

      // Check overall course progress
      await updateCourseProgress(userId, courseId, course);

      return true;
    } catch (error) {
      console.error('Error updating video completion:', error);
      return false;
    }
  }, []);

  const updateCourseProgress = useCallback(async (
    userId: string,
    courseId: string,
    course: CourseSyllabus
  ) => {
    try {
      // Count completed modules (where quiz is passed)
      const { data: passedModules } = await supabase
        .from('student_module_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('quiz_passed', true);

      const modulesCompleted = passedModules?.length || 0;
      const totalModules = course.modules.length;
      const examUnlocked = modulesCompleted >= totalModules;

      // Find current module (first non-passed module)
      const { data: moduleProgressList } = await supabase
        .from('student_module_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .order('created_at', { ascending: true });

      let currentModuleId = course.modules[0]?.id;
      if (moduleProgressList) {
        for (const module of course.modules) {
          const mp = moduleProgressList.find(m => m.module_id === module.id);
          if (!mp?.quiz_passed) {
            currentModuleId = module.id;
            break;
          }
        }
      }

      // Update course progress
      await supabase
        .from('student_course_progress')
        .upsert([{
          user_id: userId,
          course_id: courseId,
          modules_completed: modulesCompleted,
          total_modules: totalModules,
          exam_unlocked: examUnlocked,
          current_module_id: currentModuleId,
        }] as any, {
          onConflict: 'user_id,course_id'
        });

      return true;
    } catch (error) {
      console.error('Error updating course progress:', error);
      return false;
    }
  }, []);

  return {
    initializeCourseProgress,
    updateVideoCompletion,
    updateCourseProgress,
  };
};