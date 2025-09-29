// src/contexts/auth-context.tsx
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// Mock user type. Replace with your actual user type from the database.
export interface User {
  id: string;
  email: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({ user: null, loading: true });

// This is a temporary mock provider.
// It assumes the user is always logged in to allow development of other features.
// This will be replaced with a real authentication flow connecting to the MySQL database.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>({
      id: '1',
      email: 'dev@otiplanner.com',
      name: 'Dev User'
  });
  const [loading, setLoading] = useState(false); // Set to false as we are mocking auth

  const value = {
    user,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
