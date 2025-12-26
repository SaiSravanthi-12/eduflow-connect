import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Users, Clock, Search, CheckCircle, Loader2 } from 'lucide-react';

interface AvailableCourse {
  id: string;
  name: string;
  description: string;
  institutionName: string;
  totalClasses: number;
  enrolledStudents: number;
  isEnrolled: boolean;
  isPending: boolean;
}

const mockAvailableCourses: AvailableCourse[] = [
  {
    id: 'c1',
    name: 'Web Development Fundamentals',
    description: 'Learn HTML, CSS, and JavaScript from scratch. Build responsive websites and web applications.',
    institutionName: 'Tech University',
    totalClasses: 24,
    enrolledStudents: 45,
    isEnrolled: true,
    isPending: false,
  },
  {
    id: 'c2',
    name: 'Data Science Basics',
    description: 'Introduction to Python and Data Analysis. Learn data visualization and machine learning fundamentals.',
    institutionName: 'Tech University',
    totalClasses: 30,
    enrolledStudents: 32,
    isEnrolled: true,
    isPending: false,
  },
  {
    id: 'c3',
    name: 'Mobile App Development',
    description: 'Build cross-platform mobile applications using React Native and modern development practices.',
    institutionName: 'Tech University',
    totalClasses: 28,
    enrolledStudents: 28,
    isEnrolled: false,
    isPending: false,
  },
  {
    id: 'c4',
    name: 'Cloud Computing Essentials',
    description: 'Master AWS, Azure, and Google Cloud. Deploy and manage scalable applications in the cloud.',
    institutionName: 'Tech University',
    totalClasses: 20,
    enrolledStudents: 18,
    isEnrolled: false,
    isPending: true,
  },
  {
    id: 'c5',
    name: 'Cybersecurity Fundamentals',
    description: 'Learn network security, ethical hacking, and security best practices for modern applications.',
    institutionName: 'Tech University',
    totalClasses: 22,
    enrolledStudents: 25,
    isEnrolled: false,
    isPending: false,
  },
  {
    id: 'c6',
    name: 'AI and Machine Learning',
    description: 'Deep dive into artificial intelligence, neural networks, and practical ML implementations.',
    institutionName: 'Tech University',
    totalClasses: 35,
    enrolledStudents: 40,
    isEnrolled: false,
    isPending: false,
  },
];

export default function StudentBrowseCoursesPage() {
  const [courses, setCourses] = useState<AvailableCourse[]>(mockAvailableCourses);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingCourseId, setLoadingCourseId] = useState<string | null>(null);
  const { toast } = useToast();

  const filteredCourses = courses.filter(
    (course) =>
      course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRequestEnrollment = async (courseId: string) => {
    setLoadingCourseId(courseId);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    
    setCourses(
      courses.map((course) =>
        course.id === courseId ? { ...course, isPending: true } : course
      )
    );
    
    setLoadingCourseId(null);
    
    const course = courses.find((c) => c.id === courseId);
    toast({
      title: 'Enrollment Requested',
      description: `Your request for "${course?.name}" has been sent to the institution for approval.`,
    });
  };

  const getStatusBadge = (course: AvailableCourse) => {
    if (course.isEnrolled) {
      return (
        <Badge className="bg-success/10 text-success border-success/20">
          <CheckCircle className="w-3 h-3 mr-1" />
          Enrolled
        </Badge>
      );
    }
    if (course.isPending) {
      return (
        <Badge variant="secondary" className="bg-warning/10 text-warning border-warning/20">
          <Clock className="w-3 h-3 mr-1" />
          Pending Approval
        </Badge>
      );
    }
    return null;
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Browse Courses"
        description="Explore available courses and request enrollment"
      />

      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
          <Card key={course.id} className="card-hover flex flex-col">
            <CardHeader>
              <div className="flex items-start justify-between gap-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                {getStatusBadge(course)}
              </div>
              <CardTitle className="text-lg mt-4">{course.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <p className="text-sm text-muted-foreground mb-4 flex-1">
                {course.description}
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {course.totalClasses} classes
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    {course.enrolledStudents} students
                  </span>
                </div>
                
                <p className="text-xs text-muted-foreground">
                  {course.institutionName}
                </p>

                {!course.isEnrolled && !course.isPending && (
                  <Button
                    className="w-full"
                    onClick={() => handleRequestEnrollment(course.id)}
                    disabled={loadingCourseId === course.id}
                  >
                    {loadingCourseId === course.id ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Requesting...
                      </>
                    ) : (
                      'Request Enrollment'
                    )}
                  </Button>
                )}
                
                {course.isPending && (
                  <Button className="w-full" variant="secondary" disabled>
                    Awaiting Approval
                  </Button>
                )}
                
                {course.isEnrolled && (
                  <Button className="w-full" variant="outline" disabled>
                    Already Enrolled
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCourses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No courses found</h3>
          <p className="text-muted-foreground">
            Try adjusting your search query
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
