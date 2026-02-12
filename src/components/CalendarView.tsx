import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, Priority } from '../types';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Download } from 'lucide-react';
import { CONTEXTS } from '../constants';
import { exportTasksToICS } from '../utils/icsUtils';

interface CalendarViewProps {
    tasks: Task[];
    activeContextId: string;
}

const CalendarView: React.FC<CalendarViewProps> = ({ tasks, activeContextId }) => {
    const [currentDate, setCurrentDate] = useState(new Date());

    // Arabic months and days
    const months = [
        "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];
    const daysOfWeek = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

    const { daysFromPrevMonth, daysInCurrentMonth, daysFromNextMonth } = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const lastDateOfMonth = new Date(year, month + 1, 0).getDate();
        // const lastDayOfMonth = new Date(year, month, lastDateOfMonth).getDay(); // Not strictly needed if we just fill 42 cells

        const prevMonthLastDate = new Date(year, month, 0).getDate();

        const daysPrev = [];
        for (let i = firstDayOfMonth - 1; i >= 0; i--) {
            daysPrev.push({ day: prevMonthLastDate - i, month: month - 1, year: month === 0 ? year - 1 : year, isCurrent: false });
        }

        const daysCurrent = [];
        for (let i = 1; i <= lastDateOfMonth; i++) {
            daysCurrent.push({ day: i, month, year, isCurrent: true });
        }

        const daysNext = [];
        const remainingCells = 42 - (daysPrev.length + daysCurrent.length);
        for (let i = 1; i <= remainingCells; i++) {
            daysNext.push({ day: i, month: month + 1, year: month === 11 ? year + 1 : year, isCurrent: false });
        }

        return { daysFromPrevMonth: daysPrev, daysInCurrentMonth: daysCurrent, daysFromNextMonth: daysNext };
    }, [currentDate]);

    const allCalendarDays = [...daysFromPrevMonth, ...daysInCurrentMonth, ...daysFromNextMonth];

    const getDayTasks = (day: number, month: number, year: number) => {
        return tasks.filter(t => {
            if (!t.date) return false;
            // Robust parsing to handle 2026-1-1 vs 2026-01-01 variations
            const [tYear, tMonth, tDay] = t.date.split('-').map(Number);
            return tYear === year && tMonth === (month + 1) && tDay === day;
        });
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    const prevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    const getPriorityColor = (priority: Priority) => {
        switch (priority) {
            case Priority.HIGH: return 'bg-red-100 text-red-700 border-red-200';
            case Priority.MEDIUM: return 'bg-orange-100 text-orange-700 border-orange-200';
            case Priority.LOW: return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getContextColor = (ctxId: string) => {
        const ctx = CONTEXTS.find(c => c.id === ctxId);
        return ctx ? ctx.color.replace('bg-', 'text-') : 'text-slate-500';
    };

    const getContextBg = (ctxId: string) => {
        const ctx = CONTEXTS.find(c => c.id === ctxId);
        return ctx ? ctx.color : 'bg-slate-500';
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden animate-in fade-in duration-500">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-red-500 rounded-xl">
                        <CalendarIcon className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900">
                            {months[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </h2>
                        <p className="text-xs text-slate-400 font-bold mt-1">
                            عرض المهام والأنشطة لشهر {months[currentDate.getMonth()]}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => exportTasksToICS(tasks, activeContextId === 'home' ? 'Global' : activeContextId)}
                        className="flex items-center gap-2 px-4 py-2 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-md shadow-slate-900/10"
                    >
                        <Download className="w-4 h-4" />
                        تصدير الكل
                    </button>
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>
                    <button onClick={goToToday} className="px-4 py-2 text-xs font-black bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                        اليوم
                    </button>
                    <div className="flex bg-slate-50 p-1 rounded-xl">
                        <button onClick={prevMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <button onClick={nextMonth} className="p-2 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-500">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Grid */}
            <div className="w-full">
                {/* Days Header */}
                <div className="grid grid-cols-7 border-b border-slate-100">
                    {daysOfWeek.map(day => (
                        <div key={day} className="py-4 text-center text-xs font-black text-slate-400 uppercase tracking-wider">
                            {day}
                        </div>
                    ))}
                </div>

                {/* Calendar Cells */}
                <div className="grid grid-cols-7 min-h-[600px] bg-slate-50/50">
                    {allCalendarDays.map((dateObj, idx) => {
                        const dayTasks = getDayTasks(dateObj.day, dateObj.month, dateObj.year);
                        const isToday =
                            new Date().getDate() === dateObj.day &&
                            new Date().getMonth() === dateObj.month &&
                            new Date().getFullYear() === dateObj.year;

                        return (
                            <div
                                key={idx}
                                className={`min-h-[140px] p-2 border-b border-l border-slate-100 transition-colors hover:bg-white group relative ${!dateObj.isCurrent ? 'bg-slate-50/80 text-slate-300' : 'bg-white'
                                    } ${isToday ? 'bg-red-50/30' : ''}`}
                            >
                                <div className={`mb-2 w-8 h-8 flex items-center justify-center rounded-full text-sm font-black ${isToday ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'text-slate-700 group-hover:bg-slate-100'
                                    }`}>
                                    {dateObj.day}
                                </div>

                                <div className="space-y-1.5 pl-1">
                                    {dayTasks.map(task => (
                                        <div
                                            key={task.id}
                                            className={`px-2 py-1.5 rounded-lg border text-[10px] font-bold truncate cursor-pointer transition-transform hover:scale-[1.02] flex items-center gap-1.5 ${task.status === TaskStatus.DONE
                                                ? 'bg-slate-100 text-slate-400 decoration-slate-400 line-through border-slate-200'
                                                : 'bg-white border-slate-200 text-slate-700 shadow-sm'
                                                }`}
                                        >
                                            {activeContextId === 'home' && (
                                                <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${getContextBg(task.contextId)}`} />
                                            )}
                                            <span className="truncate">{task.title}</span>
                                        </div>
                                    ))}
                                    {dayTasks.length === 0 && isToday && (
                                        <div className="mt-4 flex flex-col items-center justify-center opacity-0 group-hover:opacity-60 transition-opacity">
                                            <span className="text-[10px] text-slate-300 font-bold">لا مهام</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default CalendarView;
