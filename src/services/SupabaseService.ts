import { createClient, SupabaseClient } from '@supabase/supabase-js';

class SupabaseService {
    private client: SupabaseClient | null = null;
    private isConfigured = false;

    constructor() {
        const supabaseUrl = process.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

        if (supabaseUrl && supabaseAnonKey) {
            this.client = createClient(supabaseUrl, supabaseAnonKey);
            this.isConfigured = true;
        } else {
            console.warn('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
        }
    }

    getClient(): SupabaseClient | null {
        if (!this.isConfigured) {
            console.error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
            return null;
        }
        return this.client;
    }

    // Authentication methods
    async signUp(email: string, password: string, options?: { data?: any, redirectTo?: string }) {
        if (!this.isConfigured) {
            throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
        }
        
        try {
            const response = await this.client!.auth.signUp({
                email,
                password,
                options: {
                    data: options?.data,
                    emailRedirectTo: options?.redirectTo
                }
            });
            return response;
        } catch (error) {
            console.error('Error signing up:', error);
            throw error;
        }
    }

    async signIn(email: string, password: string) {
        if (!this.isConfigured) {
            throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
        }
        
        try {
            const response = await this.client!.auth.signInWithPassword({
                email,
                password
            });
            return response;
        } catch (error) {
            console.error('Error signing in:', error);
            throw error;
        }
    }

    async signInWithOAuth(provider: 'google' | 'github' | 'gitlab' | 'bitbucket') {
        if (!this.isConfigured) {
            throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
        }
        
        try {
            const response = await this.client!.auth.signInWithOAuth({
                provider
            });
            return response;
        } catch (error) {
            console.error('Error signing in with OAuth:', error);
            throw error;
        }
    }

    async signOut() {
        if (!this.isConfigured) {
            throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
        }
        
        try {
            await this.client!.auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
            throw error;
        }
    }

    async getCurrentUser() {
        if (!this.isConfigured) {
            console.error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
            return null;
        }
        
        try {
            const { data: { user } } = await this.client!.auth.getUser();
            return user;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    async resetPassword(email: string, options?: { redirectTo?: string }) {
        if (!this.isConfigured) {
            throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
        }
        
        try {
            const response = await this.client!.auth.resetPasswordForEmail(email, {
                redirectTo: options?.redirectTo
            });
            return response;
        } catch (error) {
            console.error('Error resetting password:', error);
            throw error;
        }
    }

    // Database methods
    async insert(table: string, data: any) {
        if (!this.isConfigured) {
            throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
        }
        
        try {
            const { data: insertedData, error } = await this.client!
                .from(table)
                .insert(data)
                .select();
            
            if (error) throw error;
            return insertedData;
        } catch (error) {
            console.error(`Error inserting into ${table}:`, error);
            throw error;
        }
    }

    async select(table: string, columns = '*', filters?: { column: string; value: any }[]) {
        if (!this.isConfigured) {
            throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
        }
        
        try {
            let query = this.client!.from(table).select(columns);
            
            if (filters && filters.length > 0) {
                filters.forEach(filter => {
                    query = query.eq(filter.column, filter.value);
                });
            }
            
            const { data, error } = await query;
            
            if (error) throw error;
            return data;
        } catch (error) {
            console.error(`Error selecting from ${table}:`, error);
            throw error;
        }
    }

    async update(table: string, data: any, filters: { column: string; value: any }[]) {
        if (!this.isConfigured) {
            throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
        }
        
        try {
            let query = this.client!.from(table).update(data);
            
            filters.forEach(filter => {
                query = query.eq(filter.column, filter.value);
            });
            
            const { data: updatedData, error } = await query.select();
            
            if (error) throw error;
            return updatedData;
        } catch (error) {
            console.error(`Error updating ${table}:`, error);
            throw error;
        }
    }

    async delete(table: string, filters: { column: string; value: any }[]) {
        if (!this.isConfigured) {
            throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
        }
        
        try {
            let query = this.client!.from(table).delete();
            
            filters.forEach(filter => {
                query = query.eq(filter.column, filter.value);
            });
            
            const { error } = await query;
            
            if (error) throw error;
            return true;
        } catch (error) {
            console.error(`Error deleting from ${table}:`, error);
            throw error;
        }
    }

    // Realtime subscriptions
    subscribeToTable(
        table: string, 
        callback: (payload: any) => void,
        filters?: { column: string; value: any }[]
    ) {
        if (!this.isConfigured) {
            throw new Error('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
        }
        
        let subscription = this.client!
            .channel(`realtime-${table}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: table,
                },
                callback
            )
            .subscribe();

        return subscription;
    }
}

export default SupabaseService;