import { SupabaseClient } from '@supabase/supabase-js';
import { supabaseClient } from './supabaseClient';
import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  session: Session | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

class AuthenticationService {
  private client: SupabaseClient | null = null;
  private isConfigured = false;
  private authState: AuthState = {
    user: null,
    session: null,
    isAuthenticated: false,
    isLoading: true,
    error: null
  };
  private listeners: Array<(state: AuthState) => void> = [];

  constructor() {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      console.warn('Authentication service initialized outside of browser environment');
      this.isConfigured = false;
      this.updateAuthState({
        ...this.authState,
        isLoading: false,
        error: 'Authentication is not available in this environment'
      });
      return;
    }

    if (supabaseClient) {
      this.client = supabaseClient;
      this.isConfigured = true;

      // Set up auth state listener
      this.setupAuthListener();

      // Check initial session
      this.checkInitialSession();
    } else {
      console.warn('Supabase is not configured. Authentication will not work.');
      this.isConfigured = false;
      this.updateAuthState({
        ...this.authState,
        isLoading: false,
        error: 'Authentication not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
      });
    }
  }

  private setupAuthListener() {
    if (!this.client) return;

    try {
      this.client.auth.onAuthStateChange(async (event: AuthChangeEvent, session: Session | null) => {
        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          const user = session?.user || null;
          this.updateAuthState({
            user,
            session,
            isAuthenticated: !!user,
            isLoading: false,
            error: null
          });
        } else if (event === 'SIGNED_OUT') {
          this.updateAuthState({
            user: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          });
        } else if (event === 'PASSWORD_RECOVERY') {
          // Handle password recovery if needed
        }
      });
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      this.updateAuthState({
        ...this.authState,
        error: 'Failed to set up authentication listener'
      });
    }
  }

  private async checkInitialSession() {
    if (!this.client) return;

    try {
      // Check if we're in a browser environment before attempting to get session
      if (typeof window === 'undefined') {
        this.updateAuthState({
          ...this.authState,
          isLoading: false,
          error: 'Authentication is not available in this environment'
        });
        return;
      }

      const { data: { session }, error } = await this.client.auth.getSession();

      if (error) {
        console.error('Error getting initial session:', error);
        this.updateAuthState({
          ...this.authState,
          isLoading: false,
          error: error.message
        });
        return;
      }

      const user = session?.user || null;
      this.updateAuthState({
        user,
        session,
        isAuthenticated: !!user,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error checking initial session:', error);
      // Handle the specific DOMException for aborted operations
      const errorMessage = error instanceof DOMException ?
        'Authentication initialization failed. Please check your connection and Supabase configuration.' :
        (error as Error).message;

      this.updateAuthState({
        ...this.authState,
        isLoading: false,
        error: errorMessage
      });
    }
  }

  private updateAuthState(newState: AuthState) {
    this.authState = newState;
    // Notify all listeners
    this.listeners.forEach(listener => listener(this.authState));
  }

  public subscribe(callback: (state: AuthState) => void) {
    this.listeners.push(callback);
    // Call immediately with current state
    callback(this.authState);

    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  public getAuthState(): AuthState {
    return { ...this.authState };
  }

  public async signUp(email: string, password: string, name?: string) {
    if (!this.isConfigured) {
      const error = new Error('Authentication is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
      this.updateAuthState({
        ...this.authState,
        error: error.message
      });
      throw error;
    }

    try {
      const { data, error } = await this.client!.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name
          }
        }
      });

      if (error) {
        this.updateAuthState({
          ...this.authState,
          error: error.message
        });
        throw error;
      }

      // Update state with new user info
      if (data.user) {
        this.updateAuthState({
          user: data.user,
          session: data.session,
          isAuthenticated: !!data.session,
          isLoading: false,
          error: null
        });
      }

      return data;
    } catch (error) {
      console.error('Sign up error:', error);
      // Handle the specific DOMException for aborted operations
      const errorMessage = error instanceof DOMException ?
        'Sign up operation failed. Please check your connection and try again.' :
        (error as Error).message;

      this.updateAuthState({
        ...this.authState,
        error: errorMessage
      });
      throw error;
    }
  }

  public async signIn(email: string, password: string) {
    if (!this.isConfigured) {
      const error = new Error('Authentication is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
      this.updateAuthState({
        ...this.authState,
        error: error.message
      });
      throw error;
    }

    try {
      const { data, error } = await this.client!.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        this.updateAuthState({
          ...this.authState,
          error: error.message
        });
        throw error;
      }

      // Update state with authenticated user
      if (data.user) {
        this.updateAuthState({
          user: data.user,
          session: data.session,
          isAuthenticated: !!data.session,
          isLoading: false,
          error: null
        });
      }

      return data;
    } catch (error) {
      console.error('Sign in error:', error);
      // Handle the specific DOMException for aborted operations
      const errorMessage = error instanceof DOMException ?
        'Sign in operation failed. Please check your connection and try again.' :
        (error as Error).message;

      this.updateAuthState({
        ...this.authState,
        error: errorMessage
      });
      throw error;
    }
  }

  public async signInWithGoogle() {
    if (!this.isConfigured) {
      const error = new Error('Authentication is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
      this.updateAuthState({
        ...this.authState,
        error: error.message
      });
      throw error;
    }

    try {
      const { data, error } = await this.client!.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });

      if (error) {
        this.updateAuthState({
          ...this.authState,
          error: error.message
        });
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Google sign in error:', error);
      // Handle the specific DOMException for aborted operations
      const errorMessage = error instanceof DOMException ?
        'Google sign in operation failed. Please check your connection and try again.' :
        (error as Error).message;

      this.updateAuthState({
        ...this.authState,
        error: errorMessage
      });
      throw error;
    }
  }

  public async signOut() {
    if (!this.isConfigured) {
      console.warn('Supabase is not configured. Skipping sign out.');
      this.updateAuthState({
        user: null,
        session: null,
        isAuthenticated: false,
        isLoading: false,
        error: null
      });
      return;
    }

    try {
      await this.client!.auth.signOut();
      // State will be updated via the auth listener
    } catch (error) {
      console.error('Sign out error:', error);
      // Handle the specific DOMException for aborted operations
      const errorMessage = error instanceof DOMException ?
        'Sign out operation failed. Please check your connection and try again.' :
        (error as Error).message;

      this.updateAuthState({
        ...this.authState,
        error: errorMessage
      });
      throw error;
    }
  }

  public async resetPassword(email: string) {
    if (!this.isConfigured) {
      const error = new Error('Authentication is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
      this.updateAuthState({
        ...this.authState,
        error: error.message
      });
      throw error;
    }

    try {
      const { error } = await this.client!.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        this.updateAuthState({
          ...this.authState,
          error: error.message
        });
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      // Handle the specific DOMException for aborted operations
      const errorMessage = error instanceof DOMException ?
        'Password reset operation failed. Please check your connection and try again.' :
        (error as Error).message;

      this.updateAuthState({
        ...this.authState,
        error: errorMessage
      });
      throw error;
    }
  }

  public async updateProfile(updates: { full_name?: string; avatar_url?: string }) {
    if (!this.isConfigured) {
      const error = new Error('Authentication is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
      this.updateAuthState({
        ...this.authState,
        error: error.message
      });
      throw error;
    }

    if (!this.authState.user) {
      const error = new Error('User not authenticated');
      this.updateAuthState({
        ...this.authState,
        error: error.message
      });
      throw error;
    }

    try {
      const { data, error } = await this.client!.auth.updateUser({
        data: updates
      });

      if (error) {
        this.updateAuthState({
          ...this.authState,
          error: error.message
        });
        throw error;
      }

      // Update the user in the auth state
      this.updateAuthState({
        ...this.authState,
        user: data.user,
        error: null
      });

      return data;
    } catch (error) {
      console.error('Update profile error:', error);
      // Handle the specific DOMException for aborted operations
      const errorMessage = error instanceof DOMException ?
        'Profile update operation failed. Please check your connection and try again.' :
        (error as Error).message;

      this.updateAuthState({
        ...this.authState,
        error: errorMessage
      });
      throw error;
    }
  }

  public getCurrentUser(): User | null {
    return this.authState.user;
  }

  public isAuthenticated(): boolean {
    return this.authState.isAuthenticated;
  }

  public isLoading(): boolean {
    return this.authState.isLoading;
  }

  public getError(): string | null {
    return this.authState.error;
  }
}

export default AuthenticationService;