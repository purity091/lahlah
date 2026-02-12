import React, { useState } from 'react';
import { ListChecks, FileText, Users, Target, Zap, Clock, Shield, TrendingUp } from 'lucide-react';
import { PRDDocument, createEmptyPRDDocument } from '../../types';
import { EditorFrame, Section, Field, TextInput, SelectInput, ArrayField, ObjectList } from './EditorComponents';

interface Props {
    document: PRDDocument | null;
    projectId: string;
    onSave: (doc: PRDDocument) => void;
    onClose: () => void;
    isNew?: boolean;
}

const PRDEditor: React.FC<Props> = ({ document, projectId, onSave, onClose, isNew }) => {
    const [doc, setDoc] = useState<PRDDocument>(() => document || createEmptyPRDDocument(projectId));
    const [errors, setErrors] = useState<string[]>([]);

    const handleSave = () => {
        const errs: string[] = [];
        if (!doc.goals.primary) errs.push('الهدف الأساسي مطلوب');
        if (doc.userStories.length === 0) errs.push('يجب إضافة قصة مستخدم واحدة على الأقل');
        if (errs.length > 0) { setErrors(errs); return; }
        doc.metadata.updatedAt = Date.now();
        onSave(doc);
    };

    return (
        <EditorFrame
            title={isNew ? 'إنشاء وثيقة متطلبات المنتج' : 'تحرير PRD'}
            subtitle="تحويل المشكلة إلى متطلبات قابلة للتنفيذ"
            icon={<ListChecks className="w-5 h-5" />}
            iconColor="bg-gradient-to-br from-indigo-500 to-blue-600"
            onSave={handleSave}
            onClose={onClose}
            errors={errors}
        >
            {/* الخلفية والسياق */}
            <Section title="الخلفية والسياق" icon={<FileText className="w-4 h-4" />} color="bg-slate-500" defaultOpen>
                <Field label="السياق">
                    <TextInput value={doc.background.context} onChange={v => setDoc({ ...doc, background: { ...doc.background, context: v } })} placeholder="ناتجة عن ملاحظات المستخدمين..." multiline />
                </Field>
                <Field label="التوافق الاستراتيجي">
                    <TextInput value={doc.background.strategicAlignment} onChange={v => setDoc({ ...doc, background: { ...doc.background, strategicAlignment: v } })} placeholder="كيف تتوافق مع أهداف المنتج..." />
                </Field>
                <Field label="التبرير التجاري">
                    <TextInput value={doc.background.businessCase} onChange={v => setDoc({ ...doc, background: { ...doc.background, businessCase: v } })} placeholder="لماذا نبني هذه الميزة الآن..." multiline />
                </Field>
            </Section>

            {/* الأهداف */}
            <Section title="الأهداف" icon={<Target className="w-4 h-4" />} color="bg-green-500" defaultOpen>
                <Field label="الهدف الأساسي" required>
                    <TextInput value={doc.goals.primary} onChange={v => setDoc({ ...doc, goals: { ...doc.goals, primary: v } })} placeholder="تقليل وقت البحث من 5 ثواني إلى ثانية واحدة" />
                </Field>
                <Field label="أهداف ثانوية">
                    <ArrayField items={doc.goals.secondary} onChange={v => setDoc({ ...doc, goals: { ...doc.goals, secondary: v } })} placeholder="هدف ثانوي..." />
                </Field>
                <Field label="ما ليس هدفاً (Non-Goals)">
                    <ArrayField items={doc.goals.nonGoals} onChange={v => setDoc({ ...doc, goals: { ...doc.goals, nonGoals: v } })} placeholder="ما لا نريد تحقيقه..." />
                </Field>
            </Section>

            {/* قصص المستخدم */}
            <Section title="قصص المستخدم" icon={<Users className="w-4 h-4" />} color="bg-purple-500">
                <ObjectList
                    items={doc.userStories}
                    onChange={v => setDoc({ ...doc, userStories: v })}
                    itemLabel="قصة مستخدم"
                    createNew={() => ({ id: `US-${Date.now()}`, asA: '', iWant: '', soThat: '', priority: 'should' as const, acceptanceCriteria: [] })}
                    renderItem={(item, _, update) => (
                        <div className="space-y-3">
                            <div className="text-[10px] font-mono text-slate-400 mb-2">{item.id}</div>
                            <TextInput value={item.asA} onChange={v => update({ ...item, asA: v })} placeholder="كـ [نوع المستخدم]..." />
                            <TextInput value={item.iWant} onChange={v => update({ ...item, iWant: v })} placeholder="أريد [الفعل]..." />
                            <TextInput value={item.soThat} onChange={v => update({ ...item, soThat: v })} placeholder="لكي [الفائدة]..." />
                            <SelectInput value={item.priority} onChange={v => update({ ...item, priority: v as any })} options={[
                                { value: 'must', label: 'يجب (Must)' }, { value: 'should', label: 'ينبغي (Should)' },
                                { value: 'could', label: 'يمكن (Could)' }, { value: 'wont', label: 'لن (Won\'t)' }
                            ]} />
                            <Field label="معايير القبول">
                                <ArrayField items={item.acceptanceCriteria} onChange={v => update({ ...item, acceptanceCriteria: v })} placeholder="معيار قبول..." />
                            </Field>
                        </div>
                    )}
                />
            </Section>

            {/* المتطلبات الوظيفية */}
            <Section title="المتطلبات الوظيفية" icon={<Zap className="w-4 h-4" />} color="bg-cyan-500">
                <ObjectList
                    items={doc.functionalRequirements}
                    onChange={v => setDoc({ ...doc, functionalRequirements: v })}
                    itemLabel="متطلب وظيفي"
                    createNew={() => ({ id: `FR-${Date.now()}`, requirement: '', priority: 'should' as const, userStoryRef: [], notes: null })}
                    renderItem={(item, _, update) => (
                        <div className="space-y-3">
                            <div className="text-[10px] font-mono text-slate-400">{item.id}</div>
                            <TextInput value={item.requirement} onChange={v => update({ ...item, requirement: v })} placeholder="يجب على النظام أن..." multiline />
                            <SelectInput value={item.priority} onChange={v => update({ ...item, priority: v as any })} options={[
                                { value: 'must', label: 'يجب' }, { value: 'should', label: 'ينبغي' }, { value: 'could', label: 'يمكن' }
                            ]} />
                            <TextInput value={item.notes || ''} onChange={v => update({ ...item, notes: v || null })} placeholder="ملاحظات إضافية..." />
                        </div>
                    )}
                />
            </Section>

            {/* المتطلبات غير الوظيفية */}
            <Section title="المتطلبات غير الوظيفية" icon={<Shield className="w-4 h-4" />} color="bg-teal-500">
                <ObjectList
                    items={doc.nonFunctionalRequirements}
                    onChange={v => setDoc({ ...doc, nonFunctionalRequirements: v })}
                    itemLabel="متطلب غير وظيفي"
                    createNew={() => ({ category: 'performance' as const, requirement: '', metric: '', target: '' })}
                    renderItem={(item, _, update) => (
                        <div className="space-y-3">
                            <SelectInput value={item.category} onChange={v => update({ ...item, category: v as any })} options={[
                                { value: 'performance', label: 'الأداء' }, { value: 'security', label: 'الأمان' },
                                { value: 'scalability', label: 'قابلية التوسع' }, { value: 'accessibility', label: 'إمكانية الوصول' },
                                { value: 'usability', label: 'سهولة الاستخدام' }, { value: 'reliability', label: 'الموثوقية' }
                            ]} />
                            <TextInput value={item.requirement} onChange={v => update({ ...item, requirement: v })} placeholder="المتطلب..." multiline />
                            <div className="grid grid-cols-2 gap-3">
                                <TextInput value={item.metric} onChange={v => update({ ...item, metric: v })} placeholder="المقياس (مثل: وقت التحميل)" />
                                <TextInput value={item.target} onChange={v => update({ ...item, target: v })} placeholder="الهدف (مثل: < 2 ثانية)" />
                            </div>
                        </div>
                    )}
                />
            </Section>

            {/* مؤشرات النجاح */}
            <Section title="مؤشرات النجاح" icon={<TrendingUp className="w-4 h-4" />} color="bg-emerald-500">
                <ObjectList
                    items={doc.successMetrics}
                    onChange={v => setDoc({ ...doc, successMetrics: v })}
                    itemLabel="مؤشر نجاح"
                    createNew={() => ({ metric: '', baseline: null, target: '', measurementMethod: '', timeframe: '' })}
                    renderItem={(item, _, update) => (
                        <div className="space-y-3">
                            <TextInput value={item.metric} onChange={v => update({ ...item, metric: v })} placeholder="المؤشر (مثل: معدل التفاعل)" />
                            <div className="grid grid-cols-3 gap-3">
                                <TextInput value={item.baseline || ''} onChange={v => update({ ...item, baseline: v || null })} placeholder="القيمة الحالية" />
                                <TextInput value={item.target} onChange={v => update({ ...item, target: v })} placeholder="الهدف" />
                                <TextInput value={item.timeframe} onChange={v => update({ ...item, timeframe: v })} placeholder="الإطار الزمني" />
                            </div>
                            <TextInput value={item.measurementMethod} onChange={v => update({ ...item, measurementMethod: v })} placeholder="طريقة القياس..." />
                        </div>
                    )}
                />
            </Section>

            {/* النطاق */}
            <Section title="النطاق" icon={<Target className="w-4 h-4" />} color="bg-amber-500">
                <Field label="ضمن النطاق">
                    <ArrayField items={doc.scope.inScope} onChange={v => setDoc({ ...doc, scope: { ...doc.scope, inScope: v } })} placeholder="ما سنبنيه..." />
                </Field>
                <Field label="خارج النطاق">
                    <ArrayField items={doc.scope.outOfScope} onChange={v => setDoc({ ...doc, scope: { ...doc.scope, outOfScope: v } })} placeholder="ما لن نبنيه..." />
                </Field>
                <Field label="اعتبارات مستقبلية">
                    <ArrayField items={doc.scope.futureConsiderations} onChange={v => setDoc({ ...doc, scope: { ...doc.scope, futureConsiderations: v } })} placeholder="قد يُضاف لاحقاً..." />
                </Field>
            </Section>

            {/* الجدول الزمني */}
            <Section title="الجدول الزمني" icon={<Clock className="w-4 h-4" />} color="bg-slate-600">
                <Field label="الجهد المقدر">
                    <TextInput value={doc.timeline.estimatedEffort} onChange={v => setDoc({ ...doc, timeline: { ...doc.timeline, estimatedEffort: v } })} placeholder="2 أسابيع، سبرينت واحد..." />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="تاريخ البدء المستهدف">
                        <TextInput value={doc.timeline.targetStartDate || ''} onChange={v => setDoc({ ...doc, timeline: { ...doc.timeline, targetStartDate: v || null } })} placeholder="YYYY-MM-DD" />
                    </Field>
                    <Field label="تاريخ الانتهاء المستهدف">
                        <TextInput value={doc.timeline.targetEndDate || ''} onChange={v => setDoc({ ...doc, timeline: { ...doc.timeline, targetEndDate: v || null } })} placeholder="YYYY-MM-DD" />
                    </Field>
                </div>
            </Section>
        </EditorFrame>
    );
};

export default PRDEditor;
