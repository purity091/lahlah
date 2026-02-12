import React from 'react';
import { Users, Plus, Mail, DollarSign, Circle } from 'lucide-react';
import { useAppState, useActiveContext } from '../../store/AppContext';
import Modal from '../../components/common/Modal';
import { Freelancer } from '../../types';

interface TeamPageProps {
    onAddFreelancer: (freelancer: Omit<Freelancer, 'id'>) => void;
}

const TeamPage: React.FC<TeamPageProps> = ({ onAddFreelancer }) => {
    const { tasks } = useAppState();
    const activeContext = useActiveContext();

    const [showModal, setShowModal] = React.useState(false);
    const [input, setInput] = React.useState<Partial<Freelancer>>({ sector: 'Other', status: 'Active' });

    const freelancers = activeContext.freelancers || [];

    const handleSubmit = () => {
        if (!input.name || !input.role) return;
        onAddFreelancer({
            name: input.name,
            role: input.role,
            sector: input.sector as any || 'Other',
            status: 'Active',
            rate: input.rate,
            contact: input.contact,
        });
        setShowModal(false);
        setInput({ sector: 'Other', status: 'Active' });
    };

    const getFreelancerTasks = (freelancerId: string) => {
        return tasks.filter(t => t.freelancerId === freelancerId);
    };

    const getCompletionRate = (freelancerId: string) => {
        const fTasks = getFreelancerTasks(freelancerId);
        if (fTasks.length === 0) return 0;
        const done = fTasks.filter(t => t.completed).length;
        return Math.round((done / fTasks.length) * 100);
    };

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-violet-100 rounded-2xl">
                        <Users className="w-6 h-6 text-violet-600" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900">إدارة الفريق</h2>
                        <p className="text-xs text-slate-500 font-bold">
                            المستقلون والفريق العامل على مشروع {activeContext.name}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20"
                >
                    <Plus className="w-4 h-4" /> إضافة عضو
                </button>
            </div>

            {/* Freelancers Grid */}
            {freelancers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {freelancers.map(f => (
                        <div
                            key={f.id}
                            className="bg-white border border-slate-100 rounded-2xl p-6 hover:shadow-lg transition-all"
                        >
                            <div className="flex items-start gap-4 mb-4">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-black text-lg">
                                    {f.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className="text-sm font-black text-slate-900 truncate">{f.name}</h3>
                                    <p className="text-xs text-slate-500 font-bold">{f.role}</p>
                                </div>
                                <span
                                    className={`px-2 py-1 rounded-lg text-[9px] font-black uppercase ${f.status === 'Active'
                                            ? 'bg-emerald-100 text-emerald-600'
                                            : f.status === 'Paused'
                                                ? 'bg-orange-100 text-orange-600'
                                                : 'bg-slate-100 text-slate-600'
                                        }`}
                                >
                                    {f.status}
                                </span>
                            </div>

                            <div className="space-y-3 text-xs">
                                <div className="flex items-center gap-2 text-slate-500">
                                    <Circle className="w-1.5 h-1.5 fill-current" />
                                    <span className="font-bold">القطاع:</span>
                                    <span className="font-black text-slate-700">{f.sector}</span>
                                </div>
                                {f.rate && (
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <DollarSign className="w-3.5 h-3.5" />
                                        <span className="font-bold">المعدل:</span>
                                        <span className="font-black text-slate-700">{f.rate}</span>
                                    </div>
                                )}
                                {f.contact && (
                                    <div className="flex items-center gap-2 text-slate-500">
                                        <Mail className="w-3.5 h-3.5" />
                                        <span className="font-bold truncate">{f.contact}</span>
                                    </div>
                                )}
                            </div>

                            {/* Performance */}
                            <div className="mt-4 pt-4 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase text-slate-400">نسبة الإنجاز</span>
                                    <span className="text-xs font-black text-slate-900">{getCompletionRate(f.id)}%</span>
                                </div>
                                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all"
                                        style={{ width: `${getCompletionRate(f.id)}%` }}
                                    />
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2">
                                    {getFreelancerTasks(f.id).length} مهام مسندة
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-12 text-center">
                    <Users className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-sm font-bold text-slate-400">لا يوجد أعضاء في الفريق حالياً</p>
                    <p className="text-xs text-slate-300 mt-1">أضف أول عضو للبدء</p>
                </div>
            )}

            {/* Add Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="إضافة عضو جديد"
                subtitle="أضف مستقل أو عضو فريق لهذا المشروع"
            >
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-2">الاسم</label>
                        <input
                            value={input.name || ''}
                            onChange={e => setInput({ ...input, name: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900"
                            placeholder="اسم المستقل"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-2">الدور</label>
                        <input
                            value={input.role || ''}
                            onChange={e => setInput({ ...input, role: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900"
                            placeholder="مثال: مطور واجهات"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black uppercase text-slate-400 mb-2">القطاع</label>
                            <select
                                value={input.sector || 'Other'}
                                onChange={e => setInput({ ...input, sector: e.target.value as any })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900"
                            >
                                <option value="Marketing">تسويق</option>
                                <option value="Content">محتوى</option>
                                <option value="Development">تطوير</option>
                                <option value="Design">تصميم</option>
                                <option value="Other">أخرى</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase text-slate-400 mb-2">المعدل</label>
                            <input
                                value={input.rate || ''}
                                onChange={e => setInput({ ...input, rate: e.target.value })}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900"
                                placeholder="$50/hr"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-black uppercase text-slate-400 mb-2">التواصل</label>
                        <input
                            value={input.contact || ''}
                            onChange={e => setInput({ ...input, contact: e.target.value })}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm font-bold focus:outline-none focus:border-slate-900"
                            placeholder="email@example.com"
                        />
                    </div>
                    <button
                        onClick={handleSubmit}
                        disabled={!input.name || !input.role}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-black hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/20 disabled:opacity-50 mt-4"
                    >
                        إضافة العضو
                    </button>
                </div>
            </Modal>
        </div>
    );
};

export default TeamPage;
