import { createContext, useContext, useEffect, useState } from 'react';
import SupabaseService from '../services/SupabaseService';

const supabaseService = new SupabaseService();

interface AuthContextType {
  user: any;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkUser();
    
    // Listen for auth changes
    const { data: { subscription } } = supabaseService.getClient().auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function checkUser() {
    try {
      const currentUser = await supabaseService.getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error('Error checking user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function login(email: string, password: string) {
    try {
      const response = await supabaseService.signIn(email, password);
      const currentUser = await supabaseService.getCurrentUser();
      setUser(currentUser);
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async function signup(email: string, password: string, name?: string) {
    try {
      const response = await supabaseService.signUp(email, password, {
        data: { 
          full_name: name 
        }
      });
      
      if (response.user) {
        setUser(response.user);
      }
      
      return response;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async function signInWithGoogle() {
    try {
      const response = await supabaseService.signInWithOAuth('google');
      return response;
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  async function logout() {
    try {
      await supabaseService.signOut();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  const value = {
    user,
    loading,
    login,
    signup,
    logout,
    signInWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}