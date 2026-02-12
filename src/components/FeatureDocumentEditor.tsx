import React, { useState, useMemo } from 'react';
import {
    X, Save, Plus, Trash2, ChevronDown, ChevronRight,
    FileText, AlertCircle, Users, Target, ListChecks, Settings,
    Shield, Link2, AlertTriangle, TrendingUp, Database, MessageSquare,
    Tag, Clock, User, Hash
} from 'lucide-react';
import {
    FeatureDocumentSchema, FeatureDefinition, ProblemStatement, TargetUser,
    ObjectiveAndValue, UseCase, FunctionalRequirement, NonFunctionalRequirement,
    AcceptanceCriterion, OutOfScope, Assumption, Constraint, Dependency,
    Risk, SuccessMetric, DataSource, NoteOrQuestion, FeatureMetadata,
    createEmptyFeatureDocument, validateFeatureDocument, ProductPhase
} from '../types';

// =============================================================================
// Section Configuration
// =============================================================================

interface SectionConfig {
    id: keyof FeatureDocumentSchema;
    label: string;
    labelAr: string;
    icon: any;
    color: string;
    description: string;
}

const SECTIONS_CONFIG: SectionConfig[] = [
    { id: 'definition', label: 'Definition', labelAr: 'تعريف الميزة', icon: FileText, color: 'bg-blue-500', description: 'العنوان والملخص' },
    { id: 'problem', label: 'Problem', labelAr: 'المشكلة والتأثير', icon: AlertCircle, color: 'bg-red-500', description: 'وصف المشكلة' },
    { id: 'targetUsers', label: 'Target Users', labelAr: 'المستخدمون المستهدفون', icon: Users, color: 'bg-purple-500', description: 'فئات المستخدمين' },
    { id: 'objective', label: 'Objectives', labelAr: 'الهدف والقيمة', icon: Target, color: 'bg-green-500', description: 'الأهداف والقيمة' },
    { id: 'useCases', label: 'Use Cases', labelAr: 'حالات الاستخدام', icon: ListChecks, color: 'bg-indigo-500', description: 'سيناريوهات الاستخدام' },
    { id: 'functionalRequirements', label: 'Functional Req.', labelAr: 'المتطلبات الوظيفية', icon: Settings, color: 'bg-cyan-500', description: 'ما يجب أن تفعله الميزة' },
    { id: 'nonFunctionalRequirements', label: 'Non-Functional Req.', labelAr: 'المتطلبات غير الوظيفية', icon: Shield, color: 'bg-teal-500', description: 'الأداء والأمان' },
    { id: 'acceptanceCriteria', label: 'Acceptance Criteria', labelAr: 'معايير القبول', icon: ListChecks, color: 'bg-emerald-500', description: 'شروط النجاح' },
    { id: 'outOfScope', label: 'Out of Scope', labelAr: 'خارج النطاق', icon: X, color: 'bg-slate-500', description: 'ما ليس ضمن الميزة' },
    { id: 'assumptions', label: 'Assumptions', labelAr: 'الافتراضات', icon: MessageSquare, color: 'bg-amber-500', description: 'الفرضيات الأساسية' },
    { id: 'constraints', label: 'Constraints', labelAr: 'القيود والحدود', icon: Shield, color: 'bg-orange-500', description: 'القيود التقنية والتجارية' },
    { id: 'dependencies', label: 'Dependencies', labelAr: 'الاعتماديات', icon: Link2, color: 'bg-pink-500', description: 'الاعتماديات الداخلية والخارجية' },
    { id: 'risks', label: 'Risks', labelAr: 'المخاطر', icon: AlertTriangle, color: 'bg-red-600', description: 'المخاطر المحتملة' },
    { id: 'successMetrics', label: 'Success Metrics', labelAr: 'مؤشرات النجاح', icon: TrendingUp, color: 'bg-green-600', description: 'كيفية قياس النجاح' },
    { id: 'dataSources', label: 'Data Sources', labelAr: 'مصادر البيانات', icon: Database, color: 'bg-violet-500', description: 'مصادر البيانات المطلوبة' },
    { id: 'notesAndQuestions', label: 'Notes & Questions', labelAr: 'الملاحظات والأسئلة', icon: MessageSquare, color: 'bg-yellow-500', description: 'أسئلة مفتوحة وملاحظات' },
    { id: 'metadata', label: 'Metadata', labelAr: 'البيانات الوصفية', icon: Tag, color: 'bg-gray-500', description: 'معلومات إدارية' },
];

// =============================================================================
// Component Props
// =============================================================================

interface FeatureDocumentEditorProps {
    document: FeatureDocumentSchema | null;
    projectId: string;
    onSave: (doc: FeatureDocumentSchema) => void;
    onClose: () => void;
    isNew?: boolean;
}

// =============================================================================
// Main Component
// =============================================================================

const FeatureDocumentEditor: React.FC<FeatureDocumentEditorProps> = ({
    document,
    projectId,
    onSave,
    onClose,
    isNew = false
}) => {
    // Initialize document
    const [doc, setDoc] = useState<FeatureDocumentSchema>(() => {
        if (document) return document;
        return createEmptyFeatureDocument(projectId, '');
    });

    const [activeSection, setActiveSection] = useState<keyof FeatureDocumentSchema>('definition');
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['definition']));
    const [errors, setErrors] = useState<string[]>([]);

    // Toggle section expansion
    const toggleSection = (sectionId: string) => {
        const newSet = new Set(expandedSections);
        if (newSet.has(sectionId)) {
            newSet.delete(sectionId);
        } else {
            newSet.add(sectionId);
        }
        setExpandedSections(newSet);
    };

    // Validate and save
    const handleSave = () => {
        // Update timestamp
        const updatedDoc = {
            ...doc,
            definition: { ...doc.definition, updatedAt: Date.now() }
        };

        const validation = validateFeatureDocument(updatedDoc);
        if (!validation.valid) {
            setErrors(validation.errors);
            return;
        }

        setErrors([]);
        onSave(updatedDoc);
    };

    // Get section completion status
    const getSectionStatus = (sectionId: keyof FeatureDocumentSchema): 'empty' | 'partial' | 'complete' => {
        const section = doc[sectionId];
        if (Array.isArray(section)) {
            return section.length === 0 ? 'empty' : 'complete';
        }
        if (typeof section === 'object' && section !== null) {
            const values = Object.values(section);
            const filled = values.filter(v => v !== null && v !== '' && (Array.isArray(v) ? v.length > 0 : true));
            if (filled.length === 0) return 'empty';
            if (filled.length === values.length) return 'complete';
            return 'partial';
        }
        return 'empty';
    };

    // =============================================================================
    // Section Editors
    // =============================================================================

    // Definition Editor
    const DefinitionEditor = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-black text-slate-500 mb-2">العنوان *</label>
                <input
                    type="text"
                    value={doc.definition.title}
                    onChange={e => setDoc({ ...doc, definition: { ...doc.definition, title: e.target.value } })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-lg font-bold focus:outline-none focus:border-slate-400"
                    placeholder="اسم الميزة..."
                />
            </div>
            <div>
                <label className="block text-xs font-black text-slate-500 mb-2">الملخص</label>
                <textarea
                    value={doc.definition.summary || ''}
                    onChange={e => setDoc({ ...doc, definition: { ...doc.definition, summary: e.target.value || null } })}
                    className="w-full min-h-[100px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-slate-400"
                    placeholder="وصف مختصر للميزة..."
                />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-black text-slate-500 mb-2">الإصدار</label>
                    <input
                        type="text"
                        value={doc.definition.version || ''}
                        onChange={e => setDoc({ ...doc, definition: { ...doc.definition, version: e.target.value || null } })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none"
                        placeholder="1.0.0"
                    />
                </div>
                <div>
                    <label className="block text-xs font-black text-slate-500 mb-2">المنشئ</label>
                    <input
                        type="text"
                        value={doc.definition.author || ''}
                        onChange={e => setDoc({ ...doc, definition: { ...doc.definition, author: e.target.value || null } })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none"
                        placeholder="اسم المؤلف..."
                    />
                </div>
            </div>
        </div>
    );

    // Problem Editor
    const ProblemEditor = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-black text-slate-500 mb-2">وصف المشكلة</label>
                <textarea
                    value={doc.problem.description || ''}
                    onChange={e => setDoc({ ...doc, problem: { ...doc.problem, description: e.target.value || null } })}
                    className="w-full min-h-[100px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none"
                    placeholder="ما هي المشكلة التي تحلها هذه الميزة؟"
                />
            </div>
            <div>
                <label className="block text-xs font-black text-slate-500 mb-2">التأثير</label>
                <textarea
                    value={doc.problem.impact || ''}
                    onChange={e => setDoc({ ...doc, problem: { ...doc.problem, impact: e.target.value || null } })}
                    className="w-full min-h-[80px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none"
                    placeholder="ما تأثير هذه المشكلة على المستخدمين والأعمال?"
                />
            </div>
            <div>
                <label className="block text-xs font-black text-slate-500 mb-2">الوضع الحالي</label>
                <textarea
                    value={doc.problem.currentState || ''}
                    onChange={e => setDoc({ ...doc, problem: { ...doc.problem, currentState: e.target.value || null } })}
                    className="w-full min-h-[80px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none"
                    placeholder="كيف يتعامل المستخدمون مع هذه المشكلة حالياً؟"
                />
            </div>
            <div>
                <label className="block text-xs font-black text-slate-500 mb-2">الأدلة الداعمة</label>
                <ArrayEditor
                    items={doc.problem.evidence}
                    onChange={evidence => setDoc({ ...doc, problem: { ...doc.problem, evidence } })}
                    placeholder="أضف دليلاً..."
                />
            </div>
        </div>
    );

    // Objective Editor
    const ObjectiveEditor = () => (
        <div className="space-y-4">
            <div>
                <label className="block text-xs font-black text-slate-500 mb-2">الهدف التجاري</label>
                <textarea
                    value={doc.objective.businessGoal || ''}
                    onChange={e => setDoc({ ...doc, objective: { ...doc.objective, businessGoal: e.target.value || null } })}
                    className="w-full min-h-[80px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none"
                    placeholder="ما الهدف التجاري من هذه الميزة؟"
                />
            </div>
            <div>
                <label className="block text-xs font-black text-slate-500 mb-2">القيمة للمستخدم</label>
                <textarea
                    value={doc.objective.userValue || ''}
                    onChange={e => setDoc({ ...doc, objective: { ...doc.objective, userValue: e.target.value || null } })}
                    className="w-full min-h-[80px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none"
                    placeholder="ما القيمة التي سيحصل عليها المستخدم؟"
                />
            </div>
            <div>
                <label className="block text-xs font-black text-slate-500 mb-2">النتيجة المتوقعة</label>
                <textarea
                    value={doc.objective.expectedOutcome || ''}
                    onChange={e => setDoc({ ...doc, objective: { ...doc.objective, expectedOutcome: e.target.value || null } })}
                    className="w-full min-h-[80px] bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none"
                    placeholder="ما النتيجة المتوقعة بعد تنفيذ الميزة؟"
                />
            </div>
            <div>
                <label className="block text-xs font-black text-slate-500 mb-2">النتائج الرئيسية (Key Results)</label>
                <ArrayEditor
                    items={doc.objective.keyResults}
                    onChange={keyResults => setDoc({ ...doc, objective: { ...doc.objective, keyResults } })}
                    placeholder="أضف نتيجة رئيسية..."
                />
            </div>
        </div>
    );

    // Target Users Editor
    const TargetUsersEditor = () => (
        <div className="space-y-4">
            {doc.targetUsers.map((user, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-center mb-3">
                        <span className="text-sm font-bold text-slate-700">مستخدم {idx + 1}</span>
                        <button
                            onClick={() => {
                                const newUsers = doc.targetUsers.filter((_, i) => i !== idx);
                                setDoc({ ...doc, targetUsers: newUsers });
                            }}
                            className="p-1 text-red-400 hover:text-red-600"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                    <div className="space-y-3">
                        <input
                            type="text"
                            value={user.persona}
                            onChange={e => {
                                const newUsers = [...doc.targetUsers];
                                newUsers[idx] = { ...user, persona: e.target.value };
                                setDoc({ ...doc, targetUsers: newUsers });
                            }}
                            className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                            placeholder="اسم الفئة المستهدفة..."
                        />
                        <textarea
                            value={user.description || ''}
                            onChange={e => {
                                const newUsers = [...doc.targetUsers];
                                newUsers[idx] = { ...user, description: e.target.value || null };
                                setDoc({ ...doc, targetUsers: newUsers });
                            }}
                            className="w-full min-h-[60px] bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                            placeholder="وصف خصائص المستخدم..."
                        />
                    </div>
                </div>
            ))}
            <button
                onClick={() => {
                    setDoc({
                        ...doc,
                        targetUsers: [...doc.targetUsers, { persona: '', description: null, needs: [], painPoints: [] }]
                    });
                }}
                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-all flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" /> إضافة مستخدم
            </button>
        </div>
    );

    // Metadata Editor
    const MetadataEditor = () => (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-black text-slate-500 mb-2">الحالة</label>
                    <select
                        value={doc.metadata.status}
                        onChange={e => setDoc({ ...doc, metadata: { ...doc.metadata, status: e.target.value as any } })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none"
                    >
                        <option value="draft">مسودة</option>
                        <option value="in_review">قيد المراجعة</option>
                        <option value="approved">معتمد</option>
                        <option value="deprecated">مهمل</option>
                        <option value="archived">مؤرشف</option>
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-black text-slate-500 mb-2">الأولوية</label>
                    <select
                        value={doc.metadata.priority || ''}
                        onChange={e => setDoc({ ...doc, metadata: { ...doc.metadata, priority: e.target.value as any || null } })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none"
                    >
                        <option value="">غير محدد</option>
                        <option value="critical">حرج</option>
                        <option value="high">عالي</option>
                        <option value="medium">متوسط</option>
                        <option value="low">منخفض</option>
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-black text-slate-500 mb-2">الجهد المتوقع</label>
                    <input
                        type="text"
                        value={doc.metadata.estimatedEffort || ''}
                        onChange={e => setDoc({ ...doc, metadata: { ...doc.metadata, estimatedEffort: e.target.value || null } })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none"
                        placeholder="مثال: 2 أسابيع"
                    />
                </div>
                <div>
                    <label className="block text-xs font-black text-slate-500 mb-2">الإصدار المستهدف</label>
                    <input
                        type="text"
                        value={doc.metadata.targetRelease || ''}
                        onChange={e => setDoc({ ...doc, metadata: { ...doc.metadata, targetRelease: e.target.value || null } })}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:outline-none"
                        placeholder="مثال: v2.0"
                    />
                </div>
            </div>
            <div>
                <label className="block text-xs font-black text-slate-500 mb-2">الوسوم</label>
                <ArrayEditor
                    items={doc.metadata.tags}
                    onChange={tags => setDoc({ ...doc, metadata: { ...doc.metadata, tags } })}
                    placeholder="أضف وسماً..."
                />
            </div>
            <div className="p-3 bg-slate-100 rounded-lg text-xs text-slate-500">
                <div className="flex items-center gap-2 mb-1">
                    <Hash className="w-3 h-3" />
                    <span>معرف الوثيقة: {doc.metadata.documentId}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>إصدار الهيكل: {doc.metadata.schemaVersion}</span>
                </div>
            </div>
        </div>
    );

    // Generic Array Item Editor (for simple string arrays)
    const ArrayEditor: React.FC<{
        items: string[];
        onChange: (items: string[]) => void;
        placeholder: string;
    }> = ({ items, onChange, placeholder }) => {
        const [newItem, setNewItem] = useState('');

        return (
            <div className="space-y-2">
                {items.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={item}
                            onChange={e => {
                                const newItems = [...items];
                                newItems[idx] = e.target.value;
                                onChange(newItems);
                            }}
                            className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        />
                        <button
                            onClick={() => onChange(items.filter((_, i) => i !== idx))}
                            className="p-1 text-red-400 hover:text-red-600"
                        >
                            <Trash2 className="w-4 h-4" />
                        </button>
                    </div>
                ))}
                <div className="flex items-center gap-2">
                    <input
                        type="text"
                        value={newItem}
                        onChange={e => setNewItem(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && newItem.trim()) {
                                onChange([...items, newItem.trim()]);
                                setNewItem('');
                            }
                        }}
                        className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                        placeholder={placeholder}
                    />
                    <button
                        onClick={() => {
                            if (newItem.trim()) {
                                onChange([...items, newItem.trim()]);
                                setNewItem('');
                            }
                        }}
                        className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:bg-slate-200"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>
        );
    };

    // Placeholder for sections that need more complex editors
    const PlaceholderEditor: React.FC<{ sectionName: string }> = ({ sectionName }) => (
        <div className="p-6 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 text-center">
            <p className="text-sm text-slate-500 mb-2">قسم {sectionName}</p>
            <p className="text-xs text-slate-400">سيتم إضافة محرر متقدم لهذا القسم</p>
        </div>
    );

    // Render section content based on active section
    const renderSectionContent = () => {
        switch (activeSection) {
            case 'definition':
                return <DefinitionEditor />;
            case 'problem':
                return <ProblemEditor />;
            case 'objective':
                return <ObjectiveEditor />;
            case 'targetUsers':
                return <TargetUsersEditor />;
            case 'metadata':
                return <MetadataEditor />;
            default:
                return <PlaceholderEditor sectionName={SECTIONS_CONFIG.find(s => s.id === activeSection)?.labelAr || activeSection} />;
        }
    };

    return (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-6xl h-[90vh] shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col border border-slate-200">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white">
                            <FileText className="w-5 h-5" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900">
                                {isNew ? 'إنشاء وثيقة ميزة جديدة' : 'تحرير وثيقة الميزة'}
                            </h2>
                            <p className="text-xs text-slate-500 mt-0.5">
                                هيكل RDP القياسي • 17 قسم
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl transition-all"
                        >
                            <X className="w-5 h-5" />
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                        >
                            <Save className="w-4 h-4" /> حفظ
                        </button>
                    </div>
                </div>

                {/* Error Display */}
                {errors.length > 0 && (
                    <div className="mx-8 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                        <p className="text-sm font-bold text-red-700 mb-2">يوجد أخطاء في الوثيقة:</p>
                        <ul className="list-disc list-inside text-xs text-red-600 space-y-1">
                            {errors.map((error, idx) => (
                                <li key={idx}>{error}</li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Sidebar - Sections List */}
                    <div className="w-72 border-l border-slate-100 overflow-y-auto p-4 bg-slate-50/50">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 px-2">الأقسام</h3>
                        <div className="space-y-1">
                            {SECTIONS_CONFIG.map(section => {
                                const status = getSectionStatus(section.id);
                                const isActive = activeSection === section.id;
                                const Icon = section.icon;

                                return (
                                    <button
                                        key={section.id}
                                        onClick={() => setActiveSection(section.id)}
                                        className={`w-full text-right px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all ${isActive
                                                ? 'bg-white shadow-sm border border-slate-200'
                                                : 'hover:bg-white/60'
                                            }`}
                                    >
                                        <div className={`p-1.5 rounded-lg ${section.color} text-white`}>
                                            <Icon className="w-3.5 h-3.5" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-xs font-bold truncate ${isActive ? 'text-slate-900' : 'text-slate-600'}`}>
                                                {section.labelAr}
                                            </p>
                                        </div>
                                        <div className={`w-2 h-2 rounded-full ${status === 'complete' ? 'bg-green-500' :
                                                status === 'partial' ? 'bg-amber-500' : 'bg-slate-200'
                                            }`} />
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Main Editor Area */}
                    <div className="flex-1 overflow-y-auto p-8">
                        <div className="max-w-3xl mx-auto">
                            {/* Section Header */}
                            <div className="mb-6">
                                <div className="flex items-center gap-3 mb-2">
                                    {React.createElement(
                                        SECTIONS_CONFIG.find(s => s.id === activeSection)?.icon || FileText,
                                        { className: 'w-5 h-5 text-slate-400' }
                                    )}
                                    <h3 className="text-lg font-black text-slate-900">
                                        {SECTIONS_CONFIG.find(s => s.id === activeSection)?.labelAr}
                                    </h3>
                                </div>
                                <p className="text-sm text-slate-500">
                                    {SECTIONS_CONFIG.find(s => s.id === activeSection)?.description}
                                </p>
                            </div>

                            {/* Section Content */}
                            {renderSectionContent()}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FeatureDocumentEditor;
