import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { 
  ArrowLeft, 
  Video, 
  FileText, 
  Upload, 
  BookOpen,
  X,
  Loader2
} from 'lucide-react';
import { coursesSyllabusData, CourseSyllabus, SyllabusTopic } from '@/data/coursesSyllabusData';

interface CourseMaterial {
  id: string;
  course_id: string;
  module_id: string;
  topic_id: string;
  material_type: string;
  name: string;
  file_url: string;
  file_path: string | null;
  uploaded_at: string;
}

export default function ContentManagerCourseSyllabusPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [course] = useState<CourseSyllabus | null>(() => {
    return coursesSyllabusData.find(c => c.id === courseId) || null;
  });
  
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<{ moduleId: string; topic: SyllabusTopic } | null>(null);
  const [uploadType, setUploadType] = useState<'video' | 'document'>('video');
  const [uploadForm, setUploadForm] = useState({ name: '' });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (courseId) {
      fetchMaterials();
    }
  }, [courseId]);

  const fetchMaterials = async () => {
    try {
      const { data, error } = await supabase
        .from('course_materials')
        .select('*')
        .eq('course_id', courseId);

      if (error) throw error;
      setMaterials(data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
      toast({
        title: 'Error',
        description: 'Failed to load course materials',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getMaterialForTopic = (topicId: string, type: 'video' | 'document') => {
    return materials.find(m => m.topic_id === topicId && m.material_type === type);
  };

  if (!course) {
    return (
      <DashboardLayout>
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-2">Course not found</h2>
          <Button onClick={() => navigate('/teacher/courses')}>Back to Courses</Button>
        </div>
      </DashboardLayout>
    );
  }

  const handleUploadClick = (moduleId: string, topic: SyllabusTopic, type: 'video' | 'document') => {
    setSelectedTopic({ moduleId, topic });
    setUploadType(type);
    const existingMaterial = getMaterialForTopic(topic.id, type);
    setUploadForm({ name: existingMaterial?.name || '' });
    setSelectedFile(null);
    setIsUploadDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (!uploadForm.name) {
        setUploadForm({ name: file.name.split('.')[0] });
      }
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTopic || !course || !selectedFile) {
      toast({
        title: 'Error',
        description: 'Please select a file to upload',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);

    try {
      // Upload file to storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${course.id}/${selectedTopic.moduleId}/${selectedTopic.topic.id}/${uploadType}_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('course-materials')
        .upload(fileName, selectedFile, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('course-materials')
        .getPublicUrl(fileName);

      // Check if material already exists
      const existingMaterial = getMaterialForTopic(selectedTopic.topic.id, uploadType);

      if (existingMaterial) {
        // Update existing material
        const { error: dbError } = await supabase
          .from('course_materials')
          .update({
            name: uploadForm.name,
            file_url: urlData.publicUrl,
            file_path: fileName,
            uploaded_at: new Date().toISOString(),
          })
          .eq('id', existingMaterial.id);

        if (dbError) throw dbError;
      } else {
        // Insert new material
        const { error: dbError } = await supabase
          .from('course_materials')
          .insert({
            course_id: course.id,
            module_id: selectedTopic.moduleId,
            topic_id: selectedTopic.topic.id,
            material_type: uploadType,
            name: uploadForm.name,
            file_url: urlData.publicUrl,
            file_path: fileName,
          });

        if (dbError) throw dbError;
      }

      await fetchMaterials();
      setIsUploadDialogOpen(false);
      setUploadForm({ name: '' });
      setSelectedFile(null);

      toast({
        title: `${uploadType === 'video' ? 'Video' : 'Document'} uploaded`,
        description: `${uploadForm.name} has been added to "${selectedTopic.topic.name}"`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload failed',
        description: 'Failed to upload the file. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveMaterial = async (material: CourseMaterial) => {
    try {
      // Delete from storage if file_path exists
      if (material.file_path) {
        await supabase.storage
          .from('course-materials')
          .remove([material.file_path]);
      }

      // Delete from database
      const { error } = await supabase
        .from('course_materials')
        .delete()
        .eq('id', material.id);

      if (error) throw error;

      await fetchMaterials();

      toast({
        title: 'Material removed',
        description: `${material.material_type === 'video' ? 'Video' : 'Document'} has been removed.`,
      });
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove material',
        variant: 'destructive',
      });
    }
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

  const getUploadedCount = () => {
    let total = 0;
    course.modules.forEach(module => {
      module.topics.forEach(() => {
        total += 2; // video + document slots
      });
    });
    return { total, uploaded: materials.length };
  };

  const stats = getUploadedCount();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <Button variant="ghost" onClick={() => navigate('/teacher/courses')} className="gap-2 mb-4">
          <ArrowLeft className="w-4 h-4" />
          Back to Courses
        </Button>
        <PageHeader
          title={course.name}
          description={course.description}
        />
      </div>

      {/* Progress Stats */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="font-medium">{course.modules.length} Modules</p>
                <p className="text-sm text-muted-foreground">
                  {course.modules.reduce((acc, m) => acc + m.topics.length, 0)} Topics
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">{stats.uploaded}</p>
              <p className="text-sm text-muted-foreground">of {stats.total} materials uploaded</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Syllabus Modules */}
      <div className="space-y-4">
        <Accordion type="multiple" className="space-y-4">
          {course.modules.map((module) => (
            <AccordionItem 
              key={module.id} 
              value={module.id}
              className="border rounded-xl overflow-hidden bg-card"
            >
              <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-muted/50">
                <div className="flex items-center gap-3 text-left">
                  <Badge variant="outline" className={getLevelColor(module.level)}>
                    {module.level}
                  </Badge>
                  <span className="font-medium">{module.title}</span>
                  <span className="text-sm text-muted-foreground ml-auto mr-2">
                    {module.topics.length} topics
                  </span>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-4 pb-4">
                <div className="space-y-3 pt-2">
                  {module.topics.map((topic) => {
                    const videoMaterial = getMaterialForTopic(topic.id, 'video');
                    const documentMaterial = getMaterialForTopic(topic.id, 'document');

                    return (
                      <div
                        key={topic.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                      >
                        <span className="font-medium text-sm flex-1">{topic.name}</span>
                        
                        <div className="flex items-center gap-2">
                          {/* Video Upload/Display */}
                          {videoMaterial ? (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
                              <Video className="w-3 h-3" />
                              <span className="max-w-20 truncate">{videoMaterial.name}</span>
                              <button
                                onClick={() => handleRemoveMaterial(videoMaterial)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-xs h-7"
                              onClick={() => handleUploadClick(module.id, topic, 'video')}
                            >
                              <Video className="w-3 h-3" />
                              <Upload className="w-3 h-3" />
                            </Button>
                          )}

                          {/* Document Upload/Display */}
                          {documentMaterial ? (
                            <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-accent/10 text-accent text-xs">
                              <FileText className="w-3 h-3" />
                              <span className="max-w-20 truncate">{documentMaterial.name}</span>
                              <button
                                onClick={() => handleRemoveMaterial(documentMaterial)}
                                className="ml-1 hover:text-destructive"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-1 text-xs h-7"
                              onClick={() => handleUploadClick(module.id, topic, 'document')}
                            >
                              <FileText className="w-3 h-3" />
                              <Upload className="w-3 h-3" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* Upload Dialog */}
      <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {uploadType === 'video' ? (
                <Video className="w-5 h-5 text-primary" />
              ) : (
                <FileText className="w-5 h-5 text-accent" />
              )}
              Upload {uploadType === 'video' ? 'Video' : 'Document'}
            </DialogTitle>
          </DialogHeader>
          
          {selectedTopic && (
            <div className="mb-4 p-3 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Topic:</p>
              <p className="font-medium">{selectedTopic.topic.name}</p>
            </div>
          )}

          <form onSubmit={handleUploadSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={uploadForm.name}
                onChange={(e) => setUploadForm({ name: e.target.value })}
                placeholder={`Enter ${uploadType} name`}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>File</Label>
              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileChange}
                accept={uploadType === 'video' ? 'video/*' : '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx'}
                className="hidden"
              />
              <div 
                className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {selectedFile ? (
                  <div className="flex items-center justify-center gap-2">
                    {uploadType === 'video' ? (
                      <Video className="w-5 h-5 text-primary" />
                    ) : (
                      <FileText className="w-5 h-5 text-accent" />
                    )}
                    <span className="font-medium">{selectedFile.name}</span>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Click to select a {uploadType}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {uploadType === 'video' ? 'MP4, MOV, AVI, etc.' : 'PDF, DOC, DOCX, PPT, XLS'}
                    </p>
                  </div>
                )}
              </div>
            </div>
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsUploadDialogOpen(false)} 
                className="flex-1"
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 gap-2" disabled={isUploading || !selectedFile}>
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Upload className="w-4 h-4" />
                )}
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
