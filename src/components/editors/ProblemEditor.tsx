import React, { useState } from 'react';
import { AlertCircle, User, Database, TrendingDown, Crosshair, FileText } from 'lucide-react';
import { ProblemStatementDocument } from '../../types';
import { EditorFrame, Section, Field, TextInput, SelectInput, ArrayField, ObjectList } from './EditorComponents';

// إنشاء وثيقة فارغة
const createEmpty = (projectId: string): ProblemStatementDocument => ({
    metadata: {
        documentId: crypto.randomUUID(),
        projectId,
        version: '1.0.0',
        status: 'draft',
        createdAt: Date.now(),
        updatedAt: null,
        author: ''
    },
    userContext: { persona: '', currentJourney: '', environment: '', frequency: '', triggers: [] },
    painPoints: [],
    evidence: [],
    impact: { onUser: { description: '', metrics: [] }, onBusiness: { description: '', estimatedCost: null, metrics: [] }, emotional: [] },
    stateComparison: { currentState: '', desiredState: '', obstacles: [] },
    problemSummary: { statement: '', hypothesis: '' }
});

interface Props {
    document: ProblemStatementDocument | null;
    projectId: string;
    onSave: (doc: ProblemStatementDocument) => void;
    onClose: () => void;
    isNew?: boolean;
}

const ProblemEditor: React.FC<Props> = ({ document, projectId, onSave, onClose, isNew }) => {
    const [doc, setDoc] = useState<ProblemStatementDocument>(() => document || createEmpty(projectId));
    const [errors, setErrors] = useState<string[]>([]);

    const handleSave = () => {
        const errs: string[] = [];
        if (!doc.problemSummary.statement) errs.push('بيان المشكلة مطلوب');
        if (!doc.userContext.persona) errs.push('شخصية المستخدم مطلوبة');
        if (errs.length > 0) { setErrors(errs); return; }
        doc.metadata.updatedAt = Date.now();
        onSave(doc);
    };

    return (
        <EditorFrame
            title={isNew ? 'إنشاء بيان المشكلة' : 'تحرير بيان المشكلة'}
            subtitle="توصيف المشكلة بدقة دون القفز للحلول"
            icon={<AlertCircle className="w-5 h-5" />}
            iconColor="bg-gradient-to-br from-red-500 to-rose-600"
            onSave={handleSave}
            onClose={onClose}
            errors={errors}
        >
            {/* سياق المستخدم */}
            <Section title="سياق المستخدم" icon={<User className="w-4 h-4" />} color="bg-purple-500" defaultOpen>
                <Field label="الشخصية المستهدفة (Persona)" required>
                    <TextInput value={doc.userContext.persona} onChange={v => setDoc({ ...doc, userContext: { ...doc.userContext, persona: v } })} placeholder="مستثمر فردي في سوق الأسهم..." />
                </Field>
                <Field label="رحلة المستخدم الحالية">
                    <TextInput value={doc.userContext.currentJourney} onChange={v => setDoc({ ...doc, userContext: { ...doc.userContext, currentJourney: v } })} placeholder="يتابع عدة مصادر يومياً ويحاول فهم السوق..." multiline rows={3} />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="بيئة الاستخدام">
                        <TextInput value={doc.userContext.environment} onChange={v => setDoc({ ...doc, userContext: { ...doc.userContext, environment: v } })} placeholder="من المنزل، أثناء العمل..." />
                    </Field>
                    <Field label="تكرار المواجهة للمشكلة">
                        <TextInput value={doc.userContext.frequency} onChange={v => setDoc({ ...doc, userContext: { ...doc.userContext, frequency: v } })} placeholder="يومياً، أسبوعياً..." />
                    </Field>
                </div>
                <Field label="محفزات ظهور المشكلة">
                    <ArrayField items={doc.userContext.triggers} onChange={v => setDoc({ ...doc, userContext: { ...doc.userContext, triggers: v } })} placeholder="أضف محفزاً..." />
                </Field>
            </Section>

            {/* نقاط الألم */}
            <Section title="نقاط الألم" icon={<TrendingDown className="w-4 h-4" />} color="bg-red-500">
                <ObjectList
                    items={doc.painPoints}
                    onChange={v => setDoc({ ...doc, painPoints: v })}
                    itemLabel="نقطة ألم"
                    createNew={() => ({ pain: '', severity: 'medium' as const, frequency: 'sometimes' as const, workaround: null })}
                    renderItem={(item, _, update) => (
                        <div className="space-y-3">
                            <TextInput value={item.pain} onChange={v => update({ ...item, pain: v })} placeholder="وصف نقطة الألم..." multiline />
                            <div className="grid grid-cols-2 gap-3">
                                <SelectInput value={item.severity} onChange={v => update({ ...item, severity: v as any })} options={[
                                    { value: 'critical', label: 'حرج' }, { value: 'high', label: 'عالي' },
                                    { value: 'medium', label: 'متوسط' }, { value: 'low', label: 'منخفض' }
                                ]} />
                                <SelectInput value={item.frequency} onChange={v => update({ ...item, frequency: v as any })} options={[
                                    { value: 'always', label: 'دائماً' }, { value: 'often', label: 'غالباً' },
                                    { value: 'sometimes', label: 'أحياناً' }, { value: 'rarely', label: 'نادراً' }
                                ]} />
                            </div>
                            <TextInput value={item.workaround || ''} onChange={v => update({ ...item, workaround: v || null })} placeholder="كيف يتعامل معها حالياً؟" />
                        </div>
                    )}
                />
            </Section>

            {/* الأدلة */}
            <Section title="الأدلة والبيانات" icon={<Database className="w-4 h-4" />} color="bg-blue-500">
                <ObjectList
                    items={doc.evidence}
                    onChange={v => setDoc({ ...doc, evidence: v })}
                    itemLabel="دليل"
                    createNew={() => ({ type: 'interview' as const, source: '', finding: '', sampleSize: null, date: '' })}
                    renderItem={(item, _, update) => (
                        <div className="space-y-3">
                            <SelectInput value={item.type} onChange={v => update({ ...item, type: v as any })} options={[
                                { value: 'interview', label: 'مقابلة' }, { value: 'survey', label: 'استبيان' },
                                { value: 'analytics', label: 'تحليلات' }, { value: 'support_tickets', label: 'تذاكر دعم' },
                                { value: 'observation', label: 'ملاحظة' }, { value: 'research', label: 'بحث' }
                            ]} />
                            <TextInput value={item.source} onChange={v => update({ ...item, source: v })} placeholder="المصدر" />
                            <TextInput value={item.finding} onChange={v => update({ ...item, finding: v })} placeholder="النتيجة/الاكتشاف" multiline />
                            <div className="grid grid-cols-2 gap-3">
                                <TextInput value={item.sampleSize?.toString() || ''} onChange={v => update({ ...item, sampleSize: parseInt(v) || null })} placeholder="حجم العينة" />
                                <TextInput value={item.date} onChange={v => update({ ...item, date: v })} placeholder="التاريخ" />
                            </div>
                        </div>
                    )}
                />
            </Section>

            {/* الأثر */}
            <Section title="الأثر والتأثير" icon={<Crosshair className="w-4 h-4" />} color="bg-amber-500">
                <Field label="الأثر على المستخدم">
                    <TextInput value={doc.impact.onUser.description} onChange={v => setDoc({ ...doc, impact: { ...doc.impact, onUser: { ...doc.impact.onUser, description: v } } })} placeholder="كيف تؤثر المشكلة على المستخدم..." multiline />
                </Field>
                <Field label="الأثر على الأعمال">
                    <TextInput value={doc.impact.onBusiness.description} onChange={v => setDoc({ ...doc, impact: { ...doc.impact, onBusiness: { ...doc.impact.onBusiness, description: v } } })} placeholder="التكلفة على الأعمال..." multiline />
                </Field>
                <Field label="الأثر العاطفي">
                    <ArrayField items={doc.impact.emotional} onChange={v => setDoc({ ...doc, impact: { ...doc.impact, emotional: v } })} placeholder="شعور سلبي..." />
                </Field>
            </Section>

            {/* المقارنة */}
            <Section title="الحالة الحالية vs المرغوبة" icon={<FileText className="w-4 h-4" />} color="bg-indigo-500">
                <Field label="الحالة الحالية">
                    <TextInput value={doc.stateComparison.currentState} onChange={v => setDoc({ ...doc, stateComparison: { ...doc.stateComparison, currentState: v } })} placeholder="كيف تُنجز المهمة حالياً..." multiline />
                </Field>
                <Field label="الحالة المرغوبة">
                    <TextInput value={doc.stateComparison.desiredState} onChange={v => setDoc({ ...doc, stateComparison: { ...doc.stateComparison, desiredState: v } })} placeholder="الحالة المثالية التي نريد الوصول إليها..." multiline />
                </Field>
                <Field label="العوائق">
                    <ArrayField items={doc.stateComparison.obstacles} onChange={v => setDoc({ ...doc, stateComparison: { ...doc.stateComparison, obstacles: v } })} placeholder="عائق..." />
                </Field>
            </Section>

            {/* الملخص */}
            <Section title="ملخص بيان المشكلة" icon={<AlertCircle className="w-4 h-4" />} color="bg-slate-700" defaultOpen>
                <Field label="بيان المشكلة المختصر" required hint="جملة أو جملتين تلخص المشكلة">
                    <TextInput value={doc.problemSummary.statement} onChange={v => setDoc({ ...doc, problemSummary: { ...doc.problemSummary, statement: v } })} placeholder="[المستخدم] يواجه [المشكلة] مما يؤدي إلى [الأثر]" multiline />
                </Field>
                <Field label="الفرضية المقترحة للحل" hint="نعتقد أنه إذا... سنحقق...">
                    <TextInput value={doc.problemSummary.hypothesis} onChange={v => setDoc({ ...doc, problemSummary: { ...doc.problemSummary, hypothesis: v } })} placeholder="نعتقد أنه إذا قمنا بـ... فإن المستخدم سيتمكن من..." multiline />
                </Field>
            </Section>
        </EditorFrame>
    );
};

export default ProblemEditor;
