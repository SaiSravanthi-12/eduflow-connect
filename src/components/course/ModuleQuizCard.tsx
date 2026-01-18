import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  ClipboardList, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  ArrowLeft,
  RotateCcw,
  Trophy,
  X,
  SkipForward,
  AlertTriangle,
  Check
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

export interface ModuleQuizCardProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  moduleId: string;
  moduleName: string;
  userId: string;
  onComplete: (passed: boolean) => void;
  isDemo?: boolean;
}

// Sample questions generator based on module
const generateModuleQuestions = (moduleId: string, moduleName: string): QuizQuestion[] => {
  // These are placeholder questions - in production, fetch from database or generate with AI
  return Array.from({ length: 10 }, (_, i) => ({
    id: `${moduleId}-q${i + 1}`,
    question: `Question ${i + 1} about ${moduleName}?`,
    options: [
      `Option A for question ${i + 1}`,
      `Option B for question ${i + 1}`,
      `Option C for question ${i + 1}`,
      `Option D for question ${i + 1}`,
    ],
    correctAnswer: Math.floor(Math.random() * 4),
  }));
};

export const ModuleQuizCard: React.FC<ModuleQuizCardProps> = ({
  isOpen,
  onClose,
  courseId,
  moduleId,
  moduleName,
  userId,
  onComplete,
  isDemo = false,
}) => {
  const [quizState, setQuizState] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [skippedQuestions, setSkippedQuestions] = useState<Set<string>>(new Set());
  const [markedAsDone, setMarkedAsDone] = useState<Set<string>>(new Set());
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [previousAttempt, setPreviousAttempt] = useState<{ score: number; passed: boolean } | null>(null);

  useEffect(() => {
    const loadQuizData = async () => {
      if (!userId || !isOpen) return;

      // Check for previous attempts (not for demo quizzes)
      if (!isDemo) {
        const { data: attempt } = await supabase
          .from('quiz_attempts')
          .select('*')
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .eq('module_id', moduleId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (attempt) {
          setPreviousAttempt({ score: attempt.score, passed: attempt.passed });
          if (attempt.passed) {
            setQuizState('completed');
            setScore(attempt.score);
            setPassed(true);
            setShowResults(true);
          }
        }
      }

      // Load or generate questions
      const { data: quiz } = await supabase
        .from('module_quizzes')
        .select('questions')
        .eq('course_id', courseId)
        .eq('module_id', moduleId)
        .maybeSingle();

      if (quiz?.questions && Array.isArray(quiz.questions) && quiz.questions.length > 0) {
        setQuestions(quiz.questions as unknown as QuizQuestion[]);
      } else {
        setQuestions(generateModuleQuestions(moduleId, moduleName));
      }
    };

    loadQuizData();
  }, [isOpen, userId, courseId, moduleId, moduleName, isDemo]);

  const handleStartQuiz = () => {
    setQuizState('in_progress');
    setCurrentQuestion(0);
    setAnswers({});
    setSkippedQuestions(new Set());
    setMarkedAsDone(new Set());
    setShowResults(false);
  };

  const handleAnswerSelect = (answer: number) => {
    const questionId = questions[currentQuestion].id;
    setAnswers(prev => ({
      ...prev,
      [questionId]: answer,
    }));
    // Remove from skipped if answered
    setSkippedQuestions(prev => {
      const newSet = new Set(prev);
      newSet.delete(questionId);
      return newSet;
    });
  };

  const handleSkipQuestion = () => {
    const questionId = questions[currentQuestion].id;
    setSkippedQuestions(prev => new Set(prev).add(questionId));
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handleMarkAsDone = () => {
    const questionId = questions[currentQuestion].id;
    setMarkedAsDone(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const handleGoToSkipped = () => {
    // Find first skipped question
    const skippedIndex = questions.findIndex(q => skippedQuestions.has(q.id));
    if (skippedIndex !== -1) {
      setCurrentQuestion(skippedIndex);
    }
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(prev => prev - 1);
    }
  };

  const canSubmit = () => {
    // All questions must be answered (no skipped questions allowed for final submission)
    return skippedQuestions.size === 0 && Object.keys(answers).length === questions.length;
  };

  const handleSubmit = async () => {
    // Check if there are skipped questions
    if (skippedQuestions.size > 0) {
      toast.error(`Please answer all ${skippedQuestions.size} skipped question(s) before submitting.`);
      return;
    }

    // Calculate score
    let correct = 0;
    questions.forEach(q => {
      if (answers[q.id] === q.correctAnswer) {
        correct++;
      }
    });

    const scorePercent = Math.round((correct / questions.length) * 100);
    const hasPassed = isDemo ? true : scorePercent >= 70;

    setScore(scorePercent);
    setPassed(hasPassed);
    setShowResults(true);
    setQuizState('completed');

    // Save attempt (only for non-demo quizzes)
    if (userId && !isDemo) {
      await supabase.from('quiz_attempts').insert([{
        user_id: userId,
        course_id: courseId,
        module_id: moduleId,
        answers: answers,
        score: scorePercent,
        total_questions: questions.length,
        passed: hasPassed,
        completed_at: new Date().toISOString(),
      }] as any);

      // Update module progress
      if (hasPassed) {
        await supabase
          .from('student_module_progress')
          .upsert([{
            user_id: userId,
            course_id: courseId,
            module_id: moduleId,
            quiz_passed: true,
            quiz_score: scorePercent,
            quiz_completed_at: new Date().toISOString(),
          }] as any, {
            onConflict: 'user_id,course_id,module_id'
          });
      }
    }

    onComplete(hasPassed);

    if (isDemo) {
      toast.success('Demo quiz completed! You can now proceed to the next content.');
    } else if (hasPassed) {
      toast.success('Congratulations! You passed the quiz!');
    } else {
      toast.error('You did not pass. Try again!');
    }
  };

  const renderQuestionNavigator = () => {
    return (
      <div className="flex flex-wrap gap-1 mb-4">
        {questions.map((q, idx) => {
          const isAnswered = answers[q.id] !== undefined;
          const isSkipped = skippedQuestions.has(q.id);
          const isDone = markedAsDone.has(q.id);
          const isCurrent = idx === currentQuestion;

          return (
            <button
              key={q.id}
              onClick={() => setCurrentQuestion(idx)}
              className={`w-8 h-8 rounded-md text-xs font-medium transition-all flex items-center justify-center ${
                isCurrent
                  ? 'ring-2 ring-primary ring-offset-2'
                  : ''
              } ${
                isSkipped
                  ? 'bg-warning/20 text-warning border border-warning/40'
                  : isAnswered
                    ? isDone
                      ? 'bg-success/20 text-success border border-success/40'
                      : 'bg-primary/20 text-primary border border-primary/40'
                    : 'bg-muted text-muted-foreground border border-border'
              }`}
            >
              {isSkipped ? '!' : idx + 1}
            </button>
          );
        })}
      </div>
    );
  };

  const renderContent = () => {
    if (quizState === 'not_started') {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-semibold">
              {isDemo ? 'Demo Quiz' : 'Module Quiz'}: {moduleName}
            </h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-muted-foreground">Questions</p>
              <p className="font-semibold text-foreground">10 MCQs</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-muted-foreground">{isDemo ? 'Type' : 'Passing Score'}</p>
              <p className="font-semibold text-foreground">{isDemo ? 'Practice' : '70%'}</p>
            </div>
          </div>

          {isDemo && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary">
                This is a practice quiz. No score required to proceed, but completion is mandatory.
              </p>
            </div>
          )}
          
          {!isDemo && previousAttempt && !previousAttempt.passed && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">
                Previous attempt: {previousAttempt.score}% - Did not pass
              </p>
            </div>
          )}
          
          <Button onClick={handleStartQuiz} className="w-full gap-2">
            {previousAttempt && !isDemo ? 'Retry Quiz' : 'Start Quiz'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    if (showResults) {
      return (
        <div className="text-center space-y-4">
          {passed || isDemo ? (
            <>
              <Trophy className="h-16 w-16 mx-auto text-success" />
              <h3 className="text-2xl font-bold text-success">
                {isDemo ? 'Quiz Completed!' : 'Congratulations!'}
              </h3>
              <p className="text-muted-foreground">
                {isDemo ? 'You completed the practice quiz' : 'You passed the quiz'}
              </p>
            </>
          ) : (
            <>
              <XCircle className="h-16 w-16 mx-auto text-destructive" />
              <h3 className="text-2xl font-bold text-destructive">Not Passed</h3>
              <p className="text-muted-foreground">You need 70% to pass</p>
            </>
          )}
          
          <div className="text-4xl font-bold text-foreground">{score}%</div>
          
          <Progress value={score} className="h-3" />
          
          <div className="flex gap-2 justify-center">
            {!passed && !isDemo && (
              <Button onClick={handleStartQuiz} variant="outline" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Try Again
              </Button>
            )}
            <Button onClick={onClose}>
              {passed || isDemo ? 'Continue' : 'Close'}
            </Button>
          </div>
        </div>
      );
    }

    const currentQ = questions[currentQuestion];
    const isAnswered = currentQ && answers[currentQ.id] !== undefined;
    const isSkipped = currentQ && skippedQuestions.has(currentQ.id);
    const isDone = currentQ && markedAsDone.has(currentQ.id);
    const hasSkippedQuestions = skippedQuestions.size > 0;

    return (
      <div className="space-y-4">
        {/* Question Navigator */}
        {renderQuestionNavigator()}

        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Question {currentQuestion + 1} of {questions.length}</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {Object.keys(answers).length} answered
            </span>
            {hasSkippedQuestions && (
              <Badge variant="outline" className="bg-warning/10 text-warning border-warning/40">
                <AlertTriangle className="w-3 h-3 mr-1" />
                {skippedQuestions.size} skipped
              </Badge>
            )}
          </div>
        </div>
        <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-2" />
        
        {currentQ && (
          <>
            {/* Question Status Badge */}
            <div className="flex gap-2">
              {isSkipped && (
                <Badge variant="outline" className="bg-warning/10 text-warning border-warning/40">
                  Skipped
                </Badge>
              )}
              {isDone && (
                <Badge variant="outline" className="bg-success/10 text-success border-success/40">
                  <Check className="w-3 h-3 mr-1" />
                  Marked as Done
                </Badge>
              )}
            </div>

            <p className="text-foreground font-medium">{currentQ.question}</p>
            
            <RadioGroup
              value={answers[currentQ.id]?.toString()}
              onValueChange={(value) => handleAnswerSelect(parseInt(value))}
            >
              {currentQ.options.map((option, idx) => (
                <div
                  key={idx}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    answers[currentQ.id] === idx
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value={idx.toString()} id={`option-${idx}`} />
                  <Label htmlFor={`option-${idx}`} className="flex-1 cursor-pointer">
                    {option}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            
            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSkipQuestion}
                className="gap-2"
              >
                <SkipForward className="h-4 w-4" />
                Skip Question
              </Button>
              <Button
                variant={isDone ? "secondary" : "outline"}
                size="sm"
                onClick={handleMarkAsDone}
                className="gap-2"
              >
                <Check className="h-4 w-4" />
                {isDone ? 'Marked Done' : 'Mark as Done'}
              </Button>
              {hasSkippedQuestions && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleGoToSkipped}
                  className="gap-2 text-warning border-warning/40 hover:bg-warning/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Go to Skipped
                </Button>
              )}
            </div>
            
            {/* Navigation */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentQuestion === 0}
              >
                Previous
              </Button>
              
              {currentQuestion === questions.length - 1 ? (
                <Button
                  onClick={handleSubmit}
                  disabled={!canSubmit()}
                  className="gap-2"
                >
                  Submit Quiz
                  <CheckCircle2 className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleNext} className="gap-2">
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>

            {/* Warning for skipped questions */}
            {currentQuestion === questions.length - 1 && !canSubmit() && (
              <p className="text-sm text-warning text-center">
                Please answer all skipped questions before submitting.
              </p>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{isDemo ? 'Demo Quiz' : 'Module Quiz'}</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};
