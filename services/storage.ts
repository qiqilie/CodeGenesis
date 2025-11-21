import { Project, ProjectSummary, Phase } from '../types';

const STORAGE_KEY_PREFIX = 'codegenesis_project_';
const INDEX_KEY = 'codegenesis_index';

export const getProjectList = (): ProjectSummary[] => {
    try {
        const indexStr = localStorage.getItem(INDEX_KEY);
        return indexStr ? JSON.parse(indexStr) : [];
    } catch (e) {
        console.error("Failed to load project list", e);
        return [];
    }
};

export const saveProject = (project: Project): void => {
    try {
        // 1. Save full project details
        localStorage.setItem(`${STORAGE_KEY_PREFIX}${project.id}`, JSON.stringify(project));

        // 2. Update index
        const list = getProjectList();
        const existingIndex = list.findIndex(p => p.id === project.id);
        const summary: ProjectSummary = {
            id: project.id,
            name: project.name,
            updatedAt: project.updatedAt
        };

        if (existingIndex >= 0) {
            list[existingIndex] = summary;
        } else {
            list.unshift(summary);
        }
        localStorage.setItem(INDEX_KEY, JSON.stringify(list));
    } catch (e) {
        console.error("Failed to save project", e);
    }
};

export const loadProject = (id: string): Project | null => {
    try {
        const data = localStorage.getItem(`${STORAGE_KEY_PREFIX}${id}`);
        return data ? JSON.parse(data) : null;
    } catch (e) {
        console.error("Failed to load project details", e);
        return null;
    }
};

export const createNewProject = (): Project => {
    const id = crypto.randomUUID();
    const newProject: Project = {
        id,
        name: '新项目 ' + new Date().toLocaleTimeString(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        phase: Phase.INCEPTION,
        messages: [{
            id: crypto.randomUUID(),
            role: 'model',
            content: '你好！我是你的AI产品架构师。我们在**构思阶段(Inception)**。\n\n请告诉我你想构建什么样的应用？我会帮你梳理需求、用户故事和业务逻辑。',
            timestamp: Date.now()
        }],
        requirementsDoc: '# 项目需求文档\n\n待填充...',
        files: {}
    };
    saveProject(newProject);
    return newProject;
};

export const deleteProject = (id: string): void => {
    localStorage.removeItem(`${STORAGE_KEY_PREFIX}${id}`);
    const list = getProjectList().filter(p => p.id !== id);
    localStorage.setItem(INDEX_KEY, JSON.stringify(list));
}