
import { AppContext } from '../types';

export const CONTEXTS: AppContext[] = [
  {
    id: 'home',
    name: 'لوحة القيادة الشاملة',
    icon: 'LayoutDashboard',
    description: 'نظرة استراتيجية شاملة على كافة المشاريع والالتزامات مع تحليل التعارضات.',
    color: 'bg-slate-900',
    group: 'system',
    currentPhase: 'Maintenance',
    strategicGoals: ['توازن الحياة والعمل', 'تحقيق أقصى إنتاجية يومية', 'منع تعارض المواعيد']
  },
  {
    id: 'personal',
    name: 'الحياة الشخصية',
    icon: 'User',
    description: 'إدارة المواعيد الشخصية، الأهداف السنوية، والالتزامات العائلية.',
    color: 'bg-indigo-500',
    group: 'personal',
    strategicGoals: ['تطوير الذات', 'قضاء وقت نوعي مع العائلة', 'الاستقرار المالي'],
    currentPhase: 'Growth'
  },
  {
    id: 'health',
    name: 'الرياضة والصحة',
    icon: 'HeartPulse',
    description: 'اللياقة البدنية، التغذية، ومتابعة النشاط الرياضي اليومي.',
    color: 'bg-pink-500',
    group: 'personal',
    strategicGoals: ['الوصول لوزن مثالي', 'الجري 5 كم أسبوعياً', 'نظام غذائي متوازن'],
    currentPhase: 'Maintenance'
  },
  {
    id: 'professional',
    name: 'العمل (Engineering & PM)',
    icon: 'Briefcase',
    description: 'تطوير البرمجيات، إدارة الفرق، والتخطيط الاستراتيجي للمنتجات.',
    color: 'bg-blue-500',
    group: 'projects',
    techStack: ['Jira', 'GitHub', 'React', 'Node.js', 'AWS'],
    targetAudience: 'Enterprise Clients & Internal Teams',
    currentPhase: 'Scaling',
    strategicGoals: ['تسليم المشاريع في وقتها', 'تحسين جودة الكود (Code Quality)', 'قيادة الفريق التقني بفعالية']
  },
  {
    id: 'launch_assistant',
    name: 'مساعد الإطلاق',
    icon: 'Rocket',
    description: 'دعم الشباب العربي في بناء نماذج عمل عصرية وقوية.',
    color: 'bg-orange-500',
    group: 'projects',
    techStack: ['Next.js', 'OpenAI API', 'TailwindCSS', 'Vercel'],
    targetAudience: 'رواد الأعمال العرب (الشباب والمبتدئين)',
    currentPhase: 'Growth',
    strategicGoals: ['الوصول لـ 10,000 مستخدم نشط', 'إطلاق ميّزة "المولد الآلي لخطط العمل"', 'تحسين تجربة المستخدم موبايل'],
    keyFeatures: ['توليد نماذج العمل', 'تحليل السوق بالذكاء الاصطناعي', 'لوحة تحكم للمشاريع الناشئة']
  },
  {
    id: 'investor_radar',
    name: 'رادار المستثمر',
    icon: 'TrendingUp',
    description: 'تبسيط الإحصائيات والأرقام المالية للمبتدئين والخبراء.',
    color: 'bg-emerald-500',
    group: 'projects',
    techStack: ['Python (Pandas)', 'Django', 'React', 'Financial APIs'],
    targetAudience: 'المستثمرون الأفراد في السوق السعودي والخليجي',
    currentPhase: 'MVP',
    strategicGoals: ['بناء قاعدة بيانات مالية دقيقة', 'إطلاق النسخة التجريبية للمشتركين الأوائل', 'الشراكة مع منصات تداول معتمدة'],
    keyFeatures: ['تنبيهات الأسهم الذكية', 'تحليل القوائم المالية', 'رادار الفرص الاستثمارية']
  },
  {
    id: 'saudi_economy',
    name: 'المنصة الاقتصادية (السعودية)',
    icon: 'LineChart',
    description: 'أخبار وتحليلات اقتصادية حصرية للمملكة العربية السعودية.',
    color: 'bg-green-600',
    group: 'projects',
    targetAudience: 'المحللون الاقتصاديون، رجال الأعمال، والمهتمون برؤية 2030',
    currentPhase: 'Scaling',
    strategicGoals: ['تغطية حصرية لأخبار رؤية 2030', 'زيادة الاشتراكات المدفوعة بنسبة 20%', 'إنتاج تقارير إنفوجرافيك يومية']
  },
  {
    id: 'arab_news',
    name: 'المنصة الإخبارية (الوطن العربي)',
    icon: 'Globe',
    description: 'تغطية إخبارية شاملة ومخصصة لكافة أرجاء الوطن العربي.',
    color: 'bg-red-500',
    group: 'projects',
    currentPhase: 'Maintenance',
    targetAudience: 'الجمهور العربي العام',
    strategicGoals: ['الحفاظ على مصداقية الخبر', 'توسيع شبكة المراسلين', 'تحسين محركات البحث SEO']
  },
  {
    id: 'digital_merchant',
    name: 'منصة التاجر الرقمي',
    icon: 'Store',
    description: 'خدمات متكاملة لإدارة أعمال التجار رقمياً بكفاءة.',
    color: 'bg-purple-500',
    group: 'projects',
    techStack: ['Shopify API', 'Stripe/Tamara Integration', 'React Native'],
    targetAudience: 'التجار الإلكترونيين وأصحاب المتاجر الصغيرة',
    currentPhase: 'Ideation',
    strategicGoals: ['إتمام دراسة الجدوى التقنية', 'تحديد قنوات الدفع الرئيسية', 'تصميم واجهة تجربة التاجر (UX/UI)'],
    keyFeatures: ['إدارة المخزون الموحد', 'بوابة دفع ميسرة', 'تحليلات المبيعات']
  }
];

// SYSTEM_INSTRUCTION
export const SYSTEM_INSTRUCTION = `
أنت مدير منتجات محترف (Senior Product Manager) وباني منصات ومواقع رقمية (Product Builder & Web Architect).
خبرتك: بناء منتجات رقمية عالية الأداء من الصفر وحتى التوسع (Scale).
هدفك: مساعدة محمد لحلح في العمل بأقصى إنتاجية، اتخاذ قرارات ذكية، وبناء منتجات قابلة للنمو.

طريقة التفكير (Mindset):
- Builder + Strategist: توازن بين الرؤية الاستراتيجية والتنفيذ التقني الدقيق.
- Outcome-driven: ركز دائماً على النتائج والأثر (Impact) وليس فقط المخرجات (Output).
- Deep Work: صمم أنظمة تقلل التشتت وتعزز العمل العميق.

عند تحليل المهام أو تقديم الاستشارات:
1. استخدم أطر عمل عالمية مثل (RICE, Impact/Effort Matrix) لتحديد الأولويات.
2. عند التخطيط لميزة جديدة، فكر بـ (Product Discovery, Validation, User Stories).
3. اربط المهام بالأهداف الاستراتيجية للمشروع دائماً.
4. اقترح حلولاً للأتمتة (Automation) لتقليل العمل اليدوي.

اللغة: العربية الفصحى المهنية (مع استخدام المصطلحات التقنية الإنجليزية عند الحاجة للدقة).
`;
