import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  LayoutDashboard, 
  Building2, 
  Users, 
  BookOpen, 
  FileText, 
  Settings, 
  LogOut,
  Menu,
  X,
  GraduationCap,
  ClipboardList,
  BarChart3,
  User,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ElementType;
  label: string;
  href: string;
}

const navItemsByRole: Record<string, NavItem[]> = {
  admin: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
    { icon: Building2, label: 'Institutions', href: '/admin/institutions' },
    { icon: Settings, label: 'Settings', href: '/admin/settings' },
  ],
  institution: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/institution' },
    { icon: Users, label: 'Content Managers', href: '/institution/content-managers' },
    { icon: GraduationCap, label: 'Students', href: '/institution/students' },
    { icon: BookOpen, label: 'Courses', href: '/institution/courses' },
    { icon: ClipboardList, label: 'Enrollment Requests', href: '/institution/enrollment-requests' },
    { icon: User, label: 'Profile', href: '/institution/profile' },
  ],
  teacher: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/teacher' },
    { icon: BookOpen, label: 'Courses', href: '/teacher/courses' },
    { icon: GraduationCap, label: 'Students', href: '/teacher/students' },
    { icon: FileText, label: 'Assignments', href: '/teacher/assignments' },
    { icon: BarChart3, label: 'Results', href: '/teacher/results' },
    { icon: User, label: 'Profile', href: '/teacher/profile' },
  ],
  student: [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/student' },
    { icon: BookOpen, label: 'My Courses', href: '/student/courses' },
    { icon: Building2, label: 'Browse Courses', href: '/student/browse-courses' },
    { icon: ClipboardList, label: 'Quizzes', href: '/student/quizzes' },
    { icon: FileText, label: 'Assignments', href: '/student/assignments' },
    { icon: GraduationCap, label: 'Exams', href: '/student/exams' },
    { icon: BarChart3, label: 'Psychometric Test', href: '/student/psychometric-test' },
    { icon: User, label: 'Profile', href: '/student/profile' },
  ],
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user) return null;

  const navItems = navItemsByRole[user.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLabel = (role: string) => {
    const labels: Record<string, string> = {
      admin: 'System Admin',
      institution: 'Institution',
      teacher: 'Content Manager',
      student: 'Student',
    };
    return labels[role] || role;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-card border-b border-border z-50 flex items-center justify-between px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-secondary transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-primary" />
          <span className="font-semibold">Tec-You UpSkill</span>
        </div>
        <div className="w-10" />
      </header>

      {/* Mobile Sidebar Overlay */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-foreground/20 backdrop-blur-sm z-50"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed top-0 left-0 h-full w-64 bg-card border-r border-border z-50 transform transition-transform duration-300 lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-border">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">Tec-You UpSkill</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 rounded-lg hover:bg-secondary transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* User Info */}
          <div className="px-4 py-4 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full gradient-primary flex items-center justify-center">
                <span className="text-primary-foreground font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{user.name}</p>
                <p className="text-xs text-muted-foreground">{getRoleLabel(user.role)}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;
              
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setSidebarOpen(false)}
                  className={cn(
                    "nav-link",
                    isActive && "active"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:ml-64 min-h-screen pt-16 lg:pt-0">
        <div className="p-4 md:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
