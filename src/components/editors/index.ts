// =============================================================================
// تصدير جميع محررات الوثائق
// =============================================================================

export { default as VisionEditor } from './VisionEditor';
export { default as ProblemEditor } from './ProblemEditor';
export { default as PRDEditor } from './PRDEditor';
export { default as LaunchEditor } from './LaunchEditor';
export { default as ExperimentEditor } from './ExperimentEditor';
export { default as DecisionLogEditor } from './DecisionLogEditor';

// مكونات المحررات المشتركة
export * from './EditorComponents';

// =============================================================================
// تكوين المحررات
// =============================================================================

export const EDITOR_CONFIG = {
    vision: {
        id: 'vision',
        label: 'وثيقة رؤية المنتج',
        labelEn: 'Vision Document',
        description: 'توحيد الفهم العام حول سبب وجود المنتج والقيمة التي يقدمها',
        phase: 'discovery',
        color: 'from-purple-500 to-indigo-600',
        icon: 'Eye'
    },
    problem: {
        id: 'problem',
        label: 'بيان المشكلة',
        labelEn: 'Problem Statement',
        description: 'توصيف المشكلة بدقة دون القفز للحلول',
        phase: 'discovery',
        color: 'from-red-500 to-rose-600',
        icon: 'AlertCircle'
    },
    prd: {
        id: 'prd',
        label: 'وثيقة متطلبات المنتج',
        labelEn: 'PRD',
        description: 'تحويل المشكلة إلى متطلبات قابلة للتنفيذ',
        phase: 'definition',
        color: 'from-indigo-500 to-blue-600',
        icon: 'ListChecks'
    },
    launch: {
        id: 'launch',
        label: 'وثيقة الإطلاق',
        labelEn: 'Launch Document',
        description: 'تنظيم إطلاق الميزة أو المنتج',
        phase: 'launch',
        color: 'from-emerald-500 to-green-600',
        icon: 'Rocket'
    },
    experiment: {
        id: 'experiment',
        label: 'وثيقة التجارب',
        labelEn: 'Experiment Document',
        description: 'توثيق التجارب A/B والنتائج',
        phase: 'growth',
        color: 'from-orange-500 to-amber-600',
        icon: 'LineChart'
    },
    decision_log: {
        id: 'decision_log',
        label: 'سجل القرارات',
        labelEn: 'Decision Log',
        description: 'توثيق أسباب القرارات المهمة',
        phase: 'governance',
        color: 'from-red-500 to-pink-600',
        icon: 'ShieldCheck'
    }
} as const;

export type EditorType = keyof typeof EDITOR_CONFIG;
