import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  videoTitle: string;
  topicName: string;
  materialId: string;
  courseId: string;
  moduleId: string;
  topicId: string;
  userId: string;
  onComplete: (moduleId: string) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  isOpen,
  onClose,
  videoUrl,
  videoTitle,
  topicName,
  materialId,
  courseId,
  moduleId,
  topicId,
  userId,
  onComplete,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playbackSpeed, setPlaybackSpeed] = useState('1');
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [maxWatchedTime, setMaxWatchedTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [showCompletionDialog, setShowCompletionDialog] = useState(false);
  const [pendingCompletion, setPendingCompletion] = useState(false);
  const lastSaveTime = useRef(0);

  const speedOptions = ['0.5', '1', '1.5', '2'];

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setHasError(false);
      setCurrentTime(0);
      setDuration(0);
      setShowCompletionDialog(false);
      setPendingCompletion(false);
    }
  }, [isOpen, videoUrl]);

  // Load saved progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      if (!userId || !materialId) return;

      try {
        const { data } = await supabase
          .from('student_video_progress')
          .select('*')
          .eq('user_id', userId)
          .eq('material_id', materialId)
          .maybeSingle();

        if (data) {
          setMaxWatchedTime(data.watch_time_seconds);
          setIsCompleted(data.completed);
          // Set video position after it loads
          if (videoRef.current && data.watch_time_seconds > 0 && !data.completed) {
            videoRef.current.currentTime = Math.min(data.watch_time_seconds, videoRef.current.duration || data.watch_time_seconds);
          }
        }
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    };

    if (isOpen && materialId) {
      loadProgress();
    }
  }, [isOpen, materialId, userId]);

  // Save progress periodically
  const saveProgress = useCallback(async (watchTime: number, completed: boolean = false) => {
    const now = Date.now();
    if (!completed && now - lastSaveTime.current < 10000) return; // Save every 10 seconds
    lastSaveTime.current = now;

    if (!userId) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('student_video_progress')
        .upsert([{
          user_id: userId,
          material_id: materialId,
          course_id: courseId,
          module_id: moduleId,
          topic_id: topicId,
          watch_time_seconds: Math.floor(watchTime),
          total_duration_seconds: Math.floor(duration),
          completed,
          completed_at: completed ? new Date().toISOString() : null,
        }] as any, {
          onConflict: 'user_id,material_id'
        });

      if (error) throw error;
      
      if (completed && !isCompleted) {
        setIsCompleted(true);
        onComplete(moduleId);
        toast.success('Video marked as complete!');
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setIsSaving(false);
    }
  }, [materialId, courseId, moduleId, topicId, duration, isCompleted, onComplete, userId]);

  // Handle confirmed completion
  const handleConfirmCompletion = useCallback(() => {
    setShowCompletionDialog(false);
    saveProgress(currentTime, true);
  }, [saveProgress, currentTime]);

  // Handle cancel completion
  const handleCancelCompletion = useCallback(() => {
    setShowCompletionDialog(false);
    setPendingCompletion(false);
  }, []);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    const current = videoRef.current.currentTime;
    const videoDuration = videoRef.current.duration;
    
    // Prevent seeking ahead (allow 3 second buffer for seeking tolerance)
    if (current > maxWatchedTime + 3) {
      videoRef.current.currentTime = maxWatchedTime;
      toast.warning('You cannot skip ahead in the video');
      return;
    }

    setCurrentTime(current);
    
    if (current > maxWatchedTime) {
      setMaxWatchedTime(current);
    }

    // Check for completion (90% watched to account for buffering issues)
    if (videoDuration > 0 && current >= videoDuration * 0.9 && !isCompleted && !pendingCompletion) {
      setPendingCompletion(true);
      videoRef.current?.pause();
      setShowCompletionDialog(true);
    } else if (!pendingCompletion) {
      saveProgress(current, false);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
      setIsLoading(false);
      // Apply saved playback speed
      videoRef.current.playbackRate = parseFloat(playbackSpeed);
    }
  };

  const handleSpeedChange = (speed: string) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = parseFloat(speed);
    }
  };

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      // Save progress on close
      if (currentTime > 0 && !isCompleted) {
        saveProgress(currentTime, false);
      }
    }
    onClose();
  };

  const handleVideoEnded = () => {
    if (!isCompleted && !pendingCompletion) {
      setPendingCompletion(true);
      setShowCompletionDialog(true);
    }
  };

  const progress = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-card">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center gap-2 text-foreground">
              {videoTitle}
              {isCompleted && <CheckCircle2 className="h-5 w-5 text-success" />}
              {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
            </DialogTitle>
            <p className="text-sm text-muted-foreground">{topicName}</p>
          </DialogHeader>
          
          <div className="relative bg-black">
            {isLoading && !hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Loading video...</p>
                </div>
              </div>
            )}
            
            {hasError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                <div className="flex flex-col items-center gap-3 text-center p-4">
                  <AlertCircle className="h-12 w-12 text-destructive" />
                  <p className="text-sm text-muted-foreground">
                    Failed to load video. Please try again.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => window.open(videoUrl, '_blank')}
                    className="gap-2"
                  >
                    Open Video in New Tab
                  </Button>
                </div>
              </div>
            )}
            
            <video
              ref={videoRef}
              src={videoUrl}
              className="w-full aspect-video"
              controls
              controlsList="nodownload nofullscreen"
              disablePictureInPicture
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onCanPlay={() => setIsLoading(false)}
              onEnded={handleVideoEnded}
              onError={(e) => {
                console.error('Video load error:', e);
                setIsLoading(false);
                setHasError(true);
              }}
            />
          </div>
          
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="text-sm text-muted-foreground">
                  Progress: {progress}% watched
                </div>
                
                {/* Playback Speed */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Speed:</span>
                  <Select value={playbackSpeed} onValueChange={handleSpeedChange}>
                    <SelectTrigger className="w-20 h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {speedOptions.map((speed) => (
                        <SelectItem key={speed} value={speed}>
                          {speed}x
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isCompleted ? (
                  <span className="flex items-center gap-1 text-success text-sm font-medium">
                    <CheckCircle2 className="h-4 w-4" /> Completed
                  </span>
                ) : (
                  <span className="text-muted-foreground text-sm">
                    Watch to 90% to complete
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Completion Confirmation Dialog */}
      <AlertDialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Mark Video as Complete?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You've watched enough of this video to mark it as complete. 
              This action will update your progress and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelCompletion}>
              Continue Watching
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCompletion}>
              Mark as Complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
