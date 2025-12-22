import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/common/StatCard';
import { PageHeader } from '@/components/common/PageHeader';
import { BookOpen, Users, FileText, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ProgressBar } from '@/components/common/ProgressBar';

export default function TeacherDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <PageHeader
        title={`Welcome, ${user?.name || 'Teacher'}`}
        description="Manage your courses, students, and assignments"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Assigned Courses"
          value="5"
          icon={BookOpen}
        />
        <StatCard
          title="Total Students"
          value="234"
          icon={Users}
        />
        <StatCard
          title="Pending Assignments"
          value="12"
          icon={FileText}
        />
        <StatCard
          title="Avg. Completion"
          value="78%"
          icon={CheckCircle}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Progress */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Course Progress</h3>
          <div className="space-y-5">
            {[
              { name: 'Web Development', completed: 18, total: 24, students: 45 },
              { name: 'Data Science', completed: 12, total: 30, students: 38 },
              { name: 'Mobile Development', completed: 15, total: 20, students: 32 },
            ].map((course, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{course.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {course.completed}/{course.total} classes
                  </span>
                </div>
                <ProgressBar value={course.completed} max={course.total} />
                <p className="text-xs text-muted-foreground">{course.students} students enrolled</p>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Submissions */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Submissions</h3>
          <div className="space-y-4">
            {[
              { student: 'Jane Doe', assignment: 'React Basics Quiz', time: '2 hours ago', status: 'pending' },
              { student: 'Bob Smith', assignment: 'Python Assignment 3', time: '5 hours ago', status: 'graded' },
              { student: 'Alice Johnson', assignment: 'Data Analysis Project', time: '1 day ago', status: 'pending' },
            ].map((submission, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div>
                  <p className="font-medium">{submission.student}</p>
                  <p className="text-sm text-muted-foreground">{submission.assignment}</p>
                </div>
                <div className="text-right">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                    submission.status === 'graded' 
                      ? 'bg-success/10 text-success' 
                      : 'bg-warning/10 text-warning'
                  }`}>
                    {submission.status}
                  </span>
                  <p className="text-xs text-muted-foreground mt-1">{submission.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
