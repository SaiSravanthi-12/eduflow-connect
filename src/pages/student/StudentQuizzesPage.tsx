import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { HelpCircle, Clock, CheckCircle, Play } from 'lucide-react';

interface Quiz {
  id: string;
  title: string;
  course: string;
  questions: number;
  duration: number;
  status: 'pending' | 'completed';
  score?: number;
  dueDate: string;
}

const mockQuizzes: Quiz[] = [
  { id: 'q1', title: 'HTML Basics Quiz', course: 'Web Development', questions: 10, duration: 15, status: 'completed', score: 85, dueDate: '2024-12-20' },
  { id: 'q2', title: 'CSS Fundamentals Quiz', course: 'Web Development', questions: 15, duration: 20, status: 'pending', dueDate: '2024-12-25' },
  { id: 'q3', title: 'Python Variables Quiz', course: 'Data Science', questions: 12, duration: 15, status: 'pending', dueDate: '2024-12-28' },
  { id: 'q4', title: 'JavaScript Basics Quiz', course: 'Web Development', questions: 20, duration: 30, status: 'completed', score: 72, dueDate: '2024-12-15' },
];

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

const sampleQuestions: QuizQuestion[] = [
  { id: '1', question: 'What does HTML stand for?', options: ['Hyper Text Markup Language', 'High Tech Modern Language', 'Hyper Transfer Markup Language', 'Home Tool Markup Language'], correctAnswer: 0 },
  { id: '2', question: 'Which tag is used for the largest heading?', options: ['<h6>', '<heading>', '<h1>', '<head>'], correctAnswer: 2 },
  { id: '3', question: 'What is the correct HTML for creating a hyperlink?', options: ['<a url="http://example.com">', '<a href="http://example.com">', '<link href="http://example.com">', '<hyperlink>http://example.com</hyperlink>'], correctAnswer: 1 },
];

export default function StudentQuizzesPage() {
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<number[]>([]);
  const [showResults, setShowResults] = useState(false);
  const { toast } = useToast();

  const handleStartQuiz = () => {
    setIsQuizStarted(true);
    setCurrentQuestion(0);
    setSelectedAnswers([]);
    setShowResults(false);
  };

  const handleSelectAnswer = (answerIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = answerIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleNextQuestion = () => {
    if (currentQuestion < sampleQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    sampleQuestions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / sampleQuestions.length) * 100);
  };

  const handleCloseQuiz = () => {
    setSelectedQuiz(null);
    setIsQuizStarted(false);
    setShowResults(false);
    if (showResults) {
      toast({
        title: 'Quiz completed!',
        description: `Your score: ${calculateScore()}%`,
      });
    }
  };

  const pendingQuizzes = mockQuizzes.filter(q => q.status === 'pending');
  const completedQuizzes = mockQuizzes.filter(q => q.status === 'completed');

  return (
    <DashboardLayout>
      <PageHeader
        title="Quizzes"
        description="Take quizzes and track your progress"
      />

      {/* Pending Quizzes */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4">Pending Quizzes</h3>
        {pendingQuizzes.length === 0 ? (
          <p className="text-muted-foreground">No pending quizzes</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pendingQuizzes.map((quiz) => (
              <Card key={quiz.id} className="card-hover">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                      <HelpCircle className="w-5 h-5 text-warning" />
                    </div>
                    <Badge variant="outline">Pending</Badge>
                  </div>
                  <CardTitle className="text-lg mt-3">{quiz.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{quiz.course}</p>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span>{quiz.questions} questions</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {quiz.duration} min
                    </span>
                  </div>
                  <p className="text-sm mb-4">Due: {quiz.dueDate}</p>
                  <Button 
                    className="w-full gap-2" 
                    onClick={() => setSelectedQuiz(quiz)}
                  >
                    <Play className="w-4 h-4" />
                    Start Quiz
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Completed Quizzes */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Completed Quizzes</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {completedQuizzes.map((quiz) => (
            <Card key={quiz.id} className="border-success/30">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  <Badge className="bg-success/10 text-success border-success/20">
                    Score: {quiz.score}%
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-3">{quiz.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{quiz.course}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{quiz.questions} questions</span>
                  <span>Completed: {quiz.dueDate}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quiz Dialog */}
      <Dialog open={!!selectedQuiz} onOpenChange={handleCloseQuiz}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedQuiz?.title}</DialogTitle>
          </DialogHeader>

          {!isQuizStarted && !showResults && (
            <div className="text-center py-8">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <HelpCircle className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Ready to start?</h3>
              <p className="text-muted-foreground mb-6">
                {selectedQuiz?.questions} questions • {selectedQuiz?.duration} minutes
              </p>
              <Button onClick={handleStartQuiz} className="gap-2">
                <Play className="w-4 h-4" />
                Start Quiz
              </Button>
            </div>
          )}

          {isQuizStarted && !showResults && (
            <div className="py-4">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm text-muted-foreground">
                  Question {currentQuestion + 1} of {sampleQuestions.length}
                </span>
                <Badge variant="outline">
                  {selectedAnswers.filter(a => a !== undefined).length} answered
                </Badge>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">
                  {sampleQuestions[currentQuestion].question}
                </h3>
                <div className="space-y-3">
                  {sampleQuestions[currentQuestion].options.map((option, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectAnswer(index)}
                      className={`w-full p-4 rounded-lg border text-left transition-all ${
                        selectedAnswers[currentQuestion] === index
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <span className="font-medium mr-3">
                        {String.fromCharCode(65 + index)}.
                      </span>
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleNextQuestion}
                  disabled={selectedAnswers[currentQuestion] === undefined}
                >
                  {currentQuestion < sampleQuestions.length - 1 ? 'Next' : 'Finish'}
                </Button>
              </div>
            </div>
          )}

          {showResults && (
            <div className="text-center py-8">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
              <h3 className="text-2xl font-bold mb-2">Quiz Completed!</h3>
              <p className="text-4xl font-bold text-primary mb-4">{calculateScore()}%</p>
              <p className="text-muted-foreground mb-6">
                You got {selectedAnswers.filter((a, i) => a === sampleQuestions[i].correctAnswer).length} out of {sampleQuestions.length} correct
              </p>
              <Button onClick={handleCloseQuiz}>Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
