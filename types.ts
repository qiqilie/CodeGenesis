export enum Phase {
    INCEPTION = 'INCEPTION',
    CONSTRUCTION = 'CONSTRUCTION'
}

export interface Message {
    id: string;
    role: 'user' | 'model' | 'system';
    content: string;
    timestamp: number;
}

export interface FileNode {
    path: string;
    name: string;
    content: string;
    language: string;
    isFolder?: boolean;
    children?: FileNode[];
}

export interface Project {
    id: string;
    name: string;
    createdAt: number;
    updatedAt: number;
    phase: Phase;
    messages: Message[];
    requirementsDoc: string;
    files: Record<string, string>; // Flat map: path -> content
}

export interface CodeGenerationResponse {
    files: Record<string, string>;
    summary: string;
}

export interface ProjectSummary {
    id: string;
    name: string;
    updatedAt: number;
}