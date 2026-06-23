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
import { LanguageSelector } from '@/components/common/LanguageSelector';
import { useLanguage } from '@/contexts/LanguageContext';

interface NavItem {
  icon: React.ElementType;
  labelKey: string;
  href: string;
}

const navItemsByRole: Record<string, NavItem[]> = {
  admin: [
    { icon: LayoutDashboard, labelKey: 'navigation.dashboard', href: '/admin' },
    { icon: Building2, labelKey: 'navigation.institutions', href: '/admin/institutions' },
    { icon: Settings, labelKey: 'navigation.settings', href: '/admin/settings' },
  ],
  institution: [
    { icon: LayoutDashboard, labelKey: 'navigation.dashboard', href: '/institution' },
    { icon: Users, labelKey: 'navigation.contentManagers', href: '/institution/content-managers' },
    { icon: GraduationCap, labelKey: 'navigation.students', href: '/institution/students' },
    { icon: BookOpen, labelKey: 'navigation.courses', href: '/institution/courses' },
    { icon: ClipboardList, labelKey: 'navigation.enrollmentRequests', href: '/institution/enrollment-requests' },
    { icon: User, labelKey: 'navigation.profile', href: '/institution/profile' },
  ],
  teacher: [
    { icon: LayoutDashboard, labelKey: 'navigation.dashboard', href: '/teacher' },
    { icon: BookOpen, labelKey: 'navigation.courses', href: '/teacher/courses' },
    { icon: GraduationCap, labelKey: 'navigation.students', href: '/teacher/students' },
    { icon: FileText, labelKey: 'navigation.assignments', href: '/teacher/assignments' },
    { icon: BarChart3, labelKey: 'navigation.results', href: '/teacher/results' },
    { icon: User, labelKey: 'navigation.profile', href: '/teacher/profile' },
  ],
  student: [
    { icon: LayoutDashboard, labelKey: 'navigation.dashboard', href: '/student' },
    { icon: BookOpen, labelKey: 'navigation.myCourses', href: '/student/courses' },
    { icon: Building2, labelKey: 'navigation.browseCourses', href: '/student/browse-courses' },
    { icon: ClipboardList, labelKey: 'navigation.quizzes', href: '/student/quizzes' },
    { icon: FileText, labelKey: 'navigation.assignments', href: '/student/assignments' },
    { icon: GraduationCap, labelKey: 'navigation.exams', href: '/student/exams' },
    { icon: BarChart3, labelKey: 'navigation.psychometricTest', href: '/student/psychometric-test' },
    { icon: User, labelKey: 'navigation.profile', href: '/student/profile' },
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
  const { t } = useLanguage();

  if (!user) return null;

  const navItems = navItemsByRole[user.role] || [];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleLabel = (role: string) => t(`roles.${role}`);

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
          <span className="font-semibold">{t('common.appName')}</span>
        </div>
        <LanguageSelector variant="ghost" size="icon" showLabel={false} />
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
              <span className="font-bold text-lg">{t('common.appName')}</span>
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
                  <span>{t(item.labelKey)}</span>
                  {isActive && <ChevronRight className="w-4 h-4 ml-auto" />}
                </Link>
              );
            })}
          </nav>

          {/* Language & Logout */}
          <div className="p-4 border-t border-border space-y-2">
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm text-muted-foreground">{t('common.language')}</span>
              <LanguageSelector variant="outline" size="sm" showLabel={true} />
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-muted-foreground hover:text-destructive"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              <span>{t('common.logout')}</span>
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
