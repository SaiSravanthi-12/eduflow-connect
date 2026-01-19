import React from 'react';
import { Subtitles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';

export interface SubtitleTrack {
  id: string;
  languageCode: string;
  languageName: string;
  url: string;
  isDefault?: boolean;
}

interface SubtitleSelectorProps {
  tracks: SubtitleTrack[];
  activeTrackId: string | null;
  onSelectTrack: (trackId: string | null) => void;
  className?: string;
}

export const SubtitleSelector: React.FC<SubtitleSelectorProps> = ({
  tracks,
  activeTrackId,
  onSelectTrack,
  className,
}) => {
  const { t } = useLanguage();

  const activeTrack = tracks.find(track => track.id === activeTrackId);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={cn(
            'h-8 w-8 text-white hover:bg-white/20',
            activeTrackId && 'text-primary',
            className
          )}
          title={t('video.subtitles')}
        >
          <Subtitles className="h-4 w-4" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        align="end" 
        className="w-56 p-0"
        sideOffset={8}
      >
        <div className="p-2 border-b border-border">
          <h4 className="text-sm font-medium">{t('video.selectSubtitle')}</h4>
        </div>
        <ScrollArea className="max-h-60">
          <div className="p-1">
            {/* Off option */}
            <button
              onClick={() => onSelectTrack(null)}
              className={cn(
                'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                'hover:bg-muted',
                !activeTrackId && 'bg-primary/10 text-primary font-medium'
              )}
            >
              <span className="flex-1 text-left">{t('video.subtitlesOff')}</span>
              {!activeTrackId && <Check className="h-4 w-4" />}
            </button>
            
            {tracks.length > 0 ? (
              tracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() => onSelectTrack(track.id)}
                  className={cn(
                    'w-full flex items-center gap-2 px-3 py-2 text-sm rounded-md transition-colors',
                    'hover:bg-muted',
                    activeTrackId === track.id && 'bg-primary/10 text-primary font-medium'
                  )}
                >
                  <span className="flex-1 text-left">{track.languageName}</span>
                  {track.isDefault && (
                    <span className="text-xs text-muted-foreground">(default)</span>
                  )}
                  {activeTrackId === track.id && <Check className="h-4 w-4" />}
                </button>
              ))
            ) : (
              <p className="px-3 py-2 text-sm text-muted-foreground">
                {t('video.noSubtitles')}
              </p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default SubtitleSelector;
