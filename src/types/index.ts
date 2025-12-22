export type UserRole = 'admin' | 'institution' | 'teacher' | 'student';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  institutionId?: string;
  createdAt: Date;
}

export interface Institution {
  id: string;
  name: string;
  email: string;
  aisheCode: string;
  address?: string;
  phone?: string;
  createdAt: Date;
}

export interface Course {
  id: string;
  name: string;
  description: string;
  institutionId: string;
  contentManagerIds: string[];
  totalClasses: number;
  createdAt: Date;
}

export interface Subject {
  id: string;
  name: string;
  courseId: string;
  description: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  regNo: string;
  semester: number;
  registerYear: number;
  institutionId: string;
  courseIds: string[];
}

export interface ContentManager {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  institutionId: string;
  courseIds: string[];
}

export interface Material {
  id: string;
  name: string;
  type: 'video' | 'document' | 'link';
  url: string;
  subjectId: string;
  courseId: string;
}

export interface Quiz {
  id: string;
  title: string;
  subjectId: string;
  courseId: string;
  questions: QuizQuestion[];
  totalMarks: number;
  duration: number; // in minutes
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  marks: number;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  subjectId: string;
  courseId: string;
  dueDate: Date;
  totalMarks: number;
}

export interface Exam {
  id: string;
  title: string;
  courseId: string;
  date: Date;
  totalMarks: number;
  duration: number;
}

export interface Result {
  id: string;
  studentId: string;
  type: 'quiz' | 'assignment' | 'exam';
  itemId: string;
  score: number;
  totalMarks: number;
  correct?: number;
  wrong?: number;
  submittedAt: Date;
}

export interface StudentProgress {
  studentId: string;
  courseId: string;
  completedClasses: number;
  totalClasses: number;
  completedAssignments: number;
  totalAssignments: number;
  completedQuizzes: number;
  totalQuizzes: number;
}
