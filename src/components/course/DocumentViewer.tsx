import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { FileText, X, ExternalLink, Download, Loader2, AlertCircle } from 'lucide-react';

export interface DocumentViewerProps {
  isOpen: boolean;
  onClose: () => void;
  documentUrl: string;
  documentTitle: string;
  topicName: string;
}

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  isOpen,
  onClose,
  documentUrl,
  documentTitle,
  topicName,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [viewMode, setViewMode] = useState<'embed' | 'fallback'>('embed');

  // Reset loading state when document changes
  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      setHasError(false);
      setViewMode('embed');
    }
  }, [isOpen, documentUrl]);

  // Disable right-click when document viewer is open
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      if (isOpen) {
        e.preventDefault();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isOpen) {
        if (
          (e.ctrlKey || e.metaKey) &&
          (e.key === 's' || e.key === 'S' || e.key === 'p' || e.key === 'P')
        ) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Determine the file type
  const getFileExtension = (url: string): string => {
    const cleanUrl = url.split('?')[0];
    const parts = cleanUrl.split('.');
    return parts.length > 1 ? parts.pop()?.toLowerCase() || '' : '';
  };

  const isPdf = (url: string): boolean => getFileExtension(url) === 'pdf';
  const isDocx = (url: string): boolean => ['doc', 'docx'].includes(getFileExtension(url));
  const fileExtension = getFileExtension(documentUrl);
  
  // Use Office Online viewer for Office docs, Google Docs for PDFs
  const getViewerUrl = (url: string) => {
    if (isDocx(url)) {
      return `https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`;
    }
    if (isPdf(url)) {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    }
    // For other types, try Google Docs viewer
    return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
  };

  // Handle iframe load timeout
  useEffect(() => {
    if (isOpen && viewMode === 'embed') {
      const timeout = setTimeout(() => {
        if (isLoading) {
          // If still loading after 15 seconds, show fallback
          setIsLoading(false);
          setViewMode('fallback');
        }
      }, 15000);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, isLoading, viewMode]);

  const handleIframeLoad = () => {
    setIsLoading(false);
  };

  const renderFallbackView = () => (
    <div className="flex flex-col items-center justify-center h-[calc(85vh-80px)] gap-4 p-8 text-center">
      <FileText className="h-16 w-16 text-muted-foreground" />
      <div>
        <h3 className="font-medium text-lg mb-2">Document Preview</h3>
        <p className="text-sm text-muted-foreground mb-4">
          {documentTitle} ({fileExtension.toUpperCase()})
        </p>
        <p className="text-sm text-muted-foreground mb-6">
          Click below to view or download this document.
        </p>
      </div>
      <div className="flex gap-3">
        <Button
          onClick={() => window.open(documentUrl, '_blank')}
          className="gap-2"
        >
          <ExternalLink className="h-4 w-4" />
          Open Document
        </Button>
        <a
          href={documentUrl}
          download
          className="inline-flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
        >
          <Download className="h-4 w-4" />
          Download
        </a>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl w-full h-[85vh] p-0 overflow-hidden bg-card">
        <DialogHeader className="p-4 pb-2 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2 text-foreground">
                <FileText className="h-5 w-5 text-primary" />
                {documentTitle}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">{topicName}</p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={documentUrl}
                download
                className="inline-flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted rounded-md transition-colors"
              >
                <Download className="h-4 w-4" />
                Download
              </a>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(documentUrl, '_blank')}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <ExternalLink className="h-4 w-4" />
                Open in New Tab
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div 
          className="flex-1 h-full select-none relative"
          style={{ 
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none',
          }}
        >
          {viewMode === 'embed' ? (
            <>
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">Loading document...</p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setViewMode('fallback')}
                      className="text-xs"
                    >
                      Taking too long? Click here
                    </Button>
                  </div>
                </div>
              )}
              
              <iframe
                src={getViewerUrl(documentUrl)}
                className="w-full h-[calc(85vh-80px)] border-0"
                title={documentTitle}
                sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
                loading="lazy"
                onLoad={handleIframeLoad}
                onError={() => {
                  setIsLoading(false);
                  setViewMode('fallback');
                }}
              />
            </>
          ) : (
            renderFallbackView()
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};