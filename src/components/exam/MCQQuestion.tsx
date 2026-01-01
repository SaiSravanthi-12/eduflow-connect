import React from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

interface MCQQuestionProps {
  questionNumber: number;
  question: string;
  options: string[];
  selectedAnswer?: number;
  onAnswerSelect: (answer: number) => void;
  isReview?: boolean;
  correctAnswer?: number;
}

export const MCQQuestion: React.FC<MCQQuestionProps> = ({
  questionNumber,
  question,
  options,
  selectedAnswer,
  onAnswerSelect,
  isReview = false,
  correctAnswer,
}) => {
  return (
    <Card className="border-border">
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start gap-3">
          <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
            {questionNumber}
          </span>
          <p className="text-foreground font-medium pt-1">{question}</p>
        </div>

        <RadioGroup
          value={selectedAnswer?.toString()}
          onValueChange={(value) => onAnswerSelect(parseInt(value))}
          disabled={isReview}
        >
          <div className="space-y-2 pl-11">
            {options.map((option, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrect = correctAnswer === idx;
              const showCorrect = isReview && isCorrect;
              const showIncorrect = isReview && isSelected && !isCorrect;

              return (
                <div
                  key={idx}
                  className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                    showCorrect
                      ? 'border-success bg-success/10'
                      : showIncorrect
                      ? 'border-destructive bg-destructive/10'
                      : isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <RadioGroupItem value={idx.toString()} id={`q${questionNumber}-option-${idx}`} />
                  <Label
                    htmlFor={`q${questionNumber}-option-${idx}`}
                    className={`flex-1 cursor-pointer ${isReview ? 'cursor-default' : ''}`}
                  >
                    {option}
                  </Label>
                  {showCorrect && <CheckCircle2 className="h-5 w-5 text-success" />}
                </div>
              );
            })}
          </div>
        </RadioGroup>

        {selectedAnswer !== undefined && !isReview && (
          <p className="text-xs text-muted-foreground pl-11">Answer saved</p>
        )}
      </CardContent>
    </Card>
  );
};
