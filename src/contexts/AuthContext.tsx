import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { Session, User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (email: string, password: string, name: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Map Supabase app_role to UserRole
function mapAppRoleToUserRole(appRole: string): UserRole {
  switch (appRole) {
    case 'admin':
      return 'admin';
    case 'teacher':
      return 'teacher';
    case 'student':
      return 'student';
    default:
      return 'student';
  }
}

// Fetch user role from user_roles table
async function fetchUserRole(userId: string): Promise<UserRole> {
  const { data, error } = await supabase
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();

  if (error || !data) {
    console.log('No role found, defaulting to student');
    return 'student';
  }

  return mapAppRoleToUserRole(data.role);
}

// Fetch user profile
async function fetchUserProfile(userId: string): Promise<{ name: string; institution_id?: string } | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('name, institution_id')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return { name: data.name || '', institution_id: data.institution_id || undefined };
}

// Build user object from Supabase user
async function buildUserFromSupabaseUser(supabaseUser: SupabaseUser): Promise<User> {
  const role = await fetchUserRole(supabaseUser.id);
  const profile = await fetchUserProfile(supabaseUser.id);

  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    name: profile?.name || supabaseUser.email?.split('@')[0] || 'User',
    role,
    institutionId: profile?.institution_id,
    createdAt: new Date(supabaseUser.created_at),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Use setTimeout to avoid potential deadlocks with Supabase client
          setTimeout(async () => {
            try {
              const appUser = await buildUserFromSupabaseUser(session.user);
              setUser(appUser);
            } catch (error) {
              console.error('Error building user:', error);
              setUser(null);
            }
            setIsLoading(false);
          }, 0);
        } else {
          setUser(null);
          setIsLoading(false);
        }
      }
    );

    // Check for existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        try {
          const appUser = await buildUserFromSupabaseUser(session.user);
          setUser(appUser);
        } catch (error) {
          console.error('Error building user:', error);
          setUser(null);
        }
      }
      setIsLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Login error:', error.message);
        setIsLoading(false);
        return false;
      }

      if (data.user) {
        const appUser = await buildUserFromSupabaseUser(data.user);
        setUser(appUser);
        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const signup = async (email: string, password: string, name: string, role: UserRole): Promise<boolean> => {
    setIsLoading(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
          },
        },
      });

      if (error) {
        console.error('Signup error:', error.message);
        setIsLoading(false);
        return false;
      }

      if (data.user) {
        // Map UserRole to app_role enum
        let appRole: 'admin' | 'teacher' | 'student' = 'student';
        if (role === 'admin') appRole = 'admin';
        else if (role === 'teacher') appRole = 'teacher';
        else appRole = 'student';

        // Insert role into user_roles table
        const { error: roleError } = await supabase
          .from('user_roles')
          .insert([{ user_id: data.user.id, role: appRole }]);

        if (roleError) {
          console.error('Error setting user role:', roleError);
        }

        const appUser = await buildUserFromSupabaseUser(data.user);
        setUser(appUser);
        setIsLoading(false);
        return true;
      }

      setIsLoading(false);
      return false;
    } catch (error) {
      console.error('Signup error:', error);
      setIsLoading(false);
      return false;
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
