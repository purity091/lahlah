-- Supabase Schema Conversion for Lahlah OS
-- Converted from MySQL dump to PostgreSQL compatible format

-- Temporarily disable foreign key checks for data import
SET session_replication_role = replica;

BEGIN; 

-- 1. Create projects table
CREATE TABLE IF NOT EXISTS projects (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(50),
    group_name VARCHAR(50),
    strategic_goals JSONB,
    tech_stack JSONB,
    key_features JSONB,
    target_audience TEXT,
    current_phase VARCHAR(50),
    parent_id VARCHAR(50),
    sector VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for projects
CREATE INDEX IF NOT EXISTS idx_projects_group ON projects(group_name);
CREATE INDEX IF NOT EXISTS idx_projects_parent ON projects(parent_id);

-- 2. Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    priority VARCHAR(10) CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH')),
    status VARCHAR(20) CHECK (status IN ('DRAFT', 'TODO', 'IN_PROGRESS', 'REVIEW', 'DONE')),
    date DATE,
    suggested_time VARCHAR(20),
    duration VARCHAR(20),
    rationale TEXT,
    project_id VARCHAR(50) REFERENCES projects(id) ON DELETE CASCADE,
    completed BOOLEAN DEFAULT FALSE,
    created_at BIGINT,
    rice_score JSONB,
    freelancer_id VARCHAR(50)
);

-- Create indexes for tasks
CREATE INDEX IF NOT EXISTS idx_tasks_project ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);

-- 3. Create freelancers table
CREATE TABLE IF NOT EXISTS freelancers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(100),
    sector VARCHAR(50),
    status VARCHAR(20) CHECK (status IN ('Active', 'Paused', 'Completed')),
    rate VARCHAR(50),
    contact VARCHAR(255),
    project_id VARCHAR(50) REFERENCES projects(id) ON DELETE SET NULL
);

-- Create indexes for freelancers
CREATE INDEX IF NOT EXISTS idx_freelancers_project ON freelancers(project_id);
CREATE INDEX IF NOT EXISTS idx_freelancers_sector ON freelancers(sector);

-- 4. Create documents table
CREATE TABLE IF NOT EXISTS documents (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    type VARCHAR(50),
    content JSONB,
    context_id VARCHAR(50) REFERENCES projects(id) ON DELETE CASCADE,
    created_at BIGINT
);

-- Create indexes for documents
CREATE INDEX IF NOT EXISTS idx_documents_context ON documents(context_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON documents(type);

-- 5. Create chat_history table
CREATE TABLE IF NOT EXISTS chat_history (
    id SERIAL PRIMARY KEY,
    context_id VARCHAR(50) REFERENCES projects(id) ON DELETE CASCADE,
    role VARCHAR(20),
    content TEXT,
    timestamp BIGINT
);

-- Create indexes for chat_history
CREATE INDEX IF NOT EXISTS idx_chat_history_context ON chat_history(context_id);

-- 6. Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    color VARCHAR(50) NOT NULL,
    project_id VARCHAR(50) REFERENCES projects(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for categories
CREATE INDEX IF NOT EXISTS idx_categories_project ON categories(project_id);

-- 7. Create pomodoro_sessions table
CREATE TABLE IF NOT EXISTS pomodoro_sessions (
    id VARCHAR(50) PRIMARY KEY,
    project_id VARCHAR(50) REFERENCES projects(id) ON DELETE SET NULL,
    project_name VARCHAR(255),
    start_time BIGINT,
    end_time BIGINT,
    duration INTEGER,
    completed BOOLEAN DEFAULT TRUE,
    session_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for pomodoro_sessions
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_project ON pomodoro_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_pomodoro_sessions_date ON pomodoro_sessions(session_date);

-- Insert projects data first
INSERT INTO projects (id, name, description, icon, color, group_name, strategic_goals, tech_stack, key_features, target_audience, current_phase, parent_id, sector, created_at) VALUES
('arab_news', 'المنصة الإخبارية (الوطن العربي)', 'تغطية إخبارية شاملة ومخصصة لكافة أرجاء الوطن العربي.', 'Globe', 'bg-red-500', 'projects', '["الحفاظ على مصداقية الخبر","توسيع شبكة المراسلين","تحسين محركات البحث SEO"]', '[]', '[]', 'الجمهور العربي العام', 'Maintenance', NULL, NULL, '2026-01-25 14:24:06'),
('digital_merchant', 'منصة التاجر الرقمي', 'خدمات متكاملة لإدارة أعمال التجار رقمياً بكفاءة.', 'Store', 'bg-purple-500', 'projects', '["إتمام دراسة الجدوى التقنية","تحديد قنوات الدفع الرئيسية","تصميم واجهة تجربة التاجر (UX/UI)"]', '["Shopify API","Stripe/Tamara Integration","React Native"]', '["إدارة المخزون الموحد","بوابة دفع ميسرة","تحليلات المبيعات"]', 'التجار الإلكترونيين وأصحاب المتاجر الصغيرة', 'Ideation', NULL, NULL, '2026-01-25 14:24:06'),
('health', 'الرياضة والصحة', 'اللياقة البدنية، التغذية، ومتابعة النشاط الرياضي اليومي.', 'HeartPulse', 'bg-pink-500', 'personal', '["الوصول لوزن مثالي","الجري 5 كم أسبوعياً","نظام غذائي متوازن"]', '[]', '[]', NULL, 'Maintenance', NULL, NULL, '2026-01-25 14:24:06'),
('home', 'لوحة القيادة الشاملة', 'نظرة استراتيجية شاملة على كافة المشاريع والالتزامات مع تحليل التعارضات.', 'LayoutDashboard', 'bg-slate-900', 'system', '["توازن الحياة والعمل","تحقيق أقصى إنتاجية يومية","منع تعارض المواعيد"]', '[]', '[]', NULL, 'Maintenance', NULL, NULL, '2026-01-25 14:24:06'),
('investor_radar', 'رادار المستثمر', 'تبسيط الإحصائيات والأرقام المالية للمبتدئين والخبراء.', 'TrendingUp', 'bg-emerald-500', 'projects', '["بناء قاعدة بيانات مالية دقيقة","إطلاق النسخة التجريبية للمشتركين الأوائل","الشراكة مع منصات تداول معتمدة"]', '["Python (Pandas)","Django","React","Financial APIs"]', '["تنبيهات الأسهم الذكية","تحليل القوائم المالية","رادار الفرص الاستثمارية"]', 'المستثمرون الأفراد في السوق السعودي والخليجي', 'MVP', NULL, NULL, '2026-01-25 14:24:06'),
('launch_assistant', 'مساعد الإطلاق', 'دعم الشباب العربي في بناء نماذج عمل عصرية وقوية.', 'Rocket', 'bg-orange-500', 'projects', '["الوصول لـ 10,000 مستخدم نشط","إطلاق ميّزة \"المولد الآلي لخطط العمل\"","تحسين تجربة المستخدم موبايل"]', '["Next.js","OpenAI API","TailwindCSS","Vercel"]', '["توليد نماذج العمل","تحليل السوق بالذكاء الاصطناعي","لوحة تحكم للمشاريع الناشئة"]', 'رواد الأعمال العرب (الشباب والمبتدئين)', 'Growth', NULL, NULL, '2026-01-25 14:24:06'),
('personal', 'الحياة الشخصية', 'إدارة المواعيد الشخصية، الأهداف السنوية، والالتزامات العائلية.', 'User', 'bg-indigo-500', 'personal', '["تطوير الذات","قضاء وقت نوعي مع العائلة","الاستقرار المالي"]', '[]', '[]', NULL, 'Growth', NULL, NULL, '2026-01-25 14:24:06'),
('professional', 'العمل (Engineering & PM)', 'تطوير البرمجيات، إدارة الفرق، والتخطيط الاستراتيجي للمنتجات.', 'Briefcase', 'bg-blue-500', 'projects', '["تسليم المشاريع في وقتها","تحسين جودة الكود (Code Quality)","قيادة الفريق التقني بفعالية"]', '["Jira","GitHub","React","Node.js","AWS"]', '[]', 'Enterprise Clients & Internal Teams', 'Scaling', NULL, NULL, '2026-01-25 14:24:06'),
('saudi_economy', 'المنصة الاقتصادية (السعودية)', 'أخبار وتحليلات اقتصادية حصرية للمملكة العربية السعودية.', 'LineChart', 'bg-green-600', 'projects', '["تغطية حصرية لأخبار رؤية 2030","زيادة الاشتراكات المدفوعة بنسبة 20%","إنتاج تقارير إنفوجرافيك يومية"]', '[]', '[]', 'المحللون الاقتصاديون، رجال الأعمال، والمهتمون برؤية 2030', 'Scaling', NULL, NULL, '2026-01-25 14:24:06'),
('sub-h421mu', 'محتوى', 'Sub-project of مساعد الإطلاق', 'Rocket', 'bg-orange-500', 'projects', '[]', '[]', '[]', NULL, NULL, 'launch_assistant', 'Content', '2026-01-25 14:35:24'),
('sub-ihrqux', 'سلاسل المحتوى سوشال ميديا ', 'جميع السلاسل الموجودة في منصة المستثمر لجدولتها للمستقلين\n', 'Globe', 'bg-red-500', 'projects', '[]', '[]', '[]', NULL, 'Growth', 'arab_news', 'Content', '2026-01-28 12:29:55'),
('sub-itmvd9', 'مشروع بناء رادار المستثمر MVP ', 'تطبيق ويب تحليلي يهدف إلى تمكين الأفراد والأسر والشركات من اتخاذ قرارات مالية واستثمارية أكثر وعيًا، من خلال عرض بيانات الأسواق والمؤشرات الاقتصادية والمعلومات الاستثمارية بصيغة موثوقة، مبسطة، ومترابطة.\nيعتمد التطبيق على تحويل البيانات المعقدة إلى إشارات واضحة وتحليلات قابلة للفهم، مع ربطها بالسياق الاقتصادي والسلوكي، ليعمل كرادار مبكر يساعد المستخدم على قراءة المخاطر والفرص قبل اتخاذ القرار.', 'TrendingUp', 'bg-emerald-500', 'projects', '["رفع الوعي المالي","تحسين جودة القرارات الاستثمارية","تبسيط قراءة الأسواق","تقليل القرارات العاطفية","تمكين الأسرة ماليًا","دعم التخطيط المالي طويل الأجل","توفير أداة تحليل موثوقة","بناء مرجع عربي احترافي للأسواق"]', '["Next.js، React، TypeScript، Node.js، PostgreSQL، Prisma، Tailwind CSS، Chart.js / D3.js، REST APIs، Financial Data APIs، Vercel، Docker","supabase"]', '[]', 'الأفراد المهتمون بالاستثمار وإدارة المال  العائلات الباحثة عن قرارات مالية طويلة الأجل  رواد الأعمال وأصحاب الشركات الصغيرة والمتوسطة  المستثمرون غير المتفرغين (Non-Professional Investors)  صناع القرار المالي في الشركات', NULL, 'investor_radar', 'Other', '2026-01-26 08:10:14')
ON CONFLICT (id) DO NOTHING;

-- Insert freelancers data
INSERT INTO freelancers (id, name, role, sector, status, rate, contact, project_id) VALUES
('0p0tts2d3', 'اسلام الشناوي', 'مبرمج', 'Development', 'Active', NULL, NULL, 'sub-h421mu'),
('ojwhg77si', 'اسامة السعدي', 'مدخل بيانات وأخبار', 'Content', 'Active', NULL, NULL, 'launch_assistant'),
('pmsz7avaq', 'اسلام الشناوي', 'مبرمج', 'Development', 'Active', NULL, NULL, 'sub-itmvd9'),
('tce6ctqii', 'اسامة السعدي', 'مدخل بيانات', 'Content', 'Active', NULL, NULL, 'sub-h421mu')
ON CONFLICT (id) DO NOTHING;

-- Insert documents data
INSERT INTO documents (id, title, type, content, context_id, created_at) VALUES
('16ca9279-b5ff-4d62-91da-71326b4f3b9f', 'ى\\', 'problem', '{"schemaType":"legacy","legacy":{"problemStatement":"","goals":[],"userStories":[],"acceptanceCriteria":[],"techNotes":""},"sections":[{"id":"context","title":"سياق المستخدم","placeholder":"يتابع عدة مصادر يومياً...","content":""},{"id":"pain_points","title":"نقاط الألم","placeholder":"تضارب المعلومات...","content":""},{"id":"evidence","title":"الأدلة","placeholder":"مقابلات، بيانات استخدام...","content":""},{"id":"impact","title":"الأثر","placeholder":"قرارات بطيئة أو خاطئة...","content":""}],"phase":"discovery","status":"draft","type":"problem"}', 'sub-itmvd9', 1970),
('2bf016af-50b3-4ba9-b605-496d98d804a5', 'م', 'governance_decision', '{"schemaType":"legacy","legacy":{"problemStatement":"","goals":[],"userStories":[],"acceptanceCriteria":[],"techNotes":""},"sections":[{"id":"decision","title":"القرار","placeholder":"","content":""},{"id":"reason","title":"السبب","placeholder":"","content":""},{"id":"alternatives","title":"البدائل المرفوضة","placeholder":"","content":""},{"id":"date","title":"التاريخ و المسؤول","placeholder":"","content":""}],"phase":"governance","status":"draft","type":"governance_decision"}', 'sub-itmvd9', 1970),
('4212d377-95c4-4b94-9ed9-5844723ebb78', 'س', 'prd', '{"schemaType":"legacy","legacy":{"problemStatement":"","goals":[],"userStories":[],"acceptanceCriteria":[],"techNotes":""},"sections":[{"id":"background","title":"الخلفية","placeholder":"ناتجة عن إشارة سوق...","content":""},{"id":"goals","title":"الأهداف","placeholder":"فهم الإشارة خلال 30 ثانية...","content":""},{"id":"user_stories","title":"قصص المستخدم","placeholder":"كمستخدم أريد...","content":""},{"id":"functional","title":"المتطلبات الوظيفية","placeholder":"","content":""},{"id":"non_functional","title":"المتطلبات غير الوظيفية","placeholder":"سرعة التحميل < 2 ثانية...","content":""},{"id":"success_metrics","title":"مؤشرات النجاح","placeholder":"معدل التفاعل...","content":""}],"phase":"definition","status":"draft","type":"prd"}', 'sub-itmvd9', 1970),
('4517756d-32f8-4e6e-8de0-db29a3381793', 'س', 'launch', '{"schemaType":"legacy","legacy":{"problemStatement":"","goals":[],"userStories":[],"acceptanceCriteria":[],"techNotes":""},"sections":[{"id":"audience","title":"الجمهور المستهدف","placeholder":"","content":""},{"id":"messaging","title":"الرسائل الأساسية","placeholder":"","content":""},{"id":"plan","title":"خطة الإطلاق","placeholder":"توقيتات، قنوات...","content":""},{"id":"risks","title":"المخاطر المحتملة","placeholder":"","content":""}],"phase":"launch","status":"draft","type":"launch"}', 'sub-itmvd9', 1970),
('4e5a1e26-cb21-4956-acb7-8081c95a5f6e', 'س', 'vision', '{"schemaType":"legacy","legacy":{"problemStatement":"","goals":[],"userStories":[],"acceptanceCriteria":[],"techNotes":""},"sections":[{"id":"vision","title":"الرؤية","placeholder":"بناء منصة تساعد المستخدم على...","content":""},{"id":"problem","title":"المشكلة العامة","placeholder":"السوق يفتقر إلى...","content":""},{"id":"target_users","title":"المستخدمون المستهدفون","placeholder":"مستثمر فردي، صانع قرار...","content":""},{"id":"value_prop","title":"القيمة المقدمة","placeholder":"تحليل، تفسير، شفافية...","content":""},{"id":"out_of_scope","title":"ما ليس ضمن المنتج","placeholder":"لا نقدم توصيات شراء مباشرة...","content":""}],"phase":"discovery","status":"draft","type":"vision"}', 'sub-itmvd9', 1970),
('52703c7b-abbb-4c29-b7b1-af0f53ee259f', 'س', 'problem', '{"schemaType":"legacy","legacy":{"problemStatement":"","goals":[],"userStories":[],"acceptanceCriteria":[],"techNotes":""},"sections":[{"id":"context","title":"سياق المستخدم","placeholder":"يتابع عدة مصادر يومياً...","content":""},{"id":"pain_points","title":"نقاط الألم","placeholder":"تضارب المعلومات...","content":""},{"id":"evidence","title":"الأدلة","placeholder":"مقابلات، بيانات استخدام...","content":""},{"id":"impact","title":"الأثر","placeholder":"قرارات بطيئة أو خاطئة...","content":""}],"phase":"discovery","status":"draft","type":"problem"}', 'sub-itmvd9', 1970),
('6fe7447e-053f-408d-b15f-5e6966dffc94', 'المستخدم المهتم بالفرص الاقتصادية لا يستطيع تفسير التحولات السوقية في الوقت المناسب', 'problem', '{"schemaType":"legacy","legacy":{"problemStatement":"","goals":[],"userStories":[],"acceptanceCriteria":[],"techNotes":""},"sections":[{"id":"context","title":"سياق المستخدم","placeholder":"يتابع عدة مصادر يومياً...","content":"المستثمر وصانع القرار الاقتصادي يواجه فيضًا من البيانات المتفرقة (سياحة، تأشيرات، فنادق، مطارات…) دون وجود إشارة مركّبة واضحة تشرح:\\nهل ما يحدث فرصة حقيقية؟ ولماذا؟ وبأي درجة تأثير وثقة؟\\n\\nالمستخدم المهتم بالفرص الاقتصادية لا يستطيع تفسير التحولات السوقية في الوقت المناسب، لأن البيانات المتاحة:\\nمتفرقة بين مصادر متعددة\\nتُعرض كأرقام خام دون تفسير\\nلا تربط بين المؤشرات والنتائج الاستثمارية\\nمما يؤدي إلى:\\nتأخر اتخاذ القرار\\nتفويت فرص مبكرة\\nالاعتماد على الانطباع بدل التحليل"},{"id":"pain_points","title":"نقاط الألم","placeholder":"تضارب المعلومات...","content":""},{"id":"evidence","title":"الأدلة","placeholder":"مقابلات، بيانات استخدام...","content":""},{"id":"impact","title":"الأثر","placeholder":"قرارات بطيئة أو خاطئة...","content":""}],"phase":"discovery","status":"draft","type":"problem"}', 'sub-itmvd9', 1970),
('76afa639-cd61-4a32-9898-91cb493044aa', 'لوحة اشارات السوق الذكية', 'PRD', '{"schemaType":"legacy","legacy":{"problemStatement":"","goals":[],"userStories":[],"acceptanceCriteria":[],"techNotes":""},"sections":[{"id":"use_cases","title":"حالات التشغيل","placeholder":"","content":"المستثمرون وصناع القرار بحاجة إلى طريقة فعّالة لفهم تحركات السوق وتحليلها بسرعة ودقة لاتخاذ قرارات استثمارية مستنيرة، دون الحاجة إلى تحليل كميات هائلة من البيانات المعقدة بأنفسهم."},{"id":"permissions","title":"الصلاحيات","placeholder":"","content":""},{"id":"data_flow","title":"تدفق البيانات","placeholder":"","content":""},{"id":"error_handling","title":"معالجة الأخطاء","placeholder":"","content":""}],"phase":"definition","status":"draft","type":"PRD"}', 'sub-itmvd9', 1970),
('7eddd67b-7d11-4810-9a9a-c4902422fcac', 'س', 'tech_spec', '{"schemaType":"legacy","legacy":{"problemStatement":"","goals":[],"userStories":[],"acceptanceCriteria":[],"techNotes":""},"sections":[{"id":"architecture","title":"نظرة عامة على البنية","placeholder":"","content":""},{"id":"data_models","title":"نماذج البيانات","placeholder":"","content":""},{"id":"integrations","title":"التكاملات","placeholder":"","content":""},{"id":"constraints","title":"القيود التقنية","placeholder":"","content":""}],"phase":"execution","status":"draft","type":"tech_spec"}', 'sub-itmvd9', 1970),
('89f83bde-4711-4fbe-a484-52008c86a0db', 'س', 'strategy', '{"schemaType":"legacy","legacy":{"problemStatement":"","goals":[],"userStories":[],"acceptanceCriteria":[],"techNotes":""},"sections":[{"id":"pillars","title":"الركائز الاستراتيجية","placeholder":"التفسير أهم من التنبؤ...","content":""},{"id":"positioning","title":"التموضع في السوق","placeholder":"","content":""},{"id":"differentiators","title":"عناصر التميز","placeholder":"","content":""},{"id":"tradeoffs","title":"التضحيات والاختيارات","placeholder":"","content":""}],"phase":"strategy","status":"draft","type":"strategy"}', 'sub-itmvd9', 1970),
('ad4e8489-6d27-4e4d-85a1-8ad285339e5b', 'ى', 'problem', '{"schemaType":"legacy","legacy":{"problemStatement":"","goals":[],"userStories":[],"acceptanceCriteria":[],"techNotes":""},"sections":[{"id":"context","title":"سياق المستخدم","placeholder":"يتابع عدة مصادر يومياً...","content":""},{"id":"pain_points","title":"نقاط الألم","placeholder":"تضارب المعلومات...","content":""},{"id":"evidence","title":"الأدلة","placeholder":"مقابلات، بيانات استخدام...","content":""},{"id":"impact","title":"الأثر","placeholder":"قرارات بطيئة أو خاطئة...","content":""}],"phase":"discovery","status":"draft","type":"problem"}', 'sub-itmvd9', 1970),
('ad9e5b80-4c6f-472b-97e8-16bd91c072e6', 'س', 'feature_spec', '{"schemaType":"legacy","legacy":{"problemStatement":"","goals":[],"userStories":[],"acceptanceCriteria":[],"techNotes":""},"sections":[{"id":"use_cases","title":"حالات التشغيل","placeholder":"","content":""},{"id":"permissions","title":"الصلاحيات","placeholder":"","content":""},{"id":"data_flow","title":"تدفق البيانات","placeholder":"","content":""},{"id":"error_handling","title":"معالجة الأخطاء","placeholder":"","content":""}],"phase":"definition","status":"draft","type":"feature_spec"}', 'sub-itmvd9', 1970),
('c5fd8bf8-5807-40eb-82dd-3511e3d16308', 'ى', 'problem', '{"schemaType":"legacy","legacy":{"problemStatement":"","goals":[],"userStories":[],"acceptanceCriteria":[],"techNotes":""},"sections":[{"id":"context","title":"سياق المستخدم","placeholder":"يتابع عدة مصادر يومياً...","content":""},{"id":"pain_points","title":"نقاط الألم","placeholder":"تضارب المعلومات...","content":""},{"id":"evidence","title":"الأدلة","placeholder":"مقابلات، بيانات استخدام...","content":""},{"id":"impact","title":"الأثر","placeholder":"قرارات بطيئة أو خاطئة...","content":""}],"phase":"discovery","status":"draft","type":"problem"}', 'sub-itmvd9', 1970),
('de670803-de35-4de7-afdb-614a1217b8e6', 'س', 'problem', '{"schemaType":"legacy","legacy":{"problemStatement":"","goals":[],"userStories":[],"acceptanceCriteria":[],"techNotes":""},"sections":[{"id":"context","title":"سياق المستخدم","placeholder":"يتابع عدة مصادر يومياً...","content":""},{"id":"pain_points","title":"نقاط الألم","placeholder":"تضارب المعلومات...","content":""},{"id":"evidence","title":"الأدلة","placeholder":"مقابلات، بيانات استخدام...","content":""},{"id":"impact","title":"الأثر","placeholder":"قرارات بطيئة أو خاطئة...","content":""}],"phase":"discovery","status":"draft","type":"problem"}', 'sub-itmvd9', 1970)
ON CONFLICT (id) DO NOTHING;

-- Insert pomodoro_sessions data
INSERT INTO pomodoro_sessions (id, project_id, project_name, start_time, end_time, duration, completed, session_date, created_at) VALUES
('1770036230540', 'sub-itmvd9', 'مشروع بناء رادار المستثمر MVP ', 1770033186101, 1770036230540, 2700, true, '2026-02-02', '2026-02-02 12:43:50'),
('1770123232730', 'sub-itmvd9', 'مشروع بناء رادار المستثمر MVP ', 1770120488356, 1770123232730, 2700, true, '2026-02-03', '2026-02-03 12:53:52'),
('1770138123703', 'sub-itmvd9', 'مشروع بناء رادار المستثمر MVP ', 1770135395950, 1770138123703, 2700, true, '2026-02-03', '2026-02-03 17:02:03'),
('1770140976103', 'sub-itmvd9', 'مشروع بناء رادار المستثمر MVP ', 1770138249336, 1770140976103, 2700, true, '2026-02-03', '2026-02-03 17:49:36'),
('1770143714717', 'sub-itmvd9', 'مشروع بناء رادار المستثمر MVP ', 1770140993178, 1770143714717, 2700, true, '2026-02-03', '2026-02-03 18:35:14'),
('1770146509369', 'sub-itmvd9', 'مشروع بناء رادار المستثمر MVP ', 1770143786032, 1770146509369, 2700, true, '2026-02-03', '2026-02-03 19:21:49'),
('1770149880710', 'sub-itmvd9', 'مشروع بناء رادار المستثمر MVP ', 1770147148834, 1770149880711, 2700, true, '2026-02-03', '2026-02-03 20:18:00'),
('1770663885278', 'arab_news', 'المنصة الإخبارية (الوطن العربي)', 1770661152904, 1770663885279, 2700, true, '2026-02-09', '2026-02-09 19:04:45'),
('1770666964721', 'sub-itmvd9', 'مشروع بناء رادار المستثمر MVP ', 1770664227407, 1770666964723, 2700, true, '2026-02-09', '2026-02-09 19:56:04'),
('1770743164446', 'sub-itmvd9', 'مشروع بناء رادار المستثمر MVP ', 1770740433980, 1770743164447, 2700, true, '2026-02-10', '2026-02-10 17:06:04'),
('1770820294470', 'sub-itmvd9', 'مشروع بناء رادار المستثمر MVP ', 1770817555052, 1770820294471, 2700, true, '2026-02-11', '2026-02-11 14:31:34'),
('1770834633657', 'sub-itmvd9', 'مشروع بناء رادار المستثمر MVP ', 1770820662852, 1770834633657, 2700, true, '2026-02-11', '2026-02-11 18:30:33')
ON CONFLICT (id) DO NOTHING;

-- Insert tasks data
INSERT INTO tasks (id, title, category, priority, status, date, suggested_time, duration, rationale, project_id, completed, created_at, rice_score, freelancer_id) VALUES
('0nfbsn9nf', 'تطوير قاعدة بيانات المالية', 'تطوير', 'HIGH', 'TODO', '2023-10-12', '10:00 AM', '4 hours', 'لتوفير بيانات دقيقة ومحدثة، مما يعزز قيمة المنتج للمستخدمين.', 'investor_radar', false, 1769403914745, '{}', NULL),
('27nn85wxq', 'تطوير صفحة التايم لاين العامة', 'Deep Work', 'MEDIUM', 'IN_PROGRESS', '2025-12-19', '09:00 AM', '4h', 'عرض التحديثات والتحليلات لإظهار حيوية المنصة', 'sub-itmvd9', false, 1769436526113, '{"reach":7,"impact":2,"confidence":80,"effort":1.5,"score":7.5}', NULL),
('2f4u2y1ta', 'تنظيم ورشة عمل لدراسة الجدوى التقنية', 'تحليل وتخطيط', 'HIGH', 'TODO', '2023-10-15', '09:00 AM', '3 hours', 'تحديد الإمكانيات التقنية اللازمة لتنفيذ المنصة وتقييم التحديات المحتملة.', 'digital_merchant', false, 1769403912808, '{}', NULL),
('2nd83x5xg', 'تطوير صفحة مقال فردي', 'Content', 'MEDIUM', 'IN_PROGRESS', '2025-12-22', '09:00 AM', '3h', 'عرض مقال تحليلي مع المصادر والكاتب ومحتوى مرتبط', 'sub-itmvd9', false, 1769436526113, '{"reach":6,"impact":2,"confidence":85,"effort":1,"score":10.2}', NULL),
('2nwgxc5nj', 'الصناعات الثقيلة | الطباعة ثلاثية الأبعاد للقطع المعدنية الثقيلة', 'Advanced Manufacturing', 'HIGH', 'DRAFT', '2026-02-17', '09:00 AM', '1h', 'توضيح دور الطباعة ثلاثية الأبعاد في تصنيع القطع الثقيلة وتقليل زمن التوريد والتكاليف', 'sub-ihrqux', false, 1769667161402, '{"reach":7,"impact":3,"confidence":80,"effort":1,"score":16.8}', NULL),
('2p03cdtz9', 'تحليل التغذية الراجعة من المستخدمين', 'بحث وتطوير', 'HIGH', 'TODO', '2022-10-30', '09:00 AM', '2 hours', 'لفهم احتياجات المستخدمين وتحسين تجربتهم على النسخة الموبايل من التطبيق', 'launch_assistant', false, 1769351044642, '{}', NULL),
('4crc06268', 'البحث عن شراكات مع منصات تداول', 'استراتيجي', 'MEDIUM', 'TODO', '2023-10-15', '11:00 AM', '2 hours', 'لتعزيز قيمة المنتج من خلال توفير توصيات وأدوات مدعومة من منصات السوق.', 'investor_radar', false, 1769403914745, '{}', NULL),
('4yfndjj4g', 'تحليل البيانات المالية الحالية', 'تحليل بيانات', 'HIGH', 'TODO', '2023-10-10', '09:00 AM', '3 hours', 'لتحديد الفجوات في البيانات وضمان دقة المعلومات المقدمة للمستخدمين.', 'investor_radar', false, 1769403914745, '{}', NULL),
('5dgwsx8sn', 'الصناعات الثقيلة | الروبوتات الصناعية الضخمة', 'Industrial Robotics', 'HIGH', 'DRAFT', '2026-02-23', '09:00 AM', '1h', 'تحليل دور الروبوتات الصناعية الثقيلة في رفع الكفاءة وتقليل الحوادث', 'sub-ihrqux', false, 1769667161402, '{"reach":8,"impact":3,"confidence":85,"effort":1,"score":20.4}', NULL),
('6ev4opy7l', 'تطوير صفحة تفاصيل الباقات', 'Monetization', 'MEDIUM', 'IN_PROGRESS', '2025-12-24', '09:00 AM', '4h', 'شرح تفصيلي للباقات وحالات الاستخدام', 'sub-itmvd9', false, 1769436526113, '{"reach":6,"impact":2,"confidence":85,"effort":1.5,"score":6.8}', NULL),
('7c1helrqd', 'اقتصاد الرياضة | أكثر المجالات ربحًا في صناعة الرياضة', 'Market Analysis', 'HIGH', 'DRAFT', '2026-01-05', '09:00 AM', '1h', 'استعراض وتحليل القطاعات الأعلى ربحية في صناعة الرياضة مثل البث، الرعاية، والتسويق', 'sub-ihrqux', false, 1769603444981, '{"reach":8,"impact":3,"confidence":80,"effort":1,"score":19.2}', NULL),
('7wanrclgf', 'تطوير صفحة لوحة عامة', 'Deep Work', 'HIGH', 'IN_PROGRESS', '2025-12-20', '09:00 AM', '6h', 'عرض لوحة تحليلية عامة لإقناع المستخدم بقيمة المنصة', 'sub-itmvd9', false, 1769436526113, '{"reach":8,"impact":3,"confidence":85,"effort":2,"score":10.2}', NULL),
('8bn0re3hy', 'تخطيط أسبوع تطوير المنتج', 'إدارة المشروع', 'LOW', 'TODO', '2023-10-27', '09:00 AM', '1 hour', 'وضع جدول زمني مفصل للأسابيع القادمة لضمان الانتقال السلس من مرحلة الفكرة إلى التنفيذ.', 'digital_merchant', false, 1769403912808, '{}', NULL),
('8jqgnxgh5', 'اقتصاد الرياضة | أكثر الرياضات شعبية بحسب الدول', 'Country Case Study', 'MEDIUM', 'TODO', '2026-01-06', '09:00 AM', '1h', 'منشور مقارن يربط بين شعبية الرياضات والواقع الاقتصادي والثقافي لكل دولة', 'sub-ihrqux', false, 1769603444981, '{"reach":6,"impact":2,"confidence":85,"effort":1,"score":10.2}', NULL),
('8zlf0avn7', 'الصناعات الثقيلة | إنترنت الأشياء الصناعي (IIoT) في المصانع الثقيلة', 'Industrial IoT', 'HIGH', 'DRAFT', '2026-02-20', '09:00 AM', '1h', 'تقديم نظرة شاملة عن IIoT ودوره في مراقبة الأداء واتخاذ القرار في المصانع الثقيلة', 'sub-ihrqux', false, 1769667161402, '{"reach":8,"impact":3,"confidence":85,"effort":1,"score":20.4}', NULL),
('99gq5f0yq', 'اقتصاد الرياضة | أداء الأندية الرياضية وتأثيرها على الاقتصاد المحلي', 'Economic Impact', 'HIGH', 'TODO', '2026-01-08', '09:00 AM', '1h', 'توضيح كيف ينعكس أداء الأندية الرياضية على المدن والاقتصاد المحلي', 'sub-ihrqux', false, 1769603444981, '{"reach":7,"impact":3,"confidence":80,"effort":1,"score":16.8}', NULL),
('9p6hj61f0', 'تطوير صفحة المقالات والتحليلات', 'Content', 'MEDIUM', 'IN_PROGRESS', '2025-12-21', '09:00 AM', '4h', 'عرض المقالات والتحليلات لدعم المصداقية وتحسين SEO', 'sub-itmvd9', false, 1769436526113, '{"reach":7,"impact":2,"confidence":90,"effort":1,"score":12.6}', NULL),
('aha1egj6x', 'الصناعات الثقيلة | الذكاء الاصطناعي لتحسين العمليات التشغيلية', 'Industrial AI', 'HIGH', 'DRAFT', '2026-02-24', '09:00 AM', '1h', 'شرح استخدام الذكاء الاصطناعي في تحسين الكفاءة التشغيلية وخفض التكاليف في المصانع الثقيلة', 'sub-ihrqux', false, 1769667161402, '{"reach":8,"impact":3,"confidence":90,"effort":1,"score":21.6}', NULL),
('aovy62x89', 'تحديث واجهة المستخدم', 'تطوير', 'LOW', 'TODO', '2023-10-21', '10:00 AM', '3 hours', 'لجعل التطبيق أكثر سهولة وفعالية من حيث الاستخدام.', 'investor_radar', false, 1769403914745, '{}', NULL),
('auk3c408w', 'صفحة كيف تعمل المنصة', 'الصفحات العامة', 'MEDIUM', 'TODO', '2025-12-04', '09:00 AM', '1d', 'تبسيط عمل المنصة وعرض رحلة البيانات بصريًا', 'sub-itmvd9', false, 1769430222170, '{"confidence":100,"score":3.6363636363636362,"impact":3,"effort":8.25,"reach":10}', 'pmsz7avaq'),
('bajv8u7vd', 'اقتصاد الرياضة | الاقتصاد الرياضي الأوروبي', 'Regional Analysis', 'HIGH', 'TODO', '2026-01-07', '09:00 AM', '1h', 'تحليل نموذج الاقتصاد الرياضي في أوروبا ودوره في دعم الأندية والدوريات الكبرى', 'sub-ihrqux', false, 1769603444981, '{"reach":7,"impact":3,"confidence":85,"effort":1,"score":17.85}', NULL),
('bl0lggfc6', 'تقييم إمكانية الدمج مع Stripe وTamara', 'تطوير', 'HIGH', 'TODO', '2023-10-24', '10:00 AM', '3 hours', 'تأكيد إمكانية الدمج مع حلول الدفع وتقييم أفضل الطرق لتحسين تجربة الدفع للمستخدم.', 'digital_merchant', false, 1769403912808, '{}', NULL),
('byonouhzi', 'تحديث المستندات الفنية والدلائل', 'الوثائق الفنية', 'MEDIUM', 'TODO', '2022-11-21', '10:00 AM', '3 hours', 'لتمكين المطورين والمصممين من فهم التحديثات الجديدة وتطبيق تحسينات بكفاءة', 'launch_assistant', false, 1769351044642, '{}', NULL),
('dau0t06t3', 'تطوير صفحة مصادر البيانات', 'Trust', 'HIGH', 'IN_PROGRESS', '2025-12-27', '09:00 AM', '3h', 'عرض الجهات الرسمية ومنهجية التحقق لبناء الثقة', 'sub-itmvd9', false, 1769436526113, '{"reach":7,"impact":3,"confidence":95,"effort":1,"score":19.9}', NULL),
('e3docwrot', 'الصناعات الثقيلة | أنظمة التوأم الرقمي للمصانع والمعدات', 'Digital Twin', 'HIGH', 'DRAFT', '2026-02-22', '09:00 AM', '1h', 'توضيح كيف تساعد أنظمة التوأم الرقمي في المحاكاة وتقليل المخاطر التشغيلية', 'sub-ihrqux', false, 1769667161402, '{"reach":7,"impact":3,"confidence":85,"effort":1,"score":17.85}', NULL),
('etaampe3p', 'تطوير صفحة إنشاء حساب', 'Authentication', 'HIGH', 'DRAFT', '2025-12-26', '09:00 AM', '4h', 'إنشاء حساب جديد مع اختيار نوع المستخدم', 'sub-itmvd9', false, 1769436526113, '{"reach":8,"impact":3,"confidence":90,"effort":1.5,"score":14.4}', NULL),
('fah1szymq', 'تطوير صفحة كيف تعمل المنصة', 'Design', 'MEDIUM', 'TODO', '2025-12-17', '09:00 AM', '4h', 'تبسيط آلية عمل المنصة وشرح رحلة البيانات والتحليل', 'sub-itmvd9', false, 1769436526113, '{"reach":8,"impact":2,"confidence":80,"effort":1.5,"score":8.5}', NULL),
('fpq8lpejq', 'اقتصاد الرياضة | قيمة الرياضة الاقتصادية', 'Content Strategy', 'HIGH', 'TODO', '2026-01-03', '09:00 AM', '1h', 'إعداد منشور يشرح القيمة الاقتصادية للرياضة ودورها في الناتج المحلي وفرص العمل', 'sub-ihrqux', false, 1769603444981, '{"reach":8,"impact":3,"confidence":85,"effort":1,"score":20.4}', NULL),
('g3tdylywp', 'الصناعات الثقيلة | التحكم الذكي بالأفران الصناعية', 'Smart Systems', 'HIGH', 'DRAFT', '2026-02-19', '09:00 AM', '1h', 'تحليل أنظمة التحكم الذكي بالأفران الصناعية وتأثيرها على استهلاك الطاقة وجودة الإنتاج', 'sub-ihrqux', false, 1769667161402, '{"reach":7,"impact":3,"confidence":85,"effort":1,"score":17.85}', NULL),
('hx8r905j4', 'تحسين واجهة المستخدم للموبايل', 'تصميم وتجربة المستخدم', 'MEDIUM', 'DONE', '2022-11-11', '11:00 AM', '4 hours', 'لتقديم تجربة مستخدم سلسة وفعالة على الأجهزة المحمولة', 'launch_assistant', true, 1769351044642, '{}', NULL),
('itvb8ob80', 'الصناعات الثقيلة | التحول إلى الطاقة النظيفة في الصناعات الثقيلة', 'Industrial Transformation', 'HIGH', 'DRAFT', '2026-02-14', '09:00 AM', '1h', 'إعداد منشور يشرح دوافع التحول إلى الطاقة النظيفة في الصناعات الثقيلة وأثره على التكاليف والبيئة', 'sub-ihrqux', false, 1769667161402, '{"reach":8,"impact":3,"confidence":85,"effort":1,"score":20.4}', NULL),
('iyfnc6x0f', 'اختيار قنوات الدفع الرئيسية', 'تخطيط', 'HIGH', 'TODO', '2023-10-18', '10:00 AM', '2 hours', 'تحديد أفضل حلول الدفع المتوافقة مع احتياجات التجار وسهولة الدمج مع المنصة.', 'digital_merchant', false, 1769403912808, '{}', NULL),
('j1mvu4u6a', 'تنفيذ مؤتمر فيديو مع المستثمرين الأوائل', 'تواصل', 'MEDIUM', 'TODO', '2023-10-19', '04:00 PM', '1 hour', 'لجمع التعليقات حول النسخة التجريبية وتعزيز العلاقة مع المستخدمين.', 'investor_radar', false, 1769403914745, '{}', NULL),
('kg8hpvwo0', 'اقتصاد الرياضة | اقتصاد إدارة الأندية وأثرها المالي على السوق', 'Management & Finance', 'HIGH', 'TODO', '2026-01-09', '09:00 AM', '1h', 'تحليل إدارة الأندية الرياضية كنموذج مالي وتأثيره على السوق والاقتصاد الوطني', 'sub-ihrqux', false, 1769603444981, '{"reach":8,"impact":3,"confidence":85,"effort":1,"score":20.4}', NULL),
('kn9573bqr', 'تحليل السوق والمنافسين', 'تحليل السوق', 'LOW', 'TODO', '2022-11-14', '02:00 PM', '1 hour', 'لتحديد المميزات المفقودة في المساعد وفرص التحسين مقابل العروض التنافسية', 'launch_assistant', false, 1769351044642, '{}', NULL),
('masaz2510', 'استعراض تقنيات API من Shopify', 'تطوير', 'MEDIUM', 'TODO', '2023-10-22', '01:00 PM', '2 hours', 'فهم ميزات وحدود Shopify API لدمجها بشكل فعال مع المنصة.', 'digital_merchant', false, 1769403912808, '{}', NULL),
('nvy3hrqee', 'الصناعات الثقيلة | الصيانة التنبؤية باستخدام IIoT', 'Predictive Maintenance', 'HIGH', 'DRAFT', '2026-02-21', '09:00 AM', '1h', 'شرح مفهوم الصيانة التنبؤية وكيف تقلل الأعطال والتوقفات غير المخطط لها', 'sub-ihrqux', false, 1769667161402, '{"reach":8,"impact":3,"confidence":80,"effort":1,"score":19.2}', NULL),
('oclkjvdv5', 'الصناعات الثقيلة | الأتمتة الشاملة للمصانع الثقيلة', 'Industrial Automation', 'HIGH', 'DRAFT', '2026-02-15', '09:00 AM', '1h', 'تحليل مفهوم الأتمتة الشاملة ودورها في رفع الإنتاجية وتقليل الاعتماد على العمل اليدوي', 'sub-ihrqux', false, 1769667161402, '{"reach":8,"impact":3,"confidence":80,"effort":1,"score":19.2}', NULL),
('p6d40nylf', 'تنظيم حملة تسويقية', 'تسويق', 'HIGH', 'TODO', '2022-11-16', '01:00 PM', '2 hours', 'لزيادة الوعي بالمنتج وجذب مستخدمين جدد بهدف الوصول إلى 10,000 مستخدم نشط', 'launch_assistant', false, 1769351044642, '{}', NULL),
('pjupw9t91', 'تطوير الصفحة الرئيسية', 'Deep Work', 'HIGH', 'TODO', '2025-12-15', '09:00 AM', '6h', 'بناء الصفحة الرئيسية لشرح قيمة المنصة وتحفيز المستخدم على التسجيل', 'sub-itmvd9', false, 1769436526113, '{"reach":10,"impact":3,"confidence":90,"effort":2,"score":13.5}', NULL),
('qgh4612xt', 'الصناعات الثقيلة | المسح ثلاثي الأبعاد والليدار في المناجم والمصانع', 'Industrial Mapping', 'MEDIUM', 'DRAFT', '2026-02-18', '09:00 AM', '1h', 'شرح تقنيات المسح ثلاثي الأبعاد والليدار ودورها في تحسين التخطيط والسلامة الصناعية', 'sub-ihrqux', false, 1769667161402, '{"reach":6,"impact":2,"confidence":80,"effort":1,"score":9.6}', NULL),
('r9dtraexc', 'تطوير صفحة تسجيل الدخول', 'Authentication', 'HIGH', 'TODO', '2025-12-25', '09:00 AM', '3h', 'تمكين المستخدم من تسجيل الدخول واستعادة كلمة المرور', 'sub-itmvd9', false, 1769436526113, '{"reach":7,"impact":3,"confidence":95,"effort":1,"score":19.9}', NULL),
('rb0y09w20', 'الصناعات الثقيلة | أنظمة الواقع المعزز للصيانة والتشغيل (AR)', 'Operational Technology', 'MEDIUM', 'DRAFT', '2026-02-16', '09:00 AM', '1h', 'شرح استخدام الواقع المعزز في تقليل الأعطال وتحسين كفاءة الصيانة والتدريب الصناعي', 'sub-ihrqux', false, 1769667161402, '{"reach":6,"impact":2,"confidence":85,"effort":1,"score":10.2}', NULL),
('sxh2qhtya', 'تطوير صفحة الاستكشاف', 'Deep Work', 'HIGH', 'TODO', '2025-12-18', '09:00 AM', '6h', 'عرض محتوى تجريبي قبل التسجيل مع فلاتر وعينات من التحليلات', 'sub-itmvd9', false, 1769436526113, '{"reach":9,"impact":3,"confidence":85,"effort":2,"score":11.5}', NULL),
('t0u6dbdke', 'بدء تصميم واجهة تجربة المستخدم (UX/UI) للمنصة', 'تصميم', 'MEDIUM', 'TODO', '2023-10-20', '11:00 AM', '4 hours', 'إنشاء تصميمات أولية تركز على تحسين تجربة المستخدم للتجار الرقميين.', 'digital_merchant', false, 1769403912808, '{}', NULL),
('trflmyrm1', 'إعداد خطة اختبار للنسخة التجريبية', 'تجربة المستخدم', 'HIGH', 'TODO', '2023-10-17', '01:00 PM', '2 hours', 'لتحديد وإصلاح الأخطاء وتحسين تجربة المستخدم قبل الإطلاق العام.', 'investor_radar', false, 1769403914745, '{}', NULL),
('u4xchr5ne', 'اقتصاد الرياضة | محبة النادي الرياضي كاستثمار طويل الأمد', 'Investment Content', 'HIGH', 'TODO', '2026-01-04', '09:00 AM', '1h', 'تحليل فكرة الولاء للنادي الرياضي كأصل معنوي يتحول إلى قيمة اقتصادية واستثمارية', 'sub-ihrqux', false, 1769603444981, '{"reach":7,"impact":3,"confidence":80,"effort":1,"score":16.8}', NULL),
('v09jhl3eo', 'تطوير المولد الآلي لخطط العمل', 'تطوير المنتج', 'HIGH', 'TODO', '2022-11-06', '10:00 AM', '3 hours', 'لزيادة القيمة المقدمة لرواد الأعمال ومساعدتهم في تسريع عملية بناء نماذج العمل', 'launch_assistant', false, 1769351044642, '{}', NULL),
('wth9cxtnr', 'تطوير صفحة ما هو رادار المستثمر', 'Deep Work', 'HIGH', 'TODO', '2025-12-16', '09:00 AM', '4h', 'شرح مشكلة السوق وكيف تحلها المنصة وما يميزها عن الأخبار التقليدية', 'sub-itmvd9', false, 1769436526113, '{"reach":9,"impact":3,"confidence":85,"effort":1.5,"score":15.3}', NULL),
('xlf04sd3p', 'تطوير صفحة الأسعار', 'Monetization', 'HIGH', 'TODO', '2025-12-23', '09:00 AM', '4h', 'عرض الباقات وتحفيز المستخدم على الاشتراك', 'sub-itmvd9', false, 1769436526113, '{"reach":8,"impact":3,"confidence":90,"effort":1.5,"score":14.4}', NULL)
ON CONFLICT (id) DO NOTHING;

COMMIT;

SET session_replication_role = DEFAULT;