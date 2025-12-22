import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { Student } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

const mockStudents: Student[] = [
  { id: '1', name: 'Jane Doe', email: 'jane@student.com', regNo: 'STU001', semester: 4, registerYear: 2022, institutionId: 'inst-1', courseIds: ['c1', 'c2'] },
  { id: '2', name: 'Bob Smith', email: 'bob@student.com', regNo: 'STU002', semester: 3, registerYear: 2023, institutionId: 'inst-1', courseIds: ['c1'] },
  { id: '3', name: 'Alice Johnson', email: 'alice@student.com', regNo: 'STU003', semester: 5, registerYear: 2021, institutionId: 'inst-1', courseIds: ['c2', 'c3'] },
];

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    regNo: '',
    semester: '1',
    registerYear: new Date().getFullYear().toString(),
  });
  const { toast } = useToast();

  const columns = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'regNo', label: 'Registration No.' },
    { key: 'semester', label: 'Semester' },
    { key: 'registerYear', label: 'Year' },
    {
      key: 'courseIds',
      label: 'Courses',
      render: (item: Student) => (
        <Badge variant="secondary">{item.courseIds.length} enrolled</Badge>
      ),
    },
  ];

  const handleCreate = () => {
    setEditingStudent(null);
    setFormData({
      name: '',
      email: '',
      password: '',
      regNo: '',
      semester: '1',
      registerYear: new Date().getFullYear().toString(),
    });
    setIsDialogOpen(true);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name,
      email: student.email,
      password: '',
      regNo: student.regNo,
      semester: student.semester.toString(),
      registerYear: student.registerYear.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (student: Student) => {
    setStudents(students.filter((s) => s.id !== student.id));
    toast({
      title: 'Student deleted',
      description: `${student.name} has been removed.`,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingStudent) {
      setStudents(
        students.map((s) =>
          s.id === editingStudent.id
            ? {
                ...s,
                name: formData.name,
                email: formData.email,
                regNo: formData.regNo,
                semester: parseInt(formData.semester),
                registerYear: parseInt(formData.registerYear),
              }
            : s
        )
      );
      toast({
        title: 'Student updated',
        description: `${formData.name} has been updated.`,
      });
    } else {
      const newStudent: Student = {
        id: `stu-${Date.now()}`,
        name: formData.name,
        email: formData.email,
        regNo: formData.regNo,
        semester: parseInt(formData.semester),
        registerYear: parseInt(formData.registerYear),
        institutionId: 'inst-1',
        courseIds: [],
      };
      setStudents([...students, newStudent]);
      toast({
        title: 'Student created',
        description: `${formData.name} has been enrolled.`,
      });
    }

    setIsDialogOpen(false);
  };

  return (
    <DashboardLayout>
      <PageHeader
        title="Students"
        description="Manage students enrolled in your institution"
        action={{ label: 'Add Student', onClick: handleCreate }}
      />

      <DataTable
        columns={columns}
        data={students}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? 'Edit Student' : 'Add Student'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="student@student.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">
                Password {editingStudent && '(leave blank to keep current)'}
              </Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter password"
                required={!editingStudent}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="regNo">Registration Number</Label>
              <Input
                id="regNo"
                value={formData.regNo}
                onChange={(e) => setFormData({ ...formData, regNo: e.target.value })}
                placeholder="Enter registration number"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="semester">Semester</Label>
                <Select
                  value={formData.semester}
                  onValueChange={(value) => setFormData({ ...formData, semester: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((sem) => (
                      <SelectItem key={sem} value={sem.toString()}>
                        Semester {sem}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registerYear">Year</Label>
                <Input
                  id="registerYear"
                  type="number"
                  value={formData.registerYear}
                  onChange={(e) => setFormData({ ...formData, registerYear: e.target.value })}
                  min="2000"
                  max="2030"
                  required
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button type="submit" className="flex-1">
                {editingStudent ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
