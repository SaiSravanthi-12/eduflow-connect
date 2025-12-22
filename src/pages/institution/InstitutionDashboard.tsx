import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/common/StatCard';
import { PageHeader } from '@/components/common/PageHeader';
import { Users, BookOpen, GraduationCap, TrendingUp } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function InstitutionDashboard() {
  const { user } = useAuth();

  return (
    <DashboardLayout>
      <PageHeader
        title={`Welcome, ${user?.name || 'Institution'}`}
        description="Manage your institution's courses, students, and content managers"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Content Managers"
          value="12"
          icon={Users}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Students"
          value="1,234"
          icon={GraduationCap}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Active Courses"
          value="28"
          icon={BookOpen}
          trend={{ value: 3, isPositive: true }}
        />
        <StatCard
          title="Completion Rate"
          value="78%"
          icon={TrendingUp}
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Courses */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Courses</h3>
          <div className="space-y-4">
            {[
              { name: 'Web Development Fundamentals', students: 156, progress: 72 },
              { name: 'Data Science Basics', students: 98, progress: 45 },
              { name: 'Mobile App Development', students: 134, progress: 89 },
            ].map((course, index) => (
              <div
                key={index}
                className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-medium">{course.name}</p>
                  <span className="text-sm text-muted-foreground">
                    {course.students} students
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">{course.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Content Managers */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Content Managers</h3>
          <div className="space-y-4">
            {[
              { name: 'John Smith', courses: 5, students: 245 },
              { name: 'Sarah Johnson', courses: 4, students: 189 },
              { name: 'Mike Wilson', courses: 3, students: 156 },
            ].map((manager, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
              >
                <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                  <span className="text-primary-foreground font-semibold">
                    {manager.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-medium">{manager.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {manager.courses} courses • {manager.students} students
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
