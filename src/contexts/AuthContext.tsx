import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users for demonstration
const mockUsers: User[] = [
  { id: '1', email: 'admin@admin.com', name: 'System Admin', role: 'admin', createdAt: new Date() },
  { id: '2', email: 'college@institution.com', name: 'ABC College', role: 'institution', institutionId: 'inst-1', createdAt: new Date() },
  { id: '3', email: 'teacher@teacher.com', name: 'John Smith', role: 'teacher', institutionId: 'inst-1', createdAt: new Date() },
  { id: '4', email: 'student@student.com', name: 'Jane Doe', role: 'student', institutionId: 'inst-1', createdAt: new Date() },
  { id: '5', email: 'sravanthi@student.com', name: 'Sravanthi', role: 'student', institutionId: 'inst-1', createdAt: new Date() },
];

function getRoleFromEmail(email: string): UserRole | null {
  if (email.includes('@admin')) return 'admin';
  if (email.includes('@institution')) return 'institution';
  if (email.includes('@teacher')) return 'teacher';
  if (email.includes('@student')) return 'student';
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored session
    const storedUser = localStorage.getItem('edu_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const role = getRoleFromEmail(email);
    
    if (!role) {
      setIsLoading(false);
      return false;
    }

    // Find existing mock user or create new one
    let foundUser = mockUsers.find(u => u.email === email);
    
    if (!foundUser) {
      foundUser = {
        id: `user-${Date.now()}`,
        email,
        name: email.split('@')[0],
        role,
        institutionId: role !== 'admin' ? 'inst-1' : undefined,
        createdAt: new Date(),
      };
    }

    setUser(foundUser);
    localStorage.setItem('edu_user', JSON.stringify(foundUser));
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('edu_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
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
