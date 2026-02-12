import React, { useState } from 'react';
import { Eye, Target, Users, Gem, XCircle, TrendingUp } from 'lucide-react';
import { VisionDocument, createEmptyVisionDocument } from '../../types';
import { EditorFrame, Section, Field, TextInput, SelectInput, ArrayField, ObjectList } from './EditorComponents';

interface VisionEditorProps {
    document: VisionDocument | null;
    projectId: string;
    onSave: (doc: VisionDocument) => void;
    onClose: () => void;
    isNew?: boolean;
}

const VisionEditor: React.FC<VisionEditorProps> = ({ document, projectId, onSave, onClose, isNew }) => {
    const [doc, setDoc] = useState<VisionDocument>(() => document || createEmptyVisionDocument(projectId));
    const [errors, setErrors] = useState<string[]>([]);

    const handleSave = () => {
        const errs: string[] = [];
        if (!doc.vision.statement) errs.push('بيان الرؤية مطلوب');
        if (!doc.marketProblem.description) errs.push('وصف المشكلة مطلوب');
        if (errs.length > 0) { setErrors(errs); return; }

        doc.metadata.updatedAt = Date.now();
        onSave(doc);
    };

    return (
        <EditorFrame
            title={isNew ? 'إنشاء وثيقة رؤية المنتج' : 'تحرير وثيقة الرؤية'}
            subtitle="توحيد الفهم العام حول سبب وجود المنتج"
            icon={<Eye className="w-5 h-5" />}
            iconColor="bg-gradient-to-br from-purple-500 to-indigo-600"
            onSave={handleSave}
            onClose={onClose}
            errors={errors}
        >
            {/* الرؤية الأساسية */}
            <Section title="الرؤية الأساسية" icon={<Eye className="w-4 h-4" />} color="bg-purple-500" defaultOpen>
                <Field label="بيان الرؤية" required hint="جملة واحدة قوية تصف ما نريد تحقيقه">
                    <TextInput
                        value={doc.vision.statement}
                        onChange={v => setDoc({ ...doc, vision: { ...doc.vision, statement: v } })}
                        placeholder="نبني منصة تمكّن كل مستثمر من اتخاذ قرارات مدروسة..."
                        multiline
                    />
                </Field>
                <div className="grid grid-cols-2 gap-4">
                    <Field label="الأفق الزمني">
                        <TextInput
                            value={doc.vision.timeHorizon}
                            onChange={v => setDoc({ ...doc, vision: { ...doc.vision, timeHorizon: v } })}
                            placeholder="3-5 سنوات"
                        />
                    </Field>
                    <Field label="مصدر الإلهام">
                        <TextInput
                            value={doc.vision.inspiredBy || ''}
                            onChange={v => setDoc({ ...doc, vision: { ...doc.vision, inspiredBy: v || null } })}
                            placeholder="ما الذي ألهمنا لهذه الرؤية؟"
                        />
                    </Field>
                </div>
            </Section>

            {/* المشكلة في السوق */}
            <Section title="المشكلة العامة في السوق" icon={<Target className="w-4 h-4" />} color="bg-red-500">
                <Field label="وصف المشكلة" required>
                    <TextInput
                        value={doc.marketProblem.description}
                        onChange={v => setDoc({ ...doc, marketProblem: { ...doc.marketProblem, description: v } })}
                        placeholder="السوق يفتقر إلى أدوات تحليل شفافة..."
                        multiline
                        rows={4}
                    />
                </Field>
                <Field label="نطاق المشكلة">
                    <SelectInput
                        value={doc.marketProblem.scope}
                        onChange={v => setDoc({ ...doc, marketProblem: { ...doc.marketProblem, scope: v as any } })}
                        options={[
                            { value: 'global', label: 'عالمي' },
                            { value: 'regional', label: 'إقليمي' },
                            { value: 'local', label: 'محلي' },
                            { value: 'niche', label: 'متخصص' }
                        ]}
                    />
                </Field>
                <Field label="الفئات المتأثرة">
                    <ArrayField
                        items={doc.marketProblem.affectedSegments}
                        onChange={v => setDoc({ ...doc, marketProblem: { ...doc.marketProblem, affectedSegments: v } })}
                        placeholder="أضف فئة متأثرة..."
                    />
                </Field>
                <Field label="الحلول الحالية في السوق">
                    <ArrayField
                        items={doc.marketProblem.currentSolutions}
                        onChange={v => setDoc({ ...doc, marketProblem: { ...doc.marketProblem, currentSolutions: v } })}
                        placeholder="حل موجود..."
                    />
                </Field>
                <Field label="الثغرات في الحلول الحالية">
                    <ArrayField
                        items={doc.marketProblem.gaps}
                        onChange={v => setDoc({ ...doc, marketProblem: { ...doc.marketProblem, gaps: v } })}
                        placeholder="ثغرة..."
                    />
                </Field>
            </Section>

            {/* المستخدمون المستهدفون */}
            <Section title="المستخدمون المستهدفون" icon={<Users className="w-4 h-4" />} color="bg-blue-500">
                <Field label="المستخدمون الأساسيون">
                    <ObjectList
                        items={doc.targetAudience.primaryUsers}
                        onChange={v => setDoc({ ...doc, targetAudience: { ...doc.targetAudience, primaryUsers: v } })}
                        itemLabel="مستخدم أساسي"
                        createNew={() => ({ segment: '', description: '', size: null })}
                        renderItem={(item, _, update) => (
                            <div className="space-y-3">
                                <TextInput value={item.segment} onChange={v => update({ ...item, segment: v })} placeholder="اسم الفئة" />
                                <TextInput value={item.description} onChange={v => update({ ...item, description: v })} placeholder="وصف الفئة" multiline />
                                <TextInput value={item.size || ''} onChange={v => update({ ...item, size: v || null })} placeholder="الحجم التقديري" />
                            </div>
                        )}
                    />
                </Field>
                <Field label="من لا نستهدفهم">
                    <ArrayField
                        items={doc.targetAudience.excludedUsers}
                        onChange={v => setDoc({ ...doc, targetAudience: { ...doc.targetAudience, excludedUsers: v } })}
                        placeholder="فئة مستبعدة..."
                    />
                </Field>
            </Section>

            {/* القيمة المقدمة */}
            <Section title="القيمة المقدمة" icon={<Gem className="w-4 h-4" />} color="bg-emerald-500">
                <Field label="القيمة الأساسية" required hint="جملة واحدة تلخص القيمة">
                    <TextInput
                        value={doc.valueProposition.coreValue}
                        onChange={v => setDoc({ ...doc, valueProposition: { ...doc.valueProposition, coreValue: v } })}
                        placeholder="نوفر تحليلاً شفافاً يساعد المستثمر على الفهم قبل القرار"
                    />
                </Field>
                <Field label="عناصر التميز">
                    <ArrayField
                        items={doc.valueProposition.differentiators}
                        onChange={v => setDoc({ ...doc, valueProposition: { ...doc.valueProposition, differentiators: v } })}
                        placeholder="ما يميزنا..."
                    />
                </Field>
            </Section>

            {/* خارج النطاق */}
            <Section title="ما ليس ضمن المنتج" icon={<XCircle className="w-4 h-4" />} color="bg-slate-500">
                <Field label="ما لن نقدمه">
                    <ArrayField
                        items={doc.outOfScope.excluded}
                        onChange={v => setDoc({ ...doc, outOfScope: { ...doc.outOfScope, excluded: v } })}
                        placeholder="شيء لن نقدمه..."
                    />
                </Field>
                <Field label="قد يُضاف مستقبلاً">
                    <ArrayField
                        items={doc.outOfScope.futureConsideration}
                        onChange={v => setDoc({ ...doc, outOfScope: { ...doc.outOfScope, futureConsideration: v } })}
                        placeholder="احتمال مستقبلي..."
                    />
                </Field>
            </Section>

            {/* مؤشرات النجاح */}
            <Section title="مؤشرات النجاح" icon={<TrendingUp className="w-4 h-4" />} color="bg-green-500">
                <Field label="مؤشرات نوعية">
                    <ArrayField
                        items={doc.successIndicators.qualitative}
                        onChange={v => setDoc({ ...doc, successIndicators: { ...doc.successIndicators, qualitative: v } })}
                        placeholder="مؤشر نوعي..."
                    />
                </Field>
                <Field label="مؤشرات كمية">
                    <ObjectList
                        items={doc.successIndicators.quantitative}
                        onChange={v => setDoc({ ...doc, successIndicators: { ...doc.successIndicators, quantitative: v } })}
                        itemLabel="مؤشر كمي"
                        createNew={() => ({ metric: '', target: '', timeframe: '' })}
                        renderItem={(item, _, update) => (
                            <div className="grid grid-cols-3 gap-3">
                                <TextInput value={item.metric} onChange={v => update({ ...item, metric: v })} placeholder="المؤشر" />
                                <TextInput value={item.target} onChange={v => update({ ...item, target: v })} placeholder="الهدف" />
                                <TextInput value={item.timeframe} onChange={v => update({ ...item, timeframe: v })} placeholder="الإطار الزمني" />
                            </div>
                        )}
                    />
                </Field>
            </Section>
        </EditorFrame>
    );
};

export default VisionEditor;
