import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, Priority, AppContext } from '../types';
import { Trash2, ArrowRight, CheckSquare, Square, Filter, Search, RotateCcw, CheckCircle2, Clock } from 'lucide-react';
import { apiService } from '../services/apiService';

interface BulkTaskViewProps {
    tasks: Task[];
    contexts: AppContext[];
    onTasksUpdate: (updatedTasks: Task[]) => void;
}

const BulkTaskView: React.FC<BulkTaskViewProps> = ({ tasks, contexts, onTasksUpdate }) => {
    const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
    const [filterContext, setFilterContext] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Derived state for filtered tasks
    const filteredTasks = useMemo(() => {
        return tasks.filter(task => {
            const matchesContext = filterContext === 'all' || task.contextId === filterContext;
            const matchesStatus = filterStatus === 'all' || task.status === filterStatus;
            const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.rationale?.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesContext && matchesStatus && matchesSearch;
        });
    }, [tasks, filterContext, filterStatus, searchQuery]);

    // Bulk Actions
    const handleSelectAll = () => {
        if (selectedTaskIds.length === filteredTasks.length) {
            setSelectedTaskIds([]);
        } else {
            setSelectedTaskIds(filteredTasks.map(t => t.id));
        }
    };

    const handleToggleSelect = (taskId: string) => {
        setSelectedTaskIds(prev =>
            prev.includes(taskId) ? prev.filter(id => id !== taskId) : [...prev, taskId]
        );
    };

    const handleBulkStatusChange = async (newStatus: TaskStatus) => {
        if (!confirm(`هل أنت متأكد من تغيير حالة ${selectedTaskIds.length} مهمة؟`)) return;

        // Optimistic Update
        const updatedTasks = tasks.map(t =>
            selectedTaskIds.includes(t.id) ? { ...t, status: newStatus, completed: newStatus === TaskStatus.DONE } : t
        );
        onTasksUpdate(updatedTasks);
        setSelectedTaskIds([]);

        // API Call (fire and forget for now, or handle sequentially)
        try {
            await Promise.all(selectedTaskIds.map(id => {
                const task = tasks.find(t => t.id === id);
                if (task) return apiService.updateTask({ ...task, status: newStatus, completed: newStatus === TaskStatus.DONE });
                return Promise.resolve();
            }));
        } catch (e) {
            console.error("Bulk update failed", e);
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`تحذير: هل أنت متأكد من حذف ${selectedTaskIds.length} مهمة نهائياً؟`)) return;

        const idsToDelete = [...selectedTaskIds];

        // First, delete from database
        try {
            await Promise.all(idsToDelete.map(id => apiService.deleteTask(id)));

            // Only update UI after successful deletion from database
            const updatedTasks = tasks.filter(t => !idsToDelete.includes(t.id));
            onTasksUpdate(updatedTasks);
            setSelectedTaskIds([]);
        } catch (e) {
            console.error("Bulk delete failed", e);
            alert("فشل حذف بعض المهام. تأكد من أن الخادم يعمل.");
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header & Controls */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900">التحكم الجماعي</h2>
                        <p className="text-slate-500 text-sm font-medium mt-1">
                            إدارة {tasks.length} مهمة ({selectedTaskIds.length} محددة)
                        </p>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100">
                        <button
                            onClick={() => handleBulkStatusChange(TaskStatus.TODO)}
                            disabled={selectedTaskIds.length === 0}
                            className="p-2 text-slate-600 hover:bg-white hover:shadow-sm rounded-lg disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:shadow-none transition-all flex items-center gap-2 text-xs font-bold"
                            title="Move to Todo"
                        >
                            <RotateCcw className="w-4 h-4" /> إعادة
                        </button>
                        <button
                            onClick={() => handleBulkStatusChange(TaskStatus.IN_PROGRESS)}
                            disabled={selectedTaskIds.length === 0}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-30 transition-all flex items-center gap-2 text-xs font-bold"
                            title="Move to In Progress"
                        >
                            <Clock className="w-4 h-4" /> ابدأ
                        </button>
                        <button
                            onClick={() => handleBulkStatusChange(TaskStatus.DONE)}
                            disabled={selectedTaskIds.length === 0}
                            className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg disabled:opacity-30 transition-all flex items-center gap-2 text-xs font-bold"
                            title="Mark as Done"
                        >
                            <CheckCircle2 className="w-4 h-4" /> إنجاز
                        </button>
                        <div className="w-px h-6 bg-slate-200 mx-1"></div>
                        <button
                            onClick={handleBulkDelete}
                            disabled={selectedTaskIds.length === 0}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg disabled:opacity-30 transition-all flex items-center gap-2 text-xs font-bold"
                            title="Delete Selected"
                        >
                            <Trash2 className="w-4 h-4" /> حذف
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute right-3 top-3 w-4 h-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="بحث في المهام..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 text-sm font-bold focus:outline-none focus:border-slate-400"
                        />
                    </div>
                    <select
                        value={filterContext}
                        onChange={(e) => setFilterContext(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold focus:outline-none focus:border-slate-400"
                    >
                        <option value="all">كل المشاريع</option>
                        {contexts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-4 text-sm font-bold focus:outline-none focus:border-slate-400"
                    >
                        <option value="all">كل الحالات</option>
                        <option value={TaskStatus.DRAFT}>Draft</option>
                        <option value={TaskStatus.TODO}>Todo</option>
                        <option value={TaskStatus.IN_PROGRESS}>In Progress</option>
                        <option value={TaskStatus.REVIEW}>Review</option>
                        <option value={TaskStatus.DONE}>Done</option>
                    </select>
                    <div className="flex items-center justify-end">
                        <span className="text-xs font-black text-slate-400 uppercase tracking-widest">{filteredTasks.length} نتيجة</span>
                    </div>
                </div>
            </div>

            {/* Tasks Table */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-right">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200">
                                <th className="p-4 w-12">
                                    <button onClick={handleSelectAll} className="flex items-center justify-center text-slate-400 hover:text-slate-600">
                                        {selectedTaskIds.length > 0 && selectedTaskIds.length === filteredTasks.length ? <CheckSquare className="w-5 h-5 text-slate-900" /> : <Square className="w-5 h-5" />}
                                    </button>
                                </th>
                                <th className="p-4 text-xs font-black uppercase text-slate-400 tracking-wider">المهمة</th>
                                <th className="p-4 text-xs font-black uppercase text-slate-400 tracking-wider">المشروع</th>
                                <th className="p-4 text-xs font-black uppercase text-slate-400 tracking-wider">الحالة</th>
                                <th className="p-4 text-xs font-black uppercase text-slate-400 tracking-wider">الأولوية</th>
                                <th className="p-4 text-xs font-black uppercase text-slate-400 tracking-wider">RICE</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredTasks.length > 0 ? (
                                filteredTasks.map(task => (
                                    <tr key={task.id} className={`hover:bg-slate-50/50 transition-colors ${selectedTaskIds.includes(task.id) ? 'bg-blue-50/30' : ''}`}>
                                        <td className="p-4 text-center">
                                            <button onClick={() => handleToggleSelect(task.id)} className="flex items-center justify-center">
                                                {selectedTaskIds.includes(task.id) ? <CheckSquare className="w-5 h-5 text-blue-600" /> : <Square className="w-5 h-5 text-slate-300 hover:text-slate-400" />}
                                            </button>
                                        </td>
                                        <td className="p-4">
                                            <p className="text-sm font-bold text-slate-900 mb-1">{task.title}</p>
                                            <p className="text-[10px] text-slate-400 line-clamp-1">{task.rationale || 'لا يوجد وصف'}</p>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-lg">
                                                {contexts.find(c => c.id === task.contextId)?.name || 'غير معروف'}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full border ${task.status === TaskStatus.DONE ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                                task.status === TaskStatus.IN_PROGRESS ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                                    task.status === TaskStatus.REVIEW ? 'bg-amber-50 text-amber-600 border-amber-100' :
                                                        task.status === TaskStatus.DRAFT ? 'bg-gray-50 text-gray-500 border-gray-100 border-dashed' :
                                                            'bg-slate-50 text-slate-600 border-slate-100'
                                                }`}>
                                                {task.status}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-full border ${task.priority === Priority.HIGH ? 'bg-red-50 text-red-600 border-red-100' :
                                                task.priority === Priority.MEDIUM ? 'bg-orange-50 text-orange-600 border-orange-100' :
                                                    'bg-emerald-50 text-emerald-600 border-emerald-100'
                                                }`}>
                                                {task.priority}
                                            </span>
                                        </td>
                                        <td className="p-4">
                                            <span className="font-mono text-xs font-bold text-slate-500">
                                                {task.rice?.score && !isNaN(task.rice.score) ? task.rice.score.toFixed(1) : '-'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="p-12 text-center text-slate-400 italic">لا توجد مهام مطابقة للبحث</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default BulkTaskView;
