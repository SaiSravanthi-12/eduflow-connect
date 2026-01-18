import React, { useState, useEffect, useCallback } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { Dialog } from '@/components/ui/dialog';
import { BookOpen, Video, FileText, Play, ArrowLeft, Lock, CheckCircle, Loader2, ClipboardCheck, Trophy, Eye } from 'lucide-react';
import { coursesSyllabusData, CourseSyllabus, SyllabusModule } from '@/data/coursesSyllabusData';
import { supabase } from '@/integrations/supabase/client';
import { VideoPlayerModal } from '@/components/course/VideoPlayerModal';
import { DocumentViewer } from '@/components/course/DocumentViewer';
import { CourseProgressCard } from '@/components/course/CourseProgressCard';
import { ModuleQuizCard } from '@/components/course/ModuleQuizCard';
import { useVideoProgress, VideoProgressRecord } from '@/hooks/useVideoProgress';
import { useModuleProgress, ModuleProgressRecord } from '@/hooks/useModuleProgress';
import { useCourseInitialization } from '@/hooks/useCourseInitialization';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface CourseMaterial {
  id: string;
  course_id: string;
  module_id: string;
  topic_id: string;
  material_type: string;
  name: string;
  file_url: string;
  uploaded_at: string;
}

export default function StudentCoursesPage() {
  const navigate = useNavigate();
  const [selectedCourse, setSelectedCourse] = useState<CourseSyllabus | null>(null);
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Video player state
  const [activeVideo, setActiveVideo] = useState<{ material: CourseMaterial; topicName: string } | null>(null);
  
  // Document viewer state
  const [activeDocument, setActiveDocument] = useState<{ material: CourseMaterial; topicName: string } | null>(null);
  
  // Quiz state
  const [activeQuiz, setActiveQuiz] = useState<{ moduleId: string; moduleName: string } | null>(null);

  const enrolledCourses = coursesSyllabusData;

  // Get progress hooks
  const { videoProgress, refetch: refetchVideoProgress } = useVideoProgress(userId, selectedCourse?.id);
  const { moduleProgress, courseProgress, refetch: refetchModuleProgress } = useModuleProgress(userId, selectedCourse?.id);
  const { initializeCourseProgress, updateVideoCompletion } = useCourseInitialization();

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    fetchUser();
  }, []);

  // Initialize course progress when course is selected
  useEffect(() => {
    const initProgress = async () => {
      if (selectedCourse && userId) {
        await initializeCourseProgress(userId, selectedCourse);
        await refetchModuleProgress();
      }
    };
    initProgress();
  }, [selectedCourse, userId, initializeCourseProgress, refetchModuleProgress]);

  useEffect(() => {
    if (selectedCourse) {
      fetchMaterials(selectedCourse.id);
    }
  }, [selectedCourse]);

  const fetchMaterials = async (courseId: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('course_materials')
        .select('*')
        .eq('course_id', courseId);

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMaterialForTopic = (topicId: string, type: 'video' | 'document') => {
    return materials.find(m => m.topic_id === topicId && m.material_type === type);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'Beginner':
        return 'bg-success/10 text-success border-success/20';
      case 'Intermediate':
        return 'bg-warning/10 text-warning border-warning/20';
      case 'Advanced':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getMaterialsCount = (courseId: string) => {
    const courseMaterials = materials.filter(m => m.course_id === courseId);
    const videos = courseMaterials.filter(m => m.material_type === 'video').length;
    const documents = courseMaterials.filter(m => m.material_type === 'document').length;
    return { videos, documents, total: videos + documents };
  };

  const getTopicsCount = (course: CourseSyllabus) => {
    return course.modules.reduce((acc, m) => acc + m.topics.length, 0);
  };

  // Helper to find progress by topic_id
  const findVideoProgressByTopic = (topicId: string): VideoProgressRecord | undefined => {
    return videoProgress.find(v => v.topic_id === topicId);
  };

  // Helper to find module progress
  const findModuleProgress = (moduleId: string): ModuleProgressRecord | undefined => {
    return moduleProgress.find(m => m.module_id === moduleId);
  };

  // Check if a video is completed
  const isVideoCompleted = (topicId: string): boolean => {
    const progress = findVideoProgressByTopic(topicId);
    return progress?.completed || false;
  };

  // Check if a topic is unlocked (previous topic's video must be completed)
  const isTopicUnlocked = (moduleId: string, topicIndex: number, module: SyllabusModule): boolean => {
    // First topic in first module is always unlocked
    if (topicIndex === 0) {
      const moduleIndex = selectedCourse?.modules.findIndex(m => m.id === moduleId) || 0;
      if (moduleIndex === 0) return true;
      
      // First topic in subsequent modules: check if previous module quiz is passed
      const prevModule = selectedCourse?.modules[moduleIndex - 1];
      if (prevModule) {
        const prevModuleProgress = findModuleProgress(prevModule.id);
        return prevModuleProgress?.quiz_passed || false;
      }
      return false;
    }
    
    // Check if previous topic's video is completed
    const prevTopic = module.topics[topicIndex - 1];
    return isVideoCompleted(prevTopic.id);
  };

  // Check if module quiz is unlocked (all videos in module completed)
  const isModuleQuizUnlocked = (moduleId: string): boolean => {
    const mp = findModuleProgress(moduleId);
    return mp?.quiz_unlocked || false;
  };

  // Check if module quiz is passed
  const isModuleQuizPassed = (moduleId: string): boolean => {
    const mp = findModuleProgress(moduleId);
    return mp?.quiz_passed || false;
  };

  // Check if final exam is unlocked
  const isFinalExamUnlocked = (): boolean => {
    return courseProgress?.exam_unlocked || false;
  };

  // Get module completion percentage
  const getModuleCompletionPercent = (module: SyllabusModule): number => {
    const mp = findModuleProgress(module.id);
    if (!mp) return 0;
    const videosTotal = module.topics.length;
    const videosCompleted = mp.videos_completed || 0;
    return videosTotal > 0 ? Math.round((videosCompleted / videosTotal) * 100) : 0;
  };

  // Handle video completion
  const handleVideoComplete = useCallback(async (moduleId?: string) => {
    if (userId && selectedCourse && moduleId) {
      await updateVideoCompletion(userId, selectedCourse.id, moduleId, selectedCourse);
    }
    await refetchVideoProgress();
    await refetchModuleProgress();
    toast.success('Video completed! You can now proceed to the next content.');
  }, [userId, selectedCourse, updateVideoCompletion, refetchVideoProgress, refetchModuleProgress]);

  // Handle quiz completion
  const handleQuizComplete = async (passed: boolean) => {
    if (userId && selectedCourse) {
      // Refresh progress after quiz completion
      await refetchModuleProgress();
    }
    setActiveQuiz(null);
    if (passed) {
      toast.success('Quiz passed! Next module unlocked.');
    } else {
      toast.error('Quiz not passed. Review the content and try again.');
    }
  };

  // Fetch all materials for course cards
  useEffect(() => {
    const fetchAllMaterials = async () => {
      try {
        const { data, error } = await supabase
          .from('course_materials')
          .select('*');

        if (error) throw error;
        setMaterials(data || []);
      } catch (error) {
        console.error('Error fetching materials:', error);
      }
    };

    if (!selectedCourse) {
      fetchAllMaterials();
    }
  }, [selectedCourse]);

  // Course detail view with sequential access
  if (selectedCourse) {
    const stats = getMaterialsCount(selectedCourse.id);
    const overallProgress = courseProgress ? 
      Math.round((courseProgress.modules_completed / courseProgress.total_modules) * 100) : 0;
    
    return (
      <DashboardLayout>
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setSelectedCourse(null)} className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </Button>
          <PageHeader
            title={selectedCourse.name}
            description={`Instructor: ${selectedCourse.instructor}`}
          />
        </div>

        {/* Video Player Modal */}
        {activeVideo && (
          <VideoPlayerModal
            isOpen={!!activeVideo}
            onClose={() => setActiveVideo(null)}
            videoUrl={activeVideo.material.file_url}
            videoTitle={activeVideo.material.name}
            topicName={activeVideo.topicName}
            courseId={selectedCourse.id}
            moduleId={activeVideo.material.module_id}
            topicId={activeVideo.material.topic_id}
            materialId={activeVideo.material.id}
            userId={userId ?? undefined}
            onComplete={handleVideoComplete as any}
          />
        )}


        {/* Document Viewer Modal */}
        {activeDocument && (
          <DocumentViewer
            isOpen={!!activeDocument}
            onClose={() => setActiveDocument(null)}
            documentUrl={activeDocument.material.file_url}
            documentTitle={activeDocument.material.name}
            topicName={activeDocument.topicName}
          />
        )}

        {/* Module Quiz Card */}
        {activeQuiz && userId && (
          <ModuleQuizCard
            isOpen={!!activeQuiz}
            onClose={() => setActiveQuiz(null)}
            courseId={selectedCourse.id}
            moduleId={activeQuiz.moduleId}
            moduleName={activeQuiz.moduleName}
            userId={userId}
            onComplete={handleQuizComplete}
          />
        )}

        {/* Course Progress Overview */}
        <CourseProgressCard
          courseName={selectedCourse.name}
          modulesCompleted={courseProgress?.modules_completed || 0}
          totalModules={selectedCourse.modules.length}
          examUnlocked={isFinalExamUnlocked()}
          examPassed={courseProgress?.exam_passed || false}
          examScore={courseProgress?.exam_score}
        />

        {/* Course Stats */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedCourse.modules.length} Modules</p>
                  <p className="text-sm text-muted-foreground">
                    {getTopicsCount(selectedCourse)} Topics
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  <span className="font-medium">{stats.videos}</span>
                  <span className="text-sm text-muted-foreground">Videos</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-accent" />
                  <span className="font-medium">{stats.documents}</span>
                  <span className="text-sm text-muted-foreground">Documents</span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Progress value={overallProgress} className="w-32 h-2" />
                <span className="text-sm font-medium">{overallProgress}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Final Exam Card */}
        <Card className={`mb-6 ${isFinalExamUnlocked() ? 'border-primary' : 'opacity-60'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  isFinalExamUnlocked() ? 'bg-primary/10' : 'bg-muted'
                }`}>
                  <Trophy className={`w-6 h-6 ${isFinalExamUnlocked() ? 'text-primary' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <p className="font-medium">Final Certification Exam</p>
                  <p className="text-sm text-muted-foreground">
                    30 MCQs + 2 Coding Questions • Proctored
                  </p>
                </div>
              </div>
              {isFinalExamUnlocked() ? (
                courseProgress?.exam_passed ? (
                  <Badge className="bg-success/10 text-success border-success/20">
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Passed ({courseProgress.exam_score}%)
                  </Badge>
                ) : (
                  <Button onClick={() => navigate(`/student/exam/${selectedCourse.id}`)}>
                    Start Exam
                  </Button>
                )
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  <span className="text-sm">Complete all modules to unlock</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loading state */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          /* Syllabus with Materials and Sequential Access */
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Course Syllabus</h3>
            
            <Accordion type="multiple" className="space-y-4">
              {selectedCourse.modules.map((module, moduleIndex) => {
                const isModuleLocked = moduleIndex > 0 && !isModuleQuizPassed(selectedCourse.modules[moduleIndex - 1].id);
                const moduleCompletion = getModuleCompletionPercent(module);
                const quizUnlocked = isModuleQuizUnlocked(module.id);
                const quizPassed = isModuleQuizPassed(module.id);
                
                return (
                  <AccordionItem 
                    key={module.id} 
                    value={module.id}
                    className={`border rounded-xl overflow-hidden bg-card ${isModuleLocked ? 'opacity-60' : ''}`}
                    disabled={isModuleLocked}
                  >
                    <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-center gap-3 text-left w-full">
                        {isModuleLocked ? (
                          <Lock className="w-4 h-4 text-muted-foreground" />
                        ) : quizPassed ? (
                          <CheckCircle className="w-4 h-4 text-success" />
                        ) : null}
                        <Badge variant="outline" className={getLevelColor(module.level)}>
                          {module.level}
                        </Badge>
                        <span className="font-medium flex-1">{module.title}</span>
                        <div className="flex items-center gap-3 mr-4">
                          <Progress value={moduleCompletion} className="w-20 h-2" />
                          <span className="text-sm text-muted-foreground">{moduleCompletion}%</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                      {/* Topic Progress Strip */}
                      <div className="flex items-center gap-1 mb-4 pt-2">
                        <span className="text-xs text-muted-foreground mr-2">Topics:</span>
                        {module.topics.map((topic, idx) => {
                          const completed = isVideoCompleted(topic.id);
                          const unlocked = isTopicUnlocked(module.id, idx, module);
                          return (
                            <div
                              key={topic.id}
                              className={`h-2 flex-1 rounded-full transition-colors ${
                                completed 
                                  ? 'bg-success' 
                                  : unlocked 
                                    ? 'bg-primary/30' 
                                    : 'bg-muted'
                              }`}
                              title={`${topic.name}${completed ? ' (Completed)' : unlocked ? ' (In Progress)' : ' (Locked)'}`}
                            />
                          );
                        })}
                        <span className="text-xs text-muted-foreground ml-2">
                          {module.topics.filter(t => isVideoCompleted(t.id)).length}/{module.topics.length}
                        </span>
                      </div>
                      
                      <div className="space-y-3">
                        {module.topics.map((topic, topicIndex) => {
                          const videoMaterial = getMaterialForTopic(topic.id, 'video');
                          const documentMaterial = getMaterialForTopic(topic.id, 'document');
                          const hasMaterials = !!videoMaterial || !!documentMaterial;
                          const isUnlocked = isTopicUnlocked(module.id, topicIndex, module);
                          const videoCompleted = isVideoCompleted(topic.id);

                          return (
                            <div
                              key={topic.id}
                              className={`p-3 rounded-lg border ${
                                videoCompleted 
                                  ? 'bg-success/5 border-success/20' 
                                  : isUnlocked 
                                    ? 'bg-muted/30 border-border/50' 
                                    : 'bg-muted/10 border-border/20 opacity-60'
                              }`}
                            >
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  {videoCompleted ? (
                                    <CheckCircle className="w-4 h-4 text-success" />
                                  ) : isUnlocked ? (
                                    <Play className="w-4 h-4 text-primary" />
                                  ) : (
                                    <Lock className="w-4 h-4 text-muted-foreground" />
                                  )}
                                  <span className="font-medium text-sm">{topic.name}</span>
                                </div>
                                {videoCompleted && (
                                  <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-xs">
                                    Completed
                                  </Badge>
                                )}
                              </div>
                              
                              {hasMaterials && isUnlocked ? (
                                <div className="flex flex-wrap gap-2">
                                  {videoMaterial && (
                                    <Button
                                      variant={videoCompleted ? "outline" : "default"}
                                      size="sm"
                                      className="gap-2 text-xs"
                                      onClick={() => setActiveVideo({ material: videoMaterial, topicName: topic.name })}
                                    >
                                      <Video className="w-3 h-3" />
                                      <Play className="w-3 h-3" />
                                      {videoCompleted ? 'Rewatch' : 'Watch'} Video
                                    </Button>
                                  )}
                                  {documentMaterial && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="gap-2 text-xs"
                                      onClick={() => setActiveDocument({ material: documentMaterial, topicName: topic.name })}
                                    >
                                      <FileText className="w-3 h-3 text-accent" />
                                      <Eye className="w-3 h-3" />
                                      View Document
                                    </Button>
                                  )}
                                </div>
                              ) : !isUnlocked ? (
                                <p className="text-xs text-muted-foreground">
                                  Complete previous content to unlock
                                </p>
                              ) : (
                                <p className="text-xs text-muted-foreground">
                                  Materials will be available soon
                                </p>
                              )}
                            </div>
                          );
                        })}

                        {/* Module Quiz Card */}
                        <div
                          className={`p-4 rounded-lg border-2 border-dashed ${
                            quizPassed 
                              ? 'border-success/40 bg-success/5' 
                              : quizUnlocked 
                                ? 'border-primary/40 bg-primary/5' 
                                : 'border-muted-foreground/20 bg-muted/10 opacity-60'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <ClipboardCheck className={`w-5 h-5 ${
                                quizPassed ? 'text-success' : quizUnlocked ? 'text-primary' : 'text-muted-foreground'
                              }`} />
                              <div>
                                <p className="font-medium text-sm">Module Quiz</p>
                                <p className="text-xs text-muted-foreground">10 MCQs • Pass to unlock next module</p>
                              </div>
                            </div>
                            {quizPassed ? (
                              <Badge className="bg-success/10 text-success border-success/20">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Passed
                              </Badge>
                            ) : quizUnlocked ? (
                              <Button 
                                size="sm"
                                onClick={() => setActiveQuiz({ moduleId: module.id, moduleName: module.title })}
                              >
                                Take Quiz
                              </Button>
                            ) : (
                              <div className="flex items-center gap-2 text-muted-foreground">
                                <Lock className="w-4 h-4" />
                                <span className="text-xs">Complete all videos</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </div>
        )}
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="My Courses"
        description="Access your enrolled courses and study materials"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrolledCourses.map((course) => {
          const stats = getMaterialsCount(course.id);
          
          return (
            <Card
              key={course.id}
              className="card-hover cursor-pointer"
              onClick={() => setSelectedCourse(course)}
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{course.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{course.description}</p>
                <p className="text-sm mb-4">Instructor: {course.instructor}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {course.modules.length} modules
                  </span>
                  <span className="flex items-center gap-1">
                    <Video className="w-4 h-4" />
                    {stats.videos}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {stats.documents}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
}