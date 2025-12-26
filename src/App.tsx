import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// Pages
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Admin Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import InstitutionsPage from "./pages/admin/InstitutionsPage";

// Institution Pages
import InstitutionDashboard from "./pages/institution/InstitutionDashboard";
import ContentManagersPage from "./pages/institution/ContentManagersPage";
import StudentsPage from "./pages/institution/StudentsPage";
import CoursesPage from "./pages/institution/CoursesPage";
import InstitutionProfilePage from "./pages/institution/ProfilePage";
import EnrollmentRequestsPage from "./pages/institution/EnrollmentRequestsPage";

// Teacher Pages
import TeacherDashboard from "./pages/teacher/TeacherDashboard";
import TeacherCoursesPage from "./pages/teacher/TeacherCoursesPage";
import TeacherStudentsPage from "./pages/teacher/TeacherStudentsPage";
import TeacherResultsPage from "./pages/teacher/TeacherResultsPage";
import TeacherProfilePage from "./pages/teacher/TeacherProfilePage";

// Student Pages
import StudentDashboard from "./pages/student/StudentDashboard";
import StudentCoursesPage from "./pages/student/StudentCoursesPage";
import StudentBrowseCoursesPage from "./pages/student/StudentBrowseCoursesPage";
import StudentQuizzesPage from "./pages/student/StudentQuizzesPage";
import StudentAssignmentsPage from "./pages/student/StudentAssignmentsPage";
import StudentExamsPage from "./pages/student/StudentExamsPage";
import StudentProfilePage from "./pages/student/StudentProfilePage";

const queryClient = new QueryClient();

function ProtectedRoute({ children, allowedRoles }: { children: React.ReactNode; allowedRoles: string[] }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={user ? <Navigate to={`/${user.role}`} replace /> : <Login />} />
      <Route path="/" element={user ? <Navigate to={`/${user.role}`} replace /> : <Navigate to="/login" replace />} />

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />
      <Route path="/admin/institutions" element={<ProtectedRoute allowedRoles={['admin']}><InstitutionsPage /></ProtectedRoute>} />
      <Route path="/admin/institutions/new" element={<ProtectedRoute allowedRoles={['admin']}><InstitutionsPage /></ProtectedRoute>} />
      <Route path="/admin/settings" element={<ProtectedRoute allowedRoles={['admin']}><AdminDashboard /></ProtectedRoute>} />

      {/* Institution Routes */}
      <Route path="/institution" element={<ProtectedRoute allowedRoles={['institution']}><InstitutionDashboard /></ProtectedRoute>} />
      <Route path="/institution/content-managers" element={<ProtectedRoute allowedRoles={['institution']}><ContentManagersPage /></ProtectedRoute>} />
      <Route path="/institution/students" element={<ProtectedRoute allowedRoles={['institution']}><StudentsPage /></ProtectedRoute>} />
      <Route path="/institution/courses" element={<ProtectedRoute allowedRoles={['institution']}><CoursesPage /></ProtectedRoute>} />
      <Route path="/institution/enrollment-requests" element={<ProtectedRoute allowedRoles={['institution']}><EnrollmentRequestsPage /></ProtectedRoute>} />
      <Route path="/institution/profile" element={<ProtectedRoute allowedRoles={['institution']}><InstitutionProfilePage /></ProtectedRoute>} />

      {/* Teacher Routes */}
      <Route path="/teacher" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherDashboard /></ProtectedRoute>} />
      <Route path="/teacher/courses" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherCoursesPage /></ProtectedRoute>} />
      <Route path="/teacher/students" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherStudentsPage /></ProtectedRoute>} />
      <Route path="/teacher/assignments" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherCoursesPage /></ProtectedRoute>} />
      <Route path="/teacher/results" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherResultsPage /></ProtectedRoute>} />
      <Route path="/teacher/profile" element={<ProtectedRoute allowedRoles={['teacher']}><TeacherProfilePage /></ProtectedRoute>} />

      {/* Student Routes */}
      <Route path="/student" element={<ProtectedRoute allowedRoles={['student']}><StudentDashboard /></ProtectedRoute>} />
      <Route path="/student/courses" element={<ProtectedRoute allowedRoles={['student']}><StudentCoursesPage /></ProtectedRoute>} />
      <Route path="/student/browse-courses" element={<ProtectedRoute allowedRoles={['student']}><StudentBrowseCoursesPage /></ProtectedRoute>} />
      <Route path="/student/quizzes" element={<ProtectedRoute allowedRoles={['student']}><StudentQuizzesPage /></ProtectedRoute>} />
      <Route path="/student/assignments" element={<ProtectedRoute allowedRoles={['student']}><StudentAssignmentsPage /></ProtectedRoute>} />
      <Route path="/student/exams" element={<ProtectedRoute allowedRoles={['student']}><StudentExamsPage /></ProtectedRoute>} />
      <Route path="/student/profile" element={<ProtectedRoute allowedRoles={['student']}><StudentProfilePage /></ProtectedRoute>} />

      {/* Catch All */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
