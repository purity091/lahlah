import React, { useState } from 'react';
import { X, Save, Plus, Trash2, ChevronDown, ChevronRight, Check, AlertCircle } from 'lucide-react';

// =============================================================================
// مكونات مشتركة للمحررات
// =============================================================================

interface FieldProps {
    label: string;
    required?: boolean;
    children: React.ReactNode;
    hint?: string;
}

export const Field: React.FC<FieldProps> = ({ label, required, children, hint }) => (
    <div className="mb-4">
        <label className="block text-xs font-black text-slate-500 mb-2 uppercase tracking-wide">
            {label} {required && <span className="text-red-500">*</span>}
        </label>
        {children}
        {hint && <p className="mt-1 text-[10px] text-slate-400">{hint}</p>}
    </div>
);

interface TextInputProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    multiline?: boolean;
    rows?: number;
}

export const TextInput: React.FC<TextInputProps> = ({ value, onChange, placeholder, multiline, rows = 3 }) => {
    const baseClass = "w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-slate-400 focus:bg-white transition-all";

    if (multiline) {
        return (
            <textarea
                value={value || ''}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                rows={rows}
                className={baseClass + " resize-y min-h-[80px]"}
            />
        );
    }

    return (
        <input
            type="text"
            value={value || ''}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder}
            className={baseClass}
        />
    );
};

interface SelectInputProps {
    value: string;
    onChange: (value: string) => void;
    options: { value: string; label: string }[];
}

export const SelectInput: React.FC<SelectInputProps> = ({ value, onChange, options }) => (
    <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-slate-400"
    >
        {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
    </select>
);

interface ArrayFieldProps {
    items: string[];
    onChange: (items: string[]) => void;
    placeholder?: string;
    label?: string;
}

export const ArrayField: React.FC<ArrayFieldProps> = ({ items, onChange, placeholder, label }) => {
    const [newItem, setNewItem] = useState('');

    const addItem = () => {
        if (newItem.trim()) {
            onChange([...items, newItem.trim()]);
            setNewItem('');
        }
    };

    return (
        <div className="space-y-2">
            {label && <label className="block text-xs font-black text-slate-500 uppercase">{label}</label>}
            {items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                    <input
                        type="text"
                        value={item}
                        onChange={e => {
                            const newItems = [...items];
                            newItems[idx] = e.target.value;
                            onChange(newItems);
                        }}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm"
                    />
                    <button
                        onClick={() => onChange(items.filter((_, i) => i !== idx))}
                        className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
            ))}
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    value={newItem}
                    onChange={e => setNewItem(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addItem()}
                    placeholder={placeholder}
                    className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm"
                />
                <button onClick={addItem} className="p-2 bg-slate-100 rounded-lg text-slate-500 hover:bg-slate-200">
                    <Plus className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
};

// =============================================================================
// مكون القسم القابل للطي
// =============================================================================

interface SectionProps {
    title: string;
    icon: React.ReactNode;
    color: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
    status?: 'empty' | 'partial' | 'complete';
}

export const Section: React.FC<SectionProps> = ({ title, icon, color, children, defaultOpen = false, status }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white mb-4">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-all"
            >
                <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${color} text-white`}>{icon}</div>
                    <span className="text-sm font-black text-slate-800">{title}</span>
                </div>
                <div className="flex items-center gap-2">
                    {status && (
                        <div className={`w-2 h-2 rounded-full ${status === 'complete' ? 'bg-green-500' :
                                status === 'partial' ? 'bg-amber-500' : 'bg-slate-200'
                            }`} />
                    )}
                    {isOpen ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </div>
            </button>
            {isOpen && <div className="p-4 pt-0 border-t border-slate-100">{children}</div>}
        </div>
    );
};

// =============================================================================
// مكون القائمة المهيكلة (للكائنات المتعددة)
// =============================================================================

interface ObjectListProps<T> {
    items: T[];
    onChange: (items: T[]) => void;
    renderItem: (item: T, index: number, updateItem: (item: T) => void) => React.ReactNode;
    createNew: () => T;
    itemLabel: string;
}

export function ObjectList<T>({ items, onChange, renderItem, createNew, itemLabel }: ObjectListProps<T>) {
    const addItem = () => onChange([...items, createNew()]);
    const updateItem = (index: number, item: T) => {
        const newItems = [...items];
        newItems[index] = item;
        onChange(newItems);
    };
    const removeItem = (index: number) => onChange(items.filter((_, i) => i !== index));

    return (
        <div className="space-y-3">
            {items.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 relative">
                    <button
                        onClick={() => removeItem(idx)}
                        className="absolute top-2 left-2 p-1 text-red-400 hover:text-red-600"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                    <div className="text-[10px] font-bold text-slate-400 mb-3">{itemLabel} {idx + 1}</div>
                    {renderItem(item, idx, (newItem) => updateItem(idx, newItem))}
                </div>
            ))}
            <button
                onClick={addItem}
                className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-all flex items-center justify-center gap-2"
            >
                <Plus className="w-4 h-4" /> إضافة {itemLabel}
            </button>
        </div>
    );
}

// =============================================================================
// إطار المحرر العام
// =============================================================================

interface EditorFrameProps {
    title: string;
    subtitle?: string;
    icon: React.ReactNode;
    iconColor: string;
    onSave: () => void;
    onClose: () => void;
    children: React.ReactNode;
    errors?: string[];
}

export const EditorFrame: React.FC<EditorFrameProps> = ({
    title, subtitle, icon, iconColor, onSave, onClose, children, errors
}) => (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[100] flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl w-full max-w-5xl h-[90vh] shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col border border-slate-200">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 border-b border-slate-100 shrink-0">
                <div className="flex items-center gap-4">
                    <div className={`p-2.5 rounded-xl ${iconColor} text-white shadow-lg`}>{icon}</div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900">{title}</h2>
                        {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-50 rounded-xl">
                        <X className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onSave}
                        className="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-black hover:bg-slate-800 shadow-lg shadow-slate-900/20"
                    >
                        <Save className="w-4 h-4" /> حفظ
                    </button>
                </div>
            </div>

            {/* Errors */}
            {errors && errors.length > 0 && (
                <div className="mx-8 mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                    <div className="flex items-center gap-2 text-red-700 mb-2">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm font-bold">يوجد أخطاء:</span>
                    </div>
                    <ul className="list-disc list-inside text-xs text-red-600 space-y-1">
                        {errors.map((err, i) => <li key={i}>{err}</li>)}
                    </ul>
                </div>
            )}

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-3xl mx-auto">{children}</div>
            </div>
        </div>
    </div>
);

// =============================================================================
// مكون البيانات الوصفية المشترك
// =============================================================================

interface MetadataSectionProps {
    metadata: {
        version?: string;
        status: string;
        author?: string;
        reviewers?: string[];
    };
    onChange: (metadata: any) => void;
    statusOptions: { value: string; label: string }[];
}

export const MetadataSection: React.FC<MetadataSectionProps> = ({ metadata, onChange, statusOptions }) => (
    <div className="grid grid-cols-2 gap-4">
        <Field label="الإصدار">
            <TextInput
                value={metadata.version || '1.0.0'}
                onChange={v => onChange({ ...metadata, version: v })}
                placeholder="1.0.0"
            />
        </Field>
        <Field label="الحالة">
            <SelectInput
                value={metadata.status}
                onChange={v => onChange({ ...metadata, status: v })}
                options={statusOptions}
            />
        </Field>
        <Field label="المؤلف">
            <TextInput
                value={metadata.author || ''}
                onChange={v => onChange({ ...metadata, author: v })}
                placeholder="اسم المؤلف"
            />
        </Field>
        <Field label="المراجعون">
            <ArrayField
                items={metadata.reviewers || []}
                onChange={v => onChange({ ...metadata, reviewers: v })}
                placeholder="أضف مراجعاً..."
            />
        </Field>
    </div>
);

export default {
    Field,
    TextInput,
    SelectInput,
    ArrayField,
    Section,
    ObjectList,
    EditorFrame,
    MetadataSection
};
