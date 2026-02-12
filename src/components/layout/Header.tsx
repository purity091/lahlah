import React from 'react';
import {
    MessageSquare, Calendar as CalendarIcon, CheckCircle2, RefreshCw
} from 'lucide-react';
import { useAppState, useActiveContext } from '../../store/AppContext';

type ViewType = 'tasks' | 'calendar' | 'docs' | 'discovery' | 'export' | 'sheets' | 'team';

interface HeaderProps {
    currentView: ViewType;
    setCurrentView: (view: ViewType) => void;
    onToggleChat: () => void;
    chatHasMessages: boolean;
}

const Header: React.FC<HeaderProps> = ({ currentView, setCurrentView, onToggleChat, chatHasMessages }) => {
    const { activeContextId, isSyncing } = useAppState();
    const activeContext = useActiveContext();

    const isProjectView = activeContextId !== 'home';

    const viewButton = (view: ViewType, label: string) => (
        <button
            onClick={() => setCurrentView(view)}
            className={`px-5 py-1.5 rounded-lg text-[11px] font-black transition-all ${currentView === view ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-slate-600'
                }`}
        >
            {label}
        </button>
    );

    return (
        <header className="h-20 px-10 flex items-center justify-between border-b border-slate-100 bg-white/80 backdrop-blur-md sticky top-0 z-20">
            <div className="flex items-center gap-10">
                <div className="flex items-center gap-4">
                    <div className={`w-3 h-3 rounded-full ${activeContext.color} shadow-lg animate-pulse`} />
                    <h2 className="text-base font-black text-slate-900">{activeContext.name}</h2>
                </div>

                {isProjectView ? (
                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200/50">
                        {viewButton('tasks', 'المهمات')}
                        {viewButton('calendar', 'الجدول')}
                        {viewButton('docs', 'الوثائق')}
                        {viewButton('discovery', 'الاستكشاف')}
                        {viewButton('export', 'تصدير Jira')}
                        {viewButton('sheets', 'Google Sheets')}
                        {viewButton('team', 'الفريق')}
                    </div>
                ) : (
                    <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200/50">
                        {viewButton('tasks', 'لوحة القيادة')}
                        {viewButton('calendar', 'الجدول الشامل')}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-6">
                <div className="flex items-center gap-3 text-slate-400 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200/50">
                    {isSyncing ? (
                        <>
                            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                            <span className="text-[10px] font-black uppercase tracking-widest">تحديث...</span>
                        </>
                    ) : (
                        <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">منظم</span>
                        </>
                    )}
                </div>
                <button
                    onClick={onToggleChat}
                    className="p-2.5 rounded-xl hover:bg-slate-50 text-slate-500 transition-all relative border border-slate-200 shadow-sm"
                >
                    <MessageSquare className="w-5 h-5" />
                    {chatHasMessages && <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />}
                </button>
            </div>
        </header>
    );
};

export default Header;
