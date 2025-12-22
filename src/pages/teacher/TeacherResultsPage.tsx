import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';

interface ResultEntry {
  id: string;
  studentName: string;
  regNo: string;
  type: 'quiz' | 'assignment' | 'exam';
  itemName: string;
  score: number;
  totalMarks: number;
  correct?: number;
  wrong?: number;
  submittedAt: string;
}

const mockResults: ResultEntry[] = [
  { id: '1', studentName: 'Jane Doe', regNo: 'STU001', type: 'quiz', itemName: 'HTML Basics Quiz', score: 85, totalMarks: 100, correct: 17, wrong: 3, submittedAt: '2024-12-20' },
  { id: '2', studentName: 'Bob Smith', regNo: 'STU002', type: 'assignment', itemName: 'Landing Page Project', score: 0, totalMarks: 100, submittedAt: '2024-12-19' },
  { id: '3', studentName: 'Alice Johnson', regNo: 'STU003', type: 'quiz', itemName: 'CSS Fundamentals Quiz', score: 72, totalMarks: 100, correct: 14, wrong: 6, submittedAt: '2024-12-18' },
  { id: '4', studentName: 'Jane Doe', regNo: 'STU001', type: 'exam', itemName: 'Mid-term Exam', score: 0, totalMarks: 100, submittedAt: '2024-12-15' },
];

export default function TeacherResultsPage() {
  const [results, setResults] = useState<ResultEntry[]>(mockResults);
  const [activeTab, setActiveTab] = useState('all');
  const [editingResult, setEditingResult] = useState<ResultEntry | null>(null);
  const [scoreInput, setScoreInput] = useState('');
  const { toast } = useToast();

  const columns = [
    { key: 'regNo', label: 'Reg. No.' },
    { key: 'studentName', label: 'Student' },
    {
      key: 'type',
      label: 'Type',
      render: (item: ResultEntry) => (
        <Badge variant={item.type === 'quiz' ? 'default' : item.type === 'assignment' ? 'secondary' : 'outline'}>
          {item.type}
        </Badge>
      ),
    },
    { key: 'itemName', label: 'Item' },
    {
      key: 'score',
      label: 'Score',
      render: (item: ResultEntry) => (
        <span className={item.score === 0 ? 'text-muted-foreground' : 'font-medium'}>
          {item.score === 0 ? 'Pending' : `${item.score}/${item.totalMarks}`}
        </span>
      ),
    },
    {
      key: 'details',
      label: 'Details',
      render: (item: ResultEntry) => (
        item.correct !== undefined ? (
          <span className="text-sm text-muted-foreground">
            ✓ {item.correct} / ✗ {item.wrong}
          </span>
        ) : '-'
      ),
    },
    { key: 'submittedAt', label: 'Submitted' },
  ];

  const filteredResults = activeTab === 'all' 
    ? results 
    : results.filter(r => r.type === activeTab);

  const pendingResults = results.filter(r => r.score === 0 && (r.type === 'assignment' || r.type === 'exam'));

  const handleGrade = (result: ResultEntry) => {
    setEditingResult(result);
    setScoreInput(result.score.toString());
  };

  const handleSaveGrade = () => {
    if (!editingResult) return;

    const score = parseInt(scoreInput);
    if (isNaN(score) || score < 0 || score > editingResult.totalMarks) {
      toast({
        title: 'Invalid score',
        description: `Score must be between 0 and ${editingResult.totalMarks}`,
        variant: 'destructive',
      });
      return;
    }

    setResults(results.map(r => 
      r.id === editingResult.id ? { ...r, score } : r
    ));

    toast({
      title: 'Score saved',
      description: `${editingResult.studentName}'s score has been updated.`,
    });

    setEditingResult(null);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Results"
        description="View and upload marks for quizzes, assignments, and exams"
      />

      {pendingResults.length > 0 && (
        <div className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/20">
          <p className="text-sm font-medium text-warning">
            {pendingResults.length} submissions pending grading
          </p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Results</TabsTrigger>
          <TabsTrigger value="quiz">Quizzes</TabsTrigger>
          <TabsTrigger value="assignment">Assignments</TabsTrigger>
          <TabsTrigger value="exam">Exams</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={filteredResults}
        onEdit={(result) => {
          if (result.type !== 'quiz') {
            handleGrade(result);
          }
        }}
      />

      <Dialog open={!!editingResult} onOpenChange={() => setEditingResult(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
          </DialogHeader>
          
          {editingResult && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <p className="font-medium">{editingResult.studentName}</p>
                <p className="text-sm text-muted-foreground">{editingResult.regNo}</p>
                <p className="text-sm mt-2">{editingResult.itemName}</p>
              </div>

              <div className="space-y-2">
                <Label>Score (out of {editingResult.totalMarks})</Label>
                <Input
                  type="number"
                  value={scoreInput}
                  onChange={(e) => setScoreInput(e.target.value)}
                  min="0"
                  max={editingResult.totalMarks}
                />
              </div>

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setEditingResult(null)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleSaveGrade} className="flex-1 gap-2">
                  <Upload className="w-4 h-4" />
                  Save Score
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
