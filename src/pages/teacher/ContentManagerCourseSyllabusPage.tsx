import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Video, 
  FileText, 
  Upload, 
  Check, 
  ChevronDown,
  BookOpen,
  X
} from 'lucide-react';
import { coursesSyllabusData, CourseSyllabus, SyllabusTopic } from '@/data/coursesSyllabusData';

export default function ContentManagerCourseSyllabusPage() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<CourseSyllabus | null>(() => {
    return coursesSyllabusData.find(c => c.id === courseId) || null;
  });
  
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<{ moduleId: string; topic: SyllabusTopic } | null>(null);
  const [uploadType, setUploadType] = useState<'video' | 'document'>('video');
  const [uploadForm, setUploadForm] = useState({ name: '', url: '' });

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
    setUploadForm({ 
      name: topic.materials[type]?.name || '', 
      url: topic.materials[type]?.url || '' 
    });
    setIsUploadDialogOpen(true);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTopic || !course) return;

    const updatedCourse = { ...course };
    const moduleIndex = updatedCourse.modules.findIndex(m => m.id === selectedTopic.moduleId);
    if (moduleIndex === -1) return;

    const topicIndex = updatedCourse.modules[moduleIndex].topics.findIndex(
      t => t.id === selectedTopic.topic.id
    );
    if (topicIndex === -1) return;

    updatedCourse.modules[moduleIndex].topics[topicIndex].materials[uploadType] = {
      name: uploadForm.name,
      url: uploadForm.url,
      uploadedAt: new Date(),
    };

    setCourse(updatedCourse);
    setIsUploadDialogOpen(false);
    setUploadForm({ name: '', url: '' });

    toast({
      title: `${uploadType === 'video' ? 'Video' : 'Document'} uploaded`,
      description: `${uploadForm.name} has been added to "${selectedTopic.topic.name}"`,
    });
  };

  const handleRemoveMaterial = (moduleId: string, topicId: string, type: 'video' | 'document') => {
    const updatedCourse = { ...course };
    const moduleIndex = updatedCourse.modules.findIndex(m => m.id === moduleId);
    if (moduleIndex === -1) return;

    const topicIndex = updatedCourse.modules[moduleIndex].topics.findIndex(t => t.id === topicId);
    if (topicIndex === -1) return;

    delete updatedCourse.modules[moduleIndex].topics[topicIndex].materials[type];
    setCourse(updatedCourse);

    toast({
      title: 'Material removed',
      description: `${type === 'video' ? 'Video' : 'Document'} has been removed.`,
    });
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
    let uploaded = 0;
    course.modules.forEach(module => {
      module.topics.forEach(topic => {
        total += 2; // video + document slots
        if (topic.materials.video) uploaded++;
        if (topic.materials.document) uploaded++;
      });
    });
    return { total, uploaded };
  };

  const stats = getUploadedCount();

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
                  {module.topics.map((topic) => (
                    <div
                      key={topic.id}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50"
                    >
                      <span className="font-medium text-sm flex-1">{topic.name}</span>
                      
                      <div className="flex items-center gap-2">
                        {/* Video Upload/Display */}
                        {topic.materials.video ? (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary text-xs">
                            <Video className="w-3 h-3" />
                            <span className="max-w-20 truncate">{topic.materials.video.name}</span>
                            <button
                              onClick={() => handleRemoveMaterial(module.id, topic.id, 'video')}
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
                        {topic.materials.document ? (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-accent/10 text-accent text-xs">
                            <FileText className="w-3 h-3" />
                            <span className="max-w-20 truncate">{topic.materials.document.name}</span>
                            <button
                              onClick={() => handleRemoveMaterial(module.id, topic.id, 'document')}
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
                  ))}
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
                onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                placeholder={`Enter ${uploadType} name`}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>URL</Label>
              <Input
                value={uploadForm.url}
                onChange={(e) => setUploadForm({ ...uploadForm, url: e.target.value })}
                placeholder={uploadType === 'video' ? 'https://youtube.com/...' : 'https://drive.google.com/...'}
                required
              />
            </div>
            <div className="flex gap-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsUploadDialogOpen(false)} 
                className="flex-1"
              >
                Cancel
              </Button>
              <Button type="submit" className="flex-1 gap-2">
                <Upload className="w-4 h-4" />
                Upload
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
