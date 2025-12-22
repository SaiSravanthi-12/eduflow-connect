import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { FileText, Clock, CheckCircle, Upload, AlertCircle } from 'lucide-react';

interface Assignment {
  id: string;
  title: string;
  description: string;
  course: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  score?: number;
  totalMarks: number;
}

const mockAssignments: Assignment[] = [
  { id: 'a1', title: 'Build a Landing Page', description: 'Create a responsive landing page using HTML and CSS', course: 'Web Development', dueDate: '2024-12-30', status: 'pending', totalMarks: 100 },
  { id: 'a2', title: 'Data Analysis Project', description: 'Analyze the given dataset using Python and create visualizations', course: 'Data Science', dueDate: '2024-12-28', status: 'submitted', totalMarks: 100 },
  { id: 'a3', title: 'JavaScript Calculator', description: 'Build a functional calculator using JavaScript', course: 'Web Development', dueDate: '2024-12-15', status: 'graded', score: 85, totalMarks: 100 },
];

export default function StudentAssignmentsPage() {
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [submission, setSubmission] = useState({ text: '', file: '' });
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Assignment submitted!',
      description: 'Your assignment has been submitted successfully.',
    });
    setSelectedAssignment(null);
    setSubmission({ text: '', file: '' });
  };

  const getStatusBadge = (status: string, score?: number, totalMarks?: number) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
      case 'submitted':
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Submitted</Badge>;
      case 'graded':
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Graded: {score}/{totalMarks}</Badge>;
      default:
        return null;
    }
  };

  const pendingAssignments = mockAssignments.filter(a => a.status === 'pending');
  const submittedAssignments = mockAssignments.filter(a => a.status === 'submitted');
  const gradedAssignments = mockAssignments.filter(a => a.status === 'graded');

  return (
    <DashboardLayout>
      <PageHeader
        title="Assignments"
        description="View and submit your assignments"
      />

      {/* Pending Assignments */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-warning" />
          Pending Assignments ({pendingAssignments.length})
        </h3>
        {pendingAssignments.length === 0 ? (
          <p className="text-muted-foreground">No pending assignments</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingAssignments.map((assignment) => (
              <Card key={assignment.id} className="card-hover border-warning/30">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-warning" />
                    </div>
                    {getStatusBadge(assignment.status)}
                  </div>
                  <CardTitle className="text-lg mt-3">{assignment.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{assignment.course}</p>
                  <p className="text-sm mb-3">{assignment.description}</p>
                  <div className="flex items-center gap-2 text-sm text-warning mb-4">
                    <Clock className="w-4 h-4" />
                    Due: {assignment.dueDate}
                  </div>
                  <Button 
                    className="w-full gap-2" 
                    onClick={() => setSelectedAssignment(assignment)}
                  >
                    <Upload className="w-4 h-4" />
                    Submit Assignment
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Submitted Assignments */}
      {submittedAssignments.length > 0 && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Awaiting Grade ({submittedAssignments.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {submittedAssignments.map((assignment) => (
              <Card key={assignment.id} className="border-primary/30">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    {getStatusBadge(assignment.status)}
                  </div>
                  <CardTitle className="text-lg mt-3">{assignment.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">{assignment.course}</p>
                  <p className="text-sm text-muted-foreground">Submitted on {assignment.dueDate}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Graded Assignments */}
      <div>
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-success" />
          Graded ({gradedAssignments.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {gradedAssignments.map((assignment) => (
            <Card key={assignment.id} className="border-success/30">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                    <CheckCircle className="w-5 h-5 text-success" />
                  </div>
                  {getStatusBadge(assignment.status, assignment.score, assignment.totalMarks)}
                </div>
                <CardTitle className="text-lg mt-3">{assignment.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{assignment.course}</p>
                <p className="text-sm text-muted-foreground">Graded on {assignment.dueDate}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Submit Assignment Dialog */}
      <Dialog open={!!selectedAssignment} onOpenChange={() => setSelectedAssignment(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
          </DialogHeader>

          {selectedAssignment && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <h4 className="font-medium">{selectedAssignment.title}</h4>
                <p className="text-sm text-muted-foreground">{selectedAssignment.course}</p>
                <p className="text-sm mt-2">{selectedAssignment.description}</p>
              </div>

              <div className="space-y-2">
                <Label>Your Answer / Notes</Label>
                <Textarea
                  value={submission.text}
                  onChange={(e) => setSubmission({ ...submission, text: e.target.value })}
                  placeholder="Enter your answer or notes..."
                  rows={4}
                />
              </div>

              <div className="space-y-2">
                <Label>Upload File (optional)</Label>
                <Input
                  type="file"
                  onChange={(e) => setSubmission({ ...submission, file: e.target.value })}
                />
              </div>

              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setSelectedAssignment(null)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 gap-2">
                  <Upload className="w-4 h-4" />
                  Submit
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
