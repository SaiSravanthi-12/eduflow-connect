import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/common/StatCard';
import { PageHeader } from '@/components/common/PageHeader';
import { BookOpen, CheckCircle, Clock, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function StudentDashboard() {
  const { user } = useAuth();

  const performanceData = [
    { label: 'Quizzes', score: 85, total: 100 },
    { label: 'Assignments', score: 72, total: 100 },
    { label: 'Attendance', score: 90, total: 100 },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title={`Welcome, ${user?.name || 'Student'}`}
        description="Track your courses, assignments, and performance"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Enrolled Courses"
          value="4"
          icon={BookOpen}
        />
        <StatCard
          title="Completed"
          value="12"
          icon={CheckCircle}
        />
        <StatCard
          title="Pending Tasks"
          value="5"
          icon={Clock}
        />
        <StatCard
          title="Avg. Score"
          value="82%"
          icon={Award}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Course Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {[
              { name: 'Web Development', completed: 18, total: 24 },
              { name: 'Data Science', completed: 8, total: 30 },
              { name: 'Mobile Development', completed: 12, total: 20 },
            ].map((course, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{course.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {course.completed}/{course.total} classes
                  </span>
                </div>
                <ProgressBar value={course.completed} max={course.total} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Performance Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {performanceData.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-sm font-semibold">{item.score}%</span>
                </div>
                <ProgressBar value={item.score} max={item.total} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Upcoming Deadlines</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'HTML Quiz', course: 'Web Development', due: 'Dec 25, 2024', type: 'quiz' },
                { title: 'Python Project', course: 'Data Science', due: 'Dec 28, 2024', type: 'assignment' },
                { title: 'Final Exam', course: 'Mobile Development', due: 'Jan 5, 2025', type: 'exam' },
              ].map((item, index) => (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-2 ${
                    item.type === 'quiz' ? 'bg-primary/10 text-primary' :
                    item.type === 'assignment' ? 'bg-success/10 text-success' :
                    'bg-accent/10 text-accent'
                  }`}>
                    {item.type}
                  </div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.course}</p>
                  <p className="text-sm font-medium mt-2">{item.due}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
