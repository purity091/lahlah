import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Rocket, TrendingUp, Briefcase, Globe, LineChart, Store, HeartPulse, User,
  Plus, CheckCircle2, Clock, Zap, ChevronLeft, ChevronRight, Settings,
  MessageSquare, Calendar as CalendarIcon, LayoutDashboard, Download,
  MoreVertical, Check, Search, Mic, Send, Loader2, Filter,
  Circle, ListTodo, Layers, RefreshCw, AlertCircle, X, Sparkles,
  ExternalLink, Share2, AlertTriangle, Lightbulb, Target, Activity, Users,
  Save, CloudOff, Menu, FileText, Timer, LogOut
} from 'lucide-react';
import CalendarView from './components/CalendarView';
import TaskRow from './components/features/tasks/TaskRow'; // Import TaskRow
import BulkTaskView from './components/BulkTaskView'; // Import BulkTaskView
import ProductDocsView from './components/ProductDocsView'; // Import ProductDocsView
import PomodoroTimer from './components/PomodoroTimer'; // Import PomodoroTimer
import ProductDiscoveryView from './components/ProductDiscoveryView'; // Import ProductDiscoveryView
import { exportTasksToICS as exportToICS } from './utils/icsUtils';
import { playSuccessSound, playErrorSound } from './utils/soundUtils';
import { CONTEXTS } from './constants';
import { AppContext, Task, Priority, TaskStatus, ChatMessage, PRDocument, DiscoveryArtifact, Freelancer, ProjectSector, CustomCategory, DEFAULT_CATEGORIES } from './types';
import { OpenAIService } from './services/openaiService';
import { apiService } from './services/apiService';
import { useAuth } from './services/AuthService';
import * as XLSX from 'xlsx';

const ICON_MAP: Record<string, any> = {
  Rocket, TrendingUp, Briefcase, Globe, LineChart, Store, HeartPulse, User, LayoutDashboard,
  FileText: MoreVertical, // Quick fix for icon
  Compass: Search
};

const aiService = new OpenAIService();

interface GlobalAnalysis {
  conflicts: { title: string; description: string; severity: string }[];
  missedOpportunities: string[];
  strategicBrainstorm: string[];
  dailyFocus: string;
}

const App: React.FC = () => {
  const auth = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeContextId, setActiveContextId] = useState(() => localStorage.getItem('activeContextId') || 'home');

  useEffect(() => {
    localStorage.setItem('activeContextId', activeContextId);
  }, [activeContextId]);

  // Initialize from constants, then try to load from API
  const [contexts, setContexts] = useState<AppContext[]>(CONTEXTS);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [documents, setDocuments] = useState<PRDocument[]>([]);

  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setIsSyncing(true);
      setInitError(null);
      try {
        const data = await apiService.fetchInitialData();
        if (data.projects && data.projects.length > 0) {
          setContexts(data.projects);
        } else {
          setContexts(CONTEXTS);
        }
        if (data.tasks) setTasks(data.tasks);
        if (data.documents) setDocuments(data.documents);
      } catch (e: any) {
        console.error('Initialization Failed:', e);
        setInitError(e.message || 'فشل الاتصال بالخادم. تأكد من تشغيل npm run dev:all');
        // Fallback to local data so app still opens
        setContexts(CONTEXTS);
      } finally {
        setIsSyncing(false);
      }
    };
    fetchData();
  }, []);

  // Error handling moved to end of render to avoid Hook violation

  // Manual Save Function
  const handleManualSave = async (silent = false) => {
    setIsSyncing(true);
    setSaveError(null);
    try {
      // Send all current critical data to backend for bulk sync
      await apiService.syncAll(contexts, tasks, documents);

      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      if (!silent) playSuccessSound();
    } catch (e) {
      console.error('Save failed:', e);
      setSaveError('فشل الحفظ');
      if (!silent) playErrorSound();
    } finally {
      setIsSyncing(false);
    }
  };

  // Auto-save: Mark changes when data mutates
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // Mark that there are unsaved changes (though individual ops already save)
    setHasUnsavedChanges(true);

    // Debounced auto-save after 3 seconds of no changes
    const autoSaveTimer = setTimeout(() => {
      if (hasUnsavedChanges) {
        handleManualSave(true); // Silent auto-save
      }
    }, 3000);

    return () => clearTimeout(autoSaveTimer);
  }, [tasks, contexts, documents]);

  // Fetch categories when switching context
  useEffect(() => {
    if (activeContextId !== 'home') {
      apiService.getCategories(activeContextId).then(cats => {
        setContexts(prev => prev.map(c =>
          c.id === activeContextId ? { ...c, customCategories: cats } : c
        ));
      }).catch(err => console.error('Failed to fetch categories:', err));
    }
  }, [activeContextId]);

  const [discoveryArtifacts, setDiscoveryArtifacts] = useState<DiscoveryArtifact[]>([]);
  const [loading, setLoading] = useState(false);
  const [globalAnalysis, setGlobalAnalysis] = useState<GlobalAnalysis | null>(null);
  const [analyzingGlobal, setAnalyzingGlobal] = useState(false);

  // Edit Mode State
  const [isEditingContext, setIsEditingContext] = useState(false);
  const [editedContext, setEditedContext] = useState<Partial<AppContext>>({});

  // RICE Modal State
  const [riceTask, setRiceTask] = useState<Task | null>(null);
  const [tempRice, setTempRice] = useState({ reach: 5, impact: 1, confidence: 80, effort: 1 });

  // PRD Generator State
  const [showPRDModal, setShowPRDModal] = useState(false);
  const [prdInput, setPrdInput] = useState({ title: '', description: '' });
  const [isGeneratingPRD, setIsGeneratingPRD] = useState(false);

  // Discovery Generator State
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false);
  const [discoveryInput, setDiscoveryInput] = useState({ type: 'Interview' as 'Interview' | 'Experiment', focus: '' });
  const [isGeneratingDiscovery, setIsGeneratingDiscovery] = useState(false);

  // Copy Preview State
  const [showCopyPreviewModal, setShowCopyPreviewModal] = useState(false);
  const [copyPreviewData, setCopyPreviewData] = useState('');

  // Progress Update Message State
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');

  // Categories Management State
  const [showCategoriesModal, setShowCategoriesModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('bg-blue-500');

  // Team/Freelancer State
  const [showFreelancerModal, setShowFreelancerModal] = useState(false);
  const [freelancerInput, setFreelancerInput] = useState<Partial<Freelancer>>({ sector: 'Other', status: 'Active' });
  const [editingFreelancer, setEditingFreelancer] = useState<Freelancer | null>(null);

  const handleUpdateFreelancer = async (updatedFreelancer: Freelancer) => {
    // Update local state
    setContexts(prev => prev.map(ctx => {
      if (ctx.id === activeContextId && ctx.freelancers) {
        return {
          ...ctx,
          freelancers: ctx.freelancers.map(f =>
            f.id === updatedFreelancer.id ? updatedFreelancer : f
          )
        };
      }
      return ctx;
    }));

    // Update backend
    try {
      await apiService.updateFreelancer(updatedFreelancer, activeContextId);
    } catch (e) {
      console.error('Failed to update freelancer', e);
    }

    setEditingFreelancer(null);
  };

  const handleDeleteFreelancer = async (freelancerId: string) => {
    if (!confirm('هل تريد حذف هذا العضو من الفريق؟')) return;

    // Remove from local state
    setContexts(prev => prev.map(ctx => {
      if (ctx.id === activeContextId && ctx.freelancers) {
        return {
          ...ctx,
          freelancers: ctx.freelancers.filter(f => f.id !== freelancerId)
        };
      }
      return ctx;
    }));

    // Remove from backend
    try {
      await apiService.deleteFreelancer(freelancerId, activeContextId);
    } catch (e) {
      console.error('Failed to delete freelancer', e);
    }
  };

  // Sub-Projects State
  const [expandedProjectIds, setExpandedProjectIds] = useState<string[]>([]);
  const [subProjectModal, setSubProjectModal] = useState<{ show: boolean, parentId: string | null }>({ show: false, parentId: null });
  const [newSubProjectName, setNewSubProjectName] = useState('');
  const [newSubProjectSector, setNewSubProjectSector] = useState<ProjectSector>('Other');

  // Mobile Sidebar State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Task Editing
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const handleUpdateTask = async (task: Task) => {
    // Update local state
    setTasks(prev => prev.map(t => t.id === task.id ? task : t));

    // Save to backend
    try {
      await apiService.updateTask(task);
      setEditingTask(null);
    } catch (e) {
      console.error('Failed to update task', e);
      // Revert or show error could be added here
    }
  };

  // Product Docs Handlers
  const handleUpdateDoc = async (updatedDoc: PRDocument) => {
    setDocuments(prev => {
      const next = prev.map(d => d.id === updatedDoc.id ? updatedDoc : d);
      apiService.syncAll(contexts, tasks, next)
        .then(() => {
          setLastSaved(new Date());
          setHasUnsavedChanges(false);
        })
        .catch(console.error);
      return next;
    });
  };

  const handleCreateDoc = async (newDoc: PRDocument) => {
    try {
      await apiService.createDocument(newDoc);
      setDocuments(prev => [newDoc, ...prev]);
      setLastSaved(new Date());
      playSuccessSound();
    } catch (e) {
      console.error(e);
      playErrorSound();
    }
  };

  const handleDeleteDoc = async (docId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذه الوثيقة؟')) return;

    // Update local state
    setDocuments(prev => prev.filter(d => d.id !== docId));

    // Delete from database
    try {
      await apiService.deleteDocument(docId);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (e) {
      console.error('Failed to delete document', e);
    }
  };

  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>({});
  const [message, setMessage] = useState('');
  const [showChat, setShowChat] = useState(false);
  const [currentView, setCurrentView] = useState<'tasks' | 'calendar' | 'docs' | 'discovery' | 'export' | 'sheets' | 'team' | 'bulk'>(() => (localStorage.getItem('currentView') as any) || 'tasks');

  useEffect(() => {
    localStorage.setItem('currentView', currentView);
  }, [currentView]);


  // Quick Add & Suggestions States
  const [quickInput, setQuickInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [parsingTask, setParsingTask] = useState(false);
  const [suggestions, setSuggestions] = useState<Task[]>([]);
  const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);
  // Sidebar Toggles
  const [expandedGroups, setExpandedGroups] = useState({ projects: true, personal: true });
  const recognitionRef = useRef<any>(null);

  // Fallback context when contexts array is empty
  const fallbackContext: AppContext = CONTEXTS[0];

  const activeContext = useMemo(() =>
    contexts.find(c => c.id === activeContextId) || contexts[0] || fallbackContext,
    [activeContextId, contexts]
  );

  const activeContextTasks = useMemo(() =>
    tasks.filter(t => t.contextId === activeContextId)
      .sort((a, b) => b.createdAt - a.createdAt),
    [tasks, activeContextId]
  );

  // Group tasks for better UI organization
  const groupedTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return {
      today: activeContextTasks.filter(t => t.date === today),
      upcoming: activeContextTasks.filter(t => t.date !== today)
    };
  }, [activeContextTasks]);

  // Helper to get priority badge styles
  const getPriorityBadge = (priority: Priority) => {
    const colors: Record<string, string> = {
      [Priority.HIGH]: 'bg-red-50 text-red-600 border-red-100',
      [Priority.MEDIUM]: 'bg-orange-50 text-orange-600 border-orange-100',
      [Priority.LOW]: 'bg-emerald-50 text-emerald-600 border-emerald-100',
    };
    return (
      <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md border ${colors[priority] || 'bg-slate-50 text-slate-600 border-slate-100'}`}>
        {priority}
      </span>
    );
  };

  useEffect(() => {
    // Close mobile menu on context change
    setIsMobileMenuOpen(false);
  }, [activeContextId]);

  // Trigger global analysis when landing on Home or tasks update
  useEffect(() => {
    if (activeContextId === 'home' && tasks.length > 0) {
      handleGlobalAnalysis();
    }
  }, [activeContextId, tasks.length]);

  // Initialize Speech Recognition

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = 'ar-SA';
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuickInput(transcript);
        setIsListening(false);
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleGlobalAnalysis = async () => {
    setAnalyzingGlobal(true);
    const analysis = await aiService.analyzeGlobalStrategy(tasks);
    if (analysis) setGlobalAnalysis(analysis);
    setAnalyzingGlobal(false);
  };

  const handleAutoGenerate = async () => {
    setLoading(true);
    const newTasks = await aiService.generateTasks(activeContext, '');
    const tasksWithMetadata = newTasks.map((t: any) => ({
      ...t,
      contextId: activeContextId,
      status: TaskStatus.TODO,
      createdAt: Date.now()
    }));
    setTasks(prev => [...prev, ...tasksWithMetadata]);

    // Persist all generated tasks
    try {
      await Promise.all(tasksWithMetadata.map((t: Task) => apiService.createTask(t)));
    } catch (e) { console.error('Failed to save generated tasks', e); }

    setLoading(false);
  };

  const handleQuickAdd = async (inputStr: string) => {
    const textToProcess = inputStr || quickInput;
    if (!textToProcess.trim()) return;

    // Detect JSON input (starts with [ or {)
    const trimmedInput = textToProcess.trim();
    if (trimmedInput.startsWith('[') || trimmedInput.startsWith('{')) {
      try {
        let jsonData = JSON.parse(trimmedInput);

        // Normalize to array
        if (!Array.isArray(jsonData)) {
          jsonData = [jsonData];
        }

        // Map JSON to Task structure
        const importedTasks: Task[] = jsonData.map((item: any) => ({
          id: item.id || Math.random().toString(36).substr(2, 9),
          title: item.title || item.summary || item.name || 'مهمة مستوردة',
          category: item.category || 'Quick Win',
          priority: item.priority || Priority.MEDIUM,
          status: item.status || TaskStatus.TODO,
          date: item.date || new Date().toISOString().split('T')[0],
          suggestedTime: item.suggestedTime || item.time || '09:00 AM',
          duration: item.duration || '1h',
          rationale: item.rationale || item.description || '',
          contextId: activeContextId,
          completed: item.completed || false,
          createdAt: item.createdAt || Date.now(),
          rice: item.rice || {},
          freelancerId: item.freelancerId || item.assignee || null
        }));

        // Add to state
        setTasks(prev => [...importedTasks, ...prev]);

        // Persist to database
        try {
          await Promise.all(importedTasks.map(t => apiService.createTask(t)));
        } catch (e) { console.error('Failed to save imported tasks', e); }

        setQuickInput('');
        alert(`✅ تم استيراد ${importedTasks.length} مهمة بنجاح من JSON!`);
        return;
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        // Not valid JSON, continue with AI parsing
      }
    }

    // Default: AI parsing
    setParsingTask(true);
    const structuredSuggestions = await aiService.parseQuickTask(textToProcess, activeContext.name);
    if (structuredSuggestions && structuredSuggestions.length > 0) {
      setSuggestions(structuredSuggestions.map(s => ({
        ...s,
        contextId: activeContextId,
        status: TaskStatus.TODO,
        createdAt: Date.now()
      })));
    }
    setParsingTask(false);
  };

  const approveSuggestion = async (suggestionId: string) => {
    const taskToAdd = suggestions.find(s => s.id === suggestionId);
    if (taskToAdd) {
      setTasks(prev => [taskToAdd, ...prev]);

      try {
        await apiService.createTask(taskToAdd);
      } catch (e) { console.error(e); }

      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      if (suggestions.length === 1) setQuickInput('');
    }
  };

  const rejectSuggestion = (suggestionId: string) => {
    setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
    if (suggestions.length === 1) setQuickInput('');
  };

  const handleSaveRiceScore = async () => {
    if (!riceTask) return;
    const score = (tempRice.reach * tempRice.impact * (tempRice.confidence / 100)) / tempRice.effort;

    const updatedTask = { ...riceTask, rice: { ...tempRice, score } };

    setTasks(prev => prev.map(t =>
      t.id === riceTask.id ? updatedTask : t
    ));

    try {
      await apiService.updateTask(updatedTask);
    } catch (e) { console.error(e); }

    setRiceTask(null);
    setTempRice({ reach: 5, impact: 1, confidence: 80, effort: 1 }); // Reset defaults
  };

  const handleGeneratePRD = async () => {
    setIsGeneratingPRD(true);
    const prdContent = await aiService.generatePRD(activeContext, prdInput.title, prdInput.description);

    if (prdContent) {
      const newDoc: PRDocument = {
        id: Math.random().toString(36).substr(2, 9),
        title: prdInput.title,
        contextId: activeContextId,
        type: 'PRD',
        content: prdContent,
        createdAt: Date.now()
      };
      setDocuments(prev => [newDoc, ...prev]);
      apiService.createDocument(newDoc).catch(console.error);
      setShowPRDModal(false);
      setPrdInput({ title: '', description: '' });
    }
    setIsGeneratingPRD(false);
  };

  const handleGenerateDiscovery = async () => {
    setIsGeneratingDiscovery(true);
    const result = await aiService.generateDiscoveryArtifact(activeContext, discoveryInput.type, discoveryInput.focus);
    if (result) {
      const newArtifact: DiscoveryArtifact = {
        id: Math.random().toString(36).substr(2, 9),
        contextId: activeContextId,
        type: discoveryInput.type,
        title: discoveryInput.focus,
        content: result,
        createdAt: Date.now()
      };
      setDiscoveryArtifacts(prev => [newArtifact, ...prev]);
      setShowDiscoveryModal(false);
      setDiscoveryInput({ ...discoveryInput, focus: '' });
    }
    setIsGeneratingDiscovery(false);
  };

  const handleExportToJira = () => {
    const jiraData = activeContextTasks.map(task => ({
      summary: task.title,
      description: task.rationale,
      priority: task.priority,
      category: task.category,
      status: task.status,
      rice_score: task.rice?.score || 0,
      rice_reach: task.rice?.reach || 0,
      rice_impact: task.rice?.impact || 0,
      rice_confidence: task.rice?.confidence || 0,
      rice_effort: task.rice?.effort || 0,
      context: activeContext.name
    }));

    const blob = new Blob([JSON.stringify(jiraData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeContext.name}_jira_product_discovery.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportToSheets = () => {
    const workbook = XLSX.utils.book_new();

    // 1. Dashboard Sheet
    const contextTasks = activeContextTasks;
    const completedTasks = contextTasks.filter(t => t.status === TaskStatus.DONE).length;
    const pendingTasks = contextTasks.length - completedTasks;
    const avgRice = contextTasks.length ? contextTasks.reduce((acc, t) => acc + (t.rice?.score || 0), 0) / contextTasks.length : 0;

    const dashboardData = [
      ["لوحة تحكم المشروع (Project Dashboard)", ""],
      ["المشروع (Project)", activeContext.name],
      ["المرحلة الحالية (Phase)", activeContext.currentPhase || "N/A"],
      ["", ""],
      ["إحصائيات (Metrics)", "Values"],
      ["إجمالي المهام (Total Tasks)", contextTasks.length],
      ["مهام مكتملة (Completed)", completedTasks],
      ["مهام معلقة (Pending)", pendingTasks],
      ["نسبة الإنجاز (Progress %)", `${Math.round((completedTasks / contextTasks.length || 0) * 100)}%`],
      ["متوسط نقاط RICE", Math.round(avgRice)],
      ["", ""],
      ["الأهداف الاستراتيجية (Strategic Goals)", ""],
      ...(Array.isArray(activeContext.strategicGoals) ? activeContext.strategicGoals.map(g => [g, ""]) : [])
    ];
    const dashboardWS = XLSX.utils.aoa_to_sheet(dashboardData);
    XLSX.utils.book_append_sheet(workbook, dashboardWS, "Dashboard");

    // 2. Tasks Sheet
    const taskHeaders = [
      "Task Title", "Priority", "Status", "Category",
      "Reach", "Impact", "Confidence", "Effort", "RICE Score",
      "Rationale", "Date", "Duration"
    ];
    const taskRows = contextTasks.map(t => [
      t.title, t.priority, t.status, t.category,
      t.rice?.reach || 0, t.rice?.impact || 0, t.rice?.confidence || 0, t.rice?.effort || 0, t.rice?.score || 0,
      t.rationale, t.date, t.duration
    ]);
    const taskWS = XLSX.utils.aoa_to_sheet([taskHeaders, ...taskRows]);
    XLSX.utils.book_append_sheet(workbook, taskWS, "Tasks List");

    // 3. PRDs Sheet
    const prdHeaders = ["Document Title", "Problem Statement", "Goals", "Key User Stories", "Tech Notes", "Created At"];
    const prdRows = documents.filter(d => d.contextId === activeContextId).map(d => [
      d.title,
      d.content.problemStatement,
      d.content.goals.join(" | "),
      d.content.userStories.join(" | "),
      d.content.techNotes,
      new Date(d.createdAt).toLocaleDateString()
    ]);
    const prdWS = XLSX.utils.aoa_to_sheet([prdHeaders, ...prdRows]);
    XLSX.utils.book_append_sheet(workbook, prdWS, "Product Docs (PRDs)");

    // 4. Discovery Sheet
    const discoveryHeaders = ["Focus Area", "Type", "Target Audience", "Objectives", "Success Criteria", "Questions/Steps"];
    const discoveryRows = discoveryArtifacts.filter(a => a.contextId === activeContextId).map(a => [
      a.title,
      a.type,
      a.content.targetAudience,
      a.content.objectives.join(" | "),
      a.content.successCriteria?.join(" | ") || "N/A",
      a.content.questionsOrSteps.join(" | ")
    ]);
    const discoveryWS = XLSX.utils.aoa_to_sheet([discoveryHeaders, ...discoveryRows]);
    XLSX.utils.book_append_sheet(workbook, discoveryWS, "Discovery Plan");

    // Save File
    XLSX.writeFile(workbook, `${activeContext.name}_Full_Report.xlsx`);
  };

  const handleCopyTasksToClipboard = () => {
    const headers = ["Title", "Priority", "Status", "Category", "RICE Score", "Reach", "Impact", "Confidence", "Effort", "Rationale", "Date", "Duration", "Context", "Phase", "Strategic Goals"];
    const rows = activeContextTasks.map(t => [
      t.title,
      t.priority,
      t.status,
      t.category,
      t.rice?.score || 0,
      t.rice?.reach || 0,
      t.rice?.impact || 0,
      t.rice?.confidence || 0,
      t.rice?.effort || 0,
      t.rationale,
      t.date,
      t.duration,
      activeContext.name,
      activeContext.currentPhase || "N/A",
      Array.isArray(activeContext.strategicGoals) ? activeContext.strategicGoals.join(" | ") : "N/A"
    ]);
    const tsvContent = [headers.join("\t"), ...rows.map(r => r.join("\t"))].join("\n");
    setCopyPreviewData(tsvContent);
    setShowCopyPreviewModal(true);
  };

  const handleGenerateProgressMessage = () => {
    const contextTasks = activeContextTasks;
    const todoCount = contextTasks.filter(t => t.status === TaskStatus.TODO).length;
    const draftCount = contextTasks.filter(t => t.status === TaskStatus.DRAFT).length;
    const inProgressCount = contextTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length;
    const reviewCount = contextTasks.filter(t => t.status === TaskStatus.REVIEW).length;
    const doneCount = contextTasks.filter(t => t.status === TaskStatus.DONE).length;
    const totalTasks = contextTasks.length;
    const progressPercent = totalTasks > 0 ? Math.round((doneCount / totalTasks) * 100) : 0;

    const today = new Date();
    const formattedDate = today.toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const formattedTime = today.toLocaleTimeString('ar-SA', {
      hour: '2-digit',
      minute: '2-digit'
    });

    // Get in-progress tasks (prioritize high priority)
    const inProgressTasks = contextTasks
      .filter(t => t.status === TaskStatus.IN_PROGRESS)
      .sort((a, b) => {
        const priorityOrder = { [Priority.HIGH]: 0, [Priority.MEDIUM]: 1, [Priority.LOW]: 2 };
        return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      })
      .slice(0, 4)
      .map((t, i) => `   ${i + 1}. ${t.title}`)
      .join('\n');

    // Get recently completed tasks
    const completedTasks = contextTasks
      .filter(t => t.status === TaskStatus.DONE)
      .slice(0, 3)
      .map((t, i) => `   ${i + 1}. ${t.title}`)
      .join('\n');

    // Get TODO tasks (next up)
    const upcomingTasks = contextTasks
      .filter(t => t.status === TaskStatus.TODO)
      .sort((a, b) => {
        const priorityOrder = { [Priority.HIGH]: 0, [Priority.MEDIUM]: 1, [Priority.LOW]: 2 };
        return (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      })
      .slice(0, 3)
      .map((t, i) => `   ${i + 1}. ${t.title}`)
      .join('\n');

    // Progress bar RTL friendly
    const filledBlocks = Math.floor(progressPercent / 10);
    const emptyBlocks = 10 - filledBlocks;
    const progressBar = '▓'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);

    // Status emoji based on progress
    const statusEmoji = progressPercent >= 80 ? '🚀' : progressPercent >= 50 ? '📈' : progressPercent >= 25 ? '🔄' : '🏁';
    const statusText = progressPercent >= 80 ? 'في المراحل النهائية' : progressPercent >= 50 ? 'تقدم جيد' : progressPercent >= 25 ? 'قيد التنفيذ' : 'في البداية';

    const message = `السلام عليكم ورحمة الله وبركاته،

أرفق لكم تقرير متابعة تقدم المشروع:

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

📋 تقرير متابعة المشروع

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

🏷️ اسم المشروع: ${activeContext.name}
📅 تاريخ التقرير: ${formattedDate}
🕐 وقت التقرير: ${formattedTime}

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

${statusEmoji} حالة المشروع: ${statusText}

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

📊 نسبة الإنجاز: ${progressPercent}%
[${progressBar}]

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

📈 إحصائيات المهام:

   • إجمالي المهام: ${totalTasks} مهمة
   • مسودة: ${draftCount} مهمة
   • قيد الانتظار: ${todoCount} مهمة
   • قيد التنفيذ: ${inProgressCount} مهمة
   • في المراجعة: ${reviewCount} مهمة
   • مكتملة: ${doneCount} مهمة

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
${inProgressCount > 0 ? `
🔄 المهام الجارية حالياً:

${inProgressTasks}

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
` : ''}${doneCount > 0 ? `
✅ آخر الإنجازات:

${completedTasks}

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
` : ''}${todoCount > 0 ? `
📌 المهام القادمة:

${upcomingTasks}

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬
` : ''}
💡 ملاحظات:
   يسير العمل وفق الخطة الموضوعة، وسيتم إبلاغكم بأي مستجدات.

▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬

مع أطيب التحيات،
فريق العمل

📎 تم إنشاء هذا التقرير آلياً بواسطة LahlahOS`.trim();

    setProgressMessage(message);
    setShowProgressModal(true);
  };

  const handleAddFreelancer = async () => {
    if (!freelancerInput.name || !freelancerInput.role) return;

    const newFreelancer: Freelancer = {
      id: Math.random().toString(36).substr(2, 9),
      name: freelancerInput.name,
      role: freelancerInput.role,
      sector: freelancerInput.sector as any || 'Other',
      status: 'Active',
      rate: freelancerInput.rate,
      contact: freelancerInput.contact
    };

    setContexts(prev => prev.map(c => {
      if (c.id === activeContextId) {
        return { ...c, freelancers: [...(c.freelancers || []), newFreelancer] };
      }
      return c;
    }));

    try {
      await apiService.addFreelancer(newFreelancer, activeContextId);
    } catch (e) {
      console.error('API Error', e);
    }

    setShowFreelancerModal(false);
    setFreelancerInput({ sector: 'Other', status: 'Active' });
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) return;

    const newCategory: CustomCategory = {
      id: Math.random().toString(36).substr(2, 9),
      name: newCategoryName,
      color: newCategoryColor
    };

    setContexts(prev => prev.map(c => {
      if (c.id === activeContextId) {
        return {
          ...c,
          customCategories: [...(c.customCategories || []), newCategory]
        };
      }
      return c;
    }));

    try {
      await apiService.addCategory(newCategory, activeContextId);
    } catch (e) {
      console.error('Failed to add category', e);
      playErrorSound();
    }

    setNewCategoryName('');
    setNewCategoryColor('bg-blue-500');
  };

  const handleDeleteCategory = async (categoryId: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا التصنيف؟')) return;

    setContexts(prev => prev.map(c => {
      if (c.id === activeContextId) {
        return {
          ...c,
          customCategories: (c.customCategories || []).filter(cat => cat.id !== categoryId)
        };
      }
      return c;
    }));

    try {
      await apiService.deleteCategory(categoryId);
    } catch (e) {
      console.error('Failed to delete category', e);
      playErrorSound();
    }
  };

  const handleCreateSubProject = async () => {
    if (!subProjectModal.parentId || !newSubProjectName.trim()) return;

    const parent = contexts.find(c => c.id === subProjectModal.parentId);
    const newContext: AppContext = {
      id: `sub-${Math.random().toString(36).substr(2, 6)}`,
      name: newSubProjectName,
      description: `Sub-project of ${parent?.name}`,
      icon: parent?.icon as any || 'Layers',
      color: parent?.color || 'bg-slate-500',
      group: 'projects',
      parentId: subProjectModal.parentId,
      sector: newSubProjectSector,
    };

    setContexts(prev => [...prev, newContext]);

    try {
      await apiService.createProject(newContext);
    } catch (e) {
      console.error('API Error', e);
    }

    setSubProjectModal({ show: false, parentId: null });
    setNewSubProjectName('');
    setNewSubProjectSector('Other');

    // Auto expand parent
    if (subProjectModal.parentId && !expandedProjectIds.includes(subProjectModal.parentId)) {
      setExpandedProjectIds(prev => [...prev, subProjectModal.parentId!]);
    }
  };

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  const toggleListening = async () => {
    if (isListening) {
      // STOP RECORDING
      setIsListening(false);

      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      }
      return;
    }

    // START RECORDING
    if (recognitionRef.current) {
      // Use efficient native Speech Recognition (Chrome/Edge)
      try {
        setIsListening(true);
        recognitionRef.current.start();
      } catch (err) {
        console.error("Failed to start speech recognition:", err);
        setIsListening(false);
      }
    } else {
      // Use MediaRecorder (Firefox/Others) + Whisper API
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("عذراً، متصفحك لا يدعم تسجيل الصوت.");
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = async () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const audioFile = new File([audioBlob], "recording.webm", { type: 'audio/webm' });

          setParsingTask(true); // Show loading state while transcribing
          const transcript = await aiService.transcribeAudio(audioFile);
          setQuickInputAttribute(transcript);
          setParsingTask(false);
        };

        mediaRecorder.start();
        setIsListening(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("لم نتمكن من الوصول إلى الميكروفون. يرجى التحقق من الصلاحيات.");
      }
    }
  };

  // Helper to safely set state to avoid closure staleness issues if needed, 
  // though simple setQuickInput is fine here.
  const setQuickInputAttribute = (text: string) => {
    setQuickInput(prev => (prev ? prev + " " + text : text).trim());
  };

  const toggleTaskStatus = (taskId: string) => {
    let updatedTask: Task | undefined;
    setTasks(prev => prev.map(t => {
      if (t.id === taskId) {
        const nextStatus = t.status === TaskStatus.DONE ? TaskStatus.TODO : TaskStatus.DONE;
        const u = { ...t, status: nextStatus, completed: nextStatus === TaskStatus.DONE };
        updatedTask = u;
        return u;
      }
      return t;
    }));

    if (updatedTask) {
      apiService.updateTask(updatedTask).catch(console.error);
    }
  };

  // Kanban Drag & Drop Handler
  const handleKanbanDrop = (newStatus: TaskStatus) => {
    if (!draggingTaskId) return;

    const task = tasks.find(t => t.id === draggingTaskId);
    if (!task || task.status === newStatus) {
      setDraggingTaskId(null);
      return;
    }

    const updatedTask = {
      ...task,
      status: newStatus,
      completed: newStatus === TaskStatus.DONE
    };

    setTasks(prev => prev.map(t => t.id === draggingTaskId ? updatedTask : t));
    apiService.updateTask(updatedTask).catch(console.error);
    setDraggingTaskId(null);
  };

  const syncToGoogleCalendar = (task: Task) => {
    const [year, month, day] = task.date.split('-').map(Number);
    const [timePart, ampm] = (task.suggestedTime || "09:00 AM").split(' ');
    let [hours, minutes] = (timePart || "09:00").split(':').map(Number);
    if (ampm === 'PM' && hours < 12) hours += 12;
    if (ampm === 'AM' && hours === 12) hours = 0;
    const startDate = new Date(year, month - 1, day, hours, minutes);
    const endDate = new Date(startDate.getTime() + 60 * 60 * 1000);
    const formatGDate = (date: Date) => date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const baseUrl = "https://www.google.com/calendar/render?action=TEMPLATE";
    const detailsText = `${task.rationale}\n\nسياق المشروع: ${activeContext.name}\nتصنيف: ${task.category}`;
    const params = new URLSearchParams({
      text: task.title,
      dates: `${formatGDate(startDate)}/${formatGDate(endDate)}`,
      details: detailsText,
      sf: "true",
      output: "xml"
    });
    window.open(`${baseUrl}&${params.toString()}`, '_blank');
  };

  const exportTasksToICS = (tasksToExport: Task[]) => {
    exportToICS(tasksToExport, activeContext.name);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: message, timestamp: Date.now() };
    const currentChat = chatHistory[activeContextId] || [];
    const newHistory = [...currentChat, userMsg];
    setChatHistory(prev => ({ ...prev, [activeContextId]: newHistory }));

    // Save User Msg
    apiService.saveChatMessage(activeContextId, userMsg).catch(console.error);

    setMessage('');
    setLoading(true);
    const response = await aiService.getChatResponse(activeContext, newHistory.map(h => ({ role: h.role, content: h.content })), message);
    const aiMsg: ChatMessage = { role: 'model', content: response, timestamp: Date.now() };
    setChatHistory(prev => ({ ...prev, [activeContextId]: [...newHistory, aiMsg] }));

    // Save AI Msg
    apiService.saveChatMessage(activeContextId, aiMsg).catch(console.error);

    setLoading(false);
  };

  const renderHomeView = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todaysTasks = tasks.filter(t => t.date === todayStr);
    const doneCount = todaysTasks.filter(t => t.status === TaskStatus.DONE).length;

    return (
      <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Hero Section */}
        <section className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <LayoutDashboard className="w-40 h-40" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h2 className="text-3xl font-black mb-2">مرحباً محمد</h2>
              <p className="text-slate-400 text-sm font-medium">إليك النظرة الاستراتيجية الشاملة ليومك ومشاريعك.</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-slate-800/50 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 text-center min-w-[100px]">
                <p className="text-[10px] uppercase font-black text-slate-500 mb-1">إنجاز اليوم</p>
                <p className="text-2xl font-black text-emerald-400">{doneCount} / {todaysTasks.length}</p>
              </div>
              <div className="bg-slate-800/50 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 text-center min-w-[100px]">
                <p className="text-[10px] uppercase font-black text-slate-500 mb-1">المشاريع</p>
                <p className="text-2xl font-black text-blue-400">{contexts.length - 1}</p>
              </div>
            </div>
          </div>

          {globalAnalysis?.dailyFocus && (
            <div className="mt-8 bg-white/5 border border-white/10 p-4 rounded-xl flex items-center gap-4">
              <div className="bg-amber-500 p-2 rounded-lg"><Target className="w-5 h-5 text-white" /></div>
              <p className="text-sm font-bold">{globalAnalysis.dailyFocus}</p>
            </div>
          )}
        </section>

        {/* Strategic Analysis Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Conflicts & Warnings */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                <h3 className="font-black text-slate-800">تنبيهات وتعارضات</h3>
              </div>
              {analyzingGlobal && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
            </div>

            <div className="space-y-4">
              {globalAnalysis?.conflicts.length ? globalAnalysis.conflicts.map((c, i) => (
                <div key={i} className={`p-4 rounded-2xl border ${c.severity === 'High' ? 'bg-red-50 border-red-100' : 'bg-orange-50 border-orange-100'} animate-in fade-in duration-300`}>
                  <h4 className={`text-sm font-black mb-1 ${c.severity === 'High' ? 'text-red-700' : 'text-orange-700'}`}>{c.title}</h4>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">{c.description}</p>
                </div>
              )) : (
                <div className="text-center py-10">
                  <CheckCircle2 className="w-10 h-10 text-emerald-200 mx-auto mb-3" />
                  <p className="text-xs text-slate-400 font-bold">لا يوجد تعارضات استراتيجية حالياً</p>
                </div>
              )}
            </div>
          </section>

          {/* Strategic Brainstorming */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Lightbulb className="w-5 h-5 text-amber-500" />
              <h3 className="font-black text-slate-800">عصف ذهني استراتيجي</h3>
            </div>

            <div className="space-y-3">
              {globalAnalysis?.strategicBrainstorm.map((idea, i) => (
                <div key={i} className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-blue-200 transition-all">
                  <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-black text-blue-600 flex-shrink-0">{i + 1}</div>
                  <p className="text-xs font-bold text-slate-700 leading-relaxed">{idea}</p>
                </div>
              ))}
              {!globalAnalysis && <div className="h-40 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-slate-200" /></div>}
            </div>
          </section>

          {/* Missed Opportunities */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Search className="w-5 h-5 text-blue-500" />
              <h3 className="font-black text-slate-800">نقاط قد تغفل عنها</h3>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {globalAnalysis?.missedOpportunities.map((op, i) => (
                <div key={i} className="flex items-center gap-3 p-3 text-xs font-bold text-slate-600 bg-white border border-slate-100 rounded-xl hover:bg-slate-50">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                  {op}
                </div>
              ))}
            </div>
          </section>

          {/* Activity Pulse */}
          <section className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Activity className="w-5 h-5 text-emerald-500" />
              <h3 className="font-black text-slate-800">نشاط المشاريع</h3>
            </div>
            <div className="space-y-4">
              {contexts.filter(c => c.id !== 'home').map(ctx => {
                const ctxTasks = tasks.filter(t => t.contextId === ctx.id);
                const progress = ctxTasks.length ? (ctxTasks.filter(t => t.status === TaskStatus.DONE).length / ctxTasks.length) * 100 : 0;
                return (
                  <div key={ctx.id} className="space-y-2">
                    <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest text-slate-400">
                      <span>{ctx.name}</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full ${ctx.color} transition-all duration-500`} style={{ width: `${progress}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    );
  };

  // Render Helper
  const renderContextButton = (ctx: any) => {
    const IconComp = ICON_MAP[ctx.icon] || Circle; // Fallback to Circle if icon missing
    const isActive = activeContextId === ctx.id;
    return (
      <button
        key={ctx.id}
        onClick={() => setActiveContextId(ctx.id)}
        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${isActive ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
          }`}
      >
        <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-slate-900 text-white scale-110 shadow-md' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
          }`}>
          <IconComp className="w-4 h-4" />
        </div>
        <span className="text-xs font-bold">{ctx.name}</span>
        {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-slate-900" />}
      </button>
    );
  };

  // Render Sub-Project Tree Node
  const renderProjectNode = (ctx: AppContext, level = 0) => {
    const IconComp = ICON_MAP[ctx.icon] || Circle;
    const isActive = activeContextId === ctx.id;
    const children = contexts.filter(c => c.parentId === ctx.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedProjectIds.includes(ctx.id);

    return (
      <div key={ctx.id} className="w-full relative">
        <div className={`flex items-center w-full group/row relative ${isActive ? 'bg-slate-100' : 'hover:bg-slate-50'} rounded-2xl transition-all duration-200 mb-1`}>
          <div style={{ width: level * 12 }} className="shrink-0" />

          {/* Expand Toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setExpandedProjectIds(prev => prev.includes(ctx.id) ? prev.filter(id => id !== ctx.id) : [...prev, ctx.id])
            }}
            className={`p-1 w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 ${hasChildren ? 'opacity-100' : 'opacity-0'} transition-all mr-1`}
          >
            <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
          </button>

          {/* Main Click Area */}
          <button
            onClick={() => setActiveContextId(ctx.id)}
            className="flex-1 flex items-center gap-2 py-2 pr-0 pl-2 text-right"
          >
            <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-400 group-hover/row:bg-slate-200'}`}>
              <IconComp className="w-3.5 h-3.5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className={`block text-[11px] truncate ${isActive ? 'font-black text-slate-900' : 'font-bold text-slate-600'}`}>{ctx.name}</span>
              {ctx.sector && <span className="block text-[8px] font-black uppercase tracking-widest text-slate-300 truncate">{ctx.sector}</span>}
            </div>
          </button>

          {/* Add SubProject Action (Hover) */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSubProjectModal({ show: true, parentId: ctx.id });
            }}
            className="opacity-100 lg:opacity-0 lg:group-hover/row:opacity-100 p-1.5 mr-1 rounded-lg text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
            title="إضافة مشروع فرعي"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Children */}
        {isExpanded && children.length > 0 && (
          <div className="relative">
            {/* Thread Line */}
            {level === 0 && <div className="absolute top-0 bottom-2 right-[2.25rem] w-px bg-slate-200/50" />}
            {children.map(child => renderProjectNode(child, level + 1))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#f1f5f9] overflow-hidden text-slate-800 font-['IBM_Plex_Sans_Arabic']">
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <div
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-30 lg:hidden animate-in fade-in duration-200"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 flex flex-col shadow-xl lg:shadow-none lg:static lg:translate-x-0 transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h1 className="font-black text-xl tracking-tight text-slate-900">Lahlah OS</h1>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 custom-scroll">
          {/* Dashboard - Always Visible */}
          {contexts.filter(c => c.group === 'system').map(ctx => renderContextButton(ctx))}

          {/* Personal Life Group */}
          <div className="mt-4">
            <button
              onClick={() => setExpandedGroups(prev => ({ ...prev, personal: !prev.personal }))}
              className="flex items-center gap-2 w-full px-4 py-2 text-[10px] uppercase font-black text-slate-400 hover:text-slate-600 transition-colors tracking-[0.2em]"
            >
              <span className="flex-1 text-right">الحياة الشخصية</span>
              {expandedGroups.personal ? <ChevronRight className="w-3 h-3 rotate-90" /> : <ChevronLeft className="w-3 h-3" />}
            </button>

            {expandedGroups.personal && (
              <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                {contexts.filter(c => c.group === 'personal').map(ctx => renderContextButton(ctx))}
              </div>
            )}
          </div>

          {/* Projects Group */}
          <div className="mt-4">
            <button
              onClick={() => setExpandedGroups(prev => ({ ...prev, projects: !prev.projects }))}
              className="flex items-center gap-2 w-full px-4 py-2 text-[10px] uppercase font-black text-slate-400 hover:text-slate-600 transition-colors tracking-[0.2em]"
            >
              <span className="flex-1 text-right">المشاريع والعمل</span>
              {expandedGroups.projects ? <ChevronRight className="w-3 h-3 rotate-90" /> : <ChevronLeft className="w-3 h-3" />}
            </button>

            {expandedGroups.projects && (
              <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                {contexts.filter(c => c.group === 'projects' && !c.parentId).map(ctx => renderProjectNode(ctx))}
              </div>
            )}
          </div>
        </nav>

        <div className="p-6 border-t border-slate-100">
          <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200/50">
            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs font-bold shadow-sm overflow-hidden">
              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mohamed" alt="User" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-black text-slate-900 truncate">محمد لحلح</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase truncate">Software Arch / PM</p>
            </div>
            <button 
              onClick={() => auth.logout()} 
              className="p-2 text-slate-400 hover:bg-slate-200 rounded-lg transition-colors"
              title="تسجيل الخروج"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Professional Canvas */}
      <main className="flex-1 flex flex-col relative overflow-hidden bg-white">
        {/* Modern Header */}
        <header className="h-20 px-4 lg:px-10 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-20 transition-all">
          <div className="flex items-center gap-4 lg:gap-10 overflow-hidden">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -mr-2 text-slate-500 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            <div className="flex items-center gap-4 flex-shrink-0">
              <div className={`w-3 h-3 rounded-full ${activeContext.color} shadow-lg animate-pulse`} />
              <h2 className="text-base font-black text-slate-900 truncate max-w-[120px] md:max-w-none">{activeContext.name}</h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Save Button */}
            <button
              onClick={() => handleManualSave(false)}
              disabled={isSyncing}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all border shadow-sm ${hasUnsavedChanges
                ? 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                } ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{isSyncing ? 'جارٍ الحفظ...' : 'حفظ'}</span>
            </button>

            {/* Sync Status Indicator */}
            <div className="flex items-center gap-3 text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/50">
              {saveError ? (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-red-500" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-red-600">{saveError}</span>
                </>
              ) : isSyncing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span className="text-[10px] font-black uppercase tracking-widest">تحديث...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">محفوظ</span>
                    {lastSaved && (
                      <span className="text-[8px] text-slate-400">
                        {lastSaved.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Chat Button */}
            <button onClick={() => setShowChat(!showChat)} className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-500 transition-all relative border border-slate-200 shadow-sm">
              <MessageSquare className="w-5 h-5" />
              {chatHistory[activeContextId]?.length > 0 && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />}
            </button>
          </div>
        </header>

        {/* Navigation Tabs Bar */}
        <div className="w-full bg-white border-b border-slate-100 sticky top-20 z-10 px-4 lg:px-10 py-3 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-2 min-w-max">
            {activeContextId !== 'home' ? (
              <>
                <button onClick={() => setCurrentView('tasks')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${currentView === 'tasks' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>المهمات</span>
                </button>
                <button onClick={() => setCurrentView('calendar')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${currentView === 'calendar' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
                  <CalendarIcon className="w-4 h-4" />
                  <span>الجدول</span>
                </button>

                <button onClick={() => setCurrentView('team')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${currentView === 'team' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
                  <Users className="w-4 h-4" />
                  <span>الفريق</span>
                </button>
                <button onClick={() => setShowCategoriesModal(true)} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900`}>
                  <Target className="w-4 h-4" />
                  <span>التصنيفات</span>
                </button>
                <button onClick={() => setCurrentView('bulk')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${currentView === 'bulk' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
                  <Layers className="w-4 h-4" />
                  <span>تحكم جماعي</span>
                </button>
                <div className="w-px h-6 bg-slate-200 mx-2" />
                <button onClick={() => setCurrentView('docs')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${currentView === 'docs' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
                  <FileText className="w-4 h-4" />
                  <span>الوثائق (PRD)</span>
                </button>
                <button onClick={() => setCurrentView('discovery')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${currentView === 'discovery' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
                  <Sparkles className="w-4 h-4" />
                  <span>الاستكشاف</span>
                </button>
                <div className="w-px h-6 bg-slate-200 mx-2" />
                <button onClick={() => setCurrentView('sheets')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${currentView === 'sheets' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                  <ListTodo className="w-4 h-4" />
                  <span>Sheets</span>
                </button>
                <button onClick={() => setCurrentView('export')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${currentView === 'export' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>
                  <Share2 className="w-4 h-4" />
                  <span>Jira Import</span>
                </button>
                <button onClick={handleGenerateProgressMessage} className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all bg-violet-50 text-violet-600 hover:bg-violet-100">
                  <Send className="w-4 h-4" />
                  <span>رسالة متابعة</span>
                </button>
              </>
            ) : (
              <>
                <button onClick={() => setCurrentView('tasks')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${currentView === 'tasks' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
                  <LayoutDashboard className="w-4 h-4" />
                  <span>لوحة القيادة</span>
                </button>
                <button onClick={() => setCurrentView('bulk')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${currentView === 'bulk' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
                  <Layers className="w-4 h-4" />
                  <span>تحكم جماعي</span>
                </button>
                <button onClick={() => setCurrentView('calendar')} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition-all ${currentView === 'calendar' ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900'}`}>
                  <CalendarIcon className="w-4 h-4" />
                  <span>الجدول الشامل</span>
                </button>

              </>
            )}
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-10 bg-[#fafafa] custom-scroll relative">
          <div className="max-w-5xl mx-auto pb-32">

            {currentView === 'calendar' ? (
              <CalendarView tasks={activeContextId === 'home' ? tasks : activeContextTasks} activeContextId={activeContextId} />
            ) : currentView === 'bulk' ? (
              <BulkTaskView
                tasks={activeContextId === 'home' ? tasks : activeContextTasks}
                contexts={contexts}
                onTasksUpdate={(updated) => {
                  // Only update tasks that are changed
                  const updatedIds = updated.map(t => t.id);
                  setTasks(prev => prev.map(t => {
                    const found = updated.find(u => u.id === t.id);
                    return found || t;
                  }));
                  // If items were deleted (not in updated but were in tasks), we handle deletion separately in component or here.
                  // The component passes filtered list back on delete, so we should actually merge carefully.
                  // Wait, BulkTaskView passes the *result* list on delete.
                  // Let's check BulkTaskView logic.. it passes filtered list on delete.
                  // Better approach: component calls API directly and we refresh or use setTasks to remove specific IDs.

                  // Let's rely on component calling API and us syncing state.
                  // Actually, for delete, the component passes tasks *excluding* the deleted ones.
                  // AND for update, it passes *all* tasks but modified.
                  // Simpler: Just update state with the new list if it's a delete (length changed) or map if update.

                  // However, 'activeContextTasks' is a subset. We need to be careful not to lose other tasks if we just setTasks(updated).
                  // The safest way given BulkTaskView implementation:
                  // It calls onTasksUpdate with the result of the operation on the passed 'tasks' prop.

                  // If we are in 'home', passed tasks = all tasks. So setTasks(updated) is fine.
                  // If we are in context, passed tasks = context tasks. 
                  // So we must merge 'updated' back into 'tasks'.

                  setTasks(prev => {
                    // Create a map of updated tasks
                    const updatedMap = new Map(updated.map(t => [t.id, t]));
                    // Start with previous tasks
                    // If it's a delete operation, 'updated' will correspond to the filtered list of the active context.
                    // We need to know which IDs were removed.
                    // Actually, BulkTaskView logic for delete:
                    // const updatedTasks = tasks.filter(t => !selectedTaskIds.includes(t.id));
                    // onTasksUpdate(updatedTasks);

                    // So 'updated' contains the tasks that should REMAIN for this context.

                    // Valid IDs in this context (from the perspective of the view)
                    const validIdsInContext = new Set(updated.map(t => t.id));

                    // Return new task list:
                    // 1. Keep tasks from OTHER contexts as is.
                    // 2. For tasks in THIS context (if active != home), only keep those in 'validIdsInContext'.
                    // 3. Update their data from 'updatedMap'.

                    if (activeContextId === 'home') return updated;

                    return prev.filter(t => {
                      if (t.contextId !== activeContextId) return true; // Keep other contexts
                      return validIdsInContext.has(t.id); // Only keep if in updated list
                    }).map(t => updatedMap.get(t.id) || t); // Update data
                  });
                }}
              />
            ) : currentView === 'docs' ? (
              <ProductDocsView
                documents={documents}
                activeContextId={activeContextId}
                contexts={contexts}
                onUpdateDoc={handleUpdateDoc}
                onCreateDoc={handleCreateDoc}
                onDeleteDoc={handleDeleteDoc}
              />
            ) : currentView === 'discovery' ? (
              <ProductDiscoveryView
                documents={documents}
                activeContextId={activeContextId}
                contexts={contexts}
                onCreateDoc={handleCreateDoc}
                onUpdateDoc={handleUpdateDoc}
                onDeleteDoc={handleDeleteDoc}
              />

            ) : currentView === 'export' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                      <Share2 className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">تصدير إلى Jira Product Discovery</h3>
                      <p className="text-sm text-slate-500 font-bold mt-1">قم بتصدير مهامك وأولوياتك بصيغة JSON متوافقة مع Jira</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">ماذا يتم تصديره؟</h4>
                      <div className="space-y-2">
                        {[
                          { label: 'العناوين والأوصاف', icon: Check },
                          { label: 'الأولويات (High/Medium/Low)', icon: Check },
                          { label: 'درجات RICE Score الكاملة', icon: Check },
                          { label: 'التصنيفات والسياق', icon: Check }
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-xs font-bold text-slate-600">
                            <item.icon className="w-4 h-4 text-emerald-500" />
                            <span>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                      <h4 className="text-sm font-black text-slate-800 mb-4">خطوات الاستيراد في Jira:</h4>
                      <ol className="list-decimal list-inside space-y-3 text-xs font-bold text-slate-500 leading-relaxed">
                        <li>قم بتحميل ملف الـ JSON بالضغط على الزر أدناه.</li>
                        <li>افتح مشروعك في Jira Product Discovery.</li>
                        <li>اختر Create {"->"} Import ideas.</li>
                        <li>ارفع الملف المحمل وقم بمطابقة الحقول.</li>
                      </ol>
                    </div>
                  </div>

                  <button
                    onClick={handleExportToJira}
                    disabled={activeContextTasks.length === 0}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                    <Download className="w-5 h-5" />
                    تحميل ملف التصدير ({activeContextTasks.length} مهمة)
                  </button>
                </div>
              </div>
            ) : currentView === 'sheets' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-600">
                      <ListTodo className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">تصدير إلى Google Sheets</h3>
                      <p className="text-sm text-slate-500 font-bold mt-1">قم بتصدير مهامك لتتبع التقدم والأداء في جداول بيانات Google</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                    <div className="space-y-4">
                      <h4 className="text-sm font-black text-slate-800 uppercase tracking-widest">المحتويات الذكية (XLSX):</h4>
                      <div className="space-y-2">
                        {[
                          { label: 'لوحة تحكم كاملة (Dashboard Metrics)', icon: Check },
                          { label: 'سجل المهام التفصيلي والـ RICE', icon: Check },
                          { label: 'وثائق الـ PRD المنظمة', icon: Check },
                          { label: 'خطط الاستكشاف (Discovery Artifacts)', icon: Check },
                          { label: 'إدارة الأهداف الاستراتيجية', icon: Check }
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3 text-xs font-bold text-slate-600">
                            <item.icon className="w-4 h-4 text-emerald-500" />
                            <span>{item.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                      <h4 className="text-sm font-black text-slate-800 mb-4">لماذا هذا التصدير أفضل؟</h4>
                      <p className="text-xs font-bold text-slate-500 leading-relaxed mb-4">
                        الآن نقوم بتوليد ملف Excel كامل (.xlsx) يحتوي على عدة صفحات (Tabs) منظمة، مما يسمح لك باستخدامه كقاعدة بيانات متكاملة لمشروعك داخل Google Sheets.
                      </p>
                      <ul className="list-disc list-inside space-y-2 text-[11px] font-bold text-slate-400">
                        <li>افتح Google Sheets.</li>
                        <li>File {"->"} Import {"->"} Upload.</li>
                        <li>سيقوم Google Sheets بتحويل الصفحات تلقائياً.</li>
                      </ul>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <button
                      onClick={handleExportToSheets}
                      disabled={activeContextTasks.length === 0}
                      className="py-4 bg-emerald-600 text-white rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      <Download className="w-5 h-5" />
                      تحميل التقرير الكامل (.xlsx)
                    </button>

                    <button
                      onClick={handleCopyTasksToClipboard}
                      disabled={activeContextTasks.length === 0}
                      className="py-4 bg-slate-800 text-white rounded-2xl font-black hover:bg-slate-900 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      <Share2 className="w-5 h-5" />
                      نسخ المهام للحافظة (Clipboard)
                    </button>
                  </div>
                </div>
              </div>
            ) : currentView === 'team' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900">فريق العمل (Sub-Teams)</h3>
                      <p className="text-sm text-slate-500 font-bold mt-1">إدارة المستقلين والفرق الفرعية للمشروع</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFreelancerModal(true)}
                    className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                  >
                    <Plus className="w-4 h-4" /> عضو جديد
                  </button>
                </div>

                {(!activeContext.freelancers || activeContext.freelancers.length === 0) ? (
                  <div className="text-center py-20 bg-white border border-slate-200 rounded-3xl border-dashed">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <Users className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">لا يوجد أعضاء في الفريق حتى الآن</p>
                    <p className="text-xs text-slate-400 mt-1">أضف مستقلين أو جهات للمتابعة معهم</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {activeContext.freelancers.map(freelancer => {
                      const freelancerTasks = activeContextTasks.filter(t => t.freelancerId === freelancer.id);
                      const progress = freelancerTasks.length ? Math.round((freelancerTasks.filter(t => t.status === TaskStatus.DONE).length / freelancerTasks.length) * 100) : 0;

                      return (
                        <div key={freelancer.id} className="bg-white border border-slate-200 rounded-2xl p-6 hover:shadow-md transition-all group">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 text-sm font-black uppercase border-2 border-white shadow-sm">
                                {freelancer.name.substring(0, 2)}
                              </div>
                              <div>
                                <h4 className="text-sm font-black text-slate-900">{freelancer.name}</h4>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{freelancer.role}</p>
                              </div>
                            </div>
                            <span className="px-2 py-1 bg-slate-50 rounded-lg text-[10px] font-black text-slate-400 uppercase tracking-widest">{freelancer.sector}</span>
                          </div>

                          <div className="space-y-4">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-500 bg-slate-50 p-3 rounded-xl">
                              <span>معدل الإنجاز</span>
                              <span className={progress === 100 ? "text-emerald-600" : "text-slate-900"}>{progress}%</span>
                            </div>

                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase">
                                <span>المهام ({freelancerTasks.length})</span>
                              </div>
                              {freelancerTasks.slice(0, 3).map(task => (
                                <div key={task.id} className="flex items-center gap-2 text-xs text-slate-600 truncate">
                                  <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${task.status === TaskStatus.DONE ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                  <span className={`truncate ${task.status === TaskStatus.DONE ? 'line-through opacity-50' : ''}`}>{task.title}</span>
                                </div>
                              ))}
                              {freelancerTasks.length === 0 && <p className="text-xs text-slate-300 italic">لا توجد مهام مسندة</p>}
                            </div>

                            {/* Action buttons */}
                            <div className="flex items-center gap-2 pt-2 border-t border-slate-100 opacity-0 group-hover:opacity-100 transition-all">
                              <button
                                onClick={() => setEditingFreelancer(freelancer)}
                                className="flex-1 py-2 text-xs font-black text-slate-600 bg-slate-50 rounded-lg hover:bg-slate-100 transition-all"
                              >
                                تعديل
                              </button>
                              <button
                                onClick={() => handleDeleteFreelancer(freelancer.id)}
                                className="flex-1 py-2 text-xs font-black text-red-500 bg-red-50 rounded-lg hover:bg-red-100 transition-all"
                              >
                                حذف
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add Freelancer Modal */}
                {showFreelancerModal && (
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-slate-900">إضافة عضو جديد / مستقل</h3>
                        <button onClick={() => setShowFreelancerModal(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X className="w-6 h-6" /></button>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-black uppercase text-slate-400 mb-2">الاسم</label>
                            <input
                              value={freelancerInput.name || ''}
                              onChange={e => setFreelancerInput({ ...freelancerInput, name: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900"
                              placeholder="الاسم الكامل"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-black uppercase text-slate-400 mb-2">الدور (Role)</label>
                            <input
                              value={freelancerInput.role || ''}
                              onChange={e => setFreelancerInput({ ...freelancerInput, role: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900"
                              placeholder="مثلاً: كاتب محتوى"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase text-slate-400 mb-2">القطاع</label>
                          <div className="flex flex-wrap gap-2">
                            {['Marketing', 'Content', 'Development', 'Design', 'Other'].map(sector => (
                              <button
                                key={sector}
                                onClick={() => setFreelancerInput({ ...freelancerInput, sector: sector as any })}
                                className={`px-3 py-2 rounded-lg text-xs font-black transition-all border ${freelancerInput.sector === sector ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                              >
                                {sector}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-black uppercase text-slate-400 mb-2">التكلفة / الساعة (اختياري)</label>
                            <input
                              value={freelancerInput.rate || ''}
                              onChange={e => setFreelancerInput({ ...freelancerInput, rate: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900"
                              placeholder="$ / hr"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-black uppercase text-slate-400 mb-2">جهة الاتصال (اختياري)</label>
                            <input
                              value={freelancerInput.contact || ''}
                              onChange={e => setFreelancerInput({ ...freelancerInput, contact: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900"
                              placeholder="Email / Link"
                            />
                          </div>
                        </div>

                        <button
                          onClick={handleAddFreelancer}
                          disabled={!freelancerInput.name || !freelancerInput.role}
                          className="w-full py-4 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                        >
                          <Plus className="w-4 h-4" /> إضافة إلى الفريق
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Edit Freelancer Modal */}
                {editingFreelancer && (
                  <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[60] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-black text-slate-900">تعديل بيانات العضو</h3>
                        <button onClick={() => setEditingFreelancer(null)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X className="w-6 h-6" /></button>
                      </div>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-black uppercase text-slate-400 mb-2">الاسم</label>
                            <input
                              value={editingFreelancer.name}
                              onChange={e => setEditingFreelancer({ ...editingFreelancer, name: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-black uppercase text-slate-400 mb-2">الدور (Role)</label>
                            <input
                              value={editingFreelancer.role}
                              onChange={e => setEditingFreelancer({ ...editingFreelancer, role: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase text-slate-400 mb-2">القطاع</label>
                          <div className="flex flex-wrap gap-2">
                            {['Marketing', 'Content', 'Development', 'Design', 'Other'].map(sector => (
                              <button
                                key={sector}
                                onClick={() => setEditingFreelancer({ ...editingFreelancer, sector: sector as any })}
                                className={`px-3 py-2 rounded-lg text-xs font-black transition-all border ${editingFreelancer.sector === sector ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                              >
                                {sector}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-black uppercase text-slate-400 mb-2">التكلفة / الساعة</label>
                            <input
                              value={editingFreelancer.rate || ''}
                              onChange={e => setEditingFreelancer({ ...editingFreelancer, rate: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900"
                              placeholder="$ / hr"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-black uppercase text-slate-400 mb-2">جهة الاتصال</label>
                            <input
                              value={editingFreelancer.contact || ''}
                              onChange={e => setEditingFreelancer({ ...editingFreelancer, contact: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900"
                              placeholder="Email / Link"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase text-slate-400 mb-2">الحالة</label>
                          <div className="flex gap-2">
                            {['Active', 'Paused', 'Completed'].map(status => (
                              <button
                                key={status}
                                onClick={() => setEditingFreelancer({ ...editingFreelancer, status: status as any })}
                                className={`px-4 py-2 rounded-lg text-xs font-black transition-all border ${editingFreelancer.status === status ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                              >
                                {status === 'Active' ? 'نشط' : status === 'Paused' ? 'متوقف' : 'منتهي'}
                              </button>
                            ))}
                          </div>
                        </div>

                        <button
                          onClick={() => handleUpdateFreelancer(editingFreelancer)}
                          disabled={!editingFreelancer.name || !editingFreelancer.role}
                          className="w-full py-4 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
                        >
                          حفظ التغييرات
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : activeContextId === 'home' ? renderHomeView() : (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-300">

                {/* Strategic Project Dashboard - Compact */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm relative overflow-hidden max-h-[250px]">
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${activeContext.color}`} />
                  <div className="flex flex-col md:flex-row justify-between items-start gap-4 pr-12">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h2 className="text-lg font-black text-slate-900 truncate">{activeContext.name}</h2>
                        {activeContext.currentPhase && (
                          <span className="shrink-0 px-2 py-0.5 bg-slate-100 text-slate-500 text-[8px] uppercase font-black tracking-widest rounded-full border border-slate-200">
                            {activeContext.currentPhase}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-400 font-medium leading-snug text-xs line-clamp-2 mb-3">
                        {activeContext.description}
                      </p>

                      <div className="flex flex-wrap gap-4">
                        {Array.isArray(activeContext.strategicGoals) && activeContext.strategicGoals.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-[8px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-1">
                              <Target className="w-2.5 h-2.5" /> الأهداف
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {activeContext.strategicGoals.slice(0, 3).map((goal, idx) => (
                                <span key={idx} className="px-2 py-1 bg-slate-50 border border-slate-100 rounded text-[10px] font-bold text-slate-600 truncate max-w-[100px]">
                                  {goal}
                                </span>
                              ))}
                              {activeContext.strategicGoals.length > 3 && (
                                <span className="px-2 py-1 text-[10px] font-bold text-slate-400">+{activeContext.strategicGoals.length - 3}</span>
                              )}
                            </div>
                          </div>
                        )}

                        {Array.isArray(activeContext.techStack) && activeContext.techStack.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-[8px] uppercase font-black text-slate-400 tracking-widest flex items-center gap-1">
                              <Layers className="w-2.5 h-2.5" /> التقنيات
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {activeContext.techStack.slice(0, 4).map((tech, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-50 border border-blue-100 text-blue-600 rounded text-[10px] font-bold font-mono">
                                  {tech}
                                </span>
                              ))}
                              {activeContext.techStack.length > 4 && (
                                <span className="px-2 py-1 text-[10px] font-bold text-slate-400">+{activeContext.techStack.length - 4}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stats - Compact */}
                    <div className="flex gap-3 shrink-0">
                      <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 text-center min-w-[80px]">
                        <p className="text-[8px] uppercase font-black text-slate-400 mb-0.5">الإنجاز</p>
                        <p className="text-xl font-black text-slate-900">
                          {Math.round(activeContextTasks.length ? (activeContextTasks.filter(t => t.status === TaskStatus.DONE).length / activeContextTasks.length) * 100 : 0)}%
                        </p>
                      </div>
                      {activeContext.targetAudience && (
                        <div className="bg-slate-50 px-4 py-3 rounded-xl border border-slate-100 max-w-[150px]">
                          <p className="text-[8px] uppercase font-black text-slate-400 mb-0.5">الجمهور</p>
                          <p className="text-[10px] font-bold text-slate-600 leading-tight line-clamp-2">{activeContext.targetAudience}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Edit Context Button */}
                  <button
                    onClick={() => {
                      setEditedContext(activeContext);
                      setIsEditingContext(true);
                    }}
                    className="absolute top-4 left-4 p-2 rounded-lg bg-slate-50 border border-slate-100 text-slate-400 hover:text-slate-900 hover:bg-white hover:shadow-sm transition-all"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>

                {/* Edit Context Dialog Overlay */}
                {isEditingContext && (
                  <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 max-h-[90vh] overflow-y-auto">
                      <div className="flex items-center justify-between mb-8">
                        <h3 className="text-xl font-black text-slate-900">تعديل بيانات المشروع</h3>
                        <button onClick={() => setIsEditingContext(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X className="w-6 h-6" /></button>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <label className="block text-xs font-black uppercase text-slate-400 mb-2">اسم المشروع</label>
                          <input
                            value={editedContext.name || ''}
                            onChange={e => setEditedContext({ ...editedContext, name: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase text-slate-400 mb-2">الوصف العام</label>
                          <textarea
                            value={editedContext.description || ''}
                            onChange={e => setEditedContext({ ...editedContext, description: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900 transition-colors h-24 resize-none"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                          <div>
                            <label className="block text-xs font-black uppercase text-slate-400 mb-2">المرحلة الحالية</label>
                            <select
                              value={editedContext.currentPhase || ''}
                              onChange={e => setEditedContext({ ...editedContext, currentPhase: e.target.value as any })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900 transition-colors"
                            >
                              <option value="Ideation">Ideation</option>
                              <option value="MVP">MVP</option>
                              <option value="Growth">Growth</option>
                              <option value="Scaling">Scaling</option>
                              <option value="Maintenance">Maintenance</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-xs font-black uppercase text-slate-400 mb-2">الجمهور المستهدف</label>
                            <input
                              value={editedContext.targetAudience || ''}
                              onChange={e => setEditedContext({ ...editedContext, targetAudience: e.target.value })}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900 transition-colors"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase text-slate-400 mb-2">الأهداف الاستراتيجية (مفصولة بفاصلة)</label>
                          <input
                            value={Array.isArray(editedContext.strategicGoals) ? editedContext.strategicGoals.join(', ') : ''}
                            onChange={e => setEditedContext({ ...editedContext, strategicGoals: e.target.value.split(',').map(s => s.trim()) })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900 transition-colors"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-black uppercase text-slate-400 mb-2">التقنيات (Tech Stack) (مفصولة بفاصلة)</label>
                          <input
                            value={Array.isArray(editedContext.techStack) ? editedContext.techStack.join(', ') : ''}
                            onChange={e => setEditedContext({ ...editedContext, techStack: e.target.value.split(',').map(s => s.trim()) })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900 transition-colors font-mono"
                          />
                        </div>

                        <div className="pt-4">
                          <button
                            onClick={() => {
                              setContexts(prev => prev.map(c => c.id === editedContext.id ? { ...c, ...editedContext } as AppContext : c));
                              setIsEditingContext(false);
                            }}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                          >
                            حفظ التعديلات
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Quick Add Section */}
                <div className="space-y-4">
                  <div className="group bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg transition-all overflow-hidden p-2.5 flex items-center gap-3 focus-within:border-slate-400">
                    <div className="flex-1 flex items-center gap-4 px-4">
                      <Plus className="w-5 h-5 text-slate-300 group-hover:text-slate-500" />
                      <input
                        type="text"
                        value={quickInput}
                        onChange={(e) => setQuickInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleQuickAdd('')}
                        placeholder="أدخل فكرة، التزام، أو سجل صوتياً للتحليل الاستراتيجي..."
                        className="w-full bg-transparent text-sm focus:outline-none placeholder:text-slate-400 placeholder:font-bold"
                      />
                    </div>
                    <div className="flex items-center gap-2 pr-1">
                      <button onClick={toggleListening} className={`p-3 rounded-xl transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}>
                        <Mic className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleQuickAdd('')}
                        disabled={!quickInput.trim() || parsingTask}
                        className="bg-slate-900 text-white text-xs font-black px-6 py-3 rounded-xl disabled:opacity-30 hover:bg-slate-800 transition-all shadow-md shadow-slate-900/10"
                      >
                        {parsingTask ? <Loader2 className="w-4 h-4 animate-spin" /> : 'تحليل المهام'}
                      </button>
                    </div>
                  </div>

                  {/* AI Suggested Tasks Overlay */}
                  {suggestions.length > 0 && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-8 space-y-6 animate-in zoom-in-95 duration-200 shadow-xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Sparkles className="w-5 h-5 text-indigo-600" />
                          <h4 className="text-sm font-black text-indigo-700 uppercase tracking-widest">تحليل الذكاء الاصطناعي للمدخلات ({suggestions.length})</h4>
                        </div>
                        <button onClick={() => setSuggestions([])} className="p-2 hover:bg-indigo-100 rounded-xl text-indigo-400"><X className="w-5 h-5" /></button>
                      </div>
                      <div className="grid grid-cols-1 gap-4">
                        {suggestions.map(suggestion => (
                          <div key={suggestion.id} className="bg-white border border-indigo-100 rounded-2xl p-5 flex items-center justify-between shadow-sm hover:border-indigo-300 transition-all">
                            <div className="flex-1">
                              <h5 className="text-base font-black text-slate-900 mb-1">{suggestion.title}</h5>
                              <div className="flex items-center gap-6 text-[10px] font-black text-indigo-500 uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {suggestion.suggestedTime} • {suggestion.date}</span>
                                <span className="px-3 py-1 bg-indigo-50 rounded-lg border border-indigo-100">{suggestion.category}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-2 font-bold italic">السبب: {suggestion.rationale}</p>
                            </div>
                            <div className="flex items-center gap-3 ml-6">
                              <button
                                onClick={() => approveSuggestion(suggestion.id)}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
                              >
                                <Check className="w-4 h-4" /> اعتماد
                              </button>
                              <button
                                onClick={() => rejectSuggestion(suggestion.id)}
                                className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Kanban Board */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4 lg:gap-6">
                  {/* Draft Column */}
                  <div
                    className={`bg-gray-50/50 rounded-2xl p-4 border-2 border-dashed min-h-[400px] transition-all ${draggingTaskId ? 'border-gray-300 bg-gray-100/50' : 'border-transparent'}`}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-gray-400'); }}
                    onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-gray-400'); }}
                    onDrop={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-gray-400'); handleKanbanDrop(TaskStatus.DRAFT); }}
                  >
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-200">
                      <div className="w-3 h-3 rounded-full bg-gray-400 shadow-lg shadow-gray-400/50" />
                      <h3 className="text-xs font-black uppercase tracking-[0.15em] text-gray-600">مسودة</h3>
                      <span className="ml-auto bg-gray-200 text-gray-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                        {activeContextTasks.filter(t => t.status === TaskStatus.DRAFT).length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {activeContextTasks.filter(t => t.status === TaskStatus.DRAFT).length > 0 ? (
                        activeContextTasks.filter(t => t.status === TaskStatus.DRAFT).map(task => {
                          const taskContext = contexts.find(c => c.id === task.contextId);
                          const assignee = taskContext?.freelancers?.find(f => f.id === task.freelancerId);
                          return (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={() => setDraggingTaskId(task.id)}
                              onDragEnd={() => setDraggingTaskId(null)}
                              onClick={() => setEditingTask(task)}
                              className={`bg-white rounded-xl p-4 border border-gray-100 shadow-sm hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer group ${draggingTaskId === task.id ? 'opacity-50 scale-95' : ''}`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="text-sm font-bold text-slate-800 leading-tight flex-1">{task.title}</h4>
                                <span className={`shrink-0 text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${task.priority === Priority.HIGH ? 'bg-red-100 text-red-600' : task.priority === Priority.MEDIUM ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                  {task.priority}
                                </span>
                              </div>
                              {task.rationale && <p className="text-[10px] text-slate-400 font-medium mb-2 line-clamp-1">{task.rationale}</p>}

                              {/* Date & Time Row */}
                              <div className="flex items-center gap-2 mb-2 text-[9px] text-slate-500">
                                <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" />{task.date}</span>
                                {task.suggestedTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{task.suggestedTime}</span>}
                                {task.duration && <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold">{task.duration}</span>}
                              </div>

                              {/* Assignee */}
                              {assignee && (
                                <div className="flex items-center gap-2 mb-2 text-[9px]">
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center text-white text-[8px] font-black">
                                    {assignee.name.charAt(0)}
                                  </div>
                                  <span className="font-bold text-slate-600">{assignee.name}</span>
                                </div>
                              )}

                              {/* RICE Score */}
                              {task.rice?.score && (
                                <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
                                  <span className="text-[9px] font-black text-indigo-600">RICE</span>
                                  <span className="text-xs font-black text-indigo-700">{task.rice.score.toFixed(1)}</span>
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-2 border-t border-gray-50">
                                <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">{task.category}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: TaskStatus.TODO } : t)); apiService.updateTask({ ...task, status: TaskStatus.TODO }); }}
                                  className="opacity-0 group-hover:opacity-100 text-[9px] font-black text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-all"
                                >
                                  اعتماد →
                                </button>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-xs text-slate-400 italic text-center py-8">لا توجد مسودات</p>
                      )}
                    </div>
                  </div>

                  {/* To Do Column */}
                  <div
                    className={`bg-slate-50/50 rounded-2xl p-4 border-2 border-dashed min-h-[400px] transition-all ${draggingTaskId ? 'border-slate-300 bg-slate-100/50' : 'border-transparent'}`}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-slate-400'); }}
                    onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-slate-400'); }}
                    onDrop={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-slate-400'); handleKanbanDrop(TaskStatus.TODO); }}
                  >
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-slate-200">
                      <div className="w-3 h-3 rounded-full bg-slate-400 shadow-lg shadow-slate-400/50" />
                      <h3 className="text-xs font-black uppercase tracking-[0.15em] text-slate-600">To Do</h3>
                      <span className="ml-auto bg-slate-200 text-slate-600 text-[10px] font-black px-2 py-0.5 rounded-full">
                        {activeContextTasks.filter(t => t.status === TaskStatus.TODO).length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {activeContextTasks.filter(t => t.status === TaskStatus.TODO).length > 0 ? (
                        activeContextTasks.filter(t => t.status === TaskStatus.TODO).map(task => {
                          const taskContext = contexts.find(c => c.id === task.contextId);
                          const assignee = taskContext?.freelancers?.find(f => f.id === task.freelancerId);
                          return (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={() => setDraggingTaskId(task.id)}
                              onDragEnd={() => setDraggingTaskId(null)}
                              onClick={() => setEditingTask(task)}
                              className={`bg-white rounded-xl p-4 border border-slate-100 shadow-sm hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer group ${draggingTaskId === task.id ? 'opacity-50 scale-95' : ''}`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="text-sm font-bold text-slate-800 leading-tight flex-1">{task.title}</h4>
                                <span className={`shrink-0 text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${task.priority === Priority.HIGH ? 'bg-red-100 text-red-600' : task.priority === Priority.MEDIUM ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                  {task.priority}
                                </span>
                              </div>
                              {task.rationale && <p className="text-[10px] text-slate-400 font-medium mb-2 line-clamp-1">{task.rationale}</p>}

                              {/* Date & Time Row */}
                              <div className="flex items-center gap-2 mb-2 text-[9px] text-slate-500">
                                <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" />{task.date}</span>
                                {task.suggestedTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{task.suggestedTime}</span>}
                                {task.duration && <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold">{task.duration}</span>}
                              </div>

                              {/* Assignee */}
                              {assignee && (
                                <div className="flex items-center gap-2 mb-2 text-[9px]">
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 flex items-center justify-center text-white text-[8px] font-black">
                                    {assignee.name.charAt(0)}
                                  </div>
                                  <span className="font-bold text-slate-600">{assignee.name}</span>
                                </div>
                              )}

                              {/* RICE Score */}
                              {task.rice?.score && (
                                <div className="flex items-center gap-2 mb-2 px-2 py-1.5 bg-indigo-50 rounded-lg border border-indigo-100">
                                  <span className="text-[9px] font-black text-indigo-600">RICE</span>
                                  <span className="text-xs font-black text-indigo-700">{task.rice.score.toFixed(1)}</span>
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                                <span className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">{task.category}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: TaskStatus.IN_PROGRESS } : t)); apiService.updateTask({ ...task, status: TaskStatus.IN_PROGRESS }); }}
                                  className="opacity-0 group-hover:opacity-100 text-[9px] font-black text-blue-600 hover:bg-blue-50 px-2 py-1 rounded transition-all"
                                >
                                  ابدأ →
                                </button>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-xs text-slate-400 italic text-center py-8">لا توجد مهام</p>
                      )}
                    </div>
                  </div>

                  {/* In Progress Column */}
                  <div
                    className={`bg-blue-50/50 rounded-2xl p-4 border-2 border-dashed min-h-[400px] transition-all ${draggingTaskId ? 'border-blue-300 bg-blue-100/50' : 'border-transparent'}`}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-blue-400'); }}
                    onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-blue-400'); }}
                    onDrop={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-blue-400'); handleKanbanDrop(TaskStatus.IN_PROGRESS); }}
                  >
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-blue-200/50">
                      <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50 animate-pulse" />
                      <h3 className="text-xs font-black uppercase tracking-[0.15em] text-blue-700">In Progress</h3>
                      <span className="ml-auto bg-blue-200 text-blue-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                        {activeContextTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {activeContextTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length > 0 ? (
                        activeContextTasks.filter(t => t.status === TaskStatus.IN_PROGRESS).map(task => {
                          const taskContext = contexts.find(c => c.id === task.contextId);
                          const assignee = taskContext?.freelancers?.find(f => f.id === task.freelancerId);
                          return (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={() => setDraggingTaskId(task.id)}
                              onDragEnd={() => setDraggingTaskId(null)}
                              onClick={() => setEditingTask(task)}
                              className={`bg-white rounded-xl p-4 border border-blue-100 shadow-sm hover:shadow-lg hover:border-blue-300 transition-all cursor-pointer group ${draggingTaskId === task.id ? 'opacity-50 scale-95' : ''}`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="text-sm font-bold text-slate-800 leading-tight flex-1">{task.title}</h4>
                                <span className={`shrink-0 text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${task.priority === Priority.HIGH ? 'bg-red-100 text-red-600' : task.priority === Priority.MEDIUM ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                  {task.priority}
                                </span>
                              </div>
                              {task.rationale && <p className="text-[10px] text-slate-400 font-medium mb-2 line-clamp-1">{task.rationale}</p>}

                              {/* Date & Time Row */}
                              <div className="flex items-center gap-2 mb-2 text-[9px] text-slate-500">
                                <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" />{task.date}</span>
                                {task.suggestedTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{task.suggestedTime}</span>}
                                {task.duration && <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold">{task.duration}</span>}
                              </div>

                              {/* Assignee */}
                              {assignee && (
                                <div className="flex items-center gap-2 mb-2 text-[9px]">
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-[8px] font-black">
                                    {assignee.name.charAt(0)}
                                  </div>
                                  <span className="font-bold text-slate-600">{assignee.name}</span>
                                </div>
                              )}

                              {task.rice?.score && (
                                <div className="flex items-center gap-2 mb-2 p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                                  <span className="text-[10px] font-black text-indigo-600">RICE</span>
                                  <span className="text-sm font-black text-indigo-700">{task.rice.score.toFixed(1)}</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between pt-2 border-t border-blue-50/50">
                                <span className="text-[9px] font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded">{task.category}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: TaskStatus.REVIEW } : t)); apiService.updateTask({ ...task, status: TaskStatus.REVIEW }); }}
                                  className="opacity-0 group-hover:opacity-100 text-[9px] font-black text-amber-600 hover:bg-amber-50 px-2 py-1 rounded transition-all"
                                >
                                  للمراجعة →
                                </button>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-xs text-blue-400 italic text-center py-8">لا توجد مهام قيد التنفيذ</p>
                      )}
                    </div>
                  </div>

                  {/* Review Column */}
                  <div
                    className={`bg-amber-50/50 rounded-2xl p-4 border-2 border-dashed min-h-[400px] transition-all ${draggingTaskId ? 'border-amber-300 bg-amber-100/50' : 'border-transparent'}`}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-amber-400'); }}
                    onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-amber-400'); }}
                    onDrop={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-amber-400'); handleKanbanDrop(TaskStatus.REVIEW); }}
                  >
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-amber-200/50">
                      <div className="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50" />
                      <h3 className="text-xs font-black uppercase tracking-[0.15em] text-amber-700">Review / QA</h3>
                      <span className="ml-auto bg-amber-200 text-amber-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                        {activeContextTasks.filter(t => t.status === TaskStatus.REVIEW).length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {activeContextTasks.filter(t => t.status === TaskStatus.REVIEW).length > 0 ? (
                        activeContextTasks.filter(t => t.status === TaskStatus.REVIEW).map(task => {
                          const taskContext = contexts.find(c => c.id === task.contextId);
                          const assignee = taskContext?.freelancers?.find(f => f.id === task.freelancerId);
                          return (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={() => setDraggingTaskId(task.id)}
                              onDragEnd={() => setDraggingTaskId(null)}
                              onClick={() => setEditingTask(task)}
                              className={`bg-white rounded-xl p-4 border border-amber-100 shadow-sm hover:shadow-lg hover:border-amber-300 transition-all cursor-pointer group ${draggingTaskId === task.id ? 'opacity-50 scale-95' : ''}`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="text-sm font-bold text-slate-800 leading-tight flex-1">{task.title}</h4>
                                <span className={`shrink-0 text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${task.priority === Priority.HIGH ? 'bg-red-100 text-red-600' : task.priority === Priority.MEDIUM ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                  {task.priority}
                                </span>
                              </div>
                              {task.rationale && <p className="text-[10px] text-slate-400 font-medium mb-2 line-clamp-1">{task.rationale}</p>}

                              {/* Date & Time Row */}
                              <div className="flex items-center gap-2 mb-2 text-[9px] text-slate-500">
                                <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" />{task.date}</span>
                                {task.suggestedTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{task.suggestedTime}</span>}
                                {task.duration && <span className="bg-slate-100 px-1.5 py-0.5 rounded font-bold">{task.duration}</span>}
                              </div>

                              {/* Assignee */}
                              {assignee && (
                                <div className="flex items-center gap-2 mb-2 text-[9px]">
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-white text-[8px] font-black">
                                    {assignee.name.charAt(0)}
                                  </div>
                                  <span className="font-bold text-slate-600">{assignee.name}</span>
                                </div>
                              )}

                              {task.rice?.score && (
                                <div className="flex items-center gap-2 mb-2 p-2 bg-indigo-50 rounded-lg border border-indigo-100">
                                  <span className="text-[10px] font-black text-indigo-600">RICE</span>
                                  <span className="text-sm font-black text-indigo-700">{task.rice.score.toFixed(1)}</span>
                                </div>
                              )}
                              <div className="flex items-center justify-between pt-2 border-t border-amber-50/50">
                                <span className="text-[9px] font-bold text-amber-500 bg-amber-50 px-2 py-1 rounded">{task.category}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: TaskStatus.DONE, completed: true } : t)); apiService.updateTask({ ...task, status: TaskStatus.DONE, completed: true }); }}
                                  className="opacity-0 group-hover:opacity-100 text-[9px] font-black text-emerald-600 hover:bg-emerald-50 px-2 py-1 rounded transition-all"
                                >
                                  أكمل ✓
                                </button>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-xs text-amber-400 italic text-center py-8">لا توجد مهام للمراجعة</p>
                      )}
                    </div>
                  </div>

                  {/* Done Column */}
                  <div
                    className={`bg-emerald-50/50 rounded-2xl p-4 border-2 border-dashed min-h-[400px] transition-all ${draggingTaskId ? 'border-emerald-300 bg-emerald-100/50' : 'border-transparent'}`}
                    onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('ring-2', 'ring-emerald-400'); }}
                    onDragLeave={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-emerald-400'); }}
                    onDrop={(e) => { e.currentTarget.classList.remove('ring-2', 'ring-emerald-400'); handleKanbanDrop(TaskStatus.DONE); }}
                  >
                    <div className="flex items-center gap-3 mb-4 pb-3 border-b border-emerald-200/50">
                      <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                      <h3 className="text-xs font-black uppercase tracking-[0.15em] text-emerald-700">Done</h3>
                      <span className="ml-auto bg-emerald-200 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full">
                        {activeContextTasks.filter(t => t.status === TaskStatus.DONE).length}
                      </span>
                    </div>
                    <div className="space-y-3">
                      {activeContextTasks.filter(t => t.status === TaskStatus.DONE).length > 0 ? (
                        activeContextTasks.filter(t => t.status === TaskStatus.DONE).map(task => {
                          const taskContext = contexts.find(c => c.id === task.contextId);
                          const assignee = taskContext?.freelancers?.find(f => f.id === task.freelancerId);
                          return (
                            <div
                              key={task.id}
                              draggable
                              onDragStart={() => setDraggingTaskId(task.id)}
                              onDragEnd={() => setDraggingTaskId(null)}
                              onClick={() => setEditingTask(task)}
                              className={`bg-white/80 rounded-xl p-4 border border-emerald-100 shadow-sm opacity-80 hover:opacity-100 transition-all cursor-pointer group ${draggingTaskId === task.id ? 'opacity-50 scale-95' : ''}`}
                            >
                              <div className="flex items-start justify-between gap-2 mb-2">
                                <h4 className="text-sm font-bold text-slate-500 leading-tight line-through flex-1">{task.title}</h4>
                                <div className="flex items-center gap-1">
                                  <span className={`shrink-0 text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${task.priority === Priority.HIGH ? 'bg-red-100 text-red-600' : task.priority === Priority.MEDIUM ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                    {task.priority}
                                  </span>
                                  <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                                </div>
                              </div>

                              {/* Date & Time Row */}
                              <div className="flex items-center gap-2 mb-2 text-[9px] text-slate-400">
                                <span className="flex items-center gap-1"><CalendarIcon className="w-3 h-3" />{task.date}</span>
                                {task.suggestedTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{task.suggestedTime}</span>}
                              </div>

                              {/* Assignee */}
                              {assignee && (
                                <div className="flex items-center gap-2 mb-2 text-[9px]">
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-[8px] font-black">
                                    {assignee.name.charAt(0)}
                                  </div>
                                  <span className="font-bold text-slate-500">{assignee.name}</span>
                                </div>
                              )}

                              {task.rice?.score && (
                                <div className="flex items-center gap-2 mb-2 p-2 bg-emerald-50/50 rounded-lg border border-emerald-100">
                                  <span className="text-[10px] font-black text-emerald-600">RICE</span>
                                  <span className="text-sm font-black text-emerald-700">{task.rice.score.toFixed(1)}</span>
                                </div>
                              )}

                              <div className="flex items-center justify-between pt-2 border-t border-emerald-50/50">
                                <span className="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-1 rounded">{task.category}</span>
                                <button
                                  onClick={(e) => { e.stopPropagation(); setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: TaskStatus.TODO, completed: false } : t)); apiService.updateTask({ ...task, status: TaskStatus.TODO, completed: false }); }}
                                  className="opacity-0 group-hover:opacity-100 text-[9px] font-black text-orange-500 hover:bg-orange-50 px-2 py-1 rounded transition-all"
                                >
                                  إعادة فتح ↺
                                </button>
                              </div>
                            </div>
                          )
                        })
                      ) : (
                        <p className="text-xs text-emerald-400 italic text-center py-8">لا توجد مهام مكتملة</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div >

        {/* Sub-Project Modal */}
        {subProjectModal.show && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[80] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900">إضافة مشروع فرعي (Sub-Project)</h3>
                  <p className="text-xs font-bold text-slate-500 mt-1">يتم ربط هذا المشروع بالمشروع الرئيسي بشكل هرمي</p>
                </div>
                <button onClick={() => setSubProjectModal({ show: false, parentId: null })} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X className="w-6 h-6" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2">اسم المشروع الفرعي</label>
                  <input
                    value={newSubProjectName}
                    onChange={e => setNewSubProjectName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900"
                    placeholder="مثلاً: حملة التسويق الرمضانية"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2">القطاع الأساسي (Primary Sector)</label>
                  <div className="flex flex-wrap gap-2">
                    {['Marketing', 'Content', 'Engineering', 'Design', 'Sales', 'Operations', 'Other'].map(sector => (
                      <button
                        key={sector}
                        onClick={() => setNewSubProjectSector(sector as ProjectSector)}
                        className={`px-3 py-2 rounded-lg text-xs font-black transition-all border ${newSubProjectSector === sector ? 'bg-slate-900 border-slate-900 text-white' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                      >
                        {sector}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleCreateSubProject}
                  disabled={!newSubProjectName}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" /> إنشاء المشروع الفرعي
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Task Edit Modal */}
        {editingTask && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[90] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-slate-900">تعديل المهمة</h3>
                <button onClick={() => setEditingTask(null)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X className="w-6 h-6" /></button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2">عنوان المهمة</label>
                  <input
                    value={editingTask.title}
                    onChange={e => setEditingTask({ ...editingTask, title: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-2">التاريخ</label>
                    <input
                      type="date"
                      value={editingTask.date || ''}
                      onChange={e => setEditingTask({ ...editingTask, date: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-2">الوقت المقترح</label>
                    <input
                      type="time"
                      value={editingTask.suggestedTime || ''}
                      onChange={e => setEditingTask({ ...editingTask, suggestedTime: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-2">الأولوية</label>
                    <select
                      value={editingTask.priority}
                      onChange={e => setEditingTask({ ...editingTask, priority: e.target.value as Priority })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900"
                    >
                      <option value={Priority.HIGH}>High</option>
                      <option value={Priority.MEDIUM}>Medium</option>
                      <option value={Priority.LOW}>Low</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase text-slate-400 mb-2">التصنيف</label>
                    <select
                      value={editingTask.category}
                      onChange={e => setEditingTask({ ...editingTask, category: e.target.value })}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900"
                    >
                      <optgroup label="مخصص">
                        {contexts.find(c => c.id === editingTask.contextId)?.customCategories?.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </optgroup>
                      <optgroup label="افتراضي">
                        {DEFAULT_CATEGORIES.map(cat => (
                          <option key={cat.id} value={cat.name}>{cat.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-400 mb-2">إسناد إلى عضو بالفريق</label>
                  <select
                    value={editingTask.freelancerId || ''}
                    onChange={e => setEditingTask({ ...editingTask, freelancerId: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900"
                  >
                    <option value="">-- غير مسندة --</option>
                    {contexts.find(c => c.id === editingTask.contextId)?.freelancers?.map(f => (
                      <option key={f.id} value={f.id}>{f.name} ({f.role})</option>
                    ))}
                  </select>
                </div>

                {/* RICE Score Section */}
                <div className="border border-indigo-100 bg-indigo-50/50 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs font-black uppercase text-indigo-600 tracking-widest">RICE Score</p>
                    <span className="text-lg font-black text-indigo-700">
                      {(() => {
                        const r = editingTask.rice || {};
                        // Ensure all values are numbers, defaulting to standard RICE defaults if missing
                        const reach = typeof r.reach === 'number' ? r.reach : 5;
                        const impact = typeof r.impact === 'number' ? r.impact : 1;
                        const confidence = typeof r.confidence === 'number' ? r.confidence : 80;
                        const effort = (typeof r.effort === 'number' && r.effort > 0) ? r.effort : 1;

                        const score = (reach * impact * (confidence / 100)) / effort;
                        return isNaN(score) ? '0.0' : score.toFixed(1);
                      })()}
                    </span>
                  </div>
                  <div className="grid grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-bold text-indigo-500 mb-1">Reach (1-10)</label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={editingTask.rice?.reach ?? 5}
                        onChange={e => {
                          const val = Math.max(1, Math.min(10, parseFloat(e.target.value) || 0));
                          const currentRice = editingTask.rice || { reach: 5, impact: 1, confidence: 80, effort: 1, score: 0 };
                          const newRice = {
                            ...currentRice,
                            reach: val,
                            // Ensure other fields exist for calculation
                            impact: currentRice.impact ?? 1,
                            confidence: currentRice.confidence ?? 80,
                            effort: currentRice.effort ?? 1
                          };
                          newRice.score = (newRice.reach * newRice.impact * (newRice.confidence / 100)) / (newRice.effort || 1);
                          setEditingTask({ ...editingTask, rice: newRice });
                        }}
                        className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm font-bold text-center focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-indigo-500 mb-1">Impact (0.25-3)</label>
                      <select
                        value={editingTask.rice?.impact ?? 1}
                        onChange={e => {
                          const val = parseFloat(e.target.value);
                          const currentRice = editingTask.rice || { reach: 5, impact: 1, confidence: 80, effort: 1, score: 0 };
                          const newRice = {
                            ...currentRice,
                            impact: val,
                            // Ensure other fields exist for calculation
                            reach: currentRice.reach ?? 5,
                            confidence: currentRice.confidence ?? 80,
                            effort: currentRice.effort ?? 1
                          };
                          newRice.score = (newRice.reach * newRice.impact * (newRice.confidence / 100)) / (newRice.effort || 1);
                          setEditingTask({ ...editingTask, rice: newRice });
                        }}
                        className="w-full bg-white border border-indigo-200 rounded-lg px-2 py-2 text-sm font-bold text-center focus:outline-none focus:border-indigo-500"
                      >
                        <option value={0.25}>0.25 (Minimal)</option>
                        <option value={0.5}>0.5 (Low)</option>
                        <option value={1}>1 (Medium)</option>
                        <option value={2}>2 (High)</option>
                        <option value={3}>3 (Massive)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-indigo-500 mb-1">Confidence %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="5"
                        value={editingTask.rice?.confidence ?? 80}
                        onChange={e => {
                          const val = Math.max(0, Math.min(100, parseFloat(e.target.value) || 0));
                          const currentRice = editingTask.rice || { reach: 5, impact: 1, confidence: 80, effort: 1, score: 0 };
                          const newRice = {
                            ...currentRice,
                            confidence: val,
                            // Ensure other fields exist for calculation
                            reach: currentRice.reach ?? 5,
                            impact: currentRice.impact ?? 1,
                            effort: currentRice.effort ?? 1
                          };
                          newRice.score = (newRice.reach * newRice.impact * (newRice.confidence / 100)) / (newRice.effort || 1);
                          setEditingTask({ ...editingTask, rice: newRice });
                        }}
                        className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm font-bold text-center focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-indigo-500 mb-1">Effort (mo)</label>
                      <input
                        type="number"
                        min="0.25"
                        max="12"
                        step="0.25"
                        value={editingTask.rice?.effort ?? 1}
                        onChange={e => {
                          const val = Math.max(0.25, parseFloat(e.target.value) || 0.25);
                          const currentRice = editingTask.rice || { reach: 5, impact: 1, confidence: 80, effort: 1, score: 0 };
                          const newRice = {
                            ...currentRice,
                            effort: val,
                            // Ensure other fields exist for calculation
                            reach: currentRice.reach ?? 5,
                            impact: currentRice.impact ?? 1,
                            confidence: currentRice.confidence ?? 80
                          };
                          newRice.score = (newRice.reach * newRice.impact * (newRice.confidence / 100)) / (newRice.effort || 1);
                          setEditingTask({ ...editingTask, rice: newRice });
                        }}
                        className="w-full bg-white border border-indigo-200 rounded-lg px-3 py-2 text-sm font-bold text-center focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleUpdateTask(editingTask)}
                  className="w-full py-4 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 mt-4"
                >
                  حفظ التغييرات
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Global Chat Drawer */}
        <div className={`fixed inset-y-0 left-0 w-[480px] bg-white border-r border-slate-200 shadow-2xl z-40 transform transition-transform duration-500 ease-in-out flex flex-col ${showChat ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h4 className="font-black text-lg uppercase tracking-tight">المحلل الاستراتيجي</h4>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-0.5">سياق: {activeContext.name}</p>
            </div>
            <button onClick={() => setShowChat(false)} className="p-3 hover:bg-white rounded-2xl text-slate-400 border border-transparent hover:border-slate-200 transition-all">
              <ChevronLeft className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scroll bg-white">
            {(chatHistory[activeContextId] || []).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center opacity-40 text-center px-16 space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center"><AlertCircle className="w-8 h-8 stroke-[1.5px]" /></div>
                <p className="text-xs font-bold leading-relaxed uppercase tracking-widest leading-loose text-slate-500">أنا مستعد لتحليل سياق {activeContext.name} ومساعدتك في اتخاذ قرارات تقنية وبرمجية دقيقة. كيف نبدأ؟</p>
              </div>
            ) : (
              (chatHistory[activeContextId] || []).map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                  <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed ${msg.role === 'user'
                    ? 'bg-slate-900 text-white shadow-xl shadow-slate-900/10'
                    : 'bg-slate-50 text-slate-700 border border-slate-100'
                    }`}>
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {loading && <div className="flex justify-start"><Loader2 className="w-5 h-5 animate-spin text-slate-300" /></div>}
          </div>

          <form onSubmit={handleSendMessage} className="p-8 border-t border-slate-100 bg-white">
            <div className="flex gap-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="اسأل عن استراتيجية الإطلاق أو الحلول التقنية..."
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 text-xs focus:outline-none focus:border-slate-900 transition-all font-bold placeholder:text-slate-400"
              />
              <button type="submit" disabled={!message.trim() || loading} className="w-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center disabled:opacity-30 shadow-lg shadow-slate-900/20">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </form>
        </div >
      </main >

      {/* Copy Preview Modal */}
      {
        showCopyPreviewModal && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[70] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl p-8 max-w-4xl w-full h-[80vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-black text-slate-900">معاينة النسخ وتعديله</h3>
                  <p className="text-xs font-bold text-slate-500 mt-1">يمكنك تعديل البيانات أدناه قبل النسخ النهائي (صيغة TSV المتوافقة مع Excel/Sheets)</p>
                </div>
                <button onClick={() => setShowCopyPreviewModal(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X className="w-6 h-6" /></button>
              </div>

              <div className="flex-1 bg-slate-50 rounded-xl border border-slate-200 overflow-hidden flex flex-col mb-6">
                <div className="px-4 py-2 border-b border-slate-200 bg-slate-100/50 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">محرر البيانات الخام (Raw Data Editor)</span>
                  <span className="text-[10px] font-bold text-slate-400">{copyPreviewData.split('\n').length} صفوف</span>
                </div>
                <textarea
                  value={copyPreviewData}
                  onChange={(e) => setCopyPreviewData(e.target.value)}
                  className="flex-1 w-full bg-slate-50 p-4 text-xs font-mono text-slate-600 focus:outline-none resize-none whitespace-pre"
                  spellCheck={false}
                />
              </div>

              <div className="flex items-center gap-4">
                <button
                  onClick={() => setShowCopyPreviewModal(false)}
                  className="px-6 py-4 rounded-xl text-xs font-black text-slate-500 hover:bg-slate-50 transition-colors"
                >
                  إلغاء
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(copyPreviewData).then(() => {
                      alert("✅ تم النسخ بنجاح!");
                      setShowCopyPreviewModal(false);
                    });
                  }}
                  className="flex-1 py-4 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"
                >
                  <Share2 className="w-4 h-4 ml-2" />
                  نسخ المحتوى النهائي للحافظة
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Progress Update Message Modal */}
      {showProgressModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Send className="w-5 h-5 text-violet-600" />
                  رسالة متابعة تقدم المشروع
                </h3>
                <p className="text-xs font-bold text-slate-500 mt-1">انسخ هذه الرسالة وأرسلها للفريق أو العميل</p>
              </div>
              <button onClick={() => setShowProgressModal(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X className="w-6 h-6" /></button>
            </div>

            <div className="flex-1 bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 overflow-hidden flex flex-col mb-6">
              <div className="px-4 py-3 border-b border-slate-200 bg-white/50 flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">📋 تقرير المشروع</span>
                <span className="text-xs font-bold text-violet-600 bg-violet-50 px-3 py-1 rounded-full">{activeContext.name}</span>
              </div>
              <textarea
                value={progressMessage}
                onChange={(e) => setProgressMessage(e.target.value)}
                className="flex-1 w-full bg-transparent p-5 text-sm font-mono text-slate-700 focus:outline-none resize-none whitespace-pre-wrap leading-relaxed min-h-[350px]"
                spellCheck={false}
                dir="rtl"
              />
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowProgressModal(false)}
                className="px-6 py-4 rounded-xl text-xs font-black text-slate-500 hover:bg-slate-50 transition-colors"
              >
                إغلاق
              </button>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(progressMessage).then(() => {
                    playSuccessSound();
                    alert("✅ تم نسخ رسالة المتابعة بنجاح!");
                  });
                }}
                className="flex-1 py-4 bg-violet-600 text-white rounded-xl font-black hover:bg-violet-700 transition-all shadow-lg shadow-violet-900/20 flex items-center justify-center gap-2"
              >
                <Share2 className="w-4 h-4 ml-2" />
                نسخ الرسالة للحافظة
              </button>
            </div>
          </div>
        </div>
      )}

      <PomodoroTimer
        projects={contexts.filter(c => c.id !== 'home' && c.group === 'projects').map(c => ({ id: c.id, name: c.name, color: c.color }))}
        currentProjectId={activeContextId}
        currentProjectName={activeContext.name}
        onSessionComplete={(session) => {
          console.log('Pomodoro session completed:', session);
        }}
      />

      {/* Categories Management Modal */}
      {showCategoriesModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[70] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-lg w-full flex flex-col shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-black text-slate-900 flex items-center gap-2">
                  <Target className="w-5 h-5 text-blue-500" />
                  إدارة التصنيفات
                </h3>
                <p className="text-xs font-bold text-slate-500 mt-1">تخصيص تصنيفات المهام لمشروع {activeContext.name}</p>
              </div>
              <button onClick={() => setShowCategoriesModal(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400"><X className="w-6 h-6" /></button>
            </div>

            {/* List Existing Categories */}
            <div className="flex-1 overflow-y-auto min-h-[200px] max-h-[300px] bg-slate-50 rounded-2xl border border-slate-100 p-4 mb-6 space-y-2 custom-scroll">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">التصنيفات المخصصة</h4>
              {activeContext.customCategories && activeContext.customCategories.length > 0 ? (
                activeContext.customCategories.map(cat => (
                  <div key={cat.id} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm group">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${cat.color}`} />
                      <span className="text-xs font-bold text-slate-700">{cat.name}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(cat.id)}
                      className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-slate-400 italic">لا توجد تصنيفات مخصصة بعد. أضف واحداً أدناه!</div>
              )}

              <div className="my-4 h-px bg-slate-200" />

              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">التصنيفات الافتراضية</h4>
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_CATEGORIES.map(cat => (
                  <div key={cat.id} className="flex items-center gap-2 p-2 bg-slate-100/50 rounded-lg opacity-60">
                    <div className={`w-2 h-2 rounded-full ${cat.color}`} />
                    <span className="text-[10px] font-medium text-slate-600">{cat.name}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Add New Category */}
            <div className="flex items-end gap-3 bg-white border-t border-slate-100 pt-4">
              <div className="flex-1 space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">اسم التصنيف الجديد</label>
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="مثلاً: مراجعة الكود، تصميم UI..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400">اللون</label>
                <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl p-1.5">
                  {['bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-purple-500', 'bg-orange-500'].map(color => (
                    <button
                      key={color}
                      onClick={() => setNewCategoryColor(color)}
                      className={`w-6 h-6 rounded-lg transition-all ${color} ${newCategoryColor === color ? 'ring-2 ring-offset-2 ring-slate-900 scale-110' : 'hover:scale-110 opacity-70 hover:opacity-100'}`}
                    />
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddCategory}
                disabled={!newCategoryName.trim()}
                className="h-[42px] px-6 bg-slate-900 text-white rounded-xl font-black text-xs hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-slate-900/20 transition-all flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                إضافة
              </button>
            </div>
          </div>
        </div>
      )}
    </div >
  );

  function renderTaskRow(task: Task) {
    const taskContext = contexts.find(c => c.id === task.contextId);
    const assignee = taskContext?.freelancers?.find(f => f.id === task.freelancerId);

    return (
      <TaskRow
        key={task.id}
        task={task}
        assignee={assignee}
        onToggleStatus={toggleTaskStatus}
        onSyncCalendar={syncToGoogleCalendar}
        onExportICS={(t) => exportToICS([t], activeContextId === 'home' ? 'Global' : activeContextId)} // Use exportToICS from import
        onOpenRice={setRiceTask}
        onEdit={setEditingTask}
        showContext={activeContextId === 'home'}
      />
    );
  }


};

export default App;
