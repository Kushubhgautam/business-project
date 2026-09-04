import React, { createContext, useContext, useState, useEffect } from 'react';

export type UserRole = 'customer' | 'provider';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  phone?: string;
  location?: string;
  title?: string;
  rating?: number;
  completedJobs?: number;
}

export const DEMO_CUSTOMER: User = {
  id: 'cust-alex',
  name: 'Alex Chen',
  email: 'alex.chen@example.com',
  role: 'customer',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
  phone: '+91 98765 43210',
  location: 'Indiranagar, Bengaluru',
};

export const DEMO_PROVIDER: User = {
  id: 'priya-sharma',
  name: 'Priya Sharma',
  email: 'priya.sharma@fixnear.pro',
  role: 'provider',
  avatar: 'https://i.pravatar.cc/160?img=47',
  phone: '+91 98123 45678',
  location: 'Indiranagar, Bengaluru',
  title: 'Certified AC & Appliance Specialist',
  rating: 4.9,
  completedJobs: 342,
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string, role?: UserRole) => Promise<{ success: boolean; error?: string }>;
  register: (data: { name: string; email: string; password: string; role: UserRole; phone?: string }) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: (role: UserRole) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'fixnear_auth_user';
const USERS_DB_KEY = 'fixnear_users_registered';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return DEMO_CUSTOMER;
  });

  useEffect(() => {
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }, [user]);

  const login = async (email: string, _password: string, rolePreference?: UserRole): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = email.trim().toLowerCase();
    if (!cleanEmail) {
      return { success: false, error: 'Please enter your email address' };
    }

    if (cleanEmail === DEMO_PROVIDER.email.toLowerCase()) {
      setUser(DEMO_PROVIDER);
      return { success: true };
    }

    if (cleanEmail === DEMO_CUSTOMER.email.toLowerCase()) {
      setUser(DEMO_CUSTOMER);
      return { success: true };
    }

    try {
      const registeredStr = localStorage.getItem(USERS_DB_KEY);
      const registeredList: User[] = registeredStr ? JSON.parse(registeredStr) : [];
      const found = registeredList.find((u) => u.email.toLowerCase() === cleanEmail);
      if (found) {
        setUser(found);
        return { success: true };
      }
    } catch {
      // ignore
    }

    const detectedName = cleanEmail.split('@')[0].replace(/[._-]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    const newUser: User = {
      id: `user-${Date.now()}`,
      name: detectedName,
      email: cleanEmail,
      role: rolePreference || (cleanEmail.includes('pro') ? 'provider' : 'customer'),
      location: 'Bengaluru, KA',
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(detectedName)}`,
    };

    setUser(newUser);
    return { success: true };
  };

  const register = async (data: { name: string; email: string; password: string; role: UserRole; phone?: string }): Promise<{ success: boolean; error?: string }> => {
    const cleanEmail = data.email.trim().toLowerCase();
    const cleanName = data.name.trim();

    if (!cleanName || !cleanEmail || !data.password) {
      return { success: false, error: 'All fields are required' };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: cleanName,
      email: cleanEmail,
      role: data.role,
      phone: data.phone || '+91 98765 00000',
      location: 'Bengaluru, KA',
      title: data.role === 'provider' ? 'Professional Service Partner' : undefined,
      avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(cleanName)}`,
    };

    try {
      const registeredStr = localStorage.getItem(USERS_DB_KEY);
      const registeredList: User[] = registeredStr ? JSON.parse(registeredStr) : [];
      const updated = [...registeredList.filter((u) => u.email.toLowerCase() !== cleanEmail), newUser];
      localStorage.setItem(USERS_DB_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    setUser(newUser);
    return { success: true };
  };

  const loginAsDemo = (role: UserRole) => {
    setUser(role === 'provider' ? DEMO_PROVIDER : DEMO_CUSTOMER);
  };

  const switchRole = (newRole: UserRole) => {
    if (!user) {
      setUser(newRole === 'provider' ? DEMO_PROVIDER : DEMO_CUSTOMER);
      return;
    }
    setUser({ ...user, role: newRole });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        register,
        loginAsDemo,
        switchRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
