import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Loader2, AlertCircle, Maximize, Minimize, Play, Pause, SkipBack, SkipForward, Keyboard, PictureInPicture2, Bookmark, BookmarkPlus, Trash2, X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
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

interface Bookmark {
  id: string;
  time: number;
  label: string;
}

interface WatchedSegment {
  start: number;
  end: number;
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
  const progressBarRef = useRef<HTMLDivElement>(null);
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
  const [isPiPActive, setIsPiPActive] = useState(false);
  const [savedPosition, setSavedPosition] = useState(0);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [newBookmarkLabel, setNewBookmarkLabel] = useState('');
  const [showBookmarkInput, setShowBookmarkInput] = useState(false);
  const [watchedSegments, setWatchedSegments] = useState<WatchedSegment[]>([]);
  const lastSaveTime = useRef(0);
  const hasResumed = useRef(false);
  const segmentStart = useRef(0);

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
      setIsPlaying(false);
      hasResumed.current = false;
      segmentStart.current = 0;
      setWatchedSegments([]);
    }
  }, [isOpen, videoUrl]);

  // Load saved progress and bookmarks on mount
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
          }
        }

        // Load bookmarks from localStorage
        const savedBookmarks = localStorage.getItem(`video-bookmarks-${materialId}`);
        if (savedBookmarks) {
          setBookmarks(JSON.parse(savedBookmarks));
        }
        
        // Load watched segments from localStorage
        const savedSegments = localStorage.getItem(`video-segments-${materialId}`);
        if (savedSegments) {
          setWatchedSegments(JSON.parse(savedSegments));
        }
      } catch (error) {
        console.error('Error loading progress:', error);
      }
    };

    if (isOpen && materialId) {
      loadProgress();
    }
  }, [isOpen, materialId, userId]);

  // Save bookmarks to localStorage
  useEffect(() => {
    if (materialId && bookmarks.length > 0) {
      localStorage.setItem(`video-bookmarks-${materialId}`, JSON.stringify(bookmarks));
    }
  }, [bookmarks, materialId]);

  // Save watched segments to localStorage
  useEffect(() => {
    if (materialId && watchedSegments.length > 0) {
      localStorage.setItem(`video-segments-${materialId}`, JSON.stringify(watchedSegments));
    }
  }, [watchedSegments, materialId]);

  // Handle resume when video is ready
  const handleCanPlay = useCallback(() => {
    setIsLoading(false);
    if (savedPosition > 0 && !hasResumed.current && videoRef.current) {
      hasResumed.current = true;
      videoRef.current.currentTime = savedPosition;
      segmentStart.current = savedPosition;
      toast.info(`Resuming from ${formatTime(savedPosition)}`, {
        duration: 3000,
        action: {
          label: 'Start Over',
          onClick: () => {
            if (videoRef.current) {
              videoRef.current.currentTime = 0;
              segmentStart.current = 0;
            }
          }
        }
      });
    }
  }, [savedPosition]);

  // PiP mode listeners
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleEnterPiP = () => setIsPiPActive(true);
    const handleLeavePiP = () => setIsPiPActive(false);

    video.addEventListener('enterpictureinpicture', handleEnterPiP);
    video.addEventListener('leavepictureinpicture', handleLeavePiP);

    return () => {
      video.removeEventListener('enterpictureinpicture', handleEnterPiP);
      video.removeEventListener('leavepictureinpicture', handleLeavePiP);
    };
  }, [isOpen]);

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
        case 'KeyB':
          e.preventDefault();
          addBookmark();
          break;
        case 'KeyP':
          e.preventDefault();
          togglePiP();
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

  // Toggle Picture-in-Picture
  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      } else {
        toast.error('Picture-in-Picture is not supported in this browser');
      }
    } catch (error) {
      console.error('PiP error:', error);
      toast.error('Could not enable Picture-in-Picture');
    }
  }, []);

  // Format time helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Add bookmark at current time
  const addBookmark = useCallback(() => {
    if (!videoRef.current) return;
    
    const time = videoRef.current.currentTime;
    const defaultLabel = `Bookmark at ${formatTime(time)}`;
    
    const newBookmark: Bookmark = {
      id: Date.now().toString(),
      time,
      label: newBookmarkLabel || defaultLabel
    };
    
    setBookmarks(prev => [...prev, newBookmark].sort((a, b) => a.time - b.time));
    setNewBookmarkLabel('');
    setShowBookmarkInput(false);
    toast.success('Bookmark added!');
  }, [newBookmarkLabel]);

  // Delete bookmark
  const deleteBookmark = useCallback((id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
    // Also update localStorage
    const remaining = bookmarks.filter(b => b.id !== id);
    if (remaining.length === 0) {
      localStorage.removeItem(`video-bookmarks-${materialId}`);
    }
    toast.info('Bookmark removed');
  }, [bookmarks, materialId]);

  // Jump to bookmark
  const jumpToBookmark = useCallback((time: number) => {
    if (videoRef.current && time <= maxWatchedTime + 3) {
      videoRef.current.currentTime = time;
    } else {
      toast.warning('You cannot jump to an unwatched portion');
    }
  }, [maxWatchedTime]);

  // Merge overlapping segments
  const mergeSegments = (segments: WatchedSegment[]): WatchedSegment[] => {
    if (segments.length === 0) return [];
    
    const sorted = [...segments].sort((a, b) => a.start - b.start);
    const merged: WatchedSegment[] = [sorted[0]];
    
    for (let i = 1; i < sorted.length; i++) {
      const last = merged[merged.length - 1];
      const current = sorted[i];
      
      if (current.start <= last.end + 1) {
        last.end = Math.max(last.end, current.end);
      } else {
        merged.push(current);
      }
    }
    
    return merged;
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

  // Track watched segments when pausing or seeking
  const handlePause = () => {
    setIsPlaying(false);
    const current = videoRef.current?.currentTime || 0;
    if (current > segmentStart.current) {
      const newSegment: WatchedSegment = {
        start: Math.floor(segmentStart.current),
        end: Math.floor(current)
      };
      setWatchedSegments(prev => mergeSegments([...prev, newSegment]));
    }
  };

  const handlePlay = () => {
    setIsPlaying(true);
    segmentStart.current = videoRef.current?.currentTime || 0;
  };

  const handleSeeked = () => {
    segmentStart.current = videoRef.current?.currentTime || 0;
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
    // Save final segment before closing
    const current = videoRef.current?.currentTime || 0;
    if (current > segmentStart.current && isPlaying) {
      const newSegment: WatchedSegment = {
        start: Math.floor(segmentStart.current),
        end: Math.floor(current)
      };
      const updatedSegments = mergeSegments([...watchedSegments, newSegment]);
      localStorage.setItem(`video-segments-${materialId}`, JSON.stringify(updatedSegments));
    }
    
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
    // Exit PiP if active
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    }
    onClose();
  };

  const handleVideoEnded = () => {
    // Save final segment
    const current = videoRef.current?.currentTime || 0;
    if (current > segmentStart.current) {
      const newSegment: WatchedSegment = {
        start: Math.floor(segmentStart.current),
        end: Math.floor(current)
      };
      setWatchedSegments(prev => mergeSegments([...prev, newSegment]));
    }
    
    if (!isCompleted && !pendingCompletion) {
      setPendingCompletion(true);
      setShowCompletionDialog(true);
    }
  };

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error('Video load error:', e);
    setIsLoading(false);
    setHasError(true);
  };

  // Calculate total watched percentage from segments
  const getWatchedPercentage = (): number => {
    if (duration <= 0) return 0;
    const totalWatched = watchedSegments.reduce((acc, seg) => acc + (seg.end - seg.start), 0);
    return Math.min(100, Math.round((totalWatched / duration) * 100));
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
              {isPiPActive && (
                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  PiP Active
                </span>
              )}
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
              playsInline
              crossOrigin="anonymous"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={handleLoadedMetadata}
              onCanPlay={handleCanPlay}
              onPlay={handlePlay}
              onPause={handlePause}
              onSeeked={handleSeeked}
              onEnded={handleVideoEnded}
              onError={handleVideoError}
            />

            {/* Overlay controls */}
            <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="bg-black/50 hover:bg-black/70 text-white"
                      onClick={togglePiP}
                    >
                      <PictureInPicture2 className="h-5 w-5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Picture-in-Picture (P)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button
                variant="ghost"
                size="icon"
                className="bg-black/50 hover:bg-black/70 text-white"
                onClick={toggleFullscreen}
              >
                {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </Button>
            </div>

            {/* Bookmark indicators on video */}
            {duration > 0 && bookmarks.length > 0 && (
              <div className="absolute bottom-12 left-0 right-0 h-1 pointer-events-none z-10">
                {bookmarks.map(bookmark => (
                  <div
                    key={bookmark.id}
                    className="absolute w-1 h-3 bg-yellow-400 -top-1 rounded-full"
                    style={{ left: `${(bookmark.time / duration) * 100}%` }}
                    title={bookmark.label}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Mini Progress Bar - Watched Segments */}
          <div className="px-4 pt-2">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-muted-foreground">Watched segments:</span>
              <span className="text-xs font-medium">{getWatchedPercentage()}% covered</span>
            </div>
            <div 
              ref={progressBarRef}
              className="relative h-2 bg-muted rounded-full overflow-hidden"
            >
              {/* Watched segments */}
              {watchedSegments.map((segment, idx) => (
                <div
                  key={idx}
                  className="absolute h-full bg-success/70"
                  style={{
                    left: `${(segment.start / duration) * 100}%`,
                    width: `${((segment.end - segment.start) / duration) * 100}%`
                  }}
                />
              ))}
              
              {/* Current playhead */}
              <div
                className="absolute h-full w-0.5 bg-primary z-10"
                style={{ left: `${(currentTime / duration) * 100}%` }}
              />
              
              {/* Max watched indicator */}
              <div
                className="absolute h-full bg-primary/30"
                style={{ width: `${(maxWatchedTime / duration) * 100}%` }}
              />
              
              {/* Bookmark markers */}
              {bookmarks.map(bookmark => (
                <div
                  key={bookmark.id}
                  className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full top-1/2 -translate-y-1/2 cursor-pointer hover:scale-150 transition-transform z-20"
                  style={{ left: `${(bookmark.time / duration) * 100}%` }}
                  onClick={() => jumpToBookmark(bookmark.time)}
                  title={bookmark.label}
                />
              ))}
            </div>
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

                {/* PiP Button */}
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant={isPiPActive ? "default" : "ghost"} 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={togglePiP}
                      >
                        <PictureInPicture2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Picture-in-Picture (P)</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

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

                {/* Bookmarks */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                      <Bookmark className="h-4 w-4" />
                      {bookmarks.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                          {bookmarks.length}
                        </span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72 p-2" align="start">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-sm">Bookmarks</h4>
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => setShowBookmarkInput(true)}
                              >
                                <BookmarkPlus className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Add bookmark (B)</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                      
                      {showBookmarkInput && (
                        <div className="flex gap-2">
                          <Input
                            placeholder="Bookmark label..."
                            value={newBookmarkLabel}
                            onChange={(e) => setNewBookmarkLabel(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') addBookmark();
                              if (e.key === 'Escape') setShowBookmarkInput(false);
                            }}
                            className="h-8 text-sm"
                            autoFocus
                          />
                          <Button size="sm" className="h-8" onClick={addBookmark}>
                            Add
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className="h-8 w-8" 
                            onClick={() => setShowBookmarkInput(false)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      
                      {bookmarks.length === 0 ? (
                        <p className="text-xs text-muted-foreground text-center py-4">
                          No bookmarks yet. Press B to add one.
                        </p>
                      ) : (
                        <ScrollArea className="h-40">
                          <div className="space-y-1">
                            {bookmarks.map(bookmark => (
                              <div
                                key={bookmark.id}
                                className="flex items-center gap-2 p-2 hover:bg-muted rounded-md group cursor-pointer"
                                onClick={() => jumpToBookmark(bookmark.time)}
                              >
                                <Bookmark className="h-3 w-3 text-yellow-500 flex-shrink-0" />
                                <span className="text-xs font-mono text-muted-foreground">
                                  {formatTime(bookmark.time)}
                                </span>
                                <span className="text-sm flex-1 truncate">{bookmark.label}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteBookmark(bookmark.id);
                                  }}
                                >
                                  <Trash2 className="h-3 w-3 text-destructive" />
                                </Button>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
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
                        <p><kbd className="px-1 bg-muted rounded">B</kbd> Add Bookmark</p>
                        <p><kbd className="px-1 bg-muted rounded">P</kbd> Picture-in-Picture</p>
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
