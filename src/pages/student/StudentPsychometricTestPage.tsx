import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, CheckCircle, ArrowRight, ArrowLeft, RotateCcw, Trophy, Target, Lightbulb, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Question {
  id: string;
  question: string;
  options: { text: string; category: string; score: number }[];
}

interface TestResult {
  category: string;
  label: string;
  score: number;
  description: string;
  icon: React.ElementType;
  color: string;
}

const psychometricQuestions: Question[] = [
  {
    id: 'q1',
    question: 'When working on a group project, I prefer to:',
    options: [
      { text: 'Take the lead and organize the team', category: 'leadership', score: 3 },
      { text: 'Contribute ideas and collaborate equally', category: 'teamwork', score: 3 },
      { text: 'Focus on my specific assigned tasks', category: 'analytical', score: 3 },
      { text: 'Support others and help resolve conflicts', category: 'empathy', score: 3 },
    ],
  },
  {
    id: 'q2',
    question: 'When faced with a difficult problem, I usually:',
    options: [
      { text: 'Break it down into smaller parts and analyze each', category: 'analytical', score: 3 },
      { text: 'Brainstorm creative solutions', category: 'creativity', score: 3 },
      { text: 'Seek advice from others who have experience', category: 'teamwork', score: 3 },
      { text: 'Take charge and make quick decisions', category: 'leadership', score: 3 },
    ],
  },
  {
    id: 'q3',
    question: 'I feel most satisfied when:',
    options: [
      { text: 'I help someone overcome a challenge', category: 'empathy', score: 3 },
      { text: 'I solve a complex puzzle or problem', category: 'analytical', score: 3 },
      { text: 'I create something new and unique', category: 'creativity', score: 3 },
      { text: 'I achieve a goal I set for myself', category: 'leadership', score: 3 },
    ],
  },
  {
    id: 'q4',
    question: 'In my free time, I prefer activities that:',
    options: [
      { text: 'Allow me to express myself creatively', category: 'creativity', score: 3 },
      { text: 'Involve spending time with friends or family', category: 'teamwork', score: 3 },
      { text: 'Challenge my mind (puzzles, strategy games)', category: 'analytical', score: 3 },
      { text: 'Help others or contribute to community', category: 'empathy', score: 3 },
    ],
  },
  {
    id: 'q5',
    question: 'When learning something new, I prefer:',
    options: [
      { text: 'Reading detailed explanations and analysis', category: 'analytical', score: 3 },
      { text: 'Hands-on experimentation and trying things', category: 'creativity', score: 3 },
      { text: 'Group discussions and collaborative learning', category: 'teamwork', score: 3 },
      { text: 'Teaching others what I learn', category: 'leadership', score: 3 },
    ],
  },
  {
    id: 'q6',
    question: 'I am most comfortable when:',
    options: [
      { text: 'I have a clear plan and structure', category: 'analytical', score: 3 },
      { text: 'I can adapt and be flexible', category: 'creativity', score: 3 },
      { text: 'I am working with a supportive team', category: 'teamwork', score: 3 },
      { text: 'I am in a position to guide others', category: 'leadership', score: 3 },
    ],
  },
  {
    id: 'q7',
    question: 'When someone shares their problems with me, I:',
    options: [
      { text: 'Listen carefully and offer emotional support', category: 'empathy', score: 3 },
      { text: 'Try to analyze the situation and suggest solutions', category: 'analytical', score: 3 },
      { text: 'Share similar experiences to relate', category: 'teamwork', score: 3 },
      { text: 'Encourage them to take action', category: 'leadership', score: 3 },
    ],
  },
  {
    id: 'q8',
    question: 'My ideal work environment would be:',
    options: [
      { text: 'A creative studio with freedom to innovate', category: 'creativity', score: 3 },
      { text: 'A collaborative space with diverse team members', category: 'teamwork', score: 3 },
      { text: 'A structured office with clear processes', category: 'analytical', score: 3 },
      { text: 'A role where I can mentor and lead others', category: 'leadership', score: 3 },
    ],
  },
  {
    id: 'q9',
    question: 'When making decisions, I rely most on:',
    options: [
      { text: 'Data, facts, and logical analysis', category: 'analytical', score: 3 },
      { text: 'My intuition and gut feeling', category: 'creativity', score: 3 },
      { text: 'Input and opinions from others', category: 'teamwork', score: 3 },
      { text: 'How it will affect the people involved', category: 'empathy', score: 3 },
    ],
  },
  {
    id: 'q10',
    question: 'I would describe myself as:',
    options: [
      { text: 'Caring and understanding', category: 'empathy', score: 3 },
      { text: 'Logical and methodical', category: 'analytical', score: 3 },
      { text: 'Innovative and imaginative', category: 'creativity', score: 3 },
      { text: 'Confident and decisive', category: 'leadership', score: 3 },
    ],
  },
];

const categoryDescriptions: Record<string, { label: string; description: string; icon: React.ElementType; color: string }> = {
  leadership: {
    label: 'Leadership',
    description: 'You have strong leadership qualities. You are decisive, confident, and naturally take charge in group situations. Consider roles in management, entrepreneurship, or team leadership.',
    icon: Trophy,
    color: 'text-amber-500',
  },
  analytical: {
    label: 'Analytical Thinking',
    description: 'You excel at logical reasoning and problem-solving. You prefer structured approaches and data-driven decisions. Consider careers in engineering, research, data science, or finance.',
    icon: Target,
    color: 'text-blue-500',
  },
  creativity: {
    label: 'Creativity',
    description: 'You have a strong creative mindset. You think outside the box and enjoy innovation. Consider careers in design, arts, marketing, or any field that values creative problem-solving.',
    icon: Lightbulb,
    color: 'text-purple-500',
  },
  teamwork: {
    label: 'Collaboration',
    description: 'You thrive in collaborative environments. You value relationships and work well with others. Consider careers in human resources, project management, or community-oriented roles.',
    icon: Users,
    color: 'text-green-500',
  },
  empathy: {
    label: 'Empathy',
    description: 'You have high emotional intelligence and understanding. You connect well with others\' feelings. Consider careers in counseling, healthcare, teaching, or social work.',
    icon: Brain,
    color: 'text-pink-500',
  },
};

export default function StudentPsychometricTestPage() {
  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [testCompleted, setTestCompleted] = useState(false);
  const [results, setResults] = useState<TestResult[]>([]);

  const handleStartTest = () => {
    setTestStarted(true);
    setCurrentQuestion(0);
    setAnswers({});
    setSelectedOption(null);
    setTestCompleted(false);
    setResults([]);
  };

  const handleSelectOption = (optionIndex: number) => {
    setSelectedOption(optionIndex);
  };

  const handleNext = () => {
    if (selectedOption === null) return;

    const question = psychometricQuestions[currentQuestion];
    const selected = question.options[selectedOption];

    setAnswers((prev) => ({
      ...prev,
      [selected.category]: (prev[selected.category] || 0) + selected.score,
    }));

    if (currentQuestion < psychometricQuestions.length - 1) {
      setCurrentQuestion((prev) => prev + 1);
      setSelectedOption(null);
    } else {
      calculateResults();
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion((prev) => prev - 1);
      setSelectedOption(null);
    }
  };

  const calculateResults = () => {
    const question = psychometricQuestions[currentQuestion];
    if (selectedOption !== null) {
      const selected = question.options[selectedOption];
      answers[selected.category] = (answers[selected.category] || 0) + selected.score;
    }

    const maxScore = psychometricQuestions.length * 3;
    const resultData: TestResult[] = Object.entries(answers)
      .map(([category, score]) => ({
        category,
        score: Math.round((score / maxScore) * 100),
        ...categoryDescriptions[category],
      }))
      .sort((a, b) => b.score - a.score);

    setResults(resultData);
    setTestCompleted(true);
  };

  const progress = ((currentQuestion + 1) / psychometricQuestions.length) * 100;

  // Welcome Screen
  if (!testStarted) {
    return (
      <DashboardLayout>
        <PageHeader
          title="Psychometric Assessment"
          description="Discover your personality traits and career inclinations"
        />

        <div className="max-w-2xl mx-auto">
          <Card className="card-hover">
            <CardHeader className="text-center">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Brain className="w-10 h-10 text-primary" />
              </div>
              <CardTitle className="text-2xl">Personality & Career Assessment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-muted-foreground text-center">
                This assessment will help you understand your personality traits, strengths, 
                and potential career paths that align with your natural inclinations.
              </p>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>10 Questions</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>5-10 Minutes</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Instant Results</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span>Career Insights</span>
                </div>
              </div>

              <div className="bg-muted/50 rounded-lg p-4">
                <h4 className="font-medium mb-2">Instructions:</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Answer each question honestly based on your first instinct</li>
                  <li>• There are no right or wrong answers</li>
                  <li>• Choose the option that best describes you</li>
                  <li>• You can go back to previous questions if needed</li>
                </ul>
              </div>

              <Button className="w-full" size="lg" onClick={handleStartTest}>
                Start Assessment
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  // Results Screen
  if (testCompleted) {
    const topResult = results[0];
    const TopIcon = topResult?.icon || Brain;

    return (
      <DashboardLayout>
        <PageHeader
          title="Assessment Results"
          description="Your personality profile and career recommendations"
        />

        <div className="max-w-3xl mx-auto space-y-6">
          {/* Primary Result */}
          <Card className="border-primary/30">
            <CardHeader className="text-center pb-4">
              <div className={cn("w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4")}>
                <TopIcon className={cn("w-10 h-10", topResult?.color)} />
              </div>
              <Badge className="mb-2">Your Dominant Trait</Badge>
              <CardTitle className="text-2xl">{topResult?.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center">
                {topResult?.description}
              </p>
            </CardContent>
          </Card>

          {/* All Traits */}
          <Card>
            <CardHeader>
              <CardTitle>Your Complete Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {results.map((result, index) => {
                const Icon = result.icon;
                return (
                  <div key={result.category} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className={cn("w-5 h-5", result.color)} />
                        <span className="font-medium">{result.label}</span>
                        {index === 0 && (
                          <Badge variant="secondary" className="text-xs">Strongest</Badge>
                        )}
                      </div>
                      <span className="text-sm font-medium">{result.score}%</span>
                    </div>
                    <Progress value={result.score} className="h-2" />
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Career Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle>Recommended Career Paths</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {topResult?.category === 'leadership' && (
                  <>
                    <Badge variant="outline" className="justify-center py-2">Project Manager</Badge>
                    <Badge variant="outline" className="justify-center py-2">Entrepreneur</Badge>
                    <Badge variant="outline" className="justify-center py-2">Business Executive</Badge>
                    <Badge variant="outline" className="justify-center py-2">Team Lead</Badge>
                  </>
                )}
                {topResult?.category === 'analytical' && (
                  <>
                    <Badge variant="outline" className="justify-center py-2">Data Scientist</Badge>
                    <Badge variant="outline" className="justify-center py-2">Software Engineer</Badge>
                    <Badge variant="outline" className="justify-center py-2">Research Analyst</Badge>
                    <Badge variant="outline" className="justify-center py-2">Financial Analyst</Badge>
                  </>
                )}
                {topResult?.category === 'creativity' && (
                  <>
                    <Badge variant="outline" className="justify-center py-2">UX Designer</Badge>
                    <Badge variant="outline" className="justify-center py-2">Marketing Specialist</Badge>
                    <Badge variant="outline" className="justify-center py-2">Content Creator</Badge>
                    <Badge variant="outline" className="justify-center py-2">Product Designer</Badge>
                  </>
                )}
                {topResult?.category === 'teamwork' && (
                  <>
                    <Badge variant="outline" className="justify-center py-2">HR Manager</Badge>
                    <Badge variant="outline" className="justify-center py-2">Community Manager</Badge>
                    <Badge variant="outline" className="justify-center py-2">Customer Success</Badge>
                    <Badge variant="outline" className="justify-center py-2">Event Coordinator</Badge>
                  </>
                )}
                {topResult?.category === 'empathy' && (
                  <>
                    <Badge variant="outline" className="justify-center py-2">Counselor</Badge>
                    <Badge variant="outline" className="justify-center py-2">Teacher</Badge>
                    <Badge variant="outline" className="justify-center py-2">Healthcare Worker</Badge>
                    <Badge variant="outline" className="justify-center py-2">Social Worker</Badge>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          <Button className="w-full" onClick={handleStartTest}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Retake Assessment
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  // Question Screen
  const question = psychometricQuestions[currentQuestion];

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Question {currentQuestion + 1} of {psychometricQuestions.length}</span>
            <span className="font-medium">{Math.round(progress)}% Complete</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl leading-relaxed">{question.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {question.options.map((option, index) => (
              <button
                key={index}
                onClick={() => handleSelectOption(index)}
                className={cn(
                  "w-full p-4 text-left rounded-lg border-2 transition-all duration-200",
                  selectedOption === index
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0",
                      selectedOption === index
                        ? "border-primary bg-primary"
                        : "border-muted-foreground/30"
                    )}
                  >
                    {selectedOption === index && (
                      <CheckCircle className="w-4 h-4 text-primary-foreground" />
                    )}
                  </div>
                  <span className="text-sm md:text-base">{option.text}</span>
                </div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex gap-3 mt-6">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestion === 0}
            className="flex-1"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={selectedOption === null}
            className="flex-1"
          >
            {currentQuestion === psychometricQuestions.length - 1 ? 'View Results' : 'Next'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </DashboardLayout>
  );
}
