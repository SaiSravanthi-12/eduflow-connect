import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Code, FileCode } from 'lucide-react';

interface CodingQuestionProps {
  questionNumber: number;
  question: string;
  language?: string;
  starterCode?: string;
  answer: string;
  onAnswerChange: (answer: string) => void;
  isReview?: boolean;
}

export const CodingQuestion: React.FC<CodingQuestionProps> = ({
  questionNumber,
  question,
  language = 'JavaScript',
  starterCode = '',
  answer,
  onAnswerChange,
  isReview = false,
}) => {
  const [localAnswer, setLocalAnswer] = useState(answer || starterCode);

  const handleChange = (value: string) => {
    setLocalAnswer(value);
    onAnswerChange(value);
  };

  return (
    <Card className="border-border">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base">
            <FileCode className="h-5 w-5 text-primary" />
            Coding Question {questionNumber}
          </CardTitle>
          <Badge variant="secondary" className="gap-1">
            <Code className="h-3 w-3" />
            {language}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 rounded-lg bg-muted">
          <p className="text-foreground whitespace-pre-wrap">{question}</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Your Solution:</label>
          <Textarea
            value={localAnswer}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Write your code here..."
            className="min-h-[200px] font-mono text-sm bg-background border-border"
            disabled={isReview}
          />
        </div>

        {!isReview && (
          <p className="text-xs text-muted-foreground">
            Write clean, well-commented code. Your solution will be evaluated for correctness and code quality.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
