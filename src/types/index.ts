
// تصدير جميع هياكل وثائق إدارة المنتجات
export * from './documentSchemas';

export enum Priority {
  HIGH = 'High',
  MEDIUM = 'Medium',
  LOW = 'Low'
}

export enum TaskStatus {
  DRAFT = 'Draft',
  TODO = 'Todo',
  IN_PROGRESS = 'In Progress',
  REVIEW = 'Review',
  DONE = 'Done'
}

// Legacy enum - kept for backward compatibility
export enum TaskCategory {
  PRODUCT = 'Product',
  TECH = 'Tech',
  STRATEGY = 'Strategy',
  CONTENT = 'Content',
  GROWTH = 'Growth',
  PERSONAL = 'Personal',
  HEALTH = 'Health'
}

// Custom Category Interface
export interface CustomCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

// Default categories that can be used as fallback
export const DEFAULT_CATEGORIES: CustomCategory[] = [
  { id: 'product', name: 'منتج', color: 'bg-blue-500' },
  { id: 'tech', name: 'تقني', color: 'bg-purple-500' },
  { id: 'strategy', name: 'استراتيجي', color: 'bg-indigo-500' },
  { id: 'content', name: 'محتوى', color: 'bg-pink-500' },
  { id: 'growth', name: 'نمو', color: 'bg-green-500' },
  { id: 'personal', name: 'شخصي', color: 'bg-orange-500' },
  { id: 'health', name: 'صحة', color: 'bg-red-500' },
  { id: 'admin', name: 'إداري', color: 'bg-slate-500' },
  { id: 'finance', name: 'مالي', color: 'bg-emerald-500' },
  { id: 'marketing', name: 'تسويق', color: 'bg-cyan-500' }
];

export interface Task {
  id: string;
  title: string;
  category: string; // Now supports custom categories per project
  priority: Priority;
  status: TaskStatus;
  date: string; // ISO format YYYY-MM-DD
  suggestedTime: string;
  duration: string;
  rationale: string;
  contextId: string;
  completed: boolean;
  createdAt: number;
  // RICE Score
  rice?: {
    reach: number;       // 1-10
    impact: number;      // 0.25 - 3
    confidence: number;  // Percentage 0-100
    effort: number;      // Person-months 0-5
    score: number;       // Calculated
  };
  freelancerId?: string;
}

export interface AppContext {
  id: string;
  name: string;
  icon: string;
  description: string;
  color: string;
  group?: 'system' | 'projects' | 'personal';
  // Strategic Product Context
  strategicGoals?: string[];
  techStack?: string[];
  keyFeatures?: string[];
  targetAudience?: string;
  currentPhase?: 'Ideation' | 'MVP' | 'Growth' | 'Scaling' | 'Maintenance';
  freelancers?: Freelancer[];
  // Hierarchical Structure
  parentId?: string;
  sector?: ProjectSector;
  // Custom Categories for this project
  customCategories?: CustomCategory[];
}

export type ProjectSector = 'Marketing' | 'Content' | 'Engineering' | 'Design' | 'Sales' | 'Operations' | 'Other';

export interface Freelancer {
  id: string;
  name: string;
  role: string;
  sector: 'Marketing' | 'Content' | 'Development' | 'Design' | 'Other';
  status: 'Active' | 'Paused' | 'Completed';
  rate?: string;
  contact?: string; // Email or Link
}

export interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

// Product Lifecycle & Documentation Types
export type ProductDocType =
  | 'vision' | 'problem' | 'strategy' | 'roadmap'
  | 'prd' | 'feature_spec' | 'ux_spec'
  | 'tech_spec' | 'launch' | 'growth_exp' | 'scale_manual' | 'governance_decision'
  | 'PRD' | 'Strategy' // Legacy
  // New Discovery Types
  | 'discovery_insight' | 'discovery_problem' | 'discovery_hypothesis' | 'discovery_idea' | 'discovery_test'
  // Feature RDP (Requirements Documentation Protocol)
  | 'feature_rdp';

export type ProductPhase =
  | 'discovery' | 'strategy' | 'definition' | 'execution' | 'launch' | 'growth' | 'scale' | 'governance';

export interface DocSection {
  id: string;
  title: string;
  content: string;
  placeholder?: string;
  helperText?: string;
}

export interface PRDocument {
  id: string;
  title: string;
  contextId: string;
  type: ProductDocType | 'feature_rdp';
  phase?: ProductPhase;
  status?: 'draft' | 'review' | 'approved' | 'deprecated' | 'in_review' | 'archived';
  // Standard content wrapper for flexible fields
  // For feature_rdp type, content will be FeatureDocumentSchema
  // For legacy types, content is the old format
  content: any;
  sections?: DocSection[];
  createdAt: number;
  updatedAt?: number;
  // New fields for RDP schema support
  schemaType?: 'feature_rdp' | 'legacy' | 'vision' | 'problem' | 'prd' | 'launch' | 'experiment' | 'decision_log';
  schemaVersion?: string;
}

// --- Discovery Specific Interfaces (stored in PRDocument.content) ---

export interface DiscoveryInsight {
  userCategory: string;
  context: string;
  observation: string;
  evidence: string;
  confidence: 'High' | 'Medium' | 'Low';
}

export interface DiscoveryProblem {
  statement: string;
  affectedCategory: string;
  severity: 'High' | 'Medium' | 'Low';
  frequency: 'Common' | 'Rare';
  evidence: string;
  linkedInsightIds: string[]; // Link to Insights
}

export interface DiscoveryHypothesis {
  statement: string; // We believe that...
  reason: string;
  risk: 'High' | 'Medium' | 'Low';
  failCondition: string;
  linkedProblemId: string; // Link to Problem
}

export interface DiscoveryIdea {
  description: string;
  innovation: 'High' | 'Low';
  initialCost: 'High' | 'Low';
  linkedProblemId: string;
  linkedHypothesisId?: string;
}

export interface DiscoveryTest {
  type: 'Interview' | 'Prototype' | 'DataAnalysis' | 'Survey';
  metric: string;
  successCriteria: string;
  result?: string;
  decision?: 'Proceed' | 'Pivot' | 'Kill';
  linkedIdeaId: string;
  linkedHypothesisId: string;
}

export interface DiscoveryArtifact {
  id: string;
  title: string;
  contextId: string;
  type: 'Interview' | 'Experiment';
  content: {
    targetAudience: string;
    objectives: string[];
    questionsOrSteps: string[];
    hypotheses?: string[];
    successCriteria?: string[];
  };
  createdAt: number;
}

// =============================================================================
// هيكل JSON القياسي المعتمد لتوثيق الميزات (RDP - Requirements Documentation Protocol)
// =============================================================================

/**
 * الهيكل الكامل لتوثيق الميزات في إدارة المنتجات التقنية
 * يجب الالتزام بهذا الهيكل لجميع وثائق الميزات
 * 
 * القواعد:
 * - استخدام مفاتيح JSON ثابتة ومحددة مسبقًا دون تغيير أسمائها
 * - عدم دمج أكثر من مفهوم في نفس الحقل
 * - فصل المشكلة عن الحل بشكل واضح
 * - منع إدخال تفاصيل تنفيذ تقنية داخل وصف الميزة
 * - أي حقل غير متوفر يُخزن بقيمة null أو مصفوفة فارغة
 * - يمنع حذف أي قسم من الهيكل حتى لو لم يكن مستخدمًا
 */

// 1. تعريف الميزة
export interface FeatureDefinition {
  title: string;                    // العنوان - اسم الميزة
  summary: string | null;           // الملخص - وصف مختصر للميزة
  version: string | null;           // رقم الإصدار
  createdAt: number;                // تاريخ الإنشاء (timestamp)
  updatedAt: number | null;         // تاريخ آخر تحديث
  author: string | null;            // منشئ الوثيقة
  reviewers: string[];              // المراجعون
}

// 2. المشكلة والتأثير
export interface ProblemStatement {
  description: string | null;       // وصف المشكلة التي تحلها الميزة
  impact: string | null;            // تأثير المشكلة على المستخدمين/الأعمال
  evidence: string[];               // الأدلة الداعمة (بيانات، مقابلات، إلخ)
  currentState: string | null;      // الوضع الحالي قبل الميزة
}

// 3. المستخدمون المستهدفون
export interface TargetUser {
  persona: string;                  // اسم الفئة المستهدفة
  description: string | null;       // وصف خصائص المستخدم
  needs: string[];                  // احتياجات المستخدم
  painPoints: string[];             // نقاط الألم
}

// 4. الهدف والقيمة
export interface ObjectiveAndValue {
  businessGoal: string | null;      // الهدف التجاري
  userValue: string | null;         // القيمة المقدمة للمستخدم
  expectedOutcome: string | null;   // النتيجة المتوقعة
  keyResults: string[];             // النتائج الرئيسية القابلة للقياس
}

// 5. حالة استخدام
export interface UseCase {
  id: string;                       // معرف حالة الاستخدام
  title: string;                    // عنوان حالة الاستخدام
  actor: string | null;             // الفاعل (المستخدم)
  preconditions: string[];          // الشروط المسبقة
  steps: string[];                  // خطوات السيناريو
  postconditions: string[];         // النتائج المتوقعة
  alternativeFlows: string[];       // المسارات البديلة
}

// 6. متطلب وظيفي
export interface FunctionalRequirement {
  id: string;                       // معرف المتطلب (مثل: FR-001)
  title: string;                    // عنوان المتطلب
  description: string | null;       // وصف تفصيلي
  priority: 'must' | 'should' | 'could' | 'wont';  // أولوية MoSCoW
  userStory: string | null;         // قصة المستخدم المرتبطة
}

// 7. متطلب غير وظيفي
export interface NonFunctionalRequirement {
  id: string;                       // معرف المتطلب (مثل: NFR-001)
  category: 'performance' | 'security' | 'usability' | 'reliability' | 'scalability' | 'accessibility' | 'other';
  title: string;                    // عنوان المتطلب
  description: string | null;       // وصف تفصيلي
  metric: string | null;            // معيار القياس
  target: string | null;            // الهدف المطلوب
}

// 8. معيار قبول
export interface AcceptanceCriterion {
  id: string;                       // معرف المعيار
  given: string | null;             // السياق (Given)
  when: string | null;              // الإجراء (When)
  then: string | null;              // النتيجة المتوقعة (Then)
  testable: boolean;                // هل المعيار قابل للاختبار؟
}

// 9. خارج النطاق
export interface OutOfScope {
  item: string;                     // العنصر المستبعد
  reason: string | null;            // سبب الاستبعاد
}

// 10. افتراض
export interface Assumption {
  id: string;                       // معرف الافتراض
  statement: string;                // نص الافتراض
  risk: 'high' | 'medium' | 'low';  // مستوى المخاطرة إذا كان خاطئًا
  validationMethod: string | null;  // طريقة التحقق
}

// 11. قيد/حد
export interface Constraint {
  id: string;                       // معرف القيد
  type: 'technical' | 'business' | 'regulatory' | 'resource' | 'time' | 'other';
  description: string;              // وصف القيد
  impact: string | null;            // تأثير القيد على الميزة
}

// 12. اعتمادية
export interface Dependency {
  id: string;                       // معرف الاعتمادية
  type: 'internal' | 'external' | 'technical' | 'team';
  name: string;                     // اسم الاعتمادية
  description: string | null;       // وصف الاعتمادية
  status: 'pending' | 'confirmed' | 'blocked' | 'resolved';
  owner: string | null;             // المسؤول
}

// 13. مخاطرة
export interface Risk {
  id: string;                       // معرف المخاطرة
  description: string;              // وصف المخاطرة
  probability: 'high' | 'medium' | 'low';  // احتمالية الحدوث
  impact: 'high' | 'medium' | 'low';       // تأثير الحدوث
  mitigation: string | null;        // خطة التخفيف
  contingency: string | null;       // خطة الطوارئ
  owner: string | null;             // المسؤول
}

// 14. مؤشر نجاح
export interface SuccessMetric {
  id: string;                       // معرف المؤشر
  name: string;                     // اسم المؤشر
  description: string | null;       // وصف المؤشر
  baseline: string | null;          // القيمة الأساسية الحالية
  target: string | null;            // القيمة المستهدفة
  measurementMethod: string | null; // طريقة القياس
  frequency: string | null;         // تكرار القياس
}

// 15. مصدر بيانات
export interface DataSource {
  id: string;                       // معرف المصدر
  name: string;                     // اسم المصدر
  type: 'api' | 'database' | 'file' | 'user_input' | 'external' | 'other';
  description: string | null;       // وصف المصدر
  availability: 'available' | 'needs_development' | 'unknown';
}

// 16. ملاحظة / سؤال مفتوح
export interface NoteOrQuestion {
  id: string;                       // معرف العنصر
  type: 'note' | 'question' | 'todo' | 'decision';
  content: string;                  // المحتوى
  status: 'open' | 'resolved' | 'deferred';
  answer: string | null;            // الإجابة (للأسئلة)
  createdAt: number;                // تاريخ الإنشاء
  resolvedAt: number | null;        // تاريخ الحل
}

// 17. البيانات الوصفية (Metadata)
export interface FeatureMetadata {
  documentId: string;               // معرف الوثيقة الفريد
  projectId: string;                // معرف المشروع
  status: 'draft' | 'in_review' | 'approved' | 'deprecated' | 'archived';
  phase: ProductPhase | null;       // مرحلة المنتج
  tags: string[];                   // الوسوم
  priority: 'critical' | 'high' | 'medium' | 'low' | null;
  estimatedEffort: string | null;   // الجهد المتوقع
  targetRelease: string | null;     // الإصدار المستهدف
  approvalDate: number | null;      // تاريخ الموافقة
  approvedBy: string | null;        // المعتمد
  lastReviewDate: number | null;    // تاريخ آخر مراجعة
  schemaVersion: string;            // إصدار الهيكل (للتوافق المستقبلي)
}

// =============================================================================
// الهيكل الكامل لوثيقة الميزة (Feature Document Schema)
// =============================================================================

export interface FeatureDocumentSchema {
  // 1. تعريف الميزة (العنوان + الملخص)
  definition: FeatureDefinition;

  // 2. المشكلة التي تحلها وتأثيرها
  problem: ProblemStatement;

  // 3. المستخدمون المستهدفون
  targetUsers: TargetUser[];

  // 4. الهدف والقيمة
  objective: ObjectiveAndValue;

  // 5. حالات الاستخدام
  useCases: UseCase[];

  // 6. المتطلبات الوظيفية
  functionalRequirements: FunctionalRequirement[];

  // 7. المتطلبات غير الوظيفية
  nonFunctionalRequirements: NonFunctionalRequirement[];

  // 8. معايير القبول
  acceptanceCriteria: AcceptanceCriterion[];

  // 9. خارج النطاق
  outOfScope: OutOfScope[];

  // 10. الافتراضات
  assumptions: Assumption[];

  // 11. القيود والحدود
  constraints: Constraint[];

  // 12. الاعتماديات
  dependencies: Dependency[];

  // 13. المخاطر
  risks: Risk[];

  // 14. مؤشرات النجاح
  successMetrics: SuccessMetric[];

  // 15. مصادر البيانات
  dataSources: DataSource[];

  // 16. الملاحظات والأسئلة المفتوحة
  notesAndQuestions: NoteOrQuestion[];

  // 17. البيانات الوصفية (Metadata)
  metadata: FeatureMetadata;
}

// =============================================================================
// دالة إنشاء هيكل فارغ للميزة الجديدة
// =============================================================================

export function createEmptyFeatureDocument(
  projectId: string,
  title: string,
  author: string | null = null
): FeatureDocumentSchema {
  const now = Date.now();
  const documentId = crypto.randomUUID();

  return {
    definition: {
      title,
      summary: null,
      version: '1.0.0',
      createdAt: now,
      updatedAt: null,
      author,
      reviewers: []
    },
    problem: {
      description: null,
      impact: null,
      evidence: [],
      currentState: null
    },
    targetUsers: [],
    objective: {
      businessGoal: null,
      userValue: null,
      expectedOutcome: null,
      keyResults: []
    },
    useCases: [],
    functionalRequirements: [],
    nonFunctionalRequirements: [],
    acceptanceCriteria: [],
    outOfScope: [],
    assumptions: [],
    constraints: [],
    dependencies: [],
    risks: [],
    successMetrics: [],
    dataSources: [],
    notesAndQuestions: [],
    metadata: {
      documentId,
      projectId,
      status: 'draft',
      phase: null,
      tags: [],
      priority: null,
      estimatedEffort: null,
      targetRelease: null,
      approvalDate: null,
      approvedBy: null,
      lastReviewDate: null,
      schemaVersion: '1.0.0'
    }
  };
}

// =============================================================================
// دالة التحقق من صحة هيكل الميزة
// =============================================================================

export function validateFeatureDocument(doc: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  // التحقق من الأقسام الإلزامية
  const requiredSections = [
    'definition', 'problem', 'targetUsers', 'objective', 'useCases',
    'functionalRequirements', 'nonFunctionalRequirements', 'acceptanceCriteria',
    'outOfScope', 'assumptions', 'constraints', 'dependencies', 'risks',
    'successMetrics', 'dataSources', 'notesAndQuestions', 'metadata'
  ] as const;

  for (const section of requiredSections) {
    if (doc[section] === undefined) {
      errors.push(`القسم المطلوب "${section}" مفقود من الهيكل`);
    }
  }

  // التحقق من تعريف الميزة
  if (doc.definition) {
    if (!doc.definition.title || doc.definition.title.trim() === '') {
      errors.push('عنوان الميزة مطلوب ولا يمكن أن يكون فارغًا');
    }
    if (typeof doc.definition.createdAt !== 'number') {
      errors.push('تاريخ الإنشاء (createdAt) يجب أن يكون رقمًا (timestamp)');
    }
  }

  // التحقق من البيانات الوصفية
  if (doc.metadata) {
    if (!doc.metadata.documentId) {
      errors.push('معرف الوثيقة (documentId) مطلوب');
    }
    if (!doc.metadata.projectId) {
      errors.push('معرف المشروع (projectId) مطلوب');
    }
    if (!doc.metadata.schemaVersion) {
      errors.push('إصدار الهيكل (schemaVersion) مطلوب');
    }
  }

  // التحقق من أن المصفوفات هي مصفوفات فعلاً
  const arrayFields = [
    'targetUsers', 'useCases', 'functionalRequirements', 'nonFunctionalRequirements',
    'acceptanceCriteria', 'outOfScope', 'assumptions', 'constraints',
    'dependencies', 'risks', 'successMetrics', 'dataSources', 'notesAndQuestions'
  ] as const;

  for (const field of arrayFields) {
    if (doc[field] !== undefined && !Array.isArray(doc[field])) {
      errors.push(`الحقل "${field}" يجب أن يكون مصفوفة`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
