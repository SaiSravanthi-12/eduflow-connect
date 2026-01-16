import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { 
  Clock, 
  AlertTriangle, 
  Camera, 
  Shield, 
  ChevronLeft, 
  ChevronRight,
  CheckCircle2,
  Loader2,
  XCircle
} from 'lucide-react';
import { ProctoringProvider, useProctoring } from './ProctoringProvider';
import { MCQQuestion } from './MCQQuestion';
import { CodingQuestion } from './CodingQuestion';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ExamQuestion {
  id: string;
  question: string;
  options?: string[];
  correctAnswer?: number;
  type: 'mcq' | 'coding';
  language?: string;
  starterCode?: string;
}

interface FinalExamContentProps {
  courseId: string;
  courseName: string;
  timeLimit: number; // in minutes
  mcqQuestions: ExamQuestion[];
  codingQuestions: ExamQuestion[];
  onComplete: (passed: boolean, score: number) => void;
}

const FinalExamContent: React.FC<FinalExamContentProps> = ({
  courseId,
  courseName,
  timeLimit,
  mcqQuestions,
  codingQuestions,
  onComplete,
}) => {
  const navigate = useNavigate();
  const { violations, violationCount, isWebcamEnabled, startProctoring, stopProctoring, addViolation } = useProctoring();
  
  const [examState, setExamState] = useState<'instructions' | 'in_progress' | 'completed'>('instructions');
  const [currentSection, setCurrentSection] = useState<'mcq' | 'coding'>('mcq');
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [mcqAnswers, setMcqAnswers] = useState<Record<string, number>>({});
  const [codingAnswers, setCodingAnswers] = useState<Record<string, string>>({});
  const [timeRemaining, setTimeRemaining] = useState(timeLimit * 60);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [examResult, setExamResult] = useState<{ passed: boolean; score: number } | null>(null);

  // Timer
  useEffect(() => {
    if (examState !== 'in_progress') return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [examState]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartExam = async () => {
    const webcamStarted = await startProctoring();
    if (!webcamStarted) {
      toast.error('You must enable webcam access to start the exam');
      return;
    }
    setExamState('in_progress');
  };

  const handleMCQAnswer = (questionId: string, answer: number) => {
    setMcqAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleCodingAnswer = (questionId: string, answer: string) => {
    setCodingAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleSubmit = useCallback(async (autoSubmit: boolean = false) => {
    setIsSubmitting(true);
    stopProctoring();

    // Calculate MCQ score
    let correctMCQ = 0;
    mcqQuestions.forEach(q => {
      if (mcqAnswers[q.id] === q.correctAnswer) {
        correctMCQ++;
      }
    });

    const mcqScore = mcqQuestions.length > 0 ? Math.round((correctMCQ / mcqQuestions.length) * 70) : 0; // 70% weight
    const codingScore = codingQuestions.length > 0 ? 30 : 0; // 30% weight, simplified scoring
    const totalScore = mcqScore + (Object.keys(codingAnswers).length === codingQuestions.length ? codingScore : 0);
    const passed = totalScore >= 60;

    // Save exam attempt
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('exam_attempts').insert([{
        user_id: user.id,
        course_id: courseId,
        mcq_answers: mcqAnswers,
        coding_answers: codingAnswers,
        score: totalScore,
        total_marks: 100,
        passed,
        proctoring_violations: violations,
        violation_count: violationCount,
        webcam_enabled: isWebcamEnabled,
        status: 'completed',
        started_at: new Date(Date.now() - (timeLimit * 60 - timeRemaining) * 1000).toISOString(),
        completed_at: new Date().toISOString(),
        auto_submitted: autoSubmit,
      }] as any);
    }

    setExamResult({ passed, score: totalScore });
    setExamState('completed');
    setIsSubmitting(false);
    onComplete(passed, totalScore);

    if (autoSubmit) {
      toast.warning('Exam auto-submitted due to time limit or violations');
    }
  }, [mcqQuestions, mcqAnswers, codingQuestions, codingAnswers, violations, violationCount, isWebcamEnabled, timeLimit, timeRemaining, courseId, stopProctoring, onComplete]);

  // Auto-submit on max violations
  useEffect(() => {
    if (violationCount >= 3 && examState === 'in_progress') {
      handleSubmit(true);
    }
  }, [violationCount, examState, handleSubmit]);

  const allQuestions = currentSection === 'mcq' ? mcqQuestions : codingQuestions;
  const currentQ = allQuestions[currentQuestion];
  const answeredMCQs = Object.keys(mcqAnswers).length;
  const answeredCoding = Object.keys(codingAnswers).filter(k => codingAnswers[k].trim()).length;

  // Instructions screen
  if (examState === 'instructions') {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-6 w-6 text-primary" />
                Final Exam: {courseName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Duration</p>
                  <p className="text-lg font-semibold text-foreground">{timeLimit} minutes</p>
                </div>
                <div className="p-4 rounded-lg bg-muted">
                  <p className="text-sm text-muted-foreground">Questions</p>
                  <p className="text-lg font-semibold text-foreground">{mcqQuestions.length} MCQ + {codingQuestions.length} Coding</p>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-semibold text-foreground">Exam Rules:</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <Camera className="h-4 w-4 mt-0.5 text-primary" />
                    Webcam must remain on throughout the exam
                  </li>
                  <li className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 mt-0.5 text-warning" />
                    Switching tabs or windows will be recorded as a violation
                  </li>
                  <li className="flex items-start gap-2">
                    <XCircle className="h-4 w-4 mt-0.5 text-destructive" />
                    Copy, paste, and right-click are disabled
                  </li>
                  <li className="flex items-start gap-2">
                    <Clock className="h-4 w-4 mt-0.5 text-primary" />
                    Exam will auto-submit when time runs out
                  </li>
                </ul>
              </div>

              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive font-medium">
                  Warning: 3 violations will result in automatic exam submission
                </p>
              </div>

              <Button onClick={handleStartExam} className="w-full" size="lg">
                <Camera className="mr-2 h-4 w-4" />
                Enable Webcam & Start Exam
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Results screen
  if (examState === 'completed' && examResult) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <Card className={`border-2 ${examResult.passed ? 'border-success' : 'border-destructive'}`}>
            <CardContent className="p-8 text-center space-y-6">
              {examResult.passed ? (
                <>
                  <CheckCircle2 className="h-20 w-20 mx-auto text-success" />
                  <h2 className="text-3xl font-bold text-success">Congratulations!</h2>
                  <p className="text-muted-foreground">You have passed the final exam</p>
                </>
              ) : (
                <>
                  <XCircle className="h-20 w-20 mx-auto text-destructive" />
                  <h2 className="text-3xl font-bold text-destructive">Not Passed</h2>
                  <p className="text-muted-foreground">You need 60% to pass</p>
                </>
              )}

              <div className="text-5xl font-bold text-foreground">{examResult.score}%</div>
              <Progress value={examResult.score} className="h-4" />

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-muted-foreground">MCQs Answered</p>
                  <p className="font-semibold text-foreground">{answeredMCQs}/{mcqQuestions.length}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted">
                  <p className="text-muted-foreground">Coding Answered</p>
                  <p className="font-semibold text-foreground">{answeredCoding}/{codingQuestions.length}</p>
                </div>
              </div>

              {violationCount > 0 && (
                <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                  <p className="text-sm text-warning">
                    Proctoring violations recorded: {violationCount}
                  </p>
                </div>
              )}

              <Button onClick={() => navigate('/student/courses')} className="w-full">
                Return to Courses
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Exam in progress
  return (
    <div 
      className="min-h-screen bg-background select-none"
      style={{ userSelect: 'none' }}
    >
      {/* Header with timer and progress */}
      <div className="sticky top-0 z-40 bg-card border-b border-border p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant={timeRemaining < 300 ? 'destructive' : 'secondary'} className="gap-1 text-base py-1 px-3">
              <Clock className="h-4 w-4" />
              {formatTime(timeRemaining)}
            </Badge>
            {violationCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" />
                {violationCount} violation{violationCount > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setCurrentSection('mcq')}>
              MCQ ({answeredMCQs}/{mcqQuestions.length})
            </Button>
            <Button variant="outline" size="sm" onClick={() => setCurrentSection('coding')}>
              Coding ({answeredCoding}/{codingQuestions.length})
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => setShowSubmitDialog(true)}
            >
              Submit Exam
            </Button>
          </div>
        </div>
      </div>

      {/* Question content */}
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-foreground">
            {currentSection === 'mcq' ? 'Multiple Choice Questions' : 'Coding Questions'}
          </h2>
          <span className="text-sm text-muted-foreground">
            Question {currentQuestion + 1} of {allQuestions.length}
          </span>
        </div>

        <Progress value={((currentQuestion + 1) / allQuestions.length) * 100} className="h-2" />

        {currentQ && currentSection === 'mcq' && (
          <MCQQuestion
            questionNumber={currentQuestion + 1}
            question={currentQ.question}
            options={currentQ.options || []}
            selectedAnswer={mcqAnswers[currentQ.id]}
            onAnswerSelect={(answer) => handleMCQAnswer(currentQ.id, answer)}
          />
        )}

        {currentQ && currentSection === 'coding' && (
          <CodingQuestion
            questionNumber={currentQuestion + 1}
            question={currentQ.question}
            language={currentQ.language}
            starterCode={currentQ.starterCode}
            answer={codingAnswers[currentQ.id] || ''}
            onAnswerChange={(answer) => handleCodingAnswer(currentQ.id, answer)}
          />
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between pt-4">
          <Button
            variant="outline"
            onClick={() => setCurrentQuestion(prev => prev - 1)}
            disabled={currentQuestion === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Previous
          </Button>

          <div className="flex items-center gap-1">
            {allQuestions.map((_, idx) => {
              const isAnswered = currentSection === 'mcq' 
                ? mcqAnswers[allQuestions[idx].id] !== undefined
                : codingAnswers[allQuestions[idx].id]?.trim();
              return (
                <button
                  key={idx}
                  onClick={() => setCurrentQuestion(idx)}
                  className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                    idx === currentQuestion
                      ? 'bg-primary text-primary-foreground'
                      : isAnswered
                      ? 'bg-success/20 text-success'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          <Button
            onClick={() => setCurrentQuestion(prev => prev + 1)}
            disabled={currentQuestion === allQuestions.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Submit confirmation dialog */}
      <Dialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Submit Exam?</DialogTitle>
            <DialogDescription>
              Are you sure you want to submit your exam? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">MCQs Answered</p>
              <p className="font-semibold">{answeredMCQs} of {mcqQuestions.length}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-sm text-muted-foreground">Coding Answered</p>
              <p className="font-semibold">{answeredCoding} of {codingQuestions.length}</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSubmitDialog(false)}>
              Continue Exam
            </Button>
            <Button onClick={() => handleSubmit(false)} disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Submit Exam
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Wrapper component with proctoring provider
export const FinalExamPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [examData, setExamData] = useState<{
    courseName: string;
    timeLimit: number;
    mcqQuestions: ExamQuestion[];
    codingQuestions: ExamQuestion[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadExamData = async () => {
      if (!courseId) return;

      // For demo, generate sample questions
      // In production, fetch from database
      const sampleMCQs: ExamQuestion[] = Array.from({ length: 30 }, (_, i) => ({
        id: `mcq-${i + 1}`,
        type: 'mcq' as const,
        question: `Sample MCQ question ${i + 1} for the course?`,
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: Math.floor(Math.random() * 4),
      }));

      const sampleCoding: ExamQuestion[] = [
        {
          id: 'coding-1',
          type: 'coding' as const,
          question: 'Write a function that takes an array of numbers and returns the sum of all even numbers.',
          language: 'JavaScript',
          starterCode: 'function sumEvenNumbers(arr) {\n  // Your code here\n}',
        },
        {
          id: 'coding-2',
          type: 'coding' as const,
          question: 'Implement a function to check if a string is a valid palindrome, considering only alphanumeric characters.',
          language: 'JavaScript',
          starterCode: 'function isPalindrome(str) {\n  // Your code here\n}',
        },
      ];

      setExamData({
        courseName: 'Course Final Exam',
        timeLimit: 120,
        mcqQuestions: sampleMCQs,
        codingQuestions: sampleCoding,
      });
      setIsLoading(false);
    };

    loadExamData();
  }, [courseId]);

  if (isLoading || !examData || !courseId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <ProctoringProvider
      maxViolations={3}
      onMaxViolationsReached={() => {
        toast.error('Maximum violations reached');
      }}
    >
      <FinalExamContent
        courseId={courseId}
        courseName={examData.courseName}
        timeLimit={examData.timeLimit}
        mcqQuestions={examData.mcqQuestions}
        codingQuestions={examData.codingQuestions}
        onComplete={(passed, score) => {
          console.log('Exam completed:', { passed, score });
        }}
      />
    </ProctoringProvider>
  );
};
