import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckCircle2, Loader2, AlertCircle, Maximize, Minimize, Play, Pause, SkipBack, SkipForward, Keyboard, PictureInPicture2, Bookmark, BookmarkPlus, Trash2, X, FileText, Search, StickyNote, List, ChevronRight, Plus, Edit2, Save } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
  userId?: string;
  onComplete?: (moduleId: string) => void;
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

interface VideoNote {
  id: string;
  timestamp_seconds: number;
  note_text: string;
  created_at: string;
}

interface VideoChapter {
  id: string;
  title: string;
  start_time_seconds: number;
  end_time_seconds: number | null;
  description: string | null;
}

interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
  speaker?: string;
}

interface VideoTranscript {
  id: string;
  full_text: string | null;
  segments: TranscriptSegment[];
  language_code: string;
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
  
  // New features state
  const [activeTab, setActiveTab] = useState<'chapters' | 'notes' | 'transcript'>('chapters');
  const [notes, setNotes] = useState<VideoNote[]>([]);
  const [chapters, setChapters] = useState<VideoChapter[]>([]);
  const [transcript, setTranscript] = useState<VideoTranscript | null>(null);
  const [newNoteText, setNewNoteText] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [transcriptSearch, setTranscriptSearch] = useState('');
  const [showSidePanel, setShowSidePanel] = useState(false);
  
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
      setNewNoteText('');
      setEditingNoteId(null);
      setTranscriptSearch('');
    }
  }, [isOpen, videoUrl]);

  // Load saved progress, bookmarks, notes, chapters, and transcript
  useEffect(() => {
    const loadAllData = async () => {
      if (!materialId) return;

      try {
        // Local-only: bookmarks
        const savedBookmarks = localStorage.getItem(`video-bookmarks-${materialId}`);
        if (savedBookmarks) {
          setBookmarks(JSON.parse(savedBookmarks));
        }

        // Local-only: watched segments
        const savedSegments = localStorage.getItem(`video-segments-${materialId}`);
        if (savedSegments) {
          setWatchedSegments(JSON.parse(savedSegments));
        }

        // Chapters (shared content)
        const { data: chaptersData } = await supabase
          .from('video_chapters')
          .select('*')
          .eq('material_id', materialId)
          .order('start_time_seconds', { ascending: true });

        if (chaptersData) {
          setChapters(chaptersData);
        }

        // Transcript (shared content)
        const { data: transcriptData } = await supabase
          .from('video_transcripts')
          .select('*')
          .eq('material_id', materialId)
          .maybeSingle();

        if (transcriptData) {
          const segments = Array.isArray(transcriptData.segments)
            ? (transcriptData.segments as unknown as TranscriptSegment[])
            : [];
          setTranscript({
            id: transcriptData.id,
            full_text: transcriptData.full_text,
            segments,
            language_code: transcriptData.language_code || 'en',
          });
        }

        // User-specific data (requires authenticated user)
        if (userId) {
          const { data: progressData } = await supabase
            .from('student_video_progress')
            .select('*')
            .eq('user_id', userId)
            .eq('material_id', materialId)
            .maybeSingle();

          if (progressData) {
            setMaxWatchedTime(progressData.watch_time_seconds);
            setIsCompleted(progressData.completed);
            if (progressData.watch_time_seconds > 0 && !progressData.completed) {
              setSavedPosition(progressData.watch_time_seconds);
            }
          }

          const { data: notesData } = await supabase
            .from('student_video_notes')
            .select('*')
            .eq('user_id', userId)
            .eq('material_id', materialId)
            .order('timestamp_seconds', { ascending: true });

          if (notesData) {
            setNotes(notesData);
          }
        }
      } catch (error) {
        console.error('Error loading video data:', error);
      }
    };

    if (isOpen && materialId) {
      loadAllData();
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
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      const video = videoRef.current;
      if (!video) return;

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          video.paused ? video.play() : video.pause();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          video.currentTime = Math.max(0, video.currentTime - 5);
          break;
        case 'ArrowRight':
          e.preventDefault();
          video.currentTime = Math.min(video.currentTime + 5, maxWatchedTime + 3);
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
        case 'KeyN':
          e.preventDefault();
          setShowSidePanel(true);
          setActiveTab('notes');
          break;
        case 'KeyC':
          e.preventDefault();
          setShowSidePanel(true);
          setActiveTab('chapters');
          break;
        case 'KeyT':
          e.preventDefault();
          setShowSidePanel(true);
          setActiveTab('transcript');
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

  const toggleFullscreen = useCallback(() => {
    if (!videoContainerRef.current) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      videoContainerRef.current.requestFullscreen();
    }
  }, []);

  const togglePiP = useCallback(async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (document.pictureInPictureEnabled) {
        await video.requestPictureInPicture();
      } else {
        toast.error('Picture-in-Picture is not supported');
      }
    } catch (error) {
      console.error('PiP error:', error);
      toast.error('Could not enable Picture-in-Picture');
    }
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Bookmark functions
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

  const deleteBookmark = useCallback((id: string) => {
    setBookmarks(prev => prev.filter(b => b.id !== id));
    const remaining = bookmarks.filter(b => b.id !== id);
    if (remaining.length === 0) {
      localStorage.removeItem(`video-bookmarks-${materialId}`);
    }
    toast.info('Bookmark removed');
  }, [bookmarks, materialId]);

  const jumpToBookmark = useCallback((time: number) => {
    if (videoRef.current && time <= maxWatchedTime + 3) {
      videoRef.current.currentTime = time;
    } else {
      toast.warning('You cannot jump to an unwatched portion');
    }
  }, [maxWatchedTime]);

  // Note functions
  const addNote = useCallback(async () => {
    if (!userId) {
      toast.info('Log in to save notes');
      return;
    }
    if (!newNoteText.trim() || !videoRef.current) return;

    const timestamp = Math.floor(videoRef.current.currentTime);

    try {
      const { data, error } = await supabase
        .from('student_video_notes')
        .insert({
          user_id: userId,
          material_id: materialId,
          course_id: courseId,
          module_id: moduleId,
          topic_id: topicId,
          timestamp_seconds: timestamp,
          note_text: newNoteText.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setNotes((prev) => [...prev, data].sort((a, b) => a.timestamp_seconds - b.timestamp_seconds));
      setNewNoteText('');
      toast.success('Note saved!');
    } catch (error) {
      console.error('Error saving note:', error);
      toast.error('Failed to save note');
    }
  }, [newNoteText, userId, materialId, courseId, moduleId, topicId]);

  const updateNote = useCallback(
    async (noteId: string) => {
      if (!userId) {
        toast.info('Log in to edit notes');
        return;
      }
      if (!editingNoteText.trim()) return;

      try {
        const { error } = await supabase
          .from('student_video_notes')
          .update({ note_text: editingNoteText.trim() })
          .eq('id', noteId);

        if (error) throw error;

        setNotes((prev) => prev.map((n) => (n.id === noteId ? { ...n, note_text: editingNoteText.trim() } : n)));
        setEditingNoteId(null);
        setEditingNoteText('');
        toast.success('Note updated!');
      } catch (error) {
        console.error('Error updating note:', error);
        toast.error('Failed to update note');
      }
    },
    [editingNoteText, userId]
  );

  const deleteNote = useCallback(
    async (noteId: string) => {
      if (!userId) {
        toast.info('Log in to delete notes');
        return;
      }

      try {
        const { error } = await supabase.from('student_video_notes').delete().eq('id', noteId);

        if (error) throw error;

        setNotes((prev) => prev.filter((n) => n.id !== noteId));
        toast.info('Note deleted');
      } catch (error) {
        console.error('Error deleting note:', error);
        toast.error('Failed to delete note');
      }
    },
    [userId]
  );


  const jumpToTime = useCallback((time: number) => {
    if (videoRef.current && time <= maxWatchedTime + 3) {
      videoRef.current.currentTime = time;
    } else {
      toast.warning('You cannot jump to an unwatched portion');
    }
  }, [maxWatchedTime]);

  // Get current chapter
  const getCurrentChapter = useCallback(() => {
    if (chapters.length === 0) return null;
    return chapters.find(ch => 
      currentTime >= ch.start_time_seconds && 
      (!ch.end_time_seconds || currentTime < ch.end_time_seconds)
    );
  }, [chapters, currentTime]);

  // Filter transcript segments by search
  const filteredTranscriptSegments = transcript?.segments.filter(seg =>
    transcriptSearch === '' || seg.text.toLowerCase().includes(transcriptSearch.toLowerCase())
  ) || [];

  // Highlight search text in transcript
  const highlightText = (text: string, search: string) => {
    if (!search) return text;
    const parts = text.split(new RegExp(`(${search})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === search.toLowerCase() 
        ? <mark key={i} className="bg-yellow-200 dark:bg-yellow-800">{part}</mark>
        : part
    );
  };

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

  // Save progress
  const saveProgress = useCallback(
    async (watchTime: number, completed: boolean = false) => {
      const now = Date.now();
      if (!completed && now - lastSaveTime.current < 10000) return;
      lastSaveTime.current = now;

      if (!userId) return;

      setIsSaving(true);
      try {
        const { error } = await supabase
          .from('student_video_progress')
          .upsert(
            [
              {
                user_id: userId,
                material_id: materialId,
                course_id: courseId,
                module_id: moduleId,
                topic_id: topicId,
                watch_time_seconds: Math.floor(watchTime),
                total_duration_seconds: Math.floor(duration),
                completed,
                completed_at: completed ? new Date().toISOString() : null,
              },
            ] as any,
            {
              onConflict: 'user_id,material_id',
            }
          );

        if (error) throw error;

        if (completed && !isCompleted) {
          setIsCompleted(true);
          onComplete?.(moduleId);
          toast.success('Video marked as complete!');
        }
      } catch (error) {
        console.error('Error saving progress:', error);
      } finally {
        setIsSaving(false);
      }
    },
    [materialId, courseId, moduleId, topicId, duration, isCompleted, onComplete, userId]
  );

  const handleConfirmCompletion = useCallback(() => {
    setShowCompletionDialog(false);
    saveProgress(currentTime, true);
  }, [saveProgress, currentTime]);

  const handleCancelCompletion = useCallback(() => {
    setShowCompletionDialog(false);
    setPendingCompletion(false);
  }, []);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;

    const current = videoRef.current.currentTime;
    const videoDuration = videoRef.current.duration;

    if (current > maxWatchedTime + 3) {
      videoRef.current.currentTime = maxWatchedTime;
      toast.warning('You cannot skip ahead in the video');
      return;
    }

    setCurrentTime(current);

    if (current > maxWatchedTime) {
      setMaxWatchedTime(current);
    }

    if (userId && videoDuration > 0 && current >= videoDuration * 0.9 && !isCompleted && !pendingCompletion) {
      setPendingCompletion(true);
      videoRef.current?.pause();
      setShowCompletionDialog(true);
    } else if (!pendingCompletion) {
      saveProgress(current, false);
    }
  };


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
    videoRef.current.paused ? videoRef.current.play() : videoRef.current.pause();
  };

  const handleSeek = (direction: 'back' | 'forward') => {
    if (!videoRef.current) return;
    if (direction === 'back') {
      videoRef.current.currentTime = Math.max(0, videoRef.current.currentTime - 10);
    } else {
      videoRef.current.currentTime = Math.min(videoRef.current.currentTime + 10, maxWatchedTime + 3);
    }
  };

  const handleClose = () => {
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
      if (currentTime > 0 && !isCompleted) {
        saveProgress(currentTime, false);
      }
    }
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
    }
    onClose();
  };

  const handleVideoEnded = () => {
    const current = videoRef.current?.currentTime || 0;
    if (current > segmentStart.current) {
      const newSegment: WatchedSegment = {
        start: Math.floor(segmentStart.current),
        end: Math.floor(current),
      };
      setWatchedSegments((prev) => mergeSegments([...prev, newSegment]));
    }

    if (userId && !isCompleted && !pendingCompletion) {
      setPendingCompletion(true);
      setShowCompletionDialog(true);
    }
  };


  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    console.error('Video load error:', e);
    setIsLoading(false);
    setHasError(true);
  };

  const getWatchedPercentage = (): number => {
    if (duration <= 0) return 0;
    const totalWatched = watchedSegments.reduce((acc, seg) => acc + (seg.end - seg.start), 0);
    return Math.min(100, Math.round((totalWatched / duration) * 100));
  };

  const progress = duration > 0 ? Math.round((currentTime / duration) * 100) : 0;
  const currentChapter = getCurrentChapter();

  return (
    <>
      <Dialog
  open={isOpen}
  onOpenChange={(open) => {
    if (!open) handleClose();
  }}
>

        <DialogContent className={`p-0 overflow-hidden bg-card ${showSidePanel ? 'max-w-6xl' : 'max-w-4xl'} w-full`}>
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="flex items-center gap-2 text-foreground">
              {videoTitle}
              {isCompleted && <CheckCircle2 className="h-5 w-5 text-success" />}
              {isSaving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
              {isPiPActive && (
                <Badge variant="secondary" className="text-xs">PiP Active</Badge>
              )}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">{topicName}</p>
              {currentChapter && (
                <Badge variant="outline" className="text-xs">
                  {currentChapter.title}
                </Badge>
              )}
            </div>
          </DialogHeader>
          
          <div className="flex">
            {/* Main Video Area */}
            <div className={`flex-1 ${showSidePanel ? 'max-w-[60%]' : ''}`}>
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
                      <p className="text-sm text-muted-foreground">Failed to load video.</p>
                      <Button variant="outline" onClick={() => window.open(videoUrl, '_blank')}>
                        Open in New Tab
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
                        <Button variant="ghost" size="icon" className="bg-black/50 hover:bg-black/70 text-white" onClick={togglePiP}>
                          <PictureInPicture2 className="h-5 w-5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Picture-in-Picture (P)</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <Button variant="ghost" size="icon" className="bg-black/50 hover:bg-black/70 text-white" onClick={toggleFullscreen}>
                    {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
                  </Button>
                </div>

                {/* Chapter markers on video timeline */}
                {duration > 0 && chapters.length > 0 && (
                  <div className="absolute bottom-12 left-0 right-0 h-1 pointer-events-none z-10">
                    {chapters.map(chapter => (
                      <div
                        key={chapter.id}
                        className="absolute w-0.5 h-3 bg-blue-400 -top-1"
                        style={{ left: `${(chapter.start_time_seconds / duration) * 100}%` }}
                        title={chapter.title}
                      />
                    ))}
                  </div>
                )}

                {/* Bookmark indicators */}
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

              {/* Mini Progress Bar */}
              <div className="px-4 pt-2">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs text-muted-foreground">Watched:</span>
                  <span className="text-xs font-medium">{getWatchedPercentage()}%</span>
                </div>
                <div ref={progressBarRef} className="relative h-2 bg-muted rounded-full overflow-hidden">
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
                  <div className="absolute h-full w-0.5 bg-primary z-10" style={{ left: `${(currentTime / duration) * 100}%` }} />
                  <div className="absolute h-full bg-primary/30" style={{ width: `${(maxWatchedTime / duration) * 100}%` }} />
                  {bookmarks.map(bookmark => (
                    <div
                      key={bookmark.id}
                      className="absolute w-1.5 h-1.5 bg-yellow-400 rounded-full top-1/2 -translate-y-1/2 cursor-pointer hover:scale-150 transition-transform z-20"
                      style={{ left: `${(bookmark.time / duration) * 100}%` }}
                      onClick={() => jumpToBookmark(bookmark.time)}
                    />
                  ))}
                  {chapters.map(chapter => (
                    <div
                      key={chapter.id}
                      className="absolute w-0.5 h-full bg-blue-400/50 z-15"
                      style={{ left: `${(chapter.start_time_seconds / duration) * 100}%` }}
                    />
                  ))}
                </div>
              </div>
              
              {/* Controls */}
              <div className="p-4 border-t border-border">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="flex items-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleSeek('back')}>
                              <SkipBack className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>-10s (←)</TooltipContent>
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
                          <TooltipContent>+10s (→)</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>

                    <div className="text-sm text-muted-foreground">
                      {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                    
                    <Select value={playbackSpeed} onValueChange={handleSpeedChange}>
                      <SelectTrigger className="w-16 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {speedOptions.map((speed) => (
                          <SelectItem key={speed} value={speed}>{speed}x</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant={isPiPActive ? "default" : "ghost"} size="icon" className="h-8 w-8" onClick={togglePiP}>
                            <PictureInPicture2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>PiP (P)</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

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

                    {/* Bookmarks Popover */}
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
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowBookmarkInput(true)}>
                              <BookmarkPlus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          {showBookmarkInput && (
                            <div className="flex gap-2">
                              <Input
                                placeholder="Label..."
                                value={newBookmarkLabel}
                                onChange={(e) => setNewBookmarkLabel(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') addBookmark();
                                  if (e.key === 'Escape') setShowBookmarkInput(false);
                                }}
                                className="h-8 text-sm"
                                autoFocus
                              />
                              <Button size="sm" className="h-8" onClick={addBookmark}>Add</Button>
                            </div>
                          )}
                          
                          <ScrollArea className="h-32">
                            {bookmarks.length === 0 ? (
                              <p className="text-xs text-muted-foreground text-center py-4">Press B to add</p>
                            ) : (
                              <div className="space-y-1">
                                {bookmarks.map(bookmark => (
                                  <div
                                    key={bookmark.id}
                                    className="flex items-center gap-2 p-2 hover:bg-muted rounded-md cursor-pointer group"
                                    onClick={() => jumpToBookmark(bookmark.time)}
                                  >
                                    <span className="text-xs font-mono text-muted-foreground">{formatTime(bookmark.time)}</span>
                                    <span className="text-sm flex-1 truncate">{bookmark.label}</span>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6 opacity-0 group-hover:opacity-100"
                                      onClick={(e) => { e.stopPropagation(); deleteBookmark(bookmark.id); }}
                                    >
                                      <Trash2 className="h-3 w-3 text-destructive" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </ScrollArea>
                        </div>
                      </PopoverContent>
                    </Popover>

                    {/* Side Panel Toggle */}
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            variant={showSidePanel ? "default" : "ghost"} 
                            size="sm" 
                            className="h-8 gap-1" 
                            onClick={() => setShowSidePanel(!showSidePanel)}
                          >
                            <List className="h-4 w-4" />
                            <span className="hidden sm:inline">More</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Chapters, Notes & Transcript</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="flex items-center gap-1 text-xs text-muted-foreground cursor-help">
                            <Keyboard className="h-3 w-3" />
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-xs">
                          <div className="text-xs space-y-1">
                            <p><kbd className="px-1 bg-muted rounded">Space</kbd> Play/Pause</p>
                            <p><kbd className="px-1 bg-muted rounded">←/→</kbd> Seek</p>
                            <p><kbd className="px-1 bg-muted rounded">1-4</kbd> Speed</p>
                            <p><kbd className="px-1 bg-muted rounded">F</kbd> Fullscreen</p>
                            <p><kbd className="px-1 bg-muted rounded">B</kbd> Bookmark</p>
                            <p><kbd className="px-1 bg-muted rounded">P</kbd> PiP</p>
                            <p><kbd className="px-1 bg-muted rounded">N</kbd> Notes</p>
                            <p><kbd className="px-1 bg-muted rounded">C</kbd> Chapters</p>
                            <p><kbd className="px-1 bg-muted rounded">T</kbd> Transcript</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    {isCompleted ? (
                      <span className="flex items-center gap-1 text-success text-sm font-medium">
                        <CheckCircle2 className="h-4 w-4" /> Done
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-xs">90% to complete</span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Side Panel */}
            {showSidePanel && (
              <div className="w-80 border-l border-border flex flex-col max-h-[600px]">
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex flex-col h-full">
                  <TabsList className="grid w-full grid-cols-3 m-2">
                    <TabsTrigger value="chapters" className="text-xs gap-1">
                      <List className="h-3 w-3" />
                      <span className="hidden sm:inline">Chapters</span>
                    </TabsTrigger>
                    <TabsTrigger value="notes" className="text-xs gap-1">
                      <StickyNote className="h-3 w-3" />
                      <span className="hidden sm:inline">Notes</span>
                      {notes.length > 0 && <Badge variant="secondary" className="ml-1 h-4 px-1 text-xs">{notes.length}</Badge>}
                    </TabsTrigger>
                    <TabsTrigger value="transcript" className="text-xs gap-1">
                      <FileText className="h-3 w-3" />
                      <span className="hidden sm:inline">Script</span>
                    </TabsTrigger>
                  </TabsList>

                  {/* Chapters Tab */}
                  <TabsContent value="chapters" className="flex-1 overflow-hidden m-0">
                    <ScrollArea className="h-full p-2">
                      {chapters.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <List className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No chapters available</p>
                          <p className="text-xs">Content manager can add chapters</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {chapters.map((chapter, idx) => {
                            const isActive = currentChapter?.id === chapter.id;
                            const canJump = chapter.start_time_seconds <= maxWatchedTime + 3;
                            
                            return (
                              <div
                                key={chapter.id}
                                className={`p-2 rounded-md cursor-pointer transition-colors ${
                                  isActive ? 'bg-primary/10 border border-primary/30' : 'hover:bg-muted'
                                } ${!canJump ? 'opacity-50' : ''}`}
                                onClick={() => canJump && jumpToTime(chapter.start_time_seconds)}
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-mono text-muted-foreground w-12">
                                    {formatTime(chapter.start_time_seconds)}
                                  </span>
                                  {isActive && <ChevronRight className="h-3 w-3 text-primary" />}
                                  <span className="text-sm font-medium flex-1 truncate">{chapter.title}</span>
                                </div>
                                {chapter.description && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2 ml-14">
                                    {chapter.description}
                                  </p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  {/* Notes Tab */}
                  <TabsContent value="notes" className="flex-1 overflow-hidden m-0 flex flex-col">
                    <div className="p-2 border-b border-border">
                      <div className="flex gap-2">
                        <Textarea
                          placeholder={`Add note at ${formatTime(currentTime)}...`}
                          value={newNoteText}
                          onChange={(e) => setNewNoteText(e.target.value)}
                          className="min-h-[60px] text-sm resize-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                              addNote();
                            }
                          }}
                        />
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-xs text-muted-foreground">Ctrl+Enter to save</span>
                        <Button size="sm" onClick={addNote} disabled={!newNoteText.trim()}>
                          <Plus className="h-3 w-3 mr-1" /> Add
                        </Button>
                      </div>
                    </div>
                    
                    <ScrollArea className="flex-1 p-2">
                      {notes.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <StickyNote className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No notes yet</p>
                          <p className="text-xs">Add timestamped notes above</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {notes.map(note => (
                            <div
                              key={note.id}
                              className="p-2 rounded-md bg-muted/50 hover:bg-muted group"
                            >
                              <div className="flex items-center justify-between mb-1">
                                <button
                                  className="text-xs font-mono text-primary hover:underline"
                                  onClick={() => jumpToTime(note.timestamp_seconds)}
                                >
                                  {formatTime(note.timestamp_seconds)}
                                </button>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => {
                                      setEditingNoteId(note.id);
                                      setEditingNoteText(note.note_text);
                                    }}
                                  >
                                    <Edit2 className="h-3 w-3" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => deleteNote(note.id)}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              </div>
                              {editingNoteId === note.id ? (
                                <div className="space-y-2">
                                  <Textarea
                                    value={editingNoteText}
                                    onChange={(e) => setEditingNoteText(e.target.value)}
                                    className="min-h-[60px] text-sm"
                                    autoFocus
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <Button size="sm" variant="ghost" onClick={() => setEditingNoteId(null)}>
                                      Cancel
                                    </Button>
                                    <Button size="sm" onClick={() => updateNote(note.id)}>
                                      <Save className="h-3 w-3 mr-1" /> Save
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <p className="text-sm whitespace-pre-wrap">{note.note_text}</p>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>

                  {/* Transcript Tab */}
                  <TabsContent value="transcript" className="flex-1 overflow-hidden m-0 flex flex-col">
                    <div className="p-2 border-b border-border">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search transcript..."
                          value={transcriptSearch}
                          onChange={(e) => setTranscriptSearch(e.target.value)}
                          className="pl-8 h-8 text-sm"
                        />
                      </div>
                    </div>
                    
                    <ScrollArea className="flex-1 p-2">
                      {!transcript ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No transcript available</p>
                          <p className="text-xs">Transcripts can be added by content managers</p>
                        </div>
                      ) : transcript.segments.length === 0 && transcript.full_text ? (
                        <div className="p-2">
                          <p className="text-sm whitespace-pre-wrap">
                            {highlightText(transcript.full_text, transcriptSearch)}
                          </p>
                        </div>
                      ) : filteredTranscriptSegments.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No matches found</p>
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {filteredTranscriptSegments.map((segment, idx) => {
                            const isActive = currentTime >= segment.start && currentTime < segment.end;
                            const canJump = segment.start <= maxWatchedTime + 3;
                            
                            return (
                              <div
                                key={idx}
                                className={`p-2 rounded-md cursor-pointer transition-colors ${
                                  isActive ? 'bg-primary/10 border-l-2 border-primary' : 'hover:bg-muted'
                                } ${!canJump ? 'opacity-50' : ''}`}
                                onClick={() => canJump && jumpToTime(segment.start)}
                              >
                                <div className="flex items-start gap-2">
                                  <span className="text-xs font-mono text-muted-foreground shrink-0">
                                    {formatTime(segment.start)}
                                  </span>
                                  <div className="flex-1">
                                    {segment.speaker && (
                                      <span className="text-xs font-medium text-primary mr-1">
                                        {segment.speaker}:
                                      </span>
                                    )}
                                    <span className="text-sm">
                                      {highlightText(segment.text, transcriptSearch)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Completion Dialog */}
      <AlertDialog open={showCompletionDialog} onOpenChange={setShowCompletionDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-success" />
              Mark Video as Complete?
            </AlertDialogTitle>
            <AlertDialogDescription>
              You've watched enough of this video to mark it as complete.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelCompletion}>Continue Watching</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmCompletion}>Mark Complete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
    
  );
};
