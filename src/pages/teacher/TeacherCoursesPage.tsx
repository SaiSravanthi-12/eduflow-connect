import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Video, FileText } from 'lucide-react';
import { coursesSyllabusData, CourseSyllabus } from '@/data/coursesSyllabusData';

export default function TeacherCoursesPage() {
  const navigate = useNavigate();

  const getMaterialsCount = (course: CourseSyllabus) => {
    let videos = 0;
    let documents = 0;
    let totalSlots = 0;
    course.modules.forEach(module => {
      module.topics.forEach(topic => {
        totalSlots += 2;
        if (topic.materials.video) videos++;
        if (topic.materials.document) documents++;
      });
    });
    return { videos, documents, totalSlots, uploaded: videos + documents };
  };

  const getTopicsCount = (course: CourseSyllabus) => {
    return course.modules.reduce((acc, m) => acc + m.topics.length, 0);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="My Courses"
        description="Manage course content, upload videos and documents for each topic"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coursesSyllabusData.map((course) => {
          const stats = getMaterialsCount(course);
          const progress = Math.round((stats.uploaded / stats.totalSlots) * 100);
          
          return (
            <Card
              key={course.id}
              className="card-hover cursor-pointer"
              onClick={() => navigate(`/teacher/courses/${course.id}`)}
            >
              <CardHeader>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <CardTitle className="text-lg">{course.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{course.description}</p>
                
                <div className="flex items-center gap-3 mb-4 text-sm">
                  <Badge variant="outline">
                    {course.modules.length} modules
                  </Badge>
                  <Badge variant="outline">
                    {getTopicsCount(course)} topics
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Content uploaded</span>
                    <span className="font-medium">{stats.uploaded}/{stats.totalSlots}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Video className="w-4 h-4 text-primary" />
                    {stats.videos} videos
                  </span>
                  <span className="flex items-center gap-1">
                    <FileText className="w-4 h-4 text-accent" />
                    {stats.documents} docs
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
