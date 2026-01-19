import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Subtitles, Upload, Trash2, Loader2, Globe, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { supportedLanguages } from '@/i18n';

interface SubtitleTrack {
  id: string;
  language_code: string;
  language_name: string;
  subtitle_url: string;
  is_default: boolean;
}

interface SubtitleManagerProps {
  isOpen: boolean;
  onClose: () => void;
  materialId: string;
  courseId: string;
  moduleId: string;
  topicId: string;
  videoName: string;
  onUpdate?: () => void;
}

export const SubtitleManager: React.FC<SubtitleManagerProps> = ({
  isOpen,
  onClose,
  materialId,
  courseId,
  moduleId,
  topicId,
  videoName,
  onUpdate,
}) => {
  const [subtitles, setSubtitles] = useState<SubtitleTrack[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch subtitles when dialog opens
  React.useEffect(() => {
    if (isOpen && materialId) {
      fetchSubtitles();
    }
  }, [isOpen, materialId]);

  const fetchSubtitles = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('video_subtitles')
        .select('*')
        .eq('material_id', materialId)
        .order('language_code');

      if (error) throw error;
      setSubtitles(data || []);
    } catch (error) {
      console.error('Error fetching subtitles:', error);
      toast.error('Failed to load subtitles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.vtt')) {
        toast.error('Please select a VTT file');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !selectedLanguage) {
      toast.error('Please select a language and file');
      return;
    }

    setIsUploading(true);
    try {
      // Upload to storage
      const fileName = `${courseId}/${moduleId}/${topicId}/subtitles/${selectedLanguage}_${Date.now()}.vtt`;
      
      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(fileName, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('course-materials')
        .getPublicUrl(fileName);

      const langOption = supportedLanguages.find(l => l.code === selectedLanguage);

      // Check if subtitle for this language already exists
      const existing = subtitles.find(s => s.language_code === selectedLanguage);

      if (existing) {
        // Update existing
        const { error: dbError } = await supabase
          .from('video_subtitles')
          .update({
            subtitle_url: urlData.publicUrl,
            language_name: langOption?.nativeName || selectedLanguage,
          })
          .eq('id', existing.id);

        if (dbError) throw dbError;
      } else {
        // Insert new
        const { error: dbError } = await supabase
          .from('video_subtitles')
          .insert({
            material_id: materialId,
            course_id: courseId,
            module_id: moduleId,
            topic_id: topicId,
            language_code: selectedLanguage,
            language_name: langOption?.nativeName || selectedLanguage,
            subtitle_url: urlData.publicUrl,
            is_default: subtitles.length === 0,
          });

        if (dbError) throw dbError;
      }

      toast.success(`Subtitle uploaded for ${langOption?.name || selectedLanguage}`);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      fetchSubtitles();
      onUpdate?.();
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Failed to upload subtitle');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (subtitle: SubtitleTrack) => {
    try {
      const { error } = await supabase
        .from('video_subtitles')
        .delete()
        .eq('id', subtitle.id);

      if (error) throw error;

      toast.success('Subtitle deleted');
      fetchSubtitles();
      onUpdate?.();
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete subtitle');
    }
  };

  const handleSetDefault = async (subtitleId: string) => {
    try {
      // First, unset all defaults for this material
      await supabase
        .from('video_subtitles')
        .update({ is_default: false })
        .eq('material_id', materialId);

      // Set new default
      const { error } = await supabase
        .from('video_subtitles')
        .update({ is_default: true })
        .eq('id', subtitleId);

      if (error) throw error;

      toast.success('Default subtitle updated');
      fetchSubtitles();
    } catch (error) {
      console.error('Error setting default:', error);
      toast.error('Failed to set default');
    }
  };

  const availableLanguages = supportedLanguages.filter(
    lang => !subtitles.some(s => s.language_code === lang.code)
  );

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Subtitles className="w-5 h-5 text-primary" />
            Manage Subtitles
          </DialogTitle>
        </DialogHeader>

        <div className="mb-4 p-3 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">Video:</p>
          <p className="font-medium">{videoName}</p>
        </div>

        {/* Upload new subtitle */}
        <div className="space-y-3 mb-6">
          <Label>Add Subtitle Track</Label>
          <div className="flex gap-2">
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Language" />
              </SelectTrigger>
              <SelectContent>
                {availableLanguages.map(lang => (
                  <SelectItem key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <input
              ref={fileInputRef}
              type="file"
              accept=".vtt"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileText className="w-4 h-4 mr-2" />
              {selectedFile ? selectedFile.name : 'Select VTT file'}
            </Button>
            <Button onClick={handleUpload} disabled={!selectedFile || isUploading}>
              {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Upload subtitle files in WebVTT (.vtt) format
          </p>
        </div>

        {/* Existing subtitles */}
        <div className="space-y-2">
          <Label>Existing Subtitles</Label>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : subtitles.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No subtitles added yet</p>
            </div>
          ) : (
            <ScrollArea className="h-48">
              <div className="space-y-2">
                {subtitles.map(subtitle => (
                  <div
                    key={subtitle.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <div className="flex items-center gap-2">
                      <Subtitles className="w-4 h-4 text-primary" />
                      <span className="font-medium">{subtitle.language_name}</span>
                      {subtitle.is_default && (
                        <Badge variant="secondary" className="text-xs">Default</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      {!subtitle.is_default && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleSetDefault(subtitle.id)}
                        >
                          Set Default
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        onClick={() => handleDelete(subtitle)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubtitleManager;
