import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, PlayCircle, Lock, Trophy } from 'lucide-react';

interface ModuleProgress {
  moduleId: string;
  moduleName: string;
  videosCompleted: number;
  totalVideos: number;
  quizPassed: boolean;
  quizScore?: number;
}

interface CourseProgressCardProps {
  courseName: string;
  modules: ModuleProgress[];
  examUnlocked: boolean;
  examPassed?: boolean;
  examScore?: number;
  currentModuleId?: string;
}

export const CourseProgressCard: React.FC<CourseProgressCardProps> = ({
  courseName,
  modules,
  examUnlocked,
  examPassed,
  examScore,
  currentModuleId,
}) => {
  const totalVideos = modules.reduce((sum, m) => sum + m.totalVideos, 0);
  const completedVideos = modules.reduce((sum, m) => sum + m.videosCompleted, 0);
  const completedModules = modules.filter(m => m.quizPassed).length;
  
  const overallProgress = totalVideos > 0 ? Math.round((completedVideos / totalVideos) * 100) : 0;

  return (
    <Card className="border-border bg-card">
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
            <span>{completedVideos} of {totalVideos} videos</span>
            <span>{completedModules} of {modules.length} modules</span>
          </div>
        </div>

        {/* Module Progress List */}
        <div className="space-y-2 pt-2">
          <p className="text-sm font-medium text-foreground">Modules</p>
          {modules.map((module, idx) => {
            const moduleProgress = module.totalVideos > 0 
              ? Math.round((module.videosCompleted / module.totalVideos) * 100) 
              : 0;
            const isComplete = module.quizPassed;
            const isCurrent = module.moduleId === currentModuleId;
            const isLocked = idx > 0 && !modules[idx - 1].quizPassed;

            return (
              <div
                key={module.moduleId}
                className={`flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  isCurrent ? 'bg-primary/10' : isComplete ? 'bg-success/5' : 'bg-muted/50'
                }`}
              >
                <div className="flex-shrink-0">
                  {isComplete ? (
                    <CheckCircle2 className="h-5 w-5 text-success" />
                  ) : isLocked ? (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  ) : isCurrent ? (
                    <PlayCircle className="h-5 w-5 text-primary" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm truncate ${isLocked ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {module.moduleName}
                  </p>
                  <div className="flex items-center gap-2">
                    <Progress value={moduleProgress} className="h-1 flex-1" />
                    <span className="text-xs text-muted-foreground w-10 text-right">
                      {moduleProgress}%
                    </span>
                  </div>
                </div>
                {module.quizPassed && module.quizScore !== undefined && (
                  <span className="text-xs text-success font-medium">
                    Quiz: {module.quizScore}%
                  </span>
                )}
              </div>
            );
          })}
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
              {examPassed && examScore !== undefined ? (
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
