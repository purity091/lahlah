import React, { useState, useMemo } from 'react';
import {
    FileText, Search, Plus, ChevronRight, Layout, Eye, AlertCircle,
    Map, ListChecks, Layers, PenTool, Code2, Rocket, LineChart, BookOpen,
    ShieldCheck, Trash2, X, Save, Filter, Grid3X3, List, Star,
    Clock, User, Tag, Check, MoreVertical, Sparkles, Target, Zap
} from 'lucide-react';
import {
    AppContext, PRDocument, ProductDocType, ProductPhase, DocSection,
    FeatureDocumentSchema, createEmptyFeatureDocument,
    VisionDocument, ProblemStatementDocument, PRDDocument,
    LaunchDocument, ExperimentDocument, DecisionLogDocument,
    createEmptyVisionDocument, createEmptyPRDDocument,
    createEmptyExperimentDocument, createEmptyDecisionLogDocument
} from '../types';
import { apiService } from '../services/apiService';
import FeatureDocumentEditor from './FeatureDocumentEditor';
import { VisionEditor, ProblemEditor, PRDEditor, LaunchEditor, ExperimentEditor, DecisionLogEditor } from './editors';

// =============================================================================
// Configuration & Constants
// =============================================================================

interface DocTypeConfig {
    id: ProductDocType | 'feature_rdp';
    label: string;
    labelShort: string;
    icon: any;
    phase: ProductPhase;
    description: string;
    color: string;
    defaultSections: { id: string; title: string; placeholder: string }[];
}

const DOC_CONFIG: Record<string, DocTypeConfig> = {
    // ⭐ Feature RDP - New Primary Type
    feature_rdp: {
        id: 'feature_rdp',
        label: 'وثيقة متطلبات الميزة (RDP)',
        labelShort: 'Feature RDP',
        icon: Target,
        phase: 'definition',
        description: 'الهيكل القياسي الكامل لتوثيق الميزات - 17 قسم منظم',
        color: 'from-violet-500 to-purple-600',
        defaultSections: []
    },
    // Discovery
    vision: {
        id: 'vision',
        label: 'وثيقة رؤية المنتج',
        labelShort: 'Vision',
        icon: Eye,
        phase: 'discovery',
        description: 'توحيد الفهم العام حول سبب وجود المنتج',
        color: 'from-purple-500 to-indigo-600',
        defaultSections: [
            { id: 'vision', title: 'الرؤية', placeholder: 'بناء منصة تساعد المستخدم على...' },
            { id: 'problem', title: 'المشكلة العامة', placeholder: 'السوق يفتقر إلى...' },
            { id: 'target_users', title: 'المستخدمون المستهدفون', placeholder: 'مستثمر فردي، صانع قرار...' },
            { id: 'value_prop', title: 'القيمة المقدمة', placeholder: 'تحليل، تفسير، شفافية...' },
            { id: 'out_of_scope', title: 'ما ليس ضمن المنتج', placeholder: 'لا نقدم توصيات شراء مباشرة...' }
        ]
    },
    problem: {
        id: 'problem',
        label: 'بيان المشكلة',
        labelShort: 'Problem',
        icon: AlertCircle,
        phase: 'discovery',
        description: 'توصيف المشكلة بدقة دون القفز للحلول',
        color: 'from-red-500 to-rose-600',
        defaultSections: [
            { id: 'context', title: 'سياق المستخدم', placeholder: 'يتابع عدة مصادر يومياً...' },
            { id: 'pain_points', title: 'نقاط الألم', placeholder: 'تضارب المعلومات...' },
            { id: 'evidence', title: 'الأدلة', placeholder: 'مقابلات، بيانات استخدام...' },
            { id: 'impact', title: 'الأثر', placeholder: 'قرارات بطيئة أو خاطئة...' }
        ]
    },
    // Strategy
    strategy: {
        id: 'strategy',
        label: 'استراتيجية المنتج',
        labelShort: 'Strategy',
        icon: Layout,
        phase: 'strategy',
        description: 'تحويل الرؤية إلى توجهات استراتيجية',
        color: 'from-blue-500 to-cyan-600',
        defaultSections: [
            { id: 'pillars', title: 'الركائز الاستراتيجية', placeholder: 'التفسير أهم من التنبؤ...' },
            { id: 'positioning', title: 'التموضع في السوق', placeholder: '' },
            { id: 'differentiators', title: 'عناصر التميز', placeholder: '' },
            { id: 'tradeoffs', title: 'التضحيات والاختيارات', placeholder: '' }
        ]
    },
    roadmap: {
        id: 'roadmap',
        label: 'خارطة الطريق',
        labelShort: 'Roadmap',
        icon: Map,
        phase: 'strategy',
        description: 'التسلسل المنطقي للتطوير',
        color: 'from-teal-500 to-emerald-600',
        defaultSections: [
            { id: 'themes', title: 'المحاور الرئيسية', placeholder: '' },
            { id: 'outcomes', title: 'النتائج المتوقعة', placeholder: '' },
            { id: 'timeline', title: 'الأفق الزمني', placeholder: 'Q1, Q2...' },
            { id: 'dependencies', title: 'الاعتمادات', placeholder: '' }
        ]
    },
    // Definition
    prd: {
        id: 'prd',
        label: 'وثيقة متطلبات المنتج (PRD)',
        labelShort: 'PRD',
        icon: ListChecks,
        phase: 'definition',
        description: 'تحويل المشكلة إلى متطلبات قابلة للتنفيذ',
        color: 'from-indigo-500 to-blue-600',
        defaultSections: [
            { id: 'background', title: 'الخلفية', placeholder: 'ناتجة عن إشارة سوق...' },
            { id: 'goals', title: 'الأهداف', placeholder: 'فهم الإشارة خلال 30 ثانية...' },
            { id: 'user_stories', title: 'قصص المستخدم', placeholder: 'كمستخدم أريد...' },
            { id: 'functional', title: 'المتطلبات الوظيفية', placeholder: '' },
            { id: 'non_functional', title: 'المتطلبات غير الوظيفية', placeholder: 'سرعة التحميل < 2 ثانية...' },
            { id: 'success_metrics', title: 'مؤشرات النجاح', placeholder: 'معدل التفاعل...' }
        ]
    },
    feature_spec: {
        id: 'feature_spec',
        label: 'مواصفات الميزة',
        labelShort: 'Feature Spec',
        icon: Layers,
        phase: 'definition',
        description: 'تفصيل كيفية عمل الميزة',
        color: 'from-cyan-500 to-teal-600',
        defaultSections: [
            { id: 'use_cases', title: 'حالات التشغيل', placeholder: '' },
            { id: 'permissions', title: 'الصلاحيات', placeholder: '' },
            { id: 'data_flow', title: 'تدفق البيانات', placeholder: '' },
            { id: 'error_handling', title: 'معالجة الأخطاء', placeholder: '' }
        ]
    },
    ux_spec: {
        id: 'ux_spec',
        label: 'مواصفات تجربة المستخدم',
        labelShort: 'UX Spec',
        icon: PenTool,
        phase: 'definition',
        description: 'ضمان تجربة واضحة ومتسقة',
        color: 'from-pink-500 to-rose-600',
        defaultSections: [
            { id: 'user_flows', title: 'مسارات المستخدم', placeholder: '' },
            { id: 'wireframes', title: 'الرسومات التخطيطية', placeholder: 'رابط Figma...' },
            { id: 'empty_states', title: 'الحالات الفارغة', placeholder: '' },
            { id: 'copy', title: 'النصوص الإرشادية', placeholder: '' }
        ]
    },
    // Execution
    tech_spec: {
        id: 'tech_spec',
        label: 'الوثائق التقنية',
        labelShort: 'Tech Spec',
        icon: Code2,
        phase: 'execution',
        description: 'البنية التقنية ونماذج البيانات',
        color: 'from-slate-500 to-gray-600',
        defaultSections: [
            { id: 'architecture', title: 'البنية العامة', placeholder: '' },
            { id: 'data_models', title: 'نماذج البيانات', placeholder: '' },
            { id: 'integrations', title: 'التكاملات', placeholder: '' },
            { id: 'constraints', title: 'القيود التقنية', placeholder: '' }
        ]
    },
    // Launch
    launch: {
        id: 'launch',
        label: 'وثيقة الإطلاق',
        labelShort: 'Launch',
        icon: Rocket,
        phase: 'launch',
        description: 'تنظيم إطلاق الميزة',
        color: 'from-emerald-500 to-green-600',
        defaultSections: [
            { id: 'audience', title: 'الجمهور المستهدف', placeholder: '' },
            { id: 'messaging', title: 'الرسائل الأساسية', placeholder: '' },
            { id: 'plan', title: 'خطة الإطلاق', placeholder: '' },
            { id: 'risks', title: 'المخاطر', placeholder: '' }
        ]
    },
    // Growth
    growth_exp: {
        id: 'growth_exp',
        label: 'وثيقة التجارب',
        labelShort: 'Experiment',
        icon: LineChart,
        phase: 'growth',
        description: 'توثيق التجارب والنتائج',
        color: 'from-orange-500 to-amber-600',
        defaultSections: [
            { id: 'hypothesis', title: 'الفرضية', placeholder: '' },
            { id: 'metric', title: 'المؤشر', placeholder: '' },
            { id: 'success_criteria', title: 'معيار النجاح', placeholder: '' },
            { id: 'decision', title: 'القرار', placeholder: '' }
        ]
    },
    scale_manual: {
        id: 'scale_manual',
        label: 'كتيب المنتج',
        labelShort: 'Manual',
        icon: BookOpen,
        phase: 'scale',
        description: 'دليل التشغيل والتوسع',
        color: 'from-amber-500 to-yellow-600',
        defaultSections: [{ id: 'manual', title: 'الدليل', placeholder: '' }]
    },
    governance_decision: {
        id: 'governance_decision',
        label: 'سجل القرارات',
        labelShort: 'Decision Log',
        icon: ShieldCheck,
        phase: 'governance',
        description: 'توثيق أسباب القرارات',
        color: 'from-red-500 to-pink-600',
        defaultSections: [
            { id: 'decision', title: 'القرار', placeholder: '' },
            { id: 'reason', title: 'السبب', placeholder: '' },
            { id: 'alternatives', title: 'البدائل المرفوضة', placeholder: '' },
            { id: 'date', title: 'التاريخ والمسؤول', placeholder: '' }
        ]
    }
};

const PHASE_CONFIG: Record<ProductPhase, { label: string; color: string; bgColor: string }> = {
    discovery: { label: 'الاكتشاف', color: 'text-purple-600', bgColor: 'bg-purple-50' },
    strategy: { label: 'الاستراتيجية', color: 'text-blue-600', bgColor: 'bg-blue-50' },
    definition: { label: 'التعريف', color: 'text-indigo-600', bgColor: 'bg-indigo-50' },
    execution: { label: 'التنفيذ', color: 'text-slate-600', bgColor: 'bg-slate-50' },
    launch: { label: 'الإطلاق', color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
    growth: { label: 'النمو', color: 'text-orange-600', bgColor: 'bg-orange-50' },
    scale: { label: 'التوسع', color: 'text-amber-600', bgColor: 'bg-amber-50' },
    governance: { label: 'الحوكمة', color: 'text-red-600', bgColor: 'bg-red-50' },
};

// =============================================================================
// Props Interface
// =============================================================================

interface ProductDocsViewProps {
    documents: PRDocument[];
    activeContextId: string;
    contexts: AppContext[];
    onUpdateDoc: (doc: PRDocument) => void;
    onCreateDoc: (doc: PRDocument) => void;
    onDeleteDoc: (docId: string) => void;
}

// =============================================================================
// Main Component
// =============================================================================

const ProductDocsView: React.FC<ProductDocsViewProps> = ({
    documents, activeContextId, contexts, onUpdateDoc, onCreateDoc, onDeleteDoc
}) => {
    // State
    const [activePhase, setActivePhase] = useState<ProductPhase | 'all'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [editingDoc, setEditingDoc] = useState<PRDocument | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [newDocData, setNewDocData] = useState<{ title: string; type: ProductDocType | 'feature_rdp' }>({ title: '', type: 'feature_rdp' });

    // Feature RDP Editor State
    const [featureRdpEditor, setFeatureRdpEditor] = useState<{
        isOpen: boolean;
        document: FeatureDocumentSchema | null;
        isNew: boolean;
        docId?: string;
    }>({ isOpen: false, document: null, isNew: false });

    // Advanced Editors State
    const [activeEditor, setActiveEditor] = useState<{
        type: 'vision' | 'problem' | 'prd' | 'launch' | 'experiment' | 'decision_log' | null;
        document: any;
        isNew: boolean;
        docId?: string;
    }>({ type: null, document: null, isNew: false });


    // Get active context
    const activeContext = contexts.find(c => c.id === activeContextId) || contexts[0];

    // Filter documents
    const filteredDocs = useMemo(() => {
        return documents.filter(doc => {
            const matchesContext = doc.contextId === activeContextId;
            const matchesPhase = activePhase === 'all' || (DOC_CONFIG[doc.type]?.phase === activePhase);
            const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesContext && matchesPhase && matchesSearch;
        });
    }, [documents, activeContextId, activePhase, searchQuery]);

    // Stats
    const stats = useMemo(() => {
        const contextDocs = documents.filter(d => d.contextId === activeContextId);
        return {
            total: contextDocs.length,
            byPhase: Object.keys(PHASE_CONFIG).reduce((acc, phase) => {
                acc[phase] = contextDocs.filter(d => DOC_CONFIG[d.type]?.phase === phase).length;
                return acc;
            }, {} as Record<string, number>),
            featureRdp: contextDocs.filter(d => d.type === 'feature_rdp' || d.schemaType === 'feature_rdp').length
        };
    }, [documents, activeContextId]);

    // Create Handler
    const handleCreate = () => {
        setIsCreating(false);

        // Advanced document types with dedicated editors
        const advancedTypes = ['vision', 'problem', 'prd', 'launch', 'growth_exp', 'governance_decision'];

        if (newDocData.type === 'feature_rdp') {
            const newFeatureDoc = createEmptyFeatureDocument(activeContextId, newDocData.title);
            setFeatureRdpEditor({ isOpen: true, document: newFeatureDoc, isNew: true });
        } else if (newDocData.type === 'vision') {
            const doc = createEmptyVisionDocument(activeContextId);
            doc.vision.statement = newDocData.title;
            setActiveEditor({ type: 'vision', document: doc, isNew: true });
        } else if (newDocData.type === 'problem') {
            const doc: ProblemStatementDocument = {
                metadata: { documentId: crypto.randomUUID(), projectId: activeContextId, version: '1.0.0', status: 'draft', createdAt: Date.now(), updatedAt: null, author: '' },
                userContext: { persona: '', currentJourney: '', environment: '', frequency: '', triggers: [] },
                painPoints: [], evidence: [],
                impact: { onUser: { description: '', metrics: [] }, onBusiness: { description: '', estimatedCost: null, metrics: [] }, emotional: [] },
                stateComparison: { currentState: '', desiredState: '', obstacles: [] },
                problemSummary: { statement: newDocData.title, hypothesis: '' }
            };
            setActiveEditor({ type: 'problem', document: doc, isNew: true });
        } else if (newDocData.type === 'prd') {
            const doc = createEmptyPRDDocument(activeContextId);
            doc.goals.primary = newDocData.title;
            setActiveEditor({ type: 'prd', document: doc, isNew: true });
        } else if (newDocData.type === 'launch') {
            const doc: LaunchDocument = {
                metadata: { documentId: crypto.randomUUID(), projectId: activeContextId, featureRef: '', launchDate: '', status: 'planning', createdAt: Date.now(), updatedAt: null, launchLead: '' },
                targetAudience: [], rolloutPlan: [], messaging: [], prelaunchChecklist: [], risks: [], postLaunchMetrics: [],
                rollbackPlan: { trigger: '', steps: [], estimatedTime: '', notificationPlan: '' }
            };
            setActiveEditor({ type: 'launch', document: doc, isNew: true });
        } else if (newDocData.type === 'growth_exp') {
            const doc = createEmptyExperimentDocument(activeContextId);
            doc.hypothesis.statement = newDocData.title;
            setActiveEditor({ type: 'experiment', document: doc, isNew: true });
        } else if (newDocData.type === 'governance_decision') {
            const doc = createEmptyDecisionLogDocument(activeContextId);
            doc.decision.title = newDocData.title;
            setActiveEditor({ type: 'decision_log', document: doc, isNew: true });
        } else {
            // Legacy document creation
            const config = DOC_CONFIG[newDocData.type];
            const newDoc: PRDocument = {
                id: crypto.randomUUID(),
                contextId: activeContextId,
                title: newDocData.title,
                type: newDocData.type as ProductDocType,
                phase: config?.phase,
                status: 'draft',
                createdAt: Date.now(),
                updatedAt: Date.now(),
                content: { problemStatement: '', goals: [], userStories: [], acceptanceCriteria: [], techNotes: '' },
                sections: config?.defaultSections?.map(s => ({ ...s, content: '' })) || []
            };
            onCreateDoc(newDoc);
            setEditingDoc(newDoc);
        }

        setNewDocData({ title: '', type: 'feature_rdp' });
    };

    // Handle Feature RDP Save
    const handleFeatureRdpSave = (featureDoc: FeatureDocumentSchema) => {
        const prDocument: PRDocument = {
            id: featureRdpEditor.docId || crypto.randomUUID(),
            contextId: activeContextId,
            title: featureDoc.definition.title,
            type: 'feature_rdp',
            phase: featureDoc.metadata.phase || 'definition',
            status: featureDoc.metadata.status as any,
            createdAt: featureDoc.definition.createdAt,
            updatedAt: Date.now(),
            content: featureDoc,
            schemaType: 'feature_rdp',
            schemaVersion: featureDoc.metadata.schemaVersion
        };

        if (featureRdpEditor.isNew) {
            onCreateDoc(prDocument);
        } else {
            onUpdateDoc(prDocument);
        }

        setFeatureRdpEditor({ isOpen: false, document: null, isNew: false });
    };

    // Handle Advanced Editor Save
    const handleAdvancedEditorSave = (doc: any, docType: string, title: string) => {
        const phase = DOC_CONFIG[docType]?.phase || 'definition';
        const prDocument: PRDocument = {
            id: activeEditor.docId || crypto.randomUUID(),
            contextId: activeContextId,
            title: title,
            type: docType as ProductDocType,
            phase: phase,
            status: doc.metadata?.status || 'draft',
            createdAt: doc.metadata?.createdAt || Date.now(),
            updatedAt: Date.now(),
            content: doc,
            schemaType: docType as PRDocument['schemaType']
        };

        if (activeEditor.isNew) {
            onCreateDoc(prDocument);
        } else {
            onUpdateDoc(prDocument);
        }

        setActiveEditor({ type: null, document: null, isNew: false });
    };

    // Open document for editing
    const handleOpenDoc = (doc: PRDocument) => {
        if (doc.type === 'feature_rdp' || doc.schemaType === 'feature_rdp') {
            setFeatureRdpEditor({
                isOpen: true,
                document: doc.content as FeatureDocumentSchema,
                isNew: false,
                docId: doc.id
            });
        } else if (doc.type === 'vision' || doc.schemaType === 'vision') {
            setActiveEditor({ type: 'vision', document: doc.content as VisionDocument, isNew: false, docId: doc.id });
        } else if (doc.type === 'problem' || doc.schemaType === 'problem') {
            setActiveEditor({ type: 'problem', document: doc.content as ProblemStatementDocument, isNew: false, docId: doc.id });
        } else if (doc.type === 'prd' || doc.schemaType === 'prd') {
            setActiveEditor({ type: 'prd', document: doc.content as PRDDocument, isNew: false, docId: doc.id });
        } else if (doc.type === 'launch' || doc.schemaType === 'launch') {
            setActiveEditor({ type: 'launch', document: doc.content as LaunchDocument, isNew: false, docId: doc.id });
        } else if (doc.type === 'growth_exp' || doc.schemaType === 'experiment') {
            setActiveEditor({ type: 'experiment', document: doc.content as ExperimentDocument, isNew: false, docId: doc.id });
        } else if (doc.type === 'governance_decision' || doc.schemaType === 'decision_log') {
            setActiveEditor({ type: 'decision_log', document: doc.content as DecisionLogDocument, isNew: false, docId: doc.id });
        } else {
            setEditingDoc(doc);
        }
    };

    // Save Legacy Doc
    const handleSaveEdit = () => {
        if (editingDoc) {
            onUpdateDoc({ ...editingDoc, updatedAt: Date.now() });
            setEditingDoc(null);
        }
    };

    // Get document type info
    const getDocTypeInfo = (type: string) => {
        return DOC_CONFIG[type] || DOC_CONFIG['prd'];
    };

    return (
        <div className="min-h-full animate-in fade-in duration-500">
            {/* Header Section */}
            <div className="mb-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl text-white shadow-lg shadow-indigo-500/30">
                                <FileText className="w-5 h-5" />
                            </div>
                            <h1 className="text-2xl font-black text-slate-900">مركز وثائق المنتج</h1>
                        </div>
                        <p className="text-sm text-slate-500 font-medium">
                            إدارة وتوثيق متطلبات المنتج والميزات لـ {activeContext?.name}
                        </p>
                    </div>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center gap-2 bg-gradient-to-r from-slate-900 to-slate-800 text-white px-5 py-3 rounded-xl text-sm font-black hover:from-slate-800 hover:to-slate-700 transition-all shadow-lg shadow-slate-900/30"
                    >
                        <Plus className="w-4 h-4" />
                        وثيقة جديدة
                    </button>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">إجمالي الوثائق</span>
                            <FileText className="w-4 h-4 text-slate-300" />
                        </div>
                        <p className="text-2xl font-black text-slate-900">{stats.total}</p>
                    </div>
                    <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-2xl p-4">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-violet-500 uppercase">Feature RDP</span>
                            <Target className="w-4 h-4 text-violet-400" />
                        </div>
                        <p className="text-2xl font-black text-violet-700">{stats.featureRdp}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">التعريف</span>
                            <ListChecks className="w-4 h-4 text-indigo-400" />
                        </div>
                        <p className="text-2xl font-black text-slate-900">{stats.byPhase['definition'] || 0}</p>
                    </div>
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">الاستراتيجية</span>
                            <Layout className="w-4 h-4 text-blue-400" />
                        </div>
                        <p className="text-2xl font-black text-slate-900">{stats.byPhase['strategy'] || 0}</p>
                    </div>
                </div>

                {/* Filters & Controls */}
                <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                        {/* Search */}
                        <div className="relative flex-1 max-w-md w-full">
                            <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="بحث في الوثائق..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 text-sm font-bold focus:outline-none focus:border-slate-400 focus:bg-white transition-all"
                            />
                        </div>

                        {/* Phase Filter */}
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={() => setActivePhase('all')}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activePhase === 'all'
                                    ? 'bg-slate-900 text-white'
                                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                    }`}
                            >
                                الكل ({stats.total})
                            </button>
                            {Object.entries(PHASE_CONFIG).slice(0, 4).map(([phase, config]) => (
                                <button
                                    key={phase}
                                    onClick={() => setActivePhase(phase as ProductPhase)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activePhase === phase
                                        ? `${config.bgColor} ${config.color}`
                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                        }`}
                                >
                                    {config.label}
                                </button>
                            ))}
                        </div>

                        {/* View Toggle */}
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                            >
                                <Grid3X3 className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}
                            >
                                <List className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Documents Grid/List */}
            {filteredDocs.length > 0 ? (
                <div className={viewMode === 'grid'
                    ? "grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4"
                    : "space-y-3"
                }>
                    {filteredDocs.map(doc => {
                        const typeConfig = getDocTypeInfo(doc.type);
                        const phaseConfig = PHASE_CONFIG[typeConfig.phase] || PHASE_CONFIG['definition'];
                        const Icon = typeConfig.icon;
                        const isFeatureRdp = doc.type === 'feature_rdp' || doc.schemaType === 'feature_rdp';

                        if (viewMode === 'list') {
                            return (
                                <div
                                    key={doc.id}
                                    onClick={() => handleOpenDoc(doc)}
                                    className="group bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md hover:border-slate-300 transition-all cursor-pointer flex items-center gap-4"
                                >
                                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${typeConfig.color} text-white shrink-0`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-sm font-black text-slate-900 truncate">{doc.title}</h3>
                                            {isFeatureRdp && (
                                                <span className="shrink-0 px-2 py-0.5 bg-violet-100 text-violet-600 text-[9px] font-bold rounded-full flex items-center gap-1">
                                                    <Sparkles className="w-2.5 h-2.5" />
                                                    RDP
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-slate-400">
                                            <span className="font-bold">{typeConfig.labelShort}</span>
                                            <span>•</span>
                                            <span className={phaseConfig.color}>{phaseConfig.label}</span>
                                            <span>•</span>
                                            <span>{new Date(doc.createdAt).toLocaleDateString('ar-SA')}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${doc.status === 'approved' ? 'bg-emerald-50 text-emerald-600' :
                                            doc.status === 'in_review' ? 'bg-amber-50 text-amber-600' :
                                                'bg-slate-50 text-slate-500'
                                            }`}>
                                            {doc.status || 'draft'}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div
                                key={doc.id}
                                onClick={() => handleOpenDoc(doc)}
                                className="group bg-white border border-slate-200 rounded-2xl p-5 hover:shadow-lg hover:border-slate-300 transition-all cursor-pointer relative overflow-hidden"
                            >
                                {/* Gradient Border Top */}
                                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${typeConfig.color}`} />

                                {/* Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className={`p-2.5 rounded-xl bg-gradient-to-br ${typeConfig.color} text-white shadow-lg`}>
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isFeatureRdp && (
                                            <span className="px-2 py-0.5 bg-violet-100 text-violet-600 text-[9px] font-bold rounded-full flex items-center gap-1">
                                                <Sparkles className="w-2.5 h-2.5" />
                                                RDP
                                            </span>
                                        )}
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${doc.status === 'approved' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                                            doc.status === 'in_review' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                                'bg-slate-50 text-slate-500 border border-slate-100'
                                            }`}>
                                            {doc.status || 'draft'}
                                        </span>
                                    </div>
                                </div>

                                {/* Title */}
                                <h3 className="text-base font-black text-slate-900 mb-2 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                                    {doc.title}
                                </h3>

                                {/* Type & Phase */}
                                <div className="flex items-center gap-2 mb-4">
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${phaseConfig.bgColor} ${phaseConfig.color}`}>
                                        {phaseConfig.label}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold">{typeConfig.labelShort}</span>
                                </div>

                                {/* Preview */}
                                <p className="text-xs text-slate-500 line-clamp-2 mb-4 min-h-[32px]">
                                    {isFeatureRdp
                                        ? (doc.content?.definition?.summary || doc.content?.problem?.description || 'وثيقة متطلبات ميزة شاملة...')
                                        : (doc.sections?.[0]?.content?.slice(0, 100) || doc.content?.problemStatement?.slice(0, 100) || 'لا يوجد محتوى...')
                                    }
                                </p>

                                {/* Footer */}
                                <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                                    <div className="flex items-center gap-2 text-[10px] text-slate-400">
                                        <Clock className="w-3 h-3" />
                                        <span>{new Date(doc.createdAt).toLocaleDateString('ar-SA')}</span>
                                    </div>
                                    <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 group-hover:text-indigo-600 transition-colors">
                                        فتح <ChevronRight className="w-3 h-3" />
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl py-20 text-center">
                    <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                        <FileText className="w-8 h-8" />
                    </div>
                    <p className="text-sm font-bold text-slate-400 mb-1">لا توجد وثائق مطابقة</p>
                    <p className="text-xs text-slate-400">أنشئ وثيقة جديدة للبدء في توثيق متطلبات المنتج</p>
                    <button
                        onClick={() => setIsCreating(true)}
                        className="mt-4 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all"
                    >
                        <Plus className="w-4 h-4 inline-block ml-1" />
                        إنشاء وثيقة
                    </button>
                </div>
            )}

            {/* Create Document Modal */}
            {isCreating && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-100 max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-slate-900">إنشاء وثيقة جديدة</h3>
                                <p className="text-sm text-slate-500 mt-1">اختر نوع الوثيقة وأدخل العنوان</p>
                            </div>
                            <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-slate-50 rounded-xl text-slate-400">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="space-y-6">
                            {/* Title Input */}
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 mb-2">عنوان الوثيقة</label>
                                <input
                                    autoFocus
                                    value={newDocData.title}
                                    onChange={e => setNewDocData({ ...newDocData, title: e.target.value })}
                                    placeholder="مثلاً: ميزة لوحة التحكم المتقدمة..."
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-slate-900 focus:bg-white transition-all"
                                />
                            </div>

                            {/* Document Type Selection */}
                            <div>
                                <label className="block text-xs font-black uppercase text-slate-400 mb-3">نوع الوثيقة</label>

                                {/* Featured: Feature RDP */}
                                <div
                                    onClick={() => setNewDocData({ ...newDocData, type: 'feature_rdp' })}
                                    className={`mb-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${newDocData.type === 'feature_rdp'
                                        ? 'border-violet-500 bg-gradient-to-r from-violet-50 to-purple-50'
                                        : 'border-slate-200 hover:border-violet-300'
                                        }`}
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                                            <Target className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-base font-black text-slate-900">وثيقة متطلبات الميزة (Feature RDP)</h4>
                                                <span className="px-2 py-0.5 bg-violet-500 text-white text-[9px] font-bold rounded-full flex items-center gap-1">
                                                    <Star className="w-2.5 h-2.5" /> موصى
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-500 mb-2">الهيكل القياسي الكامل لتوثيق الميزات - 17 قسم منظم</p>
                                            <div className="flex flex-wrap gap-1">
                                                {['تعريف الميزة', 'المشكلة', 'المستخدمون', 'المتطلبات', 'معايير القبول', 'المخاطر', '...'].map((tag, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-white rounded text-[9px] font-bold text-slate-400 border border-slate-100">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                        {newDocData.type === 'feature_rdp' && (
                                            <div className="p-1 bg-violet-500 rounded-full text-white">
                                                <Check className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Other Document Types */}
                                <p className="text-xs font-bold text-slate-400 mb-2">أو اختر من الأنواع الأخرى:</p>
                                <div className="grid grid-cols-2 gap-2 max-h-[250px] overflow-y-auto pr-1">
                                    {Object.values(DOC_CONFIG).filter(c => c.id !== 'feature_rdp').map(config => (
                                        <button
                                            key={config.id}
                                            onClick={() => setNewDocData({ ...newDocData, type: config.id as any })}
                                            className={`p-3 rounded-xl border text-right transition-all flex items-center gap-3 ${newDocData.type === config.id
                                                ? 'border-slate-900 bg-slate-900 text-white'
                                                : 'border-slate-200 hover:border-slate-400 text-slate-600'
                                                }`}
                                        >
                                            <div className={`p-2 rounded-lg shrink-0 ${newDocData.type === config.id
                                                ? 'bg-white/20'
                                                : `bg-gradient-to-br ${config.color} text-white`
                                                }`}>
                                                {React.createElement(config.icon, { className: 'w-4 h-4' })}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-black truncate">{config.labelShort}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={handleCreate}
                                disabled={!newDocData.title}
                                className="w-full py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl font-black hover:from-slate-800 hover:to-slate-700 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 mt-4 flex items-center justify-center gap-2"
                            >
                                <Plus className="w-4 h-4" /> إنشاء الوثيقة
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Legacy Document Editor Modal */}
            {editingDoc && !featureRdpEditor.isOpen && (
                <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-[100] flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col border border-slate-200">
                        {/* Header */}
                        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0">
                            <div className="flex items-center gap-4">
                                <div className={`p-2 rounded-xl bg-gradient-to-br ${getDocTypeInfo(editingDoc.type).color} text-white`}>
                                    {React.createElement(getDocTypeInfo(editingDoc.type).icon, { className: 'w-5 h-5' })}
                                </div>
                                <div>
                                    <input
                                        value={editingDoc.title}
                                        onChange={e => setEditingDoc({ ...editingDoc, title: e.target.value })}
                                        className="text-xl font-black text-slate-900 bg-transparent focus:outline-none placeholder:text-slate-300 w-full"
                                        placeholder="عنوان الوثيقة"
                                    />
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-xs font-bold text-slate-500">{getDocTypeInfo(editingDoc.type).label}</span>
                                        <span className="text-[10px] px-2 py-0.5 bg-slate-100 rounded text-slate-500 uppercase">{editingDoc.status}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={() => onDeleteDoc(editingDoc.id)} className="p-2 text-slate-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all">
                                    <Trash2 className="w-5 h-5" />
                                </button>
                                <button onClick={() => setEditingDoc(null)} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all">
                                    <X className="w-6 h-6" />
                                </button>
                                <button onClick={handleSaveEdit} className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 mr-2">
                                    <Save className="w-4 h-4" /> حفظ
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="max-w-3xl mx-auto space-y-8">
                                {editingDoc.sections && editingDoc.sections.length > 0 ? (
                                    editingDoc.sections.map((section, idx) => (
                                        <div key={idx} className="group">
                                            <label className="block text-sm font-black text-slate-800 mb-2 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>
                                                {section.title}
                                            </label>
                                            <textarea
                                                value={section.content}
                                                onChange={e => {
                                                    const newSections = [...(editingDoc.sections || [])];
                                                    newSections[idx] = { ...section, content: e.target.value };
                                                    setEditingDoc({ ...editingDoc, sections: newSections });
                                                }}
                                                placeholder={section.placeholder}
                                                className="w-full min-h-[120px] p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm leading-relaxed focus:outline-none focus:border-slate-400 focus:bg-white transition-all resize-y placeholder:text-slate-300"
                                            />
                                        </div>
                                    ))
                                ) : (
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-sm font-black text-slate-800 mb-2">بيان المشكلة</label>
                                            <textarea
                                                value={editingDoc.content?.problemStatement || ''}
                                                onChange={e => setEditingDoc({ ...editingDoc, content: { ...editingDoc.content, problemStatement: e.target.value } })}
                                                className="w-full min-h-[100px] p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm"
                                            />
                                        </div>
                                        <div className="p-4 bg-amber-50 rounded-xl text-amber-700 text-xs font-bold flex items-center gap-2">
                                            <AlertCircle className="w-4 h-4" />
                                            هذه وثيقة من النظام القديم. يفضل إنشاء وثائق جديدة للاستفادة من الهيكلية المحدثة.
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Feature RDP Editor */}
            {featureRdpEditor.isOpen && (
                <FeatureDocumentEditor
                    document={featureRdpEditor.document}
                    projectId={activeContextId}
                    onSave={handleFeatureRdpSave}
                    onClose={() => setFeatureRdpEditor({ isOpen: false, document: null, isNew: false })}
                    isNew={featureRdpEditor.isNew}
                />
            )}

            {/* Vision Editor */}
            {activeEditor.type === 'vision' && (
                <VisionEditor
                    document={activeEditor.document}
                    projectId={activeContextId}
                    onSave={(doc) => handleAdvancedEditorSave(doc, 'vision', doc.vision.statement || 'وثيقة رؤية جديدة')}
                    onClose={() => setActiveEditor({ type: null, document: null, isNew: false })}
                    isNew={activeEditor.isNew}
                />
            )}

            {/* Problem Editor */}
            {activeEditor.type === 'problem' && (
                <ProblemEditor
                    document={activeEditor.document}
                    projectId={activeContextId}
                    onSave={(doc) => handleAdvancedEditorSave(doc, 'problem', doc.problemSummary.statement || 'بيان مشكلة جديد')}
                    onClose={() => setActiveEditor({ type: null, document: null, isNew: false })}
                    isNew={activeEditor.isNew}
                />
            )}

            {/* PRD Editor */}
            {activeEditor.type === 'prd' && (
                <PRDEditor
                    document={activeEditor.document}
                    projectId={activeContextId}
                    onSave={(doc) => handleAdvancedEditorSave(doc, 'prd', doc.goals.primary || 'وثيقة PRD جديدة')}
                    onClose={() => setActiveEditor({ type: null, document: null, isNew: false })}
                    isNew={activeEditor.isNew}
                />
            )}

            {/* Launch Editor */}
            {activeEditor.type === 'launch' && (
                <LaunchEditor
                    document={activeEditor.document}
                    projectId={activeContextId}
                    onSave={(doc) => handleAdvancedEditorSave(doc, 'launch', `إطلاق ${doc.metadata.launchDate || 'جديد'}`)}
                    onClose={() => setActiveEditor({ type: null, document: null, isNew: false })}
                    isNew={activeEditor.isNew}
                />
            )}

            {/* Experiment Editor */}
            {activeEditor.type === 'experiment' && (
                <ExperimentEditor
                    document={activeEditor.document}
                    projectId={activeContextId}
                    onSave={(doc) => handleAdvancedEditorSave(doc, 'growth_exp', doc.hypothesis.statement || 'تجربة جديدة')}
                    onClose={() => setActiveEditor({ type: null, document: null, isNew: false })}
                    isNew={activeEditor.isNew}
                />
            )}

            {/* Decision Log Editor */}
            {activeEditor.type === 'decision_log' && (
                <DecisionLogEditor
                    document={activeEditor.document}
                    projectId={activeContextId}
                    onSave={(doc) => handleAdvancedEditorSave(doc, 'governance_decision', doc.decision.title || 'قرار جديد')}
                    onClose={() => setActiveEditor({ type: null, document: null, isNew: false })}
                    isNew={activeEditor.isNew}
                />
            )}
        </div>
    );
};

export default ProductDocsView;
