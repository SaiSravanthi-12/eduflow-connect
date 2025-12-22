import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/common/StatCard';
import { PageHeader } from '@/components/common/PageHeader';
import { Building2, Users, BookOpen, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <PageHeader
        title="Admin Dashboard"
        description="Overview of all institutions and system metrics"
        action={{
          label: 'Add Institution',
          onClick: () => navigate('/admin/institutions/new'),
        }}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Institutions"
          value="24"
          icon={Building2}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Total Students"
          value="15,234"
          icon={Users}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Active Courses"
          value="342"
          icon={BookOpen}
          trend={{ value: 5, isPositive: true }}
        />
        <StatCard
          title="Growth Rate"
          value="23%"
          icon={TrendingUp}
          trend={{ value: 15, isPositive: true }}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Institutions */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Institutions</h3>
          <div className="space-y-4">
            {[
              { name: 'ABC Engineering College', code: 'AISHE001', students: 1250 },
              { name: 'XYZ University', code: 'AISHE002', students: 3420 },
              { name: 'Tech Institute', code: 'AISHE003', students: 890 },
            ].map((inst) => (
              <div
                key={inst.code}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
              >
                <div>
                  <p className="font-medium">{inst.name}</p>
                  <p className="text-sm text-muted-foreground">{inst.code}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{inst.students}</p>
                  <p className="text-sm text-muted-foreground">students</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {[
              { action: 'New institution registered', time: '2 hours ago', type: 'create' },
              { action: 'Student enrollment updated', time: '5 hours ago', type: 'update' },
              { action: 'Course materials uploaded', time: '1 day ago', type: 'upload' },
              { action: 'Quiz results published', time: '2 days ago', type: 'publish' },
            ].map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-3 rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="w-2 h-2 rounded-full bg-primary" />
                <div className="flex-1">
                  <p className="text-sm font-medium">{activity.action}</p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
