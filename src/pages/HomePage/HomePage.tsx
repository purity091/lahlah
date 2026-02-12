import React from 'react';
import { LayoutDashboard, Zap, Layers, Clock, Circle, TrendingUp } from 'lucide-react';
import { useAppState, useGroupedTasks } from '../../store/AppContext';
import { TaskStatus } from '../../types';

const HomePage: React.FC = () => {
    const { tasks, contexts, globalAnalysis, loading } = useAppState();

    const todayStr = new Date().toISOString().split('T')[0];
    const todaysTasks = tasks.filter(t => t.date === todayStr);
    const doneCount = todaysTasks.filter(t => t.status === TaskStatus.DONE).length;

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Hero Section */}
            <section className="bg-slate-900 rounded-3xl p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <LayoutDashboard className="w-40 h-40" />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div>
                        <h2 className="text-3xl font-black mb-2">مرحباً محمد</h2>
                        <p className="text-slate-400 text-sm font-medium">
                            إليك النظرة الاستراتيجية الشاملة ليومك ومشاريعك.
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="bg-slate-800/50 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 text-center min-w-[100px]">
                            <p className="text-[10px] uppercase font-black text-slate-500 mb-1">إنجاز اليوم</p>
                            <p className="text-2xl font-black text-emerald-400">
                                {doneCount} / {todaysTasks.length}
                            </p>
                        </div>
                        <div className="bg-slate-800/50 backdrop-blur-md p-4 rounded-2xl border border-slate-700/50 text-center min-w-[100px]">
                            <p className="text-[10px] uppercase font-black text-slate-500 mb-1">مشاريع نشطة</p>
                            <p className="text-2xl font-black text-sky-400">
                                {contexts.filter(c => c.group === 'projects').length}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Analytics Grid */}
            {globalAnalysis && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Daily Focus */}
                    <div className="lg:col-span-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl p-8 text-white relative overflow-hidden shadow-xl">
                        <div className="absolute top-4 left-4 opacity-20">
                            <Zap className="w-24 h-24" />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[10px] uppercase font-black text-indigo-200 tracking-widest mb-3">
                                تركيز اليوم الاستراتيجي
                            </p>
                            <p className="text-xl font-bold leading-relaxed">{globalAnalysis.dailyFocus}</p>
                        </div>
                    </div>

                    {/* Brainstorm Ideas */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-lg">
                        <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-4 flex items-center gap-2">
                            <TrendingUp className="w-3.5 h-3.5" /> أفكار استراتيجية
                        </p>
                        <ul className="space-y-3">
                            {globalAnalysis.strategicBrainstorm?.slice(0, 3).map((idea, i) => (
                                <li
                                    key={i}
                                    className="text-xs font-bold text-slate-600 p-3 bg-slate-50 rounded-xl border border-slate-100"
                                >
                                    {idea}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            )}

            {/* Conflicts Section */}
            {globalAnalysis?.conflicts && globalAnalysis.conflicts.length > 0 && (
                <section className="bg-red-50 border border-red-100 rounded-3xl p-8">
                    <h3 className="text-xs font-black uppercase text-red-600 tracking-widest mb-6 flex items-center gap-2">
                        <Circle className="w-2.5 h-2.5 fill-red-500 text-red-500" /> تنبيهات وتعارضات محتملة
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {globalAnalysis.conflicts.map((conflict, i) => (
                            <div
                                key={i}
                                className={`p-5 rounded-2xl border ${conflict.severity === 'High'
                                        ? 'bg-red-100 border-red-200'
                                        : 'bg-orange-50 border-orange-100'
                                    }`}
                            >
                                <p className="text-sm font-black text-slate-900 mb-1">{conflict.title}</p>
                                <p className="text-xs text-slate-500">{conflict.description}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Quick Stats */}
            <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] uppercase font-black text-slate-400 mb-2">إجمالي المهام</p>
                    <p className="text-3xl font-black text-slate-900">{tasks.length}</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] uppercase font-black text-slate-400 mb-2">مكتملة</p>
                    <p className="text-3xl font-black text-emerald-600">
                        {tasks.filter(t => t.status === TaskStatus.DONE).length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] uppercase font-black text-slate-400 mb-2">قيد التنفيذ</p>
                    <p className="text-3xl font-black text-blue-600">
                        {tasks.filter(t => t.status === TaskStatus.IN_PROGRESS).length}
                    </p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
                    <p className="text-[10px] uppercase font-black text-slate-400 mb-2">معلّقة</p>
                    <p className="text-3xl font-black text-orange-600">
                        {tasks.filter(t => t.status === TaskStatus.TODO).length}
                    </p>
                </div>
            </section>
        </div>
    );
};

export default HomePage;
