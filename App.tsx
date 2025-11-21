import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatInterface } from './components/ChatInterface';
import { CodeWorkspace } from './components/CodeWorkspace';
import { Project, Phase, Message, ProjectSummary } from './types';
import * as storage from './services/storage';
import * as gemini from './services/geminiService';

const App: React.FC = () => {
    const [projectList, setProjectList] = useState<ProjectSummary[]>([]);
    const [currentProject, setCurrentProject] = useState<Project | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Initialize
    useEffect(() => {
        const list = storage.getProjectList();
        setProjectList(list);
        if (list.length > 0) {
            loadProject(list[0].id);
        } else {
            handleNewProject();
        }
    }, []);

    const loadProject = (id: string) => {
        const proj = storage.loadProject(id);
        if (proj) setCurrentProject(proj);
    };

    const handleNewProject = () => {
        const newProj = storage.createNewProject();
        setProjectList(storage.getProjectList());
        setCurrentProject(newProj);
    };

    const handleDeleteProject = (id: string) => {
        storage.deleteProject(id);
        const updatedList = storage.getProjectList();
        setProjectList(updatedList);
        if (currentProject?.id === id) {
            if (updatedList.length > 0) {
                loadProject(updatedList[0].id);
            } else {
                handleNewProject();
            }
        }
    };

    const updateCurrentProject = (updates: Partial<Project>) => {
        if (!currentProject) return;
        const updated = { ...currentProject, ...updates, updatedAt: Date.now() };
        setCurrentProject(updated);
        storage.saveProject(updated);
        setProjectList(storage.getProjectList()); // Update timestamp in sidebar
    };

    const handleFileUpdate = (path: string, content: string) => {
        if (!currentProject) return;
        const updatedFiles = { ...currentProject.files, [path]: content };
        updateCurrentProject({ files: updatedFiles });
    };

    const handleSendMessage = async (text: string) => {
        if (!currentProject) return;

        // Add user message
        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content: text,
            timestamp: Date.now()
        };
        
        const updatedMessages = [...currentProject.messages, userMsg];
        updateCurrentProject({ messages: updatedMessages });

        setIsLoading(true);

        try {
            // Get AI Response
            const aiResponseText = await gemini.sendMessageToGemini(
                updatedMessages, 
                currentProject.phase, 
                currentProject.requirementsDoc
            );

            const aiMsg: Message = {
                id: crypto.randomUUID(),
                role: 'model',
                content: aiResponseText,
                timestamp: Date.now()
            };

            // If in Inception phase, try to update requirements automatically in background
            let newRequirements = currentProject.requirementsDoc;
            if (currentProject.phase === Phase.INCEPTION) {
                const reqDoc = await gemini.generateRequirements([...updatedMessages, aiMsg]);
                if (reqDoc) newRequirements = reqDoc;
            }

            updateCurrentProject({ 
                messages: [...updatedMessages, aiMsg],
                requirementsDoc: newRequirements
            });

        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleGenerateCode = async () => {
        if (!currentProject) return;
        setIsLoading(true);
        
        // Transition Message
        const transitionMsg: Message = {
            id: crypto.randomUUID(),
            role: 'system',
            content: '正在根据需求生成代码架构（Ant Design Vue + Spring Boot 工程化结构）... 请稍候，这可能需要几分钟。',
            timestamp: Date.now()
        };
        updateCurrentProject({ messages: [...currentProject.messages, transitionMsg] });

        try {
            const generatedFiles = await gemini.generateProjectCode(currentProject.requirementsDoc);
            
            // Success Message
            const successMsg: Message = {
                id: crypto.randomUUID(),
                role: 'model',
                content: `代码生成完毕！\n已创建基于 Ant Design Vue 和 Spring Boot 的工程化架构。\n包含 ${Object.keys(generatedFiles).length} 个文件。\n您可以切换到“代码工作台”在线编辑或下载源码。`,
                timestamp: Date.now()
            };

            // Select the first file to display
            const firstFileKey = Object.keys(generatedFiles)[0];
            
            updateCurrentProject({
                phase: Phase.CONSTRUCTION,
                files: generatedFiles,
                messages: [...currentProject.messages, transitionMsg, successMsg]
            });

        } catch (error) {
            const errorMsg: Message = {
                id: crypto.randomUUID(),
                role: 'system',
                content: '生成代码时遇到错误，请重试。确保 API Key 配置正确且模型可用。',
                timestamp: Date.now()
            };
            updateCurrentProject({ messages: [...currentProject.messages, transitionMsg, errorMsg] });
        } finally {
            setIsLoading(false);
        }
    };

    if (!currentProject) return <div className="flex items-center justify-center h-screen text-slate-500">Loading...</div>;

    return (
        <div className="flex h-screen w-full overflow-hidden bg-slate-50">
            <Sidebar 
                projects={projectList}
                currentProjectId={currentProject.id}
                onSelectProject={loadProject}
                onNewProject={handleNewProject}
                onDeleteProject={handleDeleteProject}
            />
            
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
                {/* Left: Chat (Resizable ideally, but fixed 40% for simplicity) */}
                <div className="w-full md:w-[400px] lg:w-[450px] border-r border-slate-200 h-1/2 md:h-full flex flex-col shadow-sm z-10">
                    <ChatInterface 
                        messages={currentProject.messages}
                        phase={currentProject.phase}
                        onSendMessage={handleSendMessage}
                        isLoading={isLoading}
                    />
                </div>

                {/* Right: Workspace */}
                <div className="flex-1 h-1/2 md:h-full bg-white">
                    <CodeWorkspace 
                        phase={currentProject.phase}
                        requirements={currentProject.requirementsDoc}
                        files={currentProject.files}
                        onUpdateRequirements={(doc) => updateCurrentProject({ requirementsDoc: doc })}
                        onUpdateFile={handleFileUpdate}
                        onGenerateCode={handleGenerateCode}
                        isGenerating={isLoading}
                    />
                </div>
            </div>
        </div>
    );
};

export default App;