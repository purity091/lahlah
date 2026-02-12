import React from 'react';
import { Zap, ChevronRight, ChevronLeft, Circle, Plus } from 'lucide-react';
import { useAppState, useActiveContext } from '../../store/AppContext';
import { AppContext as AppContextType, ProjectSector } from '../../types';

// Icon mapping - should be moved to a separate config file
import {
    Rocket, TrendingUp, Briefcase, Globe, LineChart, Store, HeartPulse, User, LayoutDashboard
} from 'lucide-react';

const ICON_MAP: Record<string, any> = {
    LayoutDashboard, Rocket, TrendingUp, Briefcase, Globe, LineChart, Store, HeartPulse, User
};

interface SidebarProps {
    onAddSubProject: (parentId: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onAddSubProject }) => {
    const { contexts, activeContextId, setActiveContextId } = useAppState();
    const [expandedGroups, setExpandedGroups] = React.useState({ projects: true, personal: true });
    const [expandedProjectIds, setExpandedProjectIds] = React.useState<string[]>([]);

    // Render context button (for system/personal groups)
    const renderContextButton = (ctx: AppContextType) => {
        const IconComp = ICON_MAP[ctx.icon] || Circle;
        const isActive = activeContextId === ctx.id;
        return (
            <button
                key={ctx.id}
                onClick={() => setActiveContextId(ctx.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${isActive ? 'bg-slate-100 text-slate-900 shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-700'
                    }`}
            >
                <div className={`p-2 rounded-xl transition-all ${isActive ? 'bg-slate-900 text-white scale-110 shadow-md' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                    }`}>
                    <IconComp className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">{ctx.name}</span>
                {isActive && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-slate-900" />}
            </button>
        );
    };

    // Render project node (hierarchical for projects group)
    const renderProjectNode = (ctx: AppContextType, level = 0) => {
        const IconComp = ICON_MAP[ctx.icon] || Circle;
        const isActive = activeContextId === ctx.id;
        const children = contexts.filter(c => c.parentId === ctx.id);
        const hasChildren = children.length > 0;
        const isExpanded = expandedProjectIds.includes(ctx.id);

        return (
            <div key={ctx.id} className="w-full relative">
                <div className={`flex items-center w-full group/row relative ${isActive ? 'bg-slate-100' : 'hover:bg-slate-50'} rounded-2xl transition-all duration-200 mb-1`}>
                    <div style={{ width: level * 12 }} className="shrink-0" />

                    {/* Expand Toggle */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setExpandedProjectIds(prev => prev.includes(ctx.id) ? prev.filter(id => id !== ctx.id) : [...prev, ctx.id]);
                        }}
                        className={`p-1 w-6 h-6 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 ${hasChildren ? 'opacity-100' : 'opacity-0'} transition-all mr-1`}
                    >
                        <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    {/* Main Click Area */}
                    <button
                        onClick={() => setActiveContextId(ctx.id)}
                        className="flex-1 flex items-center gap-2 py-2 pr-0 pl-2 text-right"
                    >
                        <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-slate-900 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-400 group-hover/row:bg-slate-200'}`}>
                            <IconComp className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className={`block text-[11px] truncate ${isActive ? 'font-black text-slate-900' : 'font-bold text-slate-600'}`}>{ctx.name}</span>
                            {ctx.sector && <span className="block text-[8px] font-black uppercase tracking-widest text-slate-300 truncate">{ctx.sector}</span>}
                        </div>
                    </button>

                    {/* Add SubProject Action (Hover) */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onAddSubProject(ctx.id);
                        }}
                        className="opacity-0 group-hover/row:opacity-100 p-1.5 mr-1 rounded-lg text-slate-300 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                        title="إضافة مشروع فرعي"
                    >
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>

                {/* Children */}
                {isExpanded && children.length > 0 && (
                    <div className="relative">
                        {level === 0 && <div className="absolute top-0 bottom-2 right-[2.25rem] w-px bg-slate-200/50" />}
                        {children.map(child => renderProjectNode(child, level + 1))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <aside className="w-72 bg-white border-l border-slate-200 flex flex-col shadow-sm z-30">
            <div className="p-8">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shadow-lg shadow-slate-900/20">
                        <Zap className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="font-black text-xl tracking-tight text-slate-900">Lahlah OS</h1>
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 pb-4 space-y-1 custom-scroll">
                {/* Dashboard - Always Visible */}
                {contexts.filter(c => c.group === 'system').map(ctx => renderContextButton(ctx))}

                {/* Personal Life Group */}
                <div className="mt-4">
                    <button
                        onClick={() => setExpandedGroups(prev => ({ ...prev, personal: !prev.personal }))}
                        className="flex items-center gap-2 w-full px-4 py-2 text-[10px] uppercase font-black text-slate-400 hover:text-slate-600 transition-colors tracking-[0.2em]"
                    >
                        <span className="flex-1 text-right">الحياة الشخصية</span>
                        {expandedGroups.personal ? <ChevronRight className="w-3 h-3 rotate-90" /> : <ChevronLeft className="w-3 h-3" />}
                    </button>

                    {expandedGroups.personal && (
                        <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                            {contexts.filter(c => c.group === 'personal').map(ctx => renderContextButton(ctx))}
                        </div>
                    )}
                </div>

                {/* Projects Group */}
                <div className="mt-4">
                    <button
                        onClick={() => setExpandedGroups(prev => ({ ...prev, projects: !prev.projects }))}
                        className="flex items-center gap-2 w-full px-4 py-2 text-[10px] uppercase font-black text-slate-400 hover:text-slate-600 transition-colors tracking-[0.2em]"
                    >
                        <span className="flex-1 text-right">المشاريع والعمل</span>
                        {expandedGroups.projects ? <ChevronRight className="w-3 h-3 rotate-90" /> : <ChevronLeft className="w-3 h-3" />}
                    </button>

                    {expandedGroups.projects && (
                        <div className="space-y-1 animate-in slide-in-from-top-2 duration-200">
                            {contexts.filter(c => c.group === 'projects' && !c.parentId).map(ctx => renderProjectNode(ctx))}
                        </div>
                    )}
                </div>
            </nav>

            <div className="p-6 border-t border-slate-100">
                <div className="flex items-center gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200/50">
                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-xs font-bold shadow-sm overflow-hidden">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mohamed" alt="User" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-xs font-black text-slate-900 truncate">محمد لحلح</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase truncate">Software Arch / PM</p>
                    </div>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
