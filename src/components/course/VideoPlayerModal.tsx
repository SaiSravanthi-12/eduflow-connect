import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Play, Pause, Volume2, VolumeX, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [maxWatchedTime, setMaxWatchedTime] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const lastSaveTime = useRef(0);

  const speedOptions = [0.5, 1, 1.5, 2];

  // Load saved progress on mount
  useEffect(() => {
    const loadProgress = async () => {
      if (!userId || !materialId) return;

      const { data } = await supabase
        .from('student_video_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('material_id', materialId)
        .maybeSingle();

      if (data) {
        setMaxWatchedTime(data.watch_time_seconds);
        setIsCompleted(data.completed);
        if (videoRef.current && data.watch_time_seconds > 0) {
          videoRef.current.currentTime = data.watch_time_seconds;
        }
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
        toast.success('Video completed!');
      }
    } catch (error) {
      console.error('Error saving progress:', error);
    } finally {
      setIsSaving(false);
    }
  }, [materialId, courseId, moduleId, topicId, duration, isCompleted, onComplete, userId]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    
    const current = videoRef.current.currentTime;
    const videoDuration = videoRef.current.duration;
    
    // Prevent seeking ahead
    if (current > maxWatchedTime + 2) {
      videoRef.current.currentTime = maxWatchedTime;
      toast.warning('You cannot skip ahead in the video');
      return;
    }

    setCurrentTime(current);
    setProgress((current / videoDuration) * 100);
    
    if (current > maxWatchedTime) {
      setMaxWatchedTime(current);
    }

    // Check for completion (95% watched to account for buffering issues)
    if (current >= videoDuration * 0.95 && !isCompleted) {
      saveProgress(current, true);
    } else {
      saveProgress(current, false);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const changeSpeed = (speed: number) => {
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
      setPlaybackSpeed(speed);
    }
  };

  const cycleSpeed = () => {
    const currentIndex = speedOptions.indexOf(playbackSpeed);
    const nextIndex = (currentIndex + 1) % speedOptions.length;
    changeSpeed(speedOptions[nextIndex]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleClose = () => {
    if (videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-card">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            {videoTitle}
            {isCompleted && <CheckCircle2 className="h-5 w-5 text-success" />}
            {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">{topicName}</p>
        </DialogHeader>
        
        <div className="relative bg-background">
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full aspect-video"
            controls
            controlsList="nodownload"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onEnded={() => {
              setIsPlaying(false);
              if (!isCompleted) {
                saveProgress(duration, true);
              }
            }}
            onError={(e) => {
              console.error('Video load error:', e);
              toast.error('Failed to load video. Please try again.');
            }}
          />
          
          {/* Video Controls */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background/90 to-transparent p-4">
            <Progress value={progress} className="h-1 mb-3" />
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={togglePlay}
                  className="text-foreground hover:bg-foreground/10"
                >
                  {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="text-foreground hover:bg-foreground/10"
                >
                {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                </Button>
                
                {/* Playback Speed Control */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={cycleSpeed}
                  className="text-foreground hover:bg-foreground/10 px-2 min-w-[48px] font-mono text-sm"
                >
                  {playbackSpeed}x
                </Button>
                
                <span className="text-sm text-muted-foreground">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {isCompleted && (
                  <Button
                    onClick={handleClose}
                    className="gap-2"
                  >
                    Done <CheckCircle2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Progress: {Math.round(progress)}% watched
            </div>
            {isCompleted ? (
              <span className="flex items-center gap-1 text-success text-sm font-medium">
                <CheckCircle2 className="h-4 w-4" /> Completed
              </span>
            ) : (
              <span className="text-muted-foreground text-sm">
                Watch to 100% to unlock next content
              </span>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};