import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, PlayCircle, Lock, Trophy } from 'lucide-react';

export interface CourseProgressCardProps {
  courseName: string;
  modulesCompleted: number;
  totalModules: number;
  examUnlocked: boolean;
  examPassed: boolean;
  examScore?: number | null;
}

export const CourseProgressCard: React.FC<CourseProgressCardProps> = ({
  courseName,
  modulesCompleted,
  totalModules,
  examUnlocked,
  examPassed,
  examScore,
}) => {
  const overallProgress = totalModules > 0 ? Math.round((modulesCompleted / totalModules) * 100) : 0;

  return (
    <Card className="border-border bg-card mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-semibold text-foreground">Course Progress</CardTitle>
        <p className="text-sm text-muted-foreground">{courseName}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Overall Progress</span>
            <span className="font-semibold text-foreground">{overallProgress}%</span>
          </div>
          <Progress value={overallProgress} className="h-3" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>{modulesCompleted} of {totalModules} modules completed</span>
          </div>
        </div>

        {/* Final Exam Status */}
        <div className={`p-3 rounded-lg border ${
          examPassed ? 'border-success bg-success/10' : 
          examUnlocked ? 'border-primary bg-primary/5' : 
          'border-border bg-muted/50'
        }`}>
          <div className="flex items-center gap-3">
            {examPassed ? (
              <Trophy className="h-5 w-5 text-success" />
            ) : examUnlocked ? (
              <PlayCircle className="h-5 w-5 text-primary" />
            ) : (
              <Lock className="h-5 w-5 text-muted-foreground" />
            )}
            <div>
              <p className={`text-sm font-medium ${
                examPassed ? 'text-success' : 
                examUnlocked ? 'text-primary' : 
                'text-muted-foreground'
              }`}>
                Final Exam
              </p>
              {examPassed && examScore !== undefined && examScore !== null ? (
                <p className="text-xs text-success">Passed with {examScore}%</p>
              ) : examUnlocked ? (
                <p className="text-xs text-primary">Ready to take</p>
              ) : (
                <p className="text-xs text-muted-foreground">Complete all modules to unlock</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};