import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/common/StatCard';
import { PageHeader } from '@/components/common/PageHeader';
import { BookOpen, CheckCircle, Clock, Award } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLanguage } from '@/contexts/LanguageContext';

export default function StudentDashboard() {
  const { user } = useAuth();
  const { t, tv, formatDate, formatNumber, formatPercent } = useLanguage();

  const performanceData = [
    { label: t('dashboard.quizzes'), score: 85, total: 100 },
    { label: t('dashboard.assignments'), score: 72, total: 100 },
    { label: t('dashboard.attendance'), score: 90, total: 100 },
  ];

  return (
    <DashboardLayout>
      <PageHeader
        title={tv('dashboard.studentTitle', { name: user?.name || t('roles.student') })}
        description={t('dashboard.studentDescription')}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title={t('dashboard.enrolledCourses')}
          value={formatNumber(4)}
          icon={BookOpen}
        />
        <StatCard
          title={t('dashboard.completed')}
          value={formatNumber(12)}
          icon={CheckCircle}
        />
        <StatCard
          title={t('dashboard.pendingTasks')}
          value={formatNumber(5)}
          icon={Clock}
        />
        <StatCard
          title={t('dashboard.avgScore')}
          value={formatPercent(82)}
          icon={Award}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Course Progress */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.courseProgress')}</CardTitle>
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
                    {formatNumber(course.completed)}/{formatNumber(course.total)} {t('dashboard.classes')}
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
            <CardTitle>{t('dashboard.performanceOverview')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {performanceData.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-sm font-semibold">{formatPercent(item.score)}</span>
                </div>
                <ProgressBar value={item.score} max={item.total} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Upcoming Deadlines */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('dashboard.upcomingDeadlines')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { title: 'HTML Quiz', course: 'Web Development', due: new Date('2024-12-25'), type: 'quiz' },
                { title: 'Python Project', course: 'Data Science', due: new Date('2024-12-28'), type: 'assignment' },
                { title: 'Final Exam', course: 'Mobile Development', due: new Date('2025-01-05'), type: 'exam' },
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
                    {t(`course.${item.type === 'exam' ? 'finalExam' : item.type}`)}
                  </div>
                  <p className="font-medium">{item.title}</p>
                  <p className="text-sm text-muted-foreground">{item.course}</p>
                  <p className="text-sm font-medium mt-2">{formatDate(item.due)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
