import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ProgressBar } from '@/components/common/ProgressBar';
import { BookOpen, Video, FileText, Play, Download, ArrowLeft } from 'lucide-react';

interface Material {
  id: string;
  name: string;
  type: 'video' | 'document';
  url: string;
  duration?: string;
  completed: boolean;
}

interface CourseDetail {
  id: string;
  name: string;
  description: string;
  instructor: string;
  completedClasses: number;
  totalClasses: number;
  materials: Material[];
}

const mockCourses: CourseDetail[] = [
  {
    id: 'c1',
    name: 'Web Development Fundamentals',
    description: 'Learn HTML, CSS, and JavaScript from scratch',
    instructor: 'John Smith',
    completedClasses: 18,
    totalClasses: 24,
    materials: [
      { id: 'm1', name: 'Introduction to HTML', type: 'video', url: '#', duration: '15 min', completed: true },
      { id: 'm2', name: 'HTML Structure', type: 'video', url: '#', duration: '20 min', completed: true },
      { id: 'm3', name: 'CSS Basics', type: 'video', url: '#', duration: '25 min', completed: false },
      { id: 'm4', name: 'HTML Cheat Sheet', type: 'document', url: '#', completed: true },
      { id: 'm5', name: 'CSS Reference Guide', type: 'document', url: '#', completed: false },
    ],
  },
  {
    id: 'c2',
    name: 'Data Science Basics',
    description: 'Introduction to Python and Data Analysis',
    instructor: 'Sarah Johnson',
    completedClasses: 8,
    totalClasses: 30,
    materials: [
      { id: 'm6', name: 'Python Setup', type: 'video', url: '#', duration: '10 min', completed: true },
      { id: 'm7', name: 'Variables and Data Types', type: 'video', url: '#', duration: '30 min', completed: false },
    ],
  },
];

export default function StudentCoursesPage() {
  const [selectedCourse, setSelectedCourse] = useState<CourseDetail | null>(null);

  if (selectedCourse) {
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

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Course Progress</span>
            <span className="text-sm font-medium">
              {selectedCourse.completedClasses}/{selectedCourse.totalClasses} completed
            </span>
          </div>
          <ProgressBar value={selectedCourse.completedClasses} max={selectedCourse.totalClasses} />
        </div>

        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Course Materials</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedCourse.materials.map((material) => (
              <Card key={material.id} className={`card-hover ${material.completed ? 'border-success/30' : ''}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  {material.type === 'video' ? (
                    <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Video className="w-6 h-6 text-primary" />
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-6 h-6 text-accent" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{material.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {material.type === 'video' ? material.duration : 'PDF Document'}
                    </p>
                    {material.completed && (
                      <span className="inline-block mt-1 px-2 py-0.5 rounded-full text-xs bg-success/10 text-success">
                        Completed
                      </span>
                    )}
                  </div>
                  <Button variant="ghost" size="icon">
                    {material.type === 'video' ? (
                      <Play className="w-5 h-5" />
                    ) : (
                      <Download className="w-5 h-5" />
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
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
        {mockCourses.map((course) => (
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
              <p className="text-sm text-muted-foreground mb-4">{course.description}</p>
              <p className="text-sm mb-3">Instructor: {course.instructor}</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">
                    {course.completedClasses}/{course.totalClasses}
                  </span>
                </div>
                <ProgressBar value={course.completedClasses} max={course.totalClasses} showLabel={false} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
