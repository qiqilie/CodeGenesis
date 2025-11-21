import React, { useState, useEffect } from 'react';
import { Phase } from '../types';
import { FileText, Code, Download, ChevronRight, ChevronDown, File, Folder, PlayCircle, Loader2, Save, Edit2, X } from 'lucide-react';

interface CodeWorkspaceProps {
    phase: Phase;
    requirements: string;
    files: Record<string, string>;
    onUpdateRequirements: (newReq: string) => void; // Allow manual edit
    onUpdateFile: (path: string, content: string) => void;
    onGenerateCode: () => void;
    isGenerating: boolean;
}

export const CodeWorkspace: React.FC<CodeWorkspaceProps> = ({ 
    phase, 
    requirements, 
    files,
    onUpdateRequirements,
    onUpdateFile,
    onGenerateCode,
    isGenerating
}) => {
    const [activeTab, setActiveTab] = useState<'req' | 'code'>('req');
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
    
    // Editing State
    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState("");

    // Automatically switch tab based on phase
    useEffect(() => {
        if (phase === Phase.CONSTRUCTION && Object.keys(files).length > 0) {
            setActiveTab('code');
        }
    }, [phase, files]);

    // Reset edit state when file selection changes
    useEffect(() => {
        if (selectedFile && files[selectedFile]) {
            setEditContent(files[selectedFile]);
            setIsEditing(false);
        }
    }, [selectedFile, files]);

    // Simple file tree builder
    const buildFileTree = (filesMap: Record<string, string>) => {
        const root: any = {};
        Object.keys(filesMap).sort().forEach(path => {
            const parts = path.split('/');
            let current = root;
            parts.forEach((part, idx) => {
                if (!current[part]) {
                    current[part] = idx === parts.length - 1 ? { _file: true, path } : {};
                }
                current = current[part];
            });
        });
        return root;
    };

    const toggleFolder = (path: string) => {
        const newSet = new Set(expandedFolders);
        if (newSet.has(path)) newSet.delete(path);
        else newSet.add(path);
        setExpandedFolders(newSet);
    };

    const renderTree = (node: any, currentPath: string = "") => {
        return Object.keys(node).map(key => {
            if (key === '_file' || key === 'path') return null;
            const isFile = node[key]._file;
            const fullPath = currentPath ? `${currentPath}/${key}` : key;
            
            if (isFile) {
                return (
                    <div 
                        key={fullPath}
                        onClick={() => setSelectedFile(node[key].path)}
                        className={`pl-4 py-1 cursor-pointer flex items-center gap-2 text-sm hover:bg-slate-100 ${selectedFile === node[key].path ? 'bg-blue-50 text-blue-600 font-medium' : 'text-slate-600'}`}
                    >
                        <File size={14} />
                        <span className="truncate">{key}</span>
                    </div>
                );
            } else {
                const isExpanded = expandedFolders.has(fullPath) || true; // Default expand all for simplicity
                return (
                    <div key={fullPath} className="pl-2">
                        <div 
                            className="flex items-center gap-1 py-1 cursor-pointer text-slate-700 text-sm font-medium hover:text-slate-900"
                            onClick={() => toggleFolder(fullPath)}
                        >
                            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                            <Folder size={14} className="text-amber-400 fill-amber-400" />
                            {key}
                        </div>
                        {isExpanded && <div className="border-l border-slate-200 ml-2">
                            {renderTree(node[key], fullPath)}
                        </div>}
                    </div>
                );
            }
        });
    };

    const handleDownload = async () => {
        if (typeof window.JSZip === 'undefined') {
            alert("JSZip library not loaded.");
            return;
        }
        const zip = new window.JSZip();
        Object.entries(files).forEach(([path, content]) => {
            zip.file(path, content);
        });
        const content = await zip.generateAsync({ type: "blob" });
        const url = window.URL.createObjectURL(content);
        const a = document.createElement("a");
        a.href = url;
        a.download = "project-codegenesis.zip";
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const handleSaveFile = () => {
        if (selectedFile) {
            onUpdateFile(selectedFile, editContent);
            setIsEditing(false);
        }
    };

    const handleCancelEdit = () => {
        if (selectedFile) {
            setEditContent(files[selectedFile]);
            setIsEditing(false);
        }
    };

    // Syntax highlighting trigger
    useEffect(() => {
        if (window.Prism && !isEditing) {
            window.Prism.highlightAll();
        }
    }, [selectedFile, files, activeTab, isEditing]);

    return (
        <div className="flex flex-col h-full bg-white">
            {/* Tabs */}
            <div className="flex items-center border-b border-slate-200 bg-slate-50">
                <button
                    onClick={() => setActiveTab('req')}
                    className={`px-6 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'req' ? 'bg-white border-b-2 border-orange-500 text-orange-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <FileText size={16} />
                    需求文档 (Inception)
                </button>
                <button
                    onClick={() => setActiveTab('code')}
                    disabled={phase === Phase.INCEPTION}
                    className={`px-6 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${activeTab === 'code' ? 'bg-white border-b-2 border-blue-500 text-blue-600' : 'text-slate-500 hover:text-slate-700'} ${phase === Phase.INCEPTION ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                    <Code size={16} />
                    代码工作台 (Construction)
                </button>
                <div className="ml-auto pr-4">
                     {activeTab === 'code' && Object.keys(files).length > 0 && (
                         <button 
                            onClick={handleDownload}
                            className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 text-white text-xs rounded hover:bg-slate-700 transition-colors"
                         >
                             <Download size={14} /> 下载源码
                         </button>
                     )}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'req' && (
                    <div className="h-full flex flex-col">
                        <div className="flex-1 p-6 overflow-y-auto">
                            <textarea
                                className="w-full h-full resize-none outline-none text-slate-700 text-sm leading-relaxed font-mono bg-transparent"
                                value={requirements}
                                onChange={(e) => onUpdateRequirements(e.target.value)}
                                placeholder="# 需求文档..."
                            />
                        </div>
                        {phase === Phase.INCEPTION && (
                            <div className="p-4 border-t bg-slate-50 flex justify-end">
                                <button
                                    onClick={onGenerateCode}
                                    disabled={isGenerating || !requirements.trim()}
                                    className="bg-gradient-to-r from-orange-500 to-orange-600 text-white px-6 py-2 rounded shadow hover:shadow-lg transition-all flex items-center gap-2 font-medium disabled:opacity-70"
                                >
                                    {isGenerating ? <Loader2 className="animate-spin" /> : <PlayCircle />}
                                    确认需求并生成代码
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'code' && (
                    <div className="h-full flex">
                        {/* File Tree Sidebar */}
                        <div className="w-64 border-r border-slate-200 bg-slate-50 overflow-y-auto py-2">
                            {Object.keys(files).length === 0 ? (
                                <div className="p-4 text-center text-slate-400 text-sm">
                                    暂无代码文件
                                </div>
                            ) : (
                                renderTree(buildFileTree(files))
                            )}
                        </div>
                        
                        {/* Code Editor Area */}
                        <div className="flex-1 overflow-hidden flex flex-col bg-[#2d2d2d]">
                            {selectedFile ? (
                                <>
                                    <div className="bg-[#1e1e1e] text-slate-400 px-4 py-2 text-xs border-b border-[#333] flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <span className="font-medium text-slate-300">{selectedFile}</span>
                                            <span className="opacity-50">|</span>
                                            <span>{(files[selectedFile].length / 1024).toFixed(2)} KB</span>
                                        </div>
                                        
                                        <div className="flex items-center gap-2">
                                            {isEditing ? (
                                                <>
                                                    <button 
                                                        onClick={handleSaveFile}
                                                        className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded transition-colors"
                                                    >
                                                        <Save size={12} /> 保存
                                                    </button>
                                                    <button 
                                                        onClick={handleCancelEdit}
                                                        className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
                                                    >
                                                        <X size={12} /> 取消
                                                    </button>
                                                </>
                                            ) : (
                                                <button 
                                                    onClick={() => setIsEditing(true)}
                                                    className="flex items-center gap-1 px-2 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors"
                                                >
                                                    <Edit2 size={12} /> 编辑
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex-1 overflow-hidden relative">
                                        {isEditing ? (
                                            <textarea
                                                value={editContent}
                                                onChange={(e) => setEditContent(e.target.value)}
                                                className="w-full h-full bg-[#1e1e1e] text-[#ccc] p-4 font-mono text-sm outline-none resize-none border-none custom-scrollbar"
                                                spellCheck={false}
                                            />
                                        ) : (
                                            <div className="w-full h-full overflow-auto custom-scrollbar">
                                                <pre className="!m-0 !p-4 !bg-transparent !text-sm min-h-full">
                                                    <code className={`language-${selectedFile.endsWith('.java') ? 'java' : selectedFile.endsWith('.vue') || selectedFile.endsWith('.js') ? 'javascript' : 'json'}`}>
                                                        {files[selectedFile]}
                                                    </code>
                                                </pre>
                                            </div>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="flex-1 flex items-center justify-center text-slate-500 flex-col gap-4">
                                    <Code size={48} opacity={0.2} />
                                    <p>选择左侧文件查看代码</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

// Add typescript definition for external libraries
declare global {
    interface Window {
        JSZip: any;
        Prism: any;
    }
}