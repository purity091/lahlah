import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { AppContext as AppContextType, Task, PRDocument, DiscoveryArtifact, ChatMessage, Freelancer, TaskStatus, ProjectSector } from '../types';
import { apiService } from '../services/apiService';
import { CONTEXTS } from '../constants';

// --- Types ---
interface GlobalAnalysis {
    conflicts: { title: string; description: string; severity: 'High' | 'Medium' }[];
    strategicBrainstorm: string[];
    dailyFocus: string;
}

interface AppState {
    // Data
    contexts: AppContextType[];
    tasks: Task[];
    documents: PRDocument[];
    discoveryArtifacts: DiscoveryArtifact[];
    chatHistory: Record<string, ChatMessage[]>;
    globalAnalysis: GlobalAnalysis | null;

    // UI State
    activeContextId: string;
    isSyncing: boolean;
    loading: boolean;

    // Actions
    setActiveContextId: (id: string) => void;
    setContexts: React.Dispatch<React.SetStateAction<AppContextType[]>>;
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    setDocuments: React.Dispatch<React.SetStateAction<PRDocument[]>>;
    setDiscoveryArtifacts: React.Dispatch<React.SetStateAction<DiscoveryArtifact[]>>;
    setChatHistory: React.Dispatch<React.SetStateAction<Record<string, ChatMessage[]>>>;
    setGlobalAnalysis: React.Dispatch<React.SetStateAction<GlobalAnalysis | null>>;
    setLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

// --- Context ---
const AppStateContext = createContext<AppState | undefined>(undefined);

// --- Provider ---
export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isSyncing, setIsSyncing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [activeContextId, setActiveContextId] = useState('home');

    const [contexts, setContexts] = useState<AppContextType[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [documents, setDocuments] = useState<PRDocument[]>([]);
    const [discoveryArtifacts, setDiscoveryArtifacts] = useState<DiscoveryArtifact[]>([]);
    const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>({});
    const [globalAnalysis, setGlobalAnalysis] = useState<GlobalAnalysis | null>(null);

    // Load initial data from API
    useEffect(() => {
        const fetchData = async () => {
            setIsSyncing(true);
            try {
                const data = await apiService.fetchInitialData();
                if (data.projects && data.projects.length > 0) {
                    setContexts(data.projects);
                } else {
                    setContexts(CONTEXTS);
                }
                if (data.tasks) setTasks(data.tasks);
                if (data.documents) setDocuments(data.documents);
            } catch (e) {
                console.error('Failed to fetch initial data:', e);
                setContexts(CONTEXTS);
            } finally {
                setIsSyncing(false);
            }
        };
        fetchData();
    }, []);

    const value = useMemo(() => ({
        contexts,
        tasks,
        documents,
        discoveryArtifacts,
        chatHistory,
        globalAnalysis,
        activeContextId,
        isSyncing,
        loading,
        setActiveContextId,
        setContexts,
        setTasks,
        setDocuments,
        setDiscoveryArtifacts,
        setChatHistory,
        setGlobalAnalysis,
        setLoading,
    }), [contexts, tasks, documents, discoveryArtifacts, chatHistory, globalAnalysis, activeContextId, isSyncing, loading]);

    return (
        <AppStateContext.Provider value={value}>
            {children}
        </AppStateContext.Provider>
    );
};

// --- Hook ---
export const useAppState = (): AppState => {
    const context = useContext(AppStateContext);
    if (context === undefined) {
        throw new Error('useAppState must be used within an AppProvider');
    }
    return context;
};

// --- Selectors (Derived State Hooks) ---
export const useActiveContext = () => {
    const { contexts, activeContextId } = useAppState();
    return useMemo(() =>
        contexts.find(c => c.id === activeContextId) || contexts[0],
        [contexts, activeContextId]
    );
};

export const useActiveContextTasks = () => {
    const { tasks, activeContextId } = useAppState();
    return useMemo(() =>
        tasks.filter(t => t.contextId === activeContextId).sort((a, b) => b.createdAt - a.createdAt),
        [tasks, activeContextId]
    );
};

export const useGroupedTasks = () => {
    const activeContextTasks = useActiveContextTasks();
    return useMemo(() => {
        const today = new Date().toISOString().split('T')[0];
        return {
            today: activeContextTasks.filter(t => t.date === today),
            upcoming: activeContextTasks.filter(t => t.date !== today),
        };
    }, [activeContextTasks]);
};
