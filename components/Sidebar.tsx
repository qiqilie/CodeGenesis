import React from 'react';
import { ProjectSummary } from '../types';
import { MessageSquarePlus, Trash2, Folder, History } from 'lucide-react';

interface SidebarProps {
    projects: ProjectSummary[];
    currentProjectId: string;
    onSelectProject: (id: string) => void;
    onNewProject: () => void;
    onDeleteProject: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
    projects, 
    currentProjectId, 
    onSelectProject, 
    onNewProject,
    onDeleteProject 
}) => {
    return (
        <div className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen border-r border-slate-800 shadow-xl">
            <div className="p-4 border-b border-slate-800">
                <div className="flex items-center gap-2 mb-6 text-white font-bold text-xl">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-blue-600 rounded-lg flex items-center justify-center">
                        CG
                    </div>
                    CodeGenesis
                </div>
                <button 
                    onClick={onNewProject}
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white p-2 rounded-md transition-colors font-medium text-sm"
                >
                    <MessageSquarePlus size={16} />
                    新建项目
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2">
                <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2 px-2 flex items-center gap-1">
                    <History size={12}/> 历史记录
                </div>
                {projects.length === 0 && (
                    <div className="text-slate-600 text-sm text-center mt-10">暂无项目</div>
                )}
                <ul className="space-y-1">
                    {projects.map(p => (
                        <li key={p.id} className="group relative">
                            <button
                                onClick={() => onSelectProject(p.id)}
                                className={`w-full text-left px-3 py-2 rounded-md text-sm flex items-center gap-2 transition-all ${
                                    p.id === currentProjectId 
                                    ? 'bg-slate-800 text-white shadow-sm border-l-2 border-blue-500' 
                                    : 'hover:bg-slate-800/50 hover:text-slate-200'
                                }`}
                            >
                                <Folder size={14} className={p.id === currentProjectId ? 'text-blue-400' : 'text-slate-500'} />
                                <span className="truncate flex-1">{p.name}</span>
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDeleteProject(p.id); }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                                title="删除项目"
                            >
                                <Trash2 size={14} />
                            </button>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="p-4 border-t border-slate-800 text-xs text-slate-500 text-center">
                v1.0.0 • AI Powered
            </div>
        </div>
    );
};