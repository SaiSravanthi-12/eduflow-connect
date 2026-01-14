import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Loader2, AlertCircle, Maximize, Minimize, Play, Pause, SkipBack, SkipForward, Keyboard } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
  const videoContainerRef = useRef<HTMLDivElement>(null);
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showResumeToast, setShowResumeToast] = useState(false);
  const [savedPosition, setSavedPosition] = useState(0);
  const lastSaveTime = useRef(0);
  const hasResumed = useRef(false);

  const speedOptions = ['0.5', '1', '1.5', '2'];
  const speedMap: Record<string, string> = { '1': '0.5', '2': '1', '3': '1.5', '4': '2' };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setHasError(false);
      setCurrentTime(0);
      setDuration(0);
      setShowCompletionDialog(false);
      setPendingCompletion(false);
      setIsPlaying(false);
      setShowResumeToast(false);
      hasResumed.current = false;
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
          // Store saved position for resume feature
          if (data.watch_time_seconds > 0 && !data.completed) {
            setSavedPosition(data.watch_time_seconds);
            setShowResumeToast(true);
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

  // Handle resume when video is ready
  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
    if (savedPosition > 0 && !hasResumed.current && videoRef.current) {
      hasResumed.current = true;
      videoRef.current.currentTime = savedPosition;
      toast.info(`Resuming from ${formatTime(savedPosition)}`, {
        duration: 3000,
        action: {
          label: 'Start Over',
          onClick: () => {
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
            }
          }
        }
      });
    }
  }, [savedPosition]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't handle if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const video = videoRef.current;
      if (!video) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          if (video.paused) {
            video.play();
          } else {
            video.pause();
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          // Only allow seeking within watched time
          const newTime = Math.min(video.currentTime + 5, maxWatchedTime + 3);
          video.currentTime = newTime;
          break;
        case 'ArrowUp':
          e.preventDefault();
          video.volume = Math.min(1, video.volume + 0.1);
          break;
        case 'ArrowDown':
          e.preventDefault();
          video.volume = Math.max(0, video.volume - 0.1);
          break;
        case 'Digit1':
        case 'Numpad1':
          e.preventDefault();
          handleSpeedChange('0.5');
          toast.info('Speed: 0.5x');
          break;
        case 'Digit2':
        case 'Numpad2':
          e.preventDefault();
          handleSpeedChange('1');
          toast.info('Speed: 1x');
          break;
        case 'Digit3':
        case 'Numpad3':
          e.preventDefault();
          handleSpeedChange('1.5');
          toast.info('Speed: 1.5x');
          break;
        case 'Digit4':
        case 'Numpad4':
          e.preventDefault();
          handleSpeedChange('2');
          toast.info('Speed: 2x');
          break;
        case 'KeyF':
          e.preventDefault();
          toggleFullscreen();
          break;
        case 'KeyM':
          e.preventDefault();
          video.muted = !video.muted;
          toast.info(video.muted ? 'Muted' : 'Unmuted');
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, maxWatchedTime]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Toggle fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!videoContainerRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoContainerRef.current.requestFullscreen();
    }
  }, []);

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
    } else {
      videoRef.current.pause();
    }
  };

  const handleSeek = (direction: 'back' | 'forward') => {
    if (!videoRef.current) return;
    if (direction === 'back') {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    } else {
      const newTime = Math.min(videoRef.current.currentTime + 10, maxWatchedTime + 3);
      videoRef.current.currentTime = newTime;
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
    // Exit fullscreen if active
    if (document.fullscreenElement) {
      document.exitFullscreen();
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
          
          <div ref={videoContainerRef} className="relative bg-black group">
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
              controlsList="nodownload"
              disablePictureInPicture
              playsInline
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onCanPlay={handleCanPlay}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={handleVideoEnded}
              onError={(e) => {
                console.error('Video load error:', e);
                setIsLoading(false);
                setHasError(true);
              }}
            />

            {/* Fullscreen button overlay */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white opacity-0 group-hover:opacity-100 transition-opacity z-20"
              onClick={toggleFullscreen}
            >
              {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
            </Button>
          </div>
          
          <div className="p-4 border-t border-border">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-4">
                {/* Custom Controls */}
                <div className="flex items-center gap-1">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSeek('back')}>
                          <SkipBack className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>-10 seconds (←)</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handlePlayPause}>
                          {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Play/Pause (Space)</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSeek('forward')}>
                          <SkipForward className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>+10 seconds (→)</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>

                <div className="text-sm text-muted-foreground">
                  {formatTime(currentTime)} / {formatTime(duration)} ({progress}%)
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

                {/* Fullscreen button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleFullscreen}>
                        {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Fullscreen (F)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Keyboard shortcuts hint */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                        <Keyboard className="h-3 w-3" />
                        <span>Shortcuts</span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <div className="text-xs space-y-1">
                        <p><kbd className="px-1 bg-muted rounded">Space</kbd> Play/Pause</p>
                        <p><kbd className="px-1 bg-muted rounded">←/→</kbd> Seek ±5s</p>
                        <p><kbd className="px-1 bg-muted rounded">↑/↓</kbd> Volume</p>
                        <p><kbd className="px-1 bg-muted rounded">1-4</kbd> Speed (0.5x-2x)</p>
                        <p><kbd className="px-1 bg-muted rounded">F</kbd> Fullscreen</p>
                        <p><kbd className="px-1 bg-muted rounded">M</kbd> Mute</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>

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
