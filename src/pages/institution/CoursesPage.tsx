import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Course } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const mockCourses: Course[] = [
  { id: 'c1', name: 'Web Development Fundamentals', description: 'Learn HTML, CSS, and JavaScript', institutionId: 'inst-1', contentManagerIds: ['1', '3'], totalClasses: 24, createdAt: new Date() },
  { id: 'c2', name: 'Data Science Basics', description: 'Introduction to Python and Data Analysis', institutionId: 'inst-1', contentManagerIds: ['1', '2'], totalClasses: 30, createdAt: new Date() },
  { id: 'c3', name: 'Mobile App Development', description: 'Build iOS and Android apps', institutionId: 'inst-1', contentManagerIds: ['2'], totalClasses: 20, createdAt: new Date() },
];

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    totalClasses: '20',
  });
  const { toast } = useToast();

  const columns = [
    { key: 'name', label: 'Course Name' },
    { key: 'description', label: 'Description' },
    { key: 'totalClasses', label: 'Total Classes' },
    {
      key: 'contentManagerIds',
      label: 'Managers',
      render: (item: Course) => (
        <Badge variant="secondary">{item.contentManagerIds.length} assigned</Badge>
      ),
    },
    {
      key: 'createdAt',
      label: 'Created',
      render: (item: Course) => new Date(item.createdAt).toLocaleDateString(),
    },
  ];

  const handleCreate = () => {
    setEditingCourse(null);
    setFormData({ name: '', description: '', totalClasses: '20' });
    setIsDialogOpen(true);
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      name: course.name,
      description: course.description,
      totalClasses: course.totalClasses.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (course: Course) => {
    setCourses(courses.filter((c) => c.id !== course.id));
    toast({
      title: 'Course deleted',
      description: `${course.name} has been removed.`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingCourse) {
      setCourses(
        courses.map((c) =>
          c.id === editingCourse.id
            ? {
                ...c,
                name: formData.name,
                description: formData.description,
                totalClasses: parseInt(formData.totalClasses),
              }
            : c
        )
      );
      toast({
        title: 'Course updated',
        description: `${formData.name} has been updated.`,
      });
    } else {
      const newCourse: Course = {
        id: `course-${Date.now()}`,
        name: formData.name,
        description: formData.description,
        institutionId: 'inst-1',
        contentManagerIds: [],
        totalClasses: parseInt(formData.totalClasses),
        createdAt: new Date(),
      };
      setCourses([...courses, newCourse]);
      toast({
        title: 'Course created',
        description: `${formData.name} has been added.`,
      });
    }

    setIsDialogOpen(false);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Courses"
        description="Manage courses offered by your institution"
        action={{ label: 'Add Course', onClick: handleCreate }}
      />

      <DataTable
        columns={columns}
        data={courses}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingCourse ? 'Edit Course' : 'Add Course'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Course Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter course name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter course description"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="totalClasses">Total Classes</Label>
              <Input
                id="totalClasses"
                type="number"
                value={formData.totalClasses}
                onChange={(e) => setFormData({ ...formData, totalClasses: e.target.value })}
                min="1"
                required
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingCourse ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
