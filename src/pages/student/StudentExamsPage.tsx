import React from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GraduationCap, Calendar, Clock, CheckCircle, AlertCircle } from 'lucide-react';

interface Exam {
  id: string;
  title: string;
  course: string;
  date: string;
  time: string;
  duration: number;
  status: 'upcoming' | 'completed';
  score?: number;
  totalMarks: number;
}

const mockExams: Exam[] = [
  { id: 'e1', title: 'Web Development Mid-term', course: 'Web Development', date: '2025-01-10', time: '10:00 AM', duration: 120, status: 'upcoming', totalMarks: 100 },
  { id: 'e2', title: 'Data Science Quiz Exam', course: 'Data Science', date: '2025-01-15', time: '2:00 PM', duration: 60, status: 'upcoming', totalMarks: 50 },
  { id: 'e3', title: 'JavaScript Fundamentals', course: 'Web Development', date: '2024-12-10', time: '10:00 AM', duration: 90, status: 'completed', score: 78, totalMarks: 100 },
];

export default function StudentExamsPage() {
  const upcomingExams = mockExams.filter(e => e.status === 'upcoming');
  const completedExams = mockExams.filter(e => e.status === 'completed');

  return (
    <DashboardLayout>
      <PageHeader
        title="Exams"
        description="View upcoming exams and past results"
      />

      {/* Upcoming Exams */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-warning" />
          Upcoming Exams ({upcomingExams.length})
        </h3>
        {upcomingExams.length === 0 ? (
          <p className="text-muted-foreground">No upcoming exams</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingExams.map((exam) => (
              <Card key={exam.id} className="card-hover border-warning/30">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                      <GraduationCap className="w-6 h-6 text-warning" />
                    </div>
                    <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">
                      Upcoming
                    </Badge>
                  </div>
                  <CardTitle className="text-lg mt-3">{exam.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{exam.course}</p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{exam.date}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{exam.time} • {exam.duration} minutes</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <span className="text-sm text-muted-foreground">Total Marks</span>
                    <span className="font-semibold">{exam.totalMarks}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Completed Exams */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-success" />
          Completed Exams ({completedExams.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {completedExams.map((exam) => (
            <Card key={exam.id} className="border-success/30">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-success" />
                  </div>
                  <Badge className="bg-success/10 text-success border-success/20">
                    Score: {exam.score}/{exam.totalMarks}
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-3">{exam.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">{exam.course}</p>
                
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <Calendar className="w-4 h-4" />
                  <span>Completed on {exam.date}</span>
                </div>

                <div className="p-4 rounded-lg bg-success/5 border border-success/20">
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">Your Score</p>
                    <p className="text-3xl font-bold text-success">
                      {Math.round((exam.score! / exam.totalMarks) * 100)}%
                    </p>
                  </div>
                </div>

                <Button variant="outline" className="w-full mt-4">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
