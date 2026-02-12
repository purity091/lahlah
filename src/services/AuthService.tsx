import { createContext, useContext, useEffect, useState } from 'react';
import AuthenticationService from './AuthenticationService';

const authService = new AuthenticationService();

interface AuthContextType {
  user: any;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: { full_name?: string; avatar_url?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState(authService.getAuthState());

  useEffect(() => {
    const unsubscribe = authService.subscribe(setAuthState);
    return () => unsubscribe();
  }, []);

  async function login(email: string, password: string) {
    try {
      await authService.signIn(email, password);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async function signup(email: string, password: string, name?: string) {
    try {
      await authService.signUp(email, password, name);
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async function signInWithGoogle() {
    try {
      await authService.signInWithGoogle();
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async function resetPassword(email: string) {
    try {
      await authService.resetPassword(email);
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  async function updateProfile(updates: { full_name?: string; avatar_url?: string }) {
    try {
      await authService.updateProfile(updates);
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  }

  const value = {
    user: authState.user,
    loading: authState.isLoading,
    error: authState.error,
    login,
    signup,
    logout,
    signInWithGoogle,
    resetPassword,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}