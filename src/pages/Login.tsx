import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GraduationCap, Mail, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelector } from '@/components/common/LanguageSelector';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!email || !password) {
      setError(t('common.missingCredentials'));
      setIsLoading(false);
      return;
    }

    const success = await login(email, password);

    if (success) {
      toast({
        title: t('common.welcomeBack') + '!',
        description: t('common.loginSuccess'),
      });

      // Redirect based on role
      if (email.includes('@admin')) {
        navigate('/admin');
      } else if (email.includes('@institution')) {
        navigate('/institution');
      } else if (email.includes('@teacher')) {
        navigate('/teacher');
      } else if (email.includes('@student')) {
        navigate('/student');
      }
    } else {
      setError(t('common.invalidLogin'));
    }

    setIsLoading(false);
  };

  const demoLogins = [
    { labelKey: 'roles.admin', email: 'admin@admin.com' },
    { labelKey: 'roles.institution', email: 'college@institution.com' },
    { labelKey: 'roles.teacher', email: 'teacher@teacher.com' },
    { labelKey: 'roles.student', email: 'student@student.com' },
    { labelKey: 'roles.sravanthi', email: 'sravanthi@student.com' },
  ];

  return (
    <div className="min-h-screen flex">
      <div className="fixed top-4 right-4 z-50">
        <LanguageSelector variant="outline" size="sm" />
      </div>
      {/* Left Panel - Hero */}
      <div className="hidden lg:flex lg:w-1/2 gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-center">
          <div className="w-20 h-20 rounded-2xl bg-primary-foreground/10 backdrop-blur flex items-center justify-center mb-8">
            <GraduationCap className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-4">
            {t('common.appName')}
          </h1>
          <p className="text-xl text-primary-foreground/80 max-w-md">
            A comprehensive educational management system for institutions, teachers, and students.
          </p>
          
          <div className="mt-12 grid grid-cols-2 gap-6 text-primary-foreground/90">
            <div className="text-center">
              <p className="text-3xl font-bold">500+</p>
              <p className="text-sm opacity-80">Institutions</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">50K+</p>
              <p className="text-sm opacity-80">Students</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">1000+</p>
              <p className="text-sm opacity-80">Courses</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-bold">99%</p>
              <p className="text-sm opacity-80">Satisfaction</p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-background">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold">{t('common.appName')}</span>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold">{t('common.welcomeBack')}</h2>
            <p className="text-muted-foreground mt-2">
              {t('common.signInDescription')}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email">{t('common.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder={t('common.enterEmail')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('common.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder={t('common.enterPassword')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Button
              type="submit"
              variant="gradient"
              size="xl"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {t('common.signingIn')}
                </>
              ) : (
                t('auth.loginButton')
              )}
            </Button>
          </form>

          {/* Demo Logins */}
          <div className="mt-8">
            <p className="text-center text-sm text-muted-foreground mb-4">
              {t('common.quickDemoAccess')}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {demoLogins.map((demo) => (
                <Button
                  key={demo.email}
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEmail(demo.email);
                    setPassword('demo123');
                  }}
                  className="text-xs"
                >
                  {t(demo.labelKey)}
                </Button>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground mt-3">
              {t('common.useAnyPassword')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
