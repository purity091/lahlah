import React from 'react';
import { Check, Clock, Download, ExternalLink, AlertCircle, Pencil, User } from 'lucide-react';
import { Task, TaskStatus, Priority, Freelancer } from '../../../types';

interface TaskRowProps {
    task: Task;
    assignee?: Freelancer;
    onToggleStatus: (taskId: string) => void;
    onSyncCalendar: (task: Task) => void;
    onExportICS: (task: Task) => void;
    onOpenRice: (task: Task) => void;
    onEdit: (task: Task) => void;
    showContext?: boolean;
}

const getPriorityBadge = (priority: Priority) => {
    const colors: Record<string, string> = {
        [Priority.HIGH]: 'bg-red-50 text-red-600 border-red-100',
        [Priority.MEDIUM]: 'bg-orange-50 text-orange-600 border-orange-100',
        [Priority.LOW]: 'bg-green-50 text-green-600 border-green-100',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-lg text-[9px] uppercase font-black border ${colors[priority]}`}>
            {priority}
        </span>
    );
};

const TaskRow: React.FC<TaskRowProps> = ({
    task,
    assignee,
    onToggleStatus,
    onSyncCalendar,
    onExportICS,
    onOpenRice,
    onEdit,
    showContext = false
}) => {
    return (
        <div
            className={`group relative flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${task.status === TaskStatus.DONE
                ? 'bg-slate-50 border-slate-100 opacity-75'
                : 'bg-white border-slate-100 hover:border-slate-300 hover:shadow-md'
                }`}
        >
            <button
                onClick={() => onToggleStatus(task.id)}
                className={`flex-shrink-0 w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${task.status === TaskStatus.DONE
                    ? 'bg-emerald-500 border-emerald-500 shadow-lg shadow-emerald-500/30'
                    : 'border-slate-200 group-hover:border-slate-400 bg-slate-50'
                    }`}
            >
                {task.status === TaskStatus.DONE && <Check className="w-4 h-4 text-white stroke-[4px]" />}
            </button>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 sm:gap-4 mb-1.5 flex-wrap">
                    <h4 className={`text-sm font-black truncate ${task.status === TaskStatus.DONE ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                        {task.title}
                    </h4>
                    {getPriorityBadge(task.priority)}
                    {showContext && (
                        <span className="text-[9px] font-black uppercase text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
                            {task.contextId}
                        </span>
                    )}
                    {assignee && (
                        <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100" title={`Assigned to: ${assignee.name}`}>
                            <User className="w-3 h-3 text-indigo-500" />
                            <span className="text-[9px] font-black text-indigo-700 truncate max-w-[80px] hidden sm:inline">{assignee.name}</span>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-2 sm:gap-6 text-[10px] font-black text-slate-400 uppercase tracking-widest flex-wrap">
                    <span className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5" /> {task.suggestedTime} • {task.duration}
                    </span>
                    <span className="hidden sm:flex items-center gap-2 border-r border-slate-200 pr-6 mr-4">• {task.category}</span>
                </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all">
                <button
                    onClick={() => onEdit(task)}
                    title="تعديل المهمة"
                    className="p-2.5 hover:bg-slate-100 rounded-xl border border-transparent hover:border-slate-200 text-slate-400 hover:text-slate-900 transition-all"
                >
                    <Pencil className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onSyncCalendar(task)}
                    title="تزامن مع التقويم"
                    className="p-2.5 hover:bg-slate-100 rounded-xl border border-transparent hover:border-slate-200 text-slate-400 hover:text-blue-600 transition-all"
                >
                    <Download className="w-4 h-4" />
                </button>
                <button
                    onClick={() => onOpenRice(task)}
                    title="تحليل RICE Score"
                    className="p-2.5 hover:bg-slate-100 rounded-xl border border-transparent hover:border-slate-200 text-slate-400 hover:text-emerald-600 transition-all"
                >
                    <ExternalLink className="w-4 h-4" />
                </button>
            </div>

            <div className={`absolute top-0 right-0 w-1 h-full rounded-l-full transition-all ${task.priority === Priority.HIGH ? 'bg-red-500' : task.priority === Priority.MEDIUM ? 'bg-orange-400' : 'bg-green-400'} opacity-0 group-hover:opacity-100`} />
        </div>
    );
};

export default TaskRow;
