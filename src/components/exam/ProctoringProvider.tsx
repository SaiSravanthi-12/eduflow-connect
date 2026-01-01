import React, { useEffect, useRef, useState, useCallback, createContext, useContext } from 'react';
import { toast } from 'sonner';

interface ProctoringViolation {
  type: string;
  timestamp: string;
  details?: string;
}

interface ProctoringContextType {
  violations: ProctoringViolation[];
  violationCount: number;
  isWebcamEnabled: boolean;
  startProctoring: () => Promise<boolean>;
  stopProctoring: () => void;
  addViolation: (type: string, details?: string) => void;
}

const ProctoringContext = createContext<ProctoringContextType | null>(null);

export const useProctoring = () => {
  const context = useContext(ProctoringContext);
  if (!context) {
    throw new Error('useProctoring must be used within a ProctoringProvider');
  }
  return context;
};

interface ProctoringProviderProps {
  children: React.ReactNode;
  maxViolations?: number;
  onMaxViolationsReached?: () => void;
  onViolation?: (violation: ProctoringViolation) => void;
}

export const ProctoringProvider: React.FC<ProctoringProviderProps> = ({
  children,
  maxViolations = 3,
  onMaxViolationsReached,
  onViolation,
}) => {
  const [violations, setViolations] = useState<ProctoringViolation[]>([]);
  const [violationCount, setViolationCount] = useState(0);
  const [isWebcamEnabled, setIsWebcamEnabled] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const addViolation = useCallback((type: string, details?: string) => {
    const violation: ProctoringViolation = {
      type,
      timestamp: new Date().toISOString(),
      details,
    };

    setViolations(prev => [...prev, violation]);
    setViolationCount(prev => {
      const newCount = prev + 1;
      if (newCount >= maxViolations) {
        onMaxViolationsReached?.();
        toast.error('Maximum violations reached. Exam will be auto-submitted.');
      } else {
        toast.warning(`Warning: ${type}. ${maxViolations - newCount} warnings remaining.`);
      }
      return newCount;
    });

    onViolation?.(violation);
  }, [maxViolations, onMaxViolationsReached, onViolation]);

  // Disable keyboard shortcuts
  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Disable common shortcuts
      if (
        (e.ctrlKey || e.metaKey) &&
        ['c', 'v', 'x', 'a', 's', 'p', 'f', 'u'].includes(e.key.toLowerCase())
      ) {
        e.preventDefault();
        addViolation('Keyboard shortcut attempt', `Attempted: ${e.ctrlKey ? 'Ctrl' : 'Cmd'}+${e.key}`);
      }
      // Disable F12 (DevTools)
      if (e.key === 'F12') {
        e.preventDefault();
        addViolation('DevTools attempt', 'Attempted to open developer tools');
      }
      // Disable PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        addViolation('Screenshot attempt', 'Attempted to take screenshot');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive, addViolation]);

  // Disable right-click context menu
  useEffect(() => {
    if (!isActive) return;

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      addViolation('Right-click attempt', 'Attempted to open context menu');
    };

    document.addEventListener('contextmenu', handleContextMenu);
    return () => document.removeEventListener('contextmenu', handleContextMenu);
  }, [isActive, addViolation]);

  // Detect tab/window switching
  useEffect(() => {
    if (!isActive) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        addViolation('Tab switch detected', 'User switched to another tab or minimized window');
      }
    };

    const handleBlur = () => {
      addViolation('Window blur detected', 'Window lost focus');
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
    };
  }, [isActive, addViolation]);

  // Disable text selection
  useEffect(() => {
    if (!isActive) return;

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      addViolation('Copy attempt', 'Attempted to copy content');
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      addViolation('Paste attempt', 'Attempted to paste content');
    };

    const handleCut = (e: ClipboardEvent) => {
      e.preventDefault();
      addViolation('Cut attempt', 'Attempted to cut content');
    };

    document.addEventListener('selectstart', handleSelectStart);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('paste', handlePaste);
    document.addEventListener('cut', handleCut);

    return () => {
      document.removeEventListener('selectstart', handleSelectStart);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('paste', handlePaste);
      document.removeEventListener('cut', handleCut);
    };
  }, [isActive, addViolation]);

  const startProctoring = useCallback(async () => {
    try {
      // Request webcam access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });

      streamRef.current = stream;
      setIsWebcamEnabled(true);
      setIsActive(true);

      // Create hidden video element for webcam
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.style.position = 'fixed';
      video.style.bottom = '20px';
      video.style.right = '20px';
      video.style.width = '160px';
      video.style.height = '120px';
      video.style.borderRadius = '8px';
      video.style.zIndex = '9999';
      video.style.border = '2px solid hsl(var(--primary))';
      video.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
      document.body.appendChild(video);
      videoRef.current = video;

      return true;
    } catch (error) {
      console.error('Failed to start webcam:', error);
      toast.error('Webcam access is required for the exam');
      return false;
    }
  }, []);

  const stopProctoring = useCallback(() => {
    setIsActive(false);
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.remove();
      videoRef.current = null;
    }

    setIsWebcamEnabled(false);
  }, []);

  return (
    <ProctoringContext.Provider
      value={{
        violations,
        violationCount,
        isWebcamEnabled,
        startProctoring,
        stopProctoring,
        addViolation,
      }}
    >
      {children}
    </ProctoringContext.Provider>
  );
};
