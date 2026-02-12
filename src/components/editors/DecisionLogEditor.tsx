import React, { useState } from 'react';
import { ShieldCheck, FileText, List, Scale, Zap, Calendar, RotateCcw } from 'lucide-react';
import { DecisionLogDocument, createEmptyDecisionLogDocument } from '../../types';
import { EditorFrame, Section, Field, TextInput, SelectInput, ArrayField, ObjectList } from './EditorComponents';

interface Props {
    document: DecisionLogDocument | null;
    projectId: string;
    onSave: (doc: DecisionLogDocument) => void;
    onClose: () => void;
    isNew?: boolean;
}

const DecisionLogEditor: React.FC<Props> = ({ document, projectId, onSave, onClose, isNew }) => {
    const [doc, setDoc] = useState<DecisionLogDocument>(() => document || createEmptyDecisionLogDocument(projectId));
    const [errors, setErrors] = useState<string[]>([]);

    const handleSave = () => {
        const errs: string[] = [];
        if (!doc.decision.title) errs.push('عنوان القرار مطلوب');
        if (!doc.decision.summary) errs.push('ملخص القرار مطلوب');
        if (doc.options.length === 0) errs.push('يجب إضافة خيار واحد على الأقل');
        if (errs.length > 0) { setErrors(errs); return; }
        doc.metadata.updatedAt = Date.now();
        onSave(doc);
    };

    return (
        <EditorFrame
            title={isNew ? 'إنشاء سجل قرار' : 'تحرير سجل القرار'}
            subtitle="توثيق أسباب القرارات المهمة"
            icon={<ShieldCheck className="w-5 h-5" />}
            iconColor="bg-gradient-to-br from-red-500 to-pink-600"
            onSave={handleSave}
            onClose={onClose}
            errors={errors}
        >
            {/* القرار */}
            <Section title="القرار" icon={<FileText className="w-4 h-4" />} color="bg-red-500" defaultOpen>
                <Field label="عنوان القرار" required>
                    <TextInput value={doc.decision.title} onChange={v => setDoc({ ...doc, decision: { ...doc.decision, title: v } })} placeholder="استخدام PostgreSQL بدلاً من MongoDB" />
                </Field>
                <Field label="ملخص القرار" required>
                    <TextInput value={doc.decision.summary} onChange={v => setDoc({ ...doc, decision: { ...doc.decision, summary: v } })} placeholder="قررنا اعتماد PostgreSQL كقاعدة بيانات رئيسية..." multiline />
                </Field>
                <Field label="السياق" hint="ما الذي أدى لهذا القرار؟">
                    <TextInput value={doc.decision.context} onChange={v => setDoc({ ...doc, decision: { ...doc.decision, context: v } })} placeholder="نحتاج قاعدة بيانات تدعم العلاقات المعقدة..." multiline />
                </Field>
                <Field label="نطاق التأثير">
                    <TextInput value={doc.decision.scope} onChange={v => setDoc({ ...doc, decision: { ...doc.decision, scope: v } })} placeholder="جميع الخدمات الخلفية" />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="الحالة">
                        <SelectInput value={doc.metadata.status} onChange={v => setDoc({ ...doc, metadata: { ...doc.metadata, status: v as any } })} options={[
                            { value: 'proposed', label: 'مقترح' }, { value: 'accepted', label: 'مقبول' },
                            { value: 'deprecated', label: 'ملغى' }, { value: 'superseded', label: 'مُستبدَل' }
                        ]} />
                    </Field>
                    <Field label="تاريخ اتخاذ القرار">
                        <TextInput value={doc.metadata.decidedAt ? new Date(doc.metadata.decidedAt).toISOString().split('T')[0] : ''} onChange={v => setDoc({ ...doc, metadata: { ...doc.metadata, decidedAt: v ? new Date(v).getTime() : null } })} placeholder="YYYY-MM-DD" />
                    </Field>
                </div>
                <Field label="صانعو القرار">
                    <ArrayField items={doc.metadata.deciders} onChange={v => setDoc({ ...doc, metadata: { ...doc.metadata, deciders: v } })} placeholder="اسم..." />
                </Field>
            </Section>

            {/* الخيارات المدروسة */}
            <Section title="الخيارات المدروسة" icon={<List className="w-4 h-4" />} color="bg-blue-500">
                <ObjectList
                    items={doc.options}
                    onChange={v => setDoc({ ...doc, options: v })}
                    itemLabel="خيار"
                    createNew={() => ({ option: '', description: '', pros: [], cons: [], effort: 'medium' as const, risk: 'medium' as const, chosen: false })}
                    renderItem={(item, _, update) => (
                        <div className="space-y-3">
                            <div className="flex items-center gap-3">
                                <input type="checkbox" checked={item.chosen} onChange={e => update({ ...item, chosen: e.target.checked })} className="w-4 h-4 accent-green-500" />
                                <span className="text-xs font-bold text-slate-500">{item.chosen ? 'الخيار المختار ✓' : 'غير مختار'}</span>
                            </div>
                            <TextInput value={item.option} onChange={v => update({ ...item, option: v })} placeholder="اسم الخيار" />
                            <TextInput value={item.description} onChange={v => update({ ...item, description: v })} placeholder="وصف الخيار..." multiline />
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-bold text-green-600 mb-1 block">الإيجابيات</label>
                                    <ArrayField items={item.pros} onChange={v => update({ ...item, pros: v })} placeholder="إيجابية..." />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-red-600 mb-1 block">السلبيات</label>
                                    <ArrayField items={item.cons} onChange={v => update({ ...item, cons: v })} placeholder="سلبية..." />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <SelectInput value={item.effort} onChange={v => update({ ...item, effort: v as any })} options={[
                                    { value: 'low', label: 'جهد منخفض' }, { value: 'medium', label: 'جهد متوسط' }, { value: 'high', label: 'جهد عالي' }
                                ]} />
                                <SelectInput value={item.risk} onChange={v => update({ ...item, risk: v as any })} options={[
                                    { value: 'low', label: 'مخاطر منخفضة' }, { value: 'medium', label: 'مخاطر متوسطة' }, { value: 'high', label: 'مخاطر عالية' }
                                ]} />
                            </div>
                        </div>
                    )}
                />
            </Section>

            {/* التبرير */}
            <Section title="التبرير" icon={<Scale className="w-4 h-4" />} color="bg-amber-500">
                <Field label="لماذا اخترنا هذا الخيار؟">
                    <TextInput value={doc.rationale.whyChosen} onChange={v => setDoc({ ...doc, rationale: { ...doc.rationale, whyChosen: v } })} placeholder="PostgreSQL يوفر ACID transactions و..." multiline rows={4} />
                </Field>
                <Field label="لماذا رفضنا الخيارات الأخرى؟">
                    <TextInput value={doc.rationale.whyNotOthers} onChange={v => setDoc({ ...doc, rationale: { ...doc.rationale, whyNotOthers: v } })} placeholder="MongoDB لا يدعم العلاقات المعقدة بشكل طبيعي..." multiline rows={3} />
                </Field>
                <Field label="الافتراضات">
                    <ArrayField items={doc.rationale.assumptions} onChange={v => setDoc({ ...doc, rationale: { ...doc.rationale, assumptions: v } })} placeholder="افتراض..." />
                </Field>
                <Field label="القيود التي أثرت على القرار">
                    <ArrayField items={doc.rationale.constraints} onChange={v => setDoc({ ...doc, rationale: { ...doc.rationale, constraints: v } })} placeholder="قيد..." />
                </Field>
            </Section>

            {/* التبعات */}
            <Section title="التبعات والعواقب" icon={<Zap className="w-4 h-4" />} color="bg-purple-500">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <Field label="التبعات الإيجابية">
                        <ArrayField items={doc.consequences.positive} onChange={v => setDoc({ ...doc, consequences: { ...doc.consequences, positive: v } })} placeholder="نتيجة إيجابية..." />
                    </Field>
                    <Field label="التبعات السلبية">
                        <ArrayField items={doc.consequences.negative} onChange={v => setDoc({ ...doc, consequences: { ...doc.consequences, negative: v } })} placeholder="نتيجة سلبية..." />
                    </Field>
                </div>
                <Field label="المخاطر الناتجة">
                    <ArrayField items={doc.consequences.risks} onChange={v => setDoc({ ...doc, consequences: { ...doc.consequences, risks: v } })} placeholder="خطر..." />
                </Field>
                <Field label="خطط التخفيف">
                    <ArrayField items={doc.consequences.mitigations} onChange={v => setDoc({ ...doc, consequences: { ...doc.consequences, mitigations: v } })} placeholder="خطة تخفيف..." />
                </Field>
            </Section>

            {/* المتابعة */}
            <Section title="المتابعة" icon={<Calendar className="w-4 h-4" />} color="bg-green-500">
                <Field label="إجراءات المتابعة">
                    <ObjectList
                        items={doc.followUp}
                        onChange={v => setDoc({ ...doc, followUp: v })}
                        itemLabel="إجراء"
                        createNew={() => ({ action: '', owner: '', dueDate: '', status: 'pending' as const })}
                        renderItem={(item, _, update) => (
                            <div className="space-y-3">
                                <TextInput value={item.action} onChange={v => update({ ...item, action: v })} placeholder="الإجراء المطلوب" />
                                <div className="grid grid-cols-3 gap-3">
                                    <TextInput value={item.owner} onChange={v => update({ ...item, owner: v })} placeholder="المسؤول" />
                                    <TextInput value={item.dueDate} onChange={v => update({ ...item, dueDate: v })} placeholder="التاريخ" />
                                    <SelectInput value={item.status} onChange={v => update({ ...item, status: v as any })} options={[
                                        { value: 'pending', label: 'قيد الانتظار' }, { value: 'done', label: 'مكتمل ✓' }
                                    ]} />
                                </div>
                            </div>
                        )}
                    />
                </Field>
            </Section>

            {/* المراجعة */}
            <Section title="جدول المراجعة" icon={<RotateCcw className="w-4 h-4" />} color="bg-slate-600">
                <Field label="تاريخ المراجعة القادمة">
                    <TextInput value={doc.reviewSchedule.nextReviewDate || ''} onChange={v => setDoc({ ...doc, reviewSchedule: { ...doc.reviewSchedule, nextReviewDate: v || null } })} placeholder="YYYY-MM-DD" />
                </Field>
                <Field label="معايير المراجعة" hint="متى يجب إعادة النظر في هذا القرار؟">
                    <ArrayField items={doc.reviewSchedule.reviewCriteria} onChange={v => setDoc({ ...doc, reviewSchedule: { ...doc.reviewSchedule, reviewCriteria: v } })} placeholder="معيار..." />
                </Field>
            </Section>
        </EditorFrame>
    );
};

export default DecisionLogEditor;
