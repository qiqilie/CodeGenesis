import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Message, Phase } from '../types';

// Helper to sanitize JSON if model wraps it in markdown
const extractJson = (text: string): any => {
    try {
        // Try direct parse first
        return JSON.parse(text);
    } catch (e) {
        // Regex to find ```json ... ``` or just ``` ... ```
        const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (match && match[1]) {
            try {
                return JSON.parse(match[1]);
            } catch (e2) {
                console.error("JSON parse failed after extraction", e2);
                throw e2;
            }
        }
        throw e;
    }
};

export const sendMessageToGemini = async (
    currentMessages: Message[],
    phase: Phase,
    requirements: string,
    systemInstruction?: string
): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key not found");

    const ai = new GoogleGenAI({ apiKey });
    
    let prompt = "";
    let activeModel = "gemini-2.5-flash";

    if (phase === Phase.INCEPTION) {
        prompt = `
        You are an expert Product Manager and Technical Architect in the 'Inception' phase.
        Your goal is to help the user clarify their requirements.
        
        Current Requirements Document State:
        ${requirements}

        User Chat History:
        ${currentMessages.map(m => `${m.role}: ${m.content}`).join('\n')}

        Instructions:
        1. Ask clarifying questions if the request is vague.
        2. Suggest user stories or functional modules.
        3. If the user seems satisfied with the requirements, ask them if they are ready to proceed to the 'Construction' phase to generate code.
        4. Respond in Chinese.
        `;
    } else {
        // Construction Chat Mode (General questions about the code)
        activeModel = "gemini-2.5-flash"; // Or pro if needing complex logic
        prompt = `
        You are a Senior Full Stack Developer (Java Spring Boot + Vue 3) in the 'Construction' phase.
        
        Context - Requirements:
        ${requirements}

        User Chat History:
        ${currentMessages.map(m => `${m.role}: ${m.content}`).join('\n')}

        Instructions:
        1. Answer technical questions about the generated code.
        2. If the user asks for modifications, explain how you would implement them (you can't update the file tree directly in this chat mode, but you can guide them).
        3. Respond in Chinese.
        `;
    }

    try {
        const response = await ai.models.generateContent({
            model: activeModel,
            contents: prompt,
            config: {
                systemInstruction: systemInstruction || "You are a helpful AI assistant for software development."
            }
        });
        return response.text || "Sorry, I couldn't generate a response.";
    } catch (error) {
        console.error("Gemini Chat Error:", error);
        return "Error contacting AI service.";
    }
};

export const generateRequirements = async (messages: Message[]): Promise<string> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key not found");
    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
    Based on the following conversation, summarize the project requirements into a structured Markdown document.
    Include: Project Name, Core Features, User Roles, and key User Stories.
    
    Conversation:
    ${messages.map(m => `${m.role}: ${m.content}`).join('\n')}
    
    Output ONLY the Markdown content. Language: Chinese.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt
    });

    return response.text || "";
};

export const generateProjectCode = async (requirements: string): Promise<Record<string, string>> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) throw new Error("API Key not found");
    const ai = new GoogleGenAI({ apiKey });

    // Schema definition for structure
    const fileSchema: Schema = {
        type: Type.OBJECT,
        properties: {
            files: {
                type: Type.OBJECT,
                description: "A map where keys are file paths (e.g., 'src/main/java/com/app/Demo.java') and values are the full file source code.",
            }
        }
    };

    const prompt = `
    ACT AS: Senior Full Stack Architect & Developer.
    TASK: Generate a production-ready, engineered web application scaffolding based on the requirements.
    
    TECH STACK:
    - Backend: Java 17, Spring Boot 3, Spring Data JPA, H2 Database, Lombok.
    - Frontend: Vue 3 (Script Setup), Vite, Ant Design Vue 4.x, Axios, Pinia (State Management), Vue Router.
    
    REQUIREMENTS:
    ${requirements}
    
    OUTPUT:
    Return a JSON object containing the file structure.
    Do NOT generate binary files (images, jars).
    
    ENGINEERING STANDARDS (CRITICAL):
    1. Frontend MUST use Ant Design Vue components (e.g., <a-button>, <a-layout>, <a-table>).
    2. Frontend MUST follow a production-grade modular structure:
       - src/api/: Encapsulate all Axios requests here (e.g., user.js, project.js).
       - src/utils/request.js: Centralized Axios instance with interceptors.
       - src/router/: Vue Router configuration with lazy loading routes.
       - src/stores/: Pinia stores for state management.
       - .env.development and .env.production: Environment configuration files.
    3. Backend MUST follow standard Spring Boot Layered Architecture (Controller -> Service -> Repository -> Entity).
    
    GENERATE THESE SPECIFIC FILES (Minimum):
    1. Backend: pom.xml, Application.java, application.yml, and one complete feature module (Controller/Service/Repository/Entity).
    2. Frontend: package.json (include ant-design-vue), vite.config.js, src/main.js (register Antd), src/App.vue, src/utils/request.js, src/router/index.js, src/api/demo.js.
    
    JSON Format:
    {
      "files": {
        "backend/pom.xml": "...",
        "backend/src/main/java/com/example/demo/DemoApplication.java": "...",
        "frontend/package.json": "...",
        "frontend/src/App.vue": "...",
        "frontend/src/utils/request.js": "..."
      }
    }
    Ensure code is complete and valid.
    `;

    const response = await ai.models.generateContent({
        model: "gemini-3-pro-preview", // Using a stronger model for code gen
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            // thinkingConfig: { thinkingBudget: 2048 } // Optional: Enable thinking for better architecture
        }
    });

    try {
        const json = extractJson(response.text || "{}");
        return json.files || {};
    } catch (e) {
        console.error("Failed to parse code generation response", e);
        throw new Error("Code generation failed format check.");
    }
};