import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { 
  ClipboardList, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  RotateCcw,
  Trophy,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  // NOTE: correctAnswer is NOT included - grading happens server-side
}

export interface ModuleQuizCardProps {
  isOpen: boolean;
  onClose: () => void;
  courseId: string;
  moduleId: string;
  moduleName: string;
  userId: string;
  onComplete: (passed: boolean) => void;
}

// Sample questions generator for fallback (without correct answers)
const generateModuleQuestions = (moduleId: string, moduleName: string): QuizQuestion[] => {
  return Array.from({ length: 10 }, (_, i) => ({
    id: `${moduleId}-q${i + 1}`,
    question: `Question ${i + 1} about ${moduleName}?`,
    options: [
      `Option A for question ${i + 1}`,
      `Option B for question ${i + 1}`,
      `Option C for question ${i + 1}`,
      `Option D for question ${i + 1}`,
    ],
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
}) => {
  const [quizState, setQuizState] = useState<'not_started' | 'in_progress' | 'completed'>('not_started');
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [showResults, setShowResults] = useState(false);
  const [score, setScore] = useState(0);
  const [passed, setPassed] = useState(false);
  const [previousAttempt, setPreviousAttempt] = useState<{ score: number; passed: boolean } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadQuizData = async () => {
      if (!userId || !isOpen) return;

      setIsLoading(true);

      // Check for previous attempts
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

      // Try to fetch questions from edge function (without correct answers)
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          const response = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/get-quiz-questions?courseId=${courseId}&moduleId=${moduleId}`,
            {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
              setQuestions(data.questions);
              setIsLoading(false);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error fetching quiz questions:', error);
      }

      // Fallback to generated questions (for demo)
      setQuestions(generateModuleQuestions(moduleId, moduleName));
      setIsLoading(false);
    };

    loadQuizData();
  }, [isOpen, userId, courseId, moduleId, moduleName]);

  const handleStartQuiz = () => {
    setQuizState('in_progress');
    setCurrentQuestion(0);
    setAnswers({});
    setShowResults(false);
  };

  const handleAnswerSelect = (answer: number) => {
    setAnswers(prev => ({
      ...prev,
      [questions[currentQuestion].id]: answer,
    }));
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

  const handleSubmit = async () => {
    setIsSubmitting(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.access_token) {
        toast.error('Please log in to submit the quiz');
        setIsSubmitting(false);
        return;
      }

      // Submit to server-side grading
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/grade-quiz`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            courseId,
            moduleId,
            answers,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to grade quiz');
      }

      const result = await response.json();
      
      setScore(result.score);
      setPassed(result.passed);
      setShowResults(true);
      setQuizState('completed');

      onComplete(result.passed);

      if (result.passed) {
        toast.success('Congratulations! You passed the quiz!');
      } else {
        toast.error('You did not pass. Try again!');
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      toast.error('Failed to submit quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-2">Loading quiz...</span>
        </div>
      );
    }

    if (quizState === 'not_started') {
      return (
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <ClipboardList className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-semibold">Module Quiz: {moduleName}</h3>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-muted-foreground">Questions</p>
              <p className="font-semibold text-foreground">{questions.length} MCQs</p>
            </div>
            <div className="p-3 rounded-lg bg-muted">
              <p className="text-muted-foreground">Passing Score</p>
              <p className="font-semibold text-foreground">70%</p>
            </div>
          </div>
          
          {previousAttempt && !previousAttempt.passed && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive">
                Previous attempt: {previousAttempt.score}% - Did not pass
              </p>
            </div>
          )}
          
          <Button onClick={handleStartQuiz} className="w-full gap-2">
            {previousAttempt ? 'Retry Quiz' : 'Start Quiz'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    if (showResults) {
      return (
        <div className="text-center space-y-4">
          {passed ? (
            <>
              <Trophy className="h-16 w-16 mx-auto text-success" />
              <h3 className="text-2xl font-bold text-success">Congratulations!</h3>
              <p className="text-muted-foreground">You passed the quiz</p>
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
            {!passed && (
              <Button onClick={handleStartQuiz} variant="outline" className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Try Again
              </Button>
            )}
            <Button onClick={onClose}>
              {passed ? 'Continue' : 'Close'}
            </Button>
          </div>
        </div>
      );
    }

    const currentQ = questions[currentQuestion];
    const isAnswered = currentQ && answers[currentQ.id] !== undefined;

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Question {currentQuestion + 1} of {questions.length}</h3>
          <span className="text-sm text-muted-foreground">
            {Object.keys(answers).length} answered
          </span>
        </div>
        <Progress value={((currentQuestion + 1) / questions.length) * 100} className="h-2" />
        
        {currentQ && (
          <>
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
            
            <div className="flex items-center justify-between pt-4">
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
                  disabled={Object.keys(answers).length < questions.length || isSubmitting}
                  className="gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Submit Quiz
                      <CheckCircle2 className="h-4 w-4" />
                    </>
                  )}
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={!isAnswered} className="gap-2">
                  Next
                  <ArrowRight className="h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="sr-only">Module Quiz</DialogTitle>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
};
