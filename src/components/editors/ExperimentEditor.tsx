import React, { useState } from 'react';
import { LineChart, Lightbulb, Settings, BarChart3, Zap, CheckCircle } from 'lucide-react';
import { ExperimentDocument, createEmptyExperimentDocument } from '../../types';
import { EditorFrame, Section, Field, TextInput, SelectInput, ArrayField, ObjectList } from './EditorComponents';

interface Props {
    document: ExperimentDocument | null;
    projectId: string;
    onSave: (doc: ExperimentDocument) => void;
    onClose: () => void;
    isNew?: boolean;
}

const ExperimentEditor: React.FC<Props> = ({ document, projectId, onSave, onClose, isNew }) => {
    const [doc, setDoc] = useState<ExperimentDocument>(() => document || createEmptyExperimentDocument(projectId));
    const [errors, setErrors] = useState<string[]>([]);

    const handleSave = () => {
        const errs: string[] = [];
        if (!doc.hypothesis.statement) errs.push('بيان الفرضية مطلوب');
        if (!doc.metrics.primary.metric) errs.push('المقياس الأساسي مطلوب');
        if (errs.length > 0) { setErrors(errs); return; }
        doc.metadata.updatedAt = Date.now();
        onSave(doc);
    };

    return (
        <EditorFrame
            title={isNew ? 'إنشاء وثيقة تجربة' : 'تحرير وثيقة التجربة'}
            subtitle="توثيق التجارب A/B والنتائج"
            icon={<LineChart className="w-5 h-5" />}
            iconColor="bg-gradient-to-br from-orange-500 to-amber-600"
            onSave={handleSave}
            onClose={onClose}
            errors={errors}
        >
            {/* الفرضية */}
            <Section title="الفرضية" icon={<Lightbulb className="w-4 h-4" />} color="bg-amber-500" defaultOpen>
                <Field label="بيان الفرضية" required hint="نعتقد أن [التغيير] سيؤدي إلى [النتيجة] لـ [المستخدمين]">
                    <TextInput
                        value={doc.hypothesis.statement}
                        onChange={v => setDoc({ ...doc, hypothesis: { ...doc.hypothesis, statement: v } })}
                        placeholder="نعتقد أن تغيير لون الزر للأخضر سيزيد معدل النقر بنسبة 10%..."
                        multiline
                        rows={3}
                    />
                </Field>
                <Field label="الافتراض الأساسي">
                    <TextInput
                        value={doc.hypothesis.assumption}
                        onChange={v => setDoc({ ...doc, hypothesis: { ...doc.hypothesis, assumption: v } })}
                        placeholder="المستخدمون لا يلاحظون الزر الحالي..."
                    />
                </Field>
                <Field label="المخاطر إذا كانت الفرضية خاطئة">
                    <TextInput
                        value={doc.hypothesis.riskIfWrong}
                        onChange={v => setDoc({ ...doc, hypothesis: { ...doc.hypothesis, riskIfWrong: v } })}
                        placeholder="قد نضيع أسبوعين من التطوير..."
                    />
                </Field>
            </Section>

            {/* تصميم التجربة */}
            <Section title="تصميم التجربة" icon={<Settings className="w-4 h-4" />} color="bg-blue-500">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <Field label="نوع التجربة">
                        <SelectInput
                            value={doc.design.type}
                            onChange={v => setDoc({ ...doc, design: { ...doc.design, type: v as any } })}
                            options={[
                                { value: 'A/B', label: 'A/B Test' },
                                { value: 'multivariate', label: 'Multivariate' },
                                { value: 'feature_flag', label: 'Feature Flag' },
                                { value: 'holdout', label: 'Holdout' }
                            ]}
                        />
                    </Field>
                    <Field label="حجم العينة المطلوب">
                        <TextInput
                            value={doc.design.sampleSize.toString()}
                            onChange={v => setDoc({ ...doc, design: { ...doc.design, sampleSize: parseInt(v) || 0 } })}
                            placeholder="1000"
                        />
                    </Field>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <Field label="مدة التجربة">
                        <TextInput
                            value={doc.design.duration}
                            onChange={v => setDoc({ ...doc, design: { ...doc.design, duration: v } })}
                            placeholder="أسبوعان"
                        />
                    </Field>
                    <Field label="الجمهور المستهدف">
                        <TextInput
                            value={doc.design.targetAudience}
                            onChange={v => setDoc({ ...doc, design: { ...doc.design, targetAudience: v } })}
                            placeholder="جميع المستخدمين النشطين"
                        />
                    </Field>
                </div>

                <Field label="المتغيرات (Variants)">
                    <ObjectList
                        items={doc.design.variants}
                        onChange={v => setDoc({ ...doc, design: { ...doc.design, variants: v } })}
                        itemLabel="متغير"
                        createNew={() => ({ name: '', description: '', trafficPercentage: 50 })}
                        renderItem={(item, idx, update) => (
                            <div className="space-y-3">
                                <div className="grid grid-cols-3 gap-3">
                                    <TextInput value={item.name} onChange={v => update({ ...item, name: v })} placeholder={idx === 0 ? 'Control' : `Variant ${idx}`} />
                                    <TextInput value={item.trafficPercentage.toString()} onChange={v => update({ ...item, trafficPercentage: parseInt(v) || 0 })} placeholder="النسبة %" />
                                </div>
                                <TextInput value={item.description} onChange={v => update({ ...item, description: v })} placeholder="وصف المتغير..." />
                            </div>
                        )}
                    />
                </Field>

                <Field label="الاستثناءات">
                    <ArrayField
                        items={doc.design.exclusions}
                        onChange={v => setDoc({ ...doc, design: { ...doc.design, exclusions: v } })}
                        placeholder="فئة مستثناة..."
                    />
                </Field>
            </Section>

            {/* المقاييس */}
            <Section title="المقاييس" icon={<BarChart3 className="w-4 h-4" />} color="bg-green-500">
                <Field label="المقياس الأساسي (Primary Metric)" required>
                    <div className="bg-slate-50 p-4 rounded-xl space-y-3">
                        <TextInput
                            value={doc.metrics.primary.metric}
                            onChange={v => setDoc({ ...doc, metrics: { ...doc.metrics, primary: { ...doc.metrics.primary, metric: v } } })}
                            placeholder="معدل النقر (CTR)"
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <TextInput
                                value={doc.metrics.primary.baseline}
                                onChange={v => setDoc({ ...doc, metrics: { ...doc.metrics, primary: { ...doc.metrics.primary, baseline: v } } })}
                                placeholder="القيمة الحالية (مثل: 2.5%)"
                            />
                            <TextInput
                                value={doc.metrics.primary.minimumDetectableEffect}
                                onChange={v => setDoc({ ...doc, metrics: { ...doc.metrics, primary: { ...doc.metrics.primary, minimumDetectableEffect: v } } })}
                                placeholder="الحد الأدنى للتغيير المرئي (مثل: 0.5%)"
                            />
                        </div>
                    </div>
                </Field>

                <Field label="مقاييس ثانوية">
                    <ObjectList
                        items={doc.metrics.secondary}
                        onChange={v => setDoc({ ...doc, metrics: { ...doc.metrics, secondary: v } })}
                        itemLabel="مقياس ثانوي"
                        createNew={() => ({ metric: '', expectedChange: '' })}
                        renderItem={(item, _, update) => (
                            <div className="grid grid-cols-2 gap-3">
                                <TextInput value={item.metric} onChange={v => update({ ...item, metric: v })} placeholder="المقياس" />
                                <TextInput value={item.expectedChange} onChange={v => update({ ...item, expectedChange: v })} placeholder="التغيير المتوقع" />
                            </div>
                        )}
                    />
                </Field>

                <Field label="حواجز الأمان (Guardrails)" hint="مقاييس يجب ألا تتأثر سلباً">
                    <ObjectList
                        items={doc.metrics.guardrails}
                        onChange={v => setDoc({ ...doc, metrics: { ...doc.metrics, guardrails: v } })}
                        itemLabel="حاجز أمان"
                        createNew={() => ({ metric: '', threshold: '' })}
                        renderItem={(item, _, update) => (
                            <div className="grid grid-cols-2 gap-3">
                                <TextInput value={item.metric} onChange={v => update({ ...item, metric: v })} placeholder="المقياس" />
                                <TextInput value={item.threshold} onChange={v => update({ ...item, threshold: v })} placeholder="الحد (مثل: لا ينخفض أكثر من 5%)" />
                            </div>
                        )}
                    />
                </Field>
            </Section>

            {/* النتائج */}
            <Section title="النتائج" icon={<Zap className="w-4 h-4" />} color="bg-purple-500">
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <Field label="تاريخ البدء">
                        <TextInput
                            value={doc.results.startDate || ''}
                            onChange={v => setDoc({ ...doc, results: { ...doc.results, startDate: v || null } })}
                            placeholder="YYYY-MM-DD"
                        />
                    </Field>
                    <Field label="تاريخ الانتهاء">
                        <TextInput
                            value={doc.results.endDate || ''}
                            onChange={v => setDoc({ ...doc, results: { ...doc.results, endDate: v || null } })}
                            placeholder="YYYY-MM-DD"
                        />
                    </Field>
                </div>

                <Field label="حجم العينة الفعلي">
                    <TextInput
                        value={doc.results.sampleSizeReached?.toString() || ''}
                        onChange={v => setDoc({ ...doc, results: { ...doc.results, sampleSizeReached: parseInt(v) || null } })}
                        placeholder="العدد الفعلي"
                    />
                </Field>

                <Field label="نتائج المتغيرات">
                    <ObjectList
                        items={doc.results.variantResults}
                        onChange={v => setDoc({ ...doc, results: { ...doc.results, variantResults: v } })}
                        itemLabel="نتيجة"
                        createNew={() => ({ variant: '', primaryMetric: '', confidence: '', significanceLevel: '' })}
                        renderItem={(item, _, update) => (
                            <div className="space-y-3">
                                <TextInput value={item.variant} onChange={v => update({ ...item, variant: v })} placeholder="اسم المتغير" />
                                <div className="grid grid-cols-3 gap-3">
                                    <TextInput value={item.primaryMetric} onChange={v => update({ ...item, primaryMetric: v })} placeholder="قيمة المقياس" />
                                    <TextInput value={item.confidence} onChange={v => update({ ...item, confidence: v })} placeholder="نسبة الثقة" />
                                    <TextInput value={item.significanceLevel} onChange={v => update({ ...item, significanceLevel: v })} placeholder="مستوى الأهمية" />
                                </div>
                            </div>
                        )}
                    />
                </Field>

                <div className="grid grid-cols-2 gap-4">
                    <Field label="ذو دلالة إحصائية؟">
                        <SelectInput
                            value={doc.results.statisticalSignificance === null ? '' : doc.results.statisticalSignificance.toString()}
                            onChange={v => setDoc({ ...doc, results: { ...doc.results, statisticalSignificance: v === '' ? null : v === 'true' } })}
                            options={[
                                { value: '', label: 'لم يُحدد بعد' },
                                { value: 'true', label: 'نعم ✓' },
                                { value: 'false', label: 'لا ✗' }
                            ]}
                        />
                    </Field>
                    <Field label="المتغير الفائز">
                        <TextInput
                            value={doc.results.winningVariant || ''}
                            onChange={v => setDoc({ ...doc, results: { ...doc.results, winningVariant: v || null } })}
                            placeholder="Control / Variant A..."
                        />
                    </Field>
                </div>
            </Section>

            {/* القرار */}
            <Section title="القرار والتعلم" icon={<CheckCircle className="w-4 h-4" />} color="bg-slate-700" defaultOpen>
                <Field label="القرار">
                    <SelectInput
                        value={doc.decision.outcome}
                        onChange={v => setDoc({ ...doc, decision: { ...doc.decision, outcome: v as any } })}
                        options={[
                            { value: 'pending', label: 'قيد الانتظار' },
                            { value: 'ship', label: '🚀 نشر (Ship)' },
                            { value: 'iterate', label: '🔄 تكرار (Iterate)' },
                            { value: 'kill', label: '❌ إلغاء (Kill)' }
                        ]}
                    />
                </Field>
                <Field label="التبرير">
                    <TextInput
                        value={doc.decision.rationale}
                        onChange={v => setDoc({ ...doc, decision: { ...doc.decision, rationale: v } })}
                        placeholder="لماذا اتخذنا هذا القرار..."
                        multiline
                    />
                </Field>
                <Field label="ما تعلمناه">
                    <ArrayField
                        items={doc.decision.learnings}
                        onChange={v => setDoc({ ...doc, decision: { ...doc.decision, learnings: v } })}
                        placeholder="تعلم..."
                    />
                </Field>
                <Field label="الخطوات التالية">
                    <ArrayField
                        items={doc.decision.nextSteps}
                        onChange={v => setDoc({ ...doc, decision: { ...doc.decision, nextSteps: v } })}
                        placeholder="خطوة..."
                    />
                </Field>
            </Section>
        </EditorFrame>
    );
};

export default ExperimentEditor;
