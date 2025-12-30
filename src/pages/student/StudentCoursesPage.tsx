import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { BookOpen, Video, FileText, Play, Download, ArrowLeft, Lock, CheckCircle } from 'lucide-react';
import { coursesSyllabusData, CourseSyllabus } from '@/data/coursesSyllabusData';

export default function StudentCoursesPage() {
  const [selectedCourse, setSelectedCourse] = useState<CourseSyllabus | null>(null);

  // Filter to show only courses with at least some materials uploaded (simulating enrolled courses)
  const enrolledCourses = coursesSyllabusData;

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

  const getMaterialsCount = (course: CourseSyllabus) => {
    let videos = 0;
    let documents = 0;
    course.modules.forEach(module => {
      module.topics.forEach(topic => {
        if (topic.materials.video) videos++;
        if (topic.materials.document) documents++;
      });
    });
    return { videos, documents, total: videos + documents };
  };

  const getTopicsCount = (course: CourseSyllabus) => {
    return course.modules.reduce((acc, m) => acc + m.topics.length, 0);
  };

  if (selectedCourse) {
    const stats = getMaterialsCount(selectedCourse);
    
    return (
      <DashboardLayout>
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setSelectedCourse(null)} className="gap-2 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Courses
          </Button>
          <PageHeader
            title={selectedCourse.name}
            description={`Instructor: ${selectedCourse.instructor}`}
          />
        </div>

        {/* Course Stats */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{selectedCourse.modules.length} Modules</p>
                  <p className="text-sm text-muted-foreground">
                    {getTopicsCount(selectedCourse)} Topics
                  </p>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <Video className="w-5 h-5 text-primary" />
                  <span className="font-medium">{stats.videos}</span>
                  <span className="text-sm text-muted-foreground">Videos</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-accent" />
                  <span className="font-medium">{stats.documents}</span>
                  <span className="text-sm text-muted-foreground">Documents</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Syllabus with Materials */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Course Syllabus</h3>
          
          <Accordion type="multiple" className="space-y-4">
            {selectedCourse.modules.map((module) => (
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
                      const hasVideo = !!topic.materials.video;
                      const hasDocument = !!topic.materials.document;
                      const hasMaterials = hasVideo || hasDocument;

                      return (
                        <div
                          key={topic.id}
                          className="p-3 rounded-lg bg-muted/30 border border-border/50"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{topic.name}</span>
                            {hasMaterials ? (
                              <CheckCircle className="w-4 h-4 text-success" />
                            ) : (
                              <Lock className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                          
                          {hasMaterials ? (
                            <div className="flex flex-wrap gap-2">
                              {hasVideo && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2 text-xs"
                                  onClick={() => window.open(topic.materials.video?.url, '_blank')}
                                >
                                  <Video className="w-3 h-3 text-primary" />
                                  <Play className="w-3 h-3" />
                                  {topic.materials.video?.name}
                                </Button>
                              )}
                              {hasDocument && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2 text-xs"
                                  onClick={() => window.open(topic.materials.document?.url, '_blank')}
                                >
                                  <FileText className="w-3 h-3 text-accent" />
                                  <Download className="w-3 h-3" />
                                  {topic.materials.document?.name}
                                </Button>
                              )}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              Materials will be available soon
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="My Courses"
        description="Access your enrolled courses and study materials"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {enrolledCourses.map((course) => {
          const stats = getMaterialsCount(course);
          
          return (
            <Card
              key={course.id}
              className="card-hover cursor-pointer"
              onClick={() => setSelectedCourse(course)}
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{course.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{course.description}</p>
                <p className="text-sm mb-4">Instructor: {course.instructor}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    {course.modules.length} modules
                  </span>
                  <span className="flex items-center gap-1">
                    <Video className="w-4 h-4" />
                    {stats.videos}
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4" />
                    {stats.documents}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </DashboardLayout>
  );
}
