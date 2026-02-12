import React, { useState } from 'react';
import { Rocket, Users, MessageSquare, CheckSquare, AlertTriangle, TrendingUp, RotateCcw, Calendar } from 'lucide-react';
import { LaunchDocument } from '../../types';
import { EditorFrame, Section, Field, TextInput, SelectInput, ArrayField, ObjectList } from './EditorComponents';

const createEmpty = (projectId: string): LaunchDocument => ({
    metadata: {
        documentId: crypto.randomUUID(),
        projectId,
        featureRef: '',
        launchDate: '',
        status: 'planning',
        createdAt: Date.now(),
        updatedAt: null,
        launchLead: ''
    },
    targetAudience: [],
    rolloutPlan: [],
    messaging: [],
    prelaunchChecklist: [],
    risks: [],
    postLaunchMetrics: [],
    rollbackPlan: { trigger: '', steps: [], estimatedTime: '', notificationPlan: '' }
});

interface Props {
    document: LaunchDocument | null;
    projectId: string;
    onSave: (doc: LaunchDocument) => void;
    onClose: () => void;
    isNew?: boolean;
}

const LaunchEditor: React.FC<Props> = ({ document, projectId, onSave, onClose, isNew }) => {
    const [doc, setDoc] = useState<LaunchDocument>(() => document || createEmpty(projectId));
    const [errors, setErrors] = useState<string[]>([]);

    const handleSave = () => {
        const errs: string[] = [];
        if (!doc.metadata.launchDate) errs.push('تاريخ الإطلاق مطلوب');
        if (doc.targetAudience.length === 0) errs.push('يجب تحديد جمهور مستهدف');
        if (errs.length > 0) { setErrors(errs); return; }
        doc.metadata.updatedAt = Date.now();
        onSave(doc);
    };

    return (
        <EditorFrame
            title={isNew ? 'إنشاء وثيقة الإطلاق' : 'تحرير وثيقة الإطلاق'}
            subtitle="تنظيم إطلاق الميزة أو المنتج"
            icon={<Rocket className="w-5 h-5" />}
            iconColor="bg-gradient-to-br from-emerald-500 to-green-600"
            onSave={handleSave}
            onClose={onClose}
            errors={errors}
        >
            {/* معلومات الإطلاق */}
            <Section title="معلومات الإطلاق" icon={<Calendar className="w-4 h-4" />} color="bg-emerald-500" defaultOpen>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="تاريخ الإطلاق" required>
                        <TextInput value={doc.metadata.launchDate} onChange={v => setDoc({ ...doc, metadata: { ...doc.metadata, launchDate: v } })} placeholder="YYYY-MM-DD" />
                    </Field>
                    <Field label="مسؤول الإطلاق">
                        <TextInput value={doc.metadata.launchLead} onChange={v => setDoc({ ...doc, metadata: { ...doc.metadata, launchLead: v } })} placeholder="اسم المسؤول" />
                    </Field>
                    <Field label="مرجع الميزة">
                        <TextInput value={doc.metadata.featureRef} onChange={v => setDoc({ ...doc, metadata: { ...doc.metadata, featureRef: v } })} placeholder="PRD أو Feature ID" />
                    </Field>
                    <Field label="الحالة">
                        <SelectInput value={doc.metadata.status} onChange={v => setDoc({ ...doc, metadata: { ...doc.metadata, status: v as any } })} options={[
                            { value: 'planning', label: 'التخطيط' }, { value: 'ready', label: 'جاهز' },
                            { value: 'launched', label: 'تم الإطلاق' }, { value: 'rolled_back', label: 'تم التراجع' }
                        ]} />
                    </Field>
                </div>
            </Section>

            {/* الجمهور المستهدف */}
            <Section title="الجمهور المستهدف للإطلاق" icon={<Users className="w-4 h-4" />} color="bg-blue-500">
                <ObjectList
                    items={doc.targetAudience}
                    onChange={v => setDoc({ ...doc, targetAudience: v })}
                    itemLabel="شريحة"
                    createNew={() => ({ segment: '', size: '', rolloutPercentage: 100, criteria: [] })}
                    renderItem={(item, _, update) => (
                        <div className="space-y-3">
                            <TextInput value={item.segment} onChange={v => update({ ...item, segment: v })} placeholder="اسم الشريحة" />
                            <div className="grid grid-cols-2 gap-3">
                                <TextInput value={item.size} onChange={v => update({ ...item, size: v })} placeholder="الحجم التقديري" />
                                <TextInput value={item.rolloutPercentage.toString()} onChange={v => update({ ...item, rolloutPercentage: parseInt(v) || 0 })} placeholder="نسبة الطرح %" />
                            </div>
                            <Field label="معايير الاستهداف">
                                <ArrayField items={item.criteria} onChange={v => update({ ...item, criteria: v })} placeholder="معيار..." />
                            </Field>
                        </div>
                    )}
                />
            </Section>

            {/* خطة الطرح */}
            <Section title="خطة الطرح التدريجي" icon={<TrendingUp className="w-4 h-4" />} color="bg-purple-500">
                <ObjectList
                    items={doc.rolloutPlan}
                    onChange={v => setDoc({ ...doc, rolloutPlan: v })}
                    itemLabel="مرحلة"
                    createNew={() => ({ phase: '', audience: '', percentage: 0, startDate: '', duration: '', successCriteria: [], rollbackTriggers: [] })}
                    renderItem={(item, idx, update) => (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <TextInput value={item.phase} onChange={v => update({ ...item, phase: v })} placeholder={`المرحلة ${idx + 1}`} />
                                <TextInput value={item.percentage.toString()} onChange={v => update({ ...item, percentage: parseInt(v) || 0 })} placeholder="النسبة %" />
                            </div>
                            <TextInput value={item.audience} onChange={v => update({ ...item, audience: v })} placeholder="الجمهور المستهدف" />
                            <div className="grid grid-cols-2 gap-3">
                                <TextInput value={item.startDate} onChange={v => update({ ...item, startDate: v })} placeholder="تاريخ البدء" />
                                <TextInput value={item.duration} onChange={v => update({ ...item, duration: v })} placeholder="المدة" />
                            </div>
                            <Field label="معايير النجاح">
                                <ArrayField items={item.successCriteria} onChange={v => update({ ...item, successCriteria: v })} placeholder="معيار..." />
                            </Field>
                            <Field label="محفزات التراجع">
                                <ArrayField items={item.rollbackTriggers} onChange={v => update({ ...item, rollbackTriggers: v })} placeholder="محفز..." />
                            </Field>
                        </div>
                    )}
                />
            </Section>

            {/* الرسائل */}
            <Section title="الرسائل والتواصل" icon={<MessageSquare className="w-4 h-4" />} color="bg-cyan-500">
                <ObjectList
                    items={doc.messaging}
                    onChange={v => setDoc({ ...doc, messaging: v })}
                    itemLabel="رسالة"
                    createNew={() => ({ channel: '', audience: '', message: '', timing: '', owner: '' })}
                    renderItem={(item, _, update) => (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <TextInput value={item.channel} onChange={v => update({ ...item, channel: v })} placeholder="القناة (بريد، إشعار...)" />
                                <TextInput value={item.audience} onChange={v => update({ ...item, audience: v })} placeholder="الجمهور" />
                            </div>
                            <TextInput value={item.message} onChange={v => update({ ...item, message: v })} placeholder="نص الرسالة..." multiline />
                            <div className="grid grid-cols-2 gap-3">
                                <TextInput value={item.timing} onChange={v => update({ ...item, timing: v })} placeholder="التوقيت" />
                                <TextInput value={item.owner} onChange={v => update({ ...item, owner: v })} placeholder="المسؤول" />
                            </div>
                        </div>
                    )}
                />
            </Section>

            {/* القائمة التحققية */}
            <Section title="قائمة التحقق قبل الإطلاق" icon={<CheckSquare className="w-4 h-4" />} color="bg-amber-500">
                <ObjectList
                    items={doc.prelaunchChecklist}
                    onChange={v => setDoc({ ...doc, prelaunchChecklist: v })}
                    itemLabel="بند"
                    createNew={() => ({ category: 'technical' as const, item: '', status: 'not_started' as const, owner: '', notes: null })}
                    renderItem={(item, _, update) => (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <SelectInput value={item.category} onChange={v => update({ ...item, category: v as any })} options={[
                                    { value: 'technical', label: 'تقني' }, { value: 'marketing', label: 'تسويق' },
                                    { value: 'support', label: 'دعم' }, { value: 'legal', label: 'قانوني' }, { value: 'operations', label: 'عمليات' }
                                ]} />
                                <SelectInput value={item.status} onChange={v => update({ ...item, status: v as any })} options={[
                                    { value: 'done', label: 'مكتمل ✓' }, { value: 'in_progress', label: 'جاري' },
                                    { value: 'not_started', label: 'لم يبدأ' }, { value: 'blocked', label: 'معطل' }
                                ]} />
                            </div>
                            <TextInput value={item.item} onChange={v => update({ ...item, item: v })} placeholder="البند..." />
                            <TextInput value={item.owner} onChange={v => update({ ...item, owner: v })} placeholder="المسؤول" />
                        </div>
                    )}
                />
            </Section>

            {/* المخاطر */}
            <Section title="المخاطر وخطة الطوارئ" icon={<AlertTriangle className="w-4 h-4" />} color="bg-red-500">
                <ObjectList
                    items={doc.risks}
                    onChange={v => setDoc({ ...doc, risks: v })}
                    itemLabel="خطر"
                    createNew={() => ({ risk: '', likelihood: 'medium' as const, impact: 'medium' as const, mitigation: '', contingency: '', owner: '' })}
                    renderItem={(item, _, update) => (
                        <div className="space-y-3">
                            <TextInput value={item.risk} onChange={v => update({ ...item, risk: v })} placeholder="وصف الخطر..." multiline />
                            <div className="grid grid-cols-2 gap-3">
                                <SelectInput value={item.likelihood} onChange={v => update({ ...item, likelihood: v as any })} options={[
                                    { value: 'high', label: 'احتمالية عالية' }, { value: 'medium', label: 'متوسطة' }, { value: 'low', label: 'منخفضة' }
                                ]} />
                                <SelectInput value={item.impact} onChange={v => update({ ...item, impact: v as any })} options={[
                                    { value: 'high', label: 'تأثير عالي' }, { value: 'medium', label: 'متوسط' }, { value: 'low', label: 'منخفض' }
                                ]} />
                            </div>
                            <TextInput value={item.mitigation} onChange={v => update({ ...item, mitigation: v })} placeholder="خطة التخفيف..." />
                            <TextInput value={item.contingency} onChange={v => update({ ...item, contingency: v })} placeholder="خطة الطوارئ..." />
                            <TextInput value={item.owner} onChange={v => update({ ...item, owner: v })} placeholder="المسؤول" />
                        </div>
                    )}
                />
            </Section>

            {/* خطة التراجع */}
            <Section title="خطة التراجع (Rollback)" icon={<RotateCcw className="w-4 h-4" />} color="bg-slate-600">
                <Field label="محفز التراجع">
                    <TextInput value={doc.rollbackPlan.trigger} onChange={v => setDoc({ ...doc, rollbackPlan: { ...doc.rollbackPlan, trigger: v } })} placeholder="متى نتراجع؟ (مثل: انخفاض الأداء بـ 20%)" multiline />
                </Field>
                <Field label="خطوات التراجع">
                    <ArrayField items={doc.rollbackPlan.steps} onChange={v => setDoc({ ...doc, rollbackPlan: { ...doc.rollbackPlan, steps: v } })} placeholder="خطوة..." />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="الوقت المقدر للتراجع">
                        <TextInput value={doc.rollbackPlan.estimatedTime} onChange={v => setDoc({ ...doc, rollbackPlan: { ...doc.rollbackPlan, estimatedTime: v } })} placeholder="30 دقيقة" />
                    </Field>
                    <Field label="خطة الإبلاغ">
                        <TextInput value={doc.rollbackPlan.notificationPlan} onChange={v => setDoc({ ...doc, rollbackPlan: { ...doc.rollbackPlan, notificationPlan: v } })} placeholder="كيف نُبلّغ المتأثرين؟" />
                    </Field>
                </div>
            </Section>
        </EditorFrame>
    );
};

export default LaunchEditor;
