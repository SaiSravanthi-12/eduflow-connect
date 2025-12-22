import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { BookOpen, Video, FileText, HelpCircle, Edit2, Plus, Trash2 } from 'lucide-react';

interface Material {
  id: string;
  name: string;
  type: 'video' | 'document';
  url: string;
}

interface CourseDetail {
  id: string;
  name: string;
  description: string;
  materials: Material[];
  quizzes: { id: string; title: string; questions: number }[];
  assignments: { id: string; title: string; dueDate: string }[];
}

const mockCourses: CourseDetail[] = [
  {
    id: 'c1',
    name: 'Web Development Fundamentals',
    description: 'Learn HTML, CSS, and JavaScript',
    materials: [
      { id: 'm1', name: 'Introduction to HTML', type: 'video', url: '#' },
      { id: 'm2', name: 'CSS Basics PDF', type: 'document', url: '#' },
    ],
    quizzes: [
      { id: 'q1', title: 'HTML Basics Quiz', questions: 10 },
      { id: 'q2', title: 'CSS Fundamentals Quiz', questions: 15 },
    ],
    assignments: [
      { id: 'a1', title: 'Build a Landing Page', dueDate: '2024-12-30' },
    ],
  },
  {
    id: 'c2',
    name: 'Data Science Basics',
    description: 'Introduction to Python and Data Analysis',
    materials: [
      { id: 'm3', name: 'Python Setup Guide', type: 'document', url: '#' },
    ],
    quizzes: [
      { id: 'q3', title: 'Python Basics Quiz', questions: 20 },
    ],
    assignments: [
      { id: 'a2', title: 'Data Analysis Project', dueDate: '2024-12-25' },
    ],
  },
];

export default function TeacherCoursesPage() {
  const [courses] = useState<CourseDetail[]>(mockCourses);
  const [selectedCourse, setSelectedCourse] = useState<CourseDetail | null>(null);
  const [isAddMaterialOpen, setIsAddMaterialOpen] = useState(false);
  const [isAddQuizOpen, setIsAddQuizOpen] = useState(false);
  const [isAddAssignmentOpen, setIsAddAssignmentOpen] = useState(false);
  const { toast } = useToast();

  const [materialForm, setMaterialForm] = useState({ name: '', type: 'video', url: '' });
  const [quizForm, setQuizForm] = useState({ title: '', questions: '' });
  const [assignmentForm, setAssignmentForm] = useState({ title: '', description: '', dueDate: '' });

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'Material added', description: `${materialForm.name} has been uploaded.` });
    setIsAddMaterialOpen(false);
    setMaterialForm({ name: '', type: 'video', url: '' });
  };

  const handleAddQuiz = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'Quiz created', description: `${quizForm.title} has been created.` });
    setIsAddQuizOpen(false);
    setQuizForm({ title: '', questions: '' });
  };

  const handleAddAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'Assignment created', description: `${assignmentForm.title} has been created.` });
    setIsAddAssignmentOpen(false);
    setAssignmentForm({ title: '', description: '', dueDate: '' });
  };

  if (selectedCourse) {
    return (
      <DashboardLayout>
        <div className="mb-6">
          <Button variant="ghost" onClick={() => setSelectedCourse(null)} className="mb-4">
            ← Back to Courses
          </Button>
          <PageHeader
            title={selectedCourse.name}
            description={selectedCourse.description}
          />
        </div>

        <Tabs defaultValue="materials" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="materials">Materials</TabsTrigger>
            <TabsTrigger value="quizzes">Quizzes</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
          </TabsList>

          <TabsContent value="materials" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsAddMaterialOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Material
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedCourse.materials.map((material) => (
                <Card key={material.id} className="card-hover">
                  <CardContent className="p-4 flex items-center gap-4">
                    {material.type === 'video' ? (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Video className="w-6 h-6 text-primary" />
                      </div>
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center">
                        <FileText className="w-6 h-6 text-accent" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{material.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{material.type}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="quizzes" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsAddQuizOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Quiz
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedCourse.quizzes.map((quiz) => (
                <Card key={quiz.id} className="card-hover">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-warning/10 flex items-center justify-center">
                      <HelpCircle className="w-6 h-6 text-warning" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{quiz.title}</p>
                      <p className="text-sm text-muted-foreground">{quiz.questions} questions</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <div className="flex justify-end">
              <Button onClick={() => setIsAddAssignmentOpen(true)} className="gap-2">
                <Plus className="w-4 h-4" />
                Add Assignment
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedCourse.assignments.map((assignment) => (
                <Card key={assignment.id} className="card-hover">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-success/10 flex items-center justify-center">
                      <FileText className="w-6 h-6 text-success" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{assignment.title}</p>
                      <p className="text-sm text-muted-foreground">Due: {assignment.dueDate}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon">
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        {/* Add Material Dialog */}
        <Dialog open={isAddMaterialOpen} onOpenChange={setIsAddMaterialOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Material</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddMaterial} className="space-y-4">
              <div className="space-y-2">
                <Label>Material Name</Label>
                <Input
                  value={materialForm.name}
                  onChange={(e) => setMaterialForm({ ...materialForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <select
                  className="w-full p-2 rounded-lg border border-input bg-background"
                  value={materialForm.type}
                  onChange={(e) => setMaterialForm({ ...materialForm, type: e.target.value })}
                >
                  <option value="video">Video</option>
                  <option value="document">Document</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>URL</Label>
                <Input
                  value={materialForm.url}
                  onChange={(e) => setMaterialForm({ ...materialForm, url: e.target.value })}
                  placeholder="https://..."
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setIsAddMaterialOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">Add</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Quiz Dialog */}
        <Dialog open={isAddQuizOpen} onOpenChange={setIsAddQuizOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Quiz</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddQuiz} className="space-y-4">
              <div className="space-y-2">
                <Label>Quiz Title</Label>
                <Input
                  value={quizForm.title}
                  onChange={(e) => setQuizForm({ ...quizForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Number of Questions</Label>
                <Input
                  type="number"
                  value={quizForm.questions}
                  onChange={(e) => setQuizForm({ ...quizForm, questions: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setIsAddQuizOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Add Assignment Dialog */}
        <Dialog open={isAddAssignmentOpen} onOpenChange={setIsAddAssignmentOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Assignment</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddAssignment} className="space-y-4">
              <div className="space-y-2">
                <Label>Assignment Title</Label>
                <Input
                  value={assignmentForm.title}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={assignmentForm.description}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, description: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={assignmentForm.dueDate}
                  onChange={(e) => setAssignmentForm({ ...assignmentForm, dueDate: e.target.value })}
                  required
                />
              </div>
              <div className="flex gap-3">
                <Button type="button" variant="outline" onClick={() => setIsAddAssignmentOpen(false)} className="flex-1">
                  Cancel
                </Button>
                <Button type="submit" className="flex-1">Create</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader
        title="My Courses"
        description="Manage your assigned courses, materials, quizzes, and assignments"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card
            key={course.id}
            className="card-hover cursor-pointer"
            onClick={() => setSelectedCourse(course)}
          >
            <CardHeader>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-primary" />
              </div>
              <CardTitle className="text-lg">{course.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">{course.description}</p>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>{course.materials.length} materials</span>
                <span>{course.quizzes.length} quizzes</span>
                <span>{course.assignments.length} assignments</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </DashboardLayout>
  );
}
