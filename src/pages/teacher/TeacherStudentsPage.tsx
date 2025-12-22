import React, { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/common/DataTable';
import { ProgressBar } from '@/components/common/ProgressBar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

interface StudentDetail {
  id: string;
  name: string;
  regNo: string;
  email: string;
  semester: number;
  registerYear: number;
  completedClasses: number;
  totalClasses: number;
  completedAssignments: number;
  totalAssignments: number;
  completedQuizzes: number;
  totalQuizzes: number;
  courseId: string;
  courseName: string;
}

const mockStudents: StudentDetail[] = [
  { id: '1', name: 'Jane Doe', regNo: 'STU001', email: 'jane@student.com', semester: 4, registerYear: 2022, completedClasses: 18, totalClasses: 24, completedAssignments: 3, totalAssignments: 4, completedQuizzes: 5, totalQuizzes: 6, courseId: 'c1', courseName: 'Web Development' },
  { id: '2', name: 'Bob Smith', regNo: 'STU002', email: 'bob@student.com', semester: 3, registerYear: 2023, completedClasses: 15, totalClasses: 24, completedAssignments: 2, totalAssignments: 4, completedQuizzes: 4, totalQuizzes: 6, courseId: 'c1', courseName: 'Web Development' },
  { id: '3', name: 'Alice Johnson', regNo: 'STU003', email: 'alice@student.com', semester: 5, registerYear: 2021, completedClasses: 12, totalClasses: 30, completedAssignments: 2, totalAssignments: 5, completedQuizzes: 3, totalQuizzes: 5, courseId: 'c2', courseName: 'Data Science' },
];

export default function TeacherStudentsPage() {
  const [selectedStudent, setSelectedStudent] = useState<StudentDetail | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const columns = [
    { key: 'regNo', label: 'Reg. No.' },
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'semester', label: 'Semester' },
    { key: 'registerYear', label: 'Year' },
    { key: 'courseName', label: 'Course' },
    {
      key: 'progress',
      label: 'Progress',
      render: (item: StudentDetail) => {
        const total = item.totalClasses + item.totalAssignments + item.totalQuizzes;
        const completed = item.completedClasses + item.completedAssignments + item.completedQuizzes;
        return <ProgressBar value={completed} max={total} />;
      },
    },
  ];

  const filteredStudents = activeTab === 'all' 
    ? mockStudents 
    : mockStudents.filter(s => s.courseId === activeTab);

  return (
    <DashboardLayout>
      <PageHeader
        title="Students"
        description="View student details and progress for your courses"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">All Students</TabsTrigger>
          <TabsTrigger value="c1">Web Development</TabsTrigger>
          <TabsTrigger value="c2">Data Science</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={filteredStudents}
        onView={(student) => setSelectedStudent(student)}
      />

      <Dialog open={!!selectedStudent} onOpenChange={() => setSelectedStudent(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Student Details</DialogTitle>
          </DialogHeader>
          
          {selectedStudent && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
                  <span className="text-2xl text-primary-foreground font-bold">
                    {selectedStudent.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedStudent.name}</h3>
                  <p className="text-muted-foreground">{selectedStudent.regNo}</p>
                  <Badge variant="secondary" className="mt-1">{selectedStudent.courseName}</Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedStudent.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Semester</p>
                  <p className="font-medium">{selectedStudent.semester}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Register Year</p>
                  <p className="font-medium">{selectedStudent.registerYear}</p>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-semibold">Progress Overview</h4>
                
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Classes Completed</span>
                      <span className="font-medium">
                        {selectedStudent.completedClasses}/{selectedStudent.totalClasses}
                      </span>
                    </div>
                    <ProgressBar value={selectedStudent.completedClasses} max={selectedStudent.totalClasses} showLabel={false} />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Assignments Completed</span>
                      <span className="font-medium">
                        {selectedStudent.completedAssignments}/{selectedStudent.totalAssignments}
                      </span>
                    </div>
                    <ProgressBar value={selectedStudent.completedAssignments} max={selectedStudent.totalAssignments} showLabel={false} />
                  </div>

                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Quizzes Completed</span>
                      <span className="font-medium">
                        {selectedStudent.completedQuizzes}/{selectedStudent.totalQuizzes}
                      </span>
                    </div>
                    <ProgressBar value={selectedStudent.completedQuizzes} max={selectedStudent.totalQuizzes} showLabel={false} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
