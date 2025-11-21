import React, { useState, useRef, useEffect } from 'react';
import { Message, Phase } from '../types';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';

interface ChatInterfaceProps {
    messages: Message[];
    phase: Phase;
    onSendMessage: (text: string) => void;
    isLoading: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ messages, phase, onSendMessage, isLoading }) => {
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isLoading]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            onSendMessage(input);
            setInput("");
        }
    };

    const isConstruction = phase === Phase.CONSTRUCTION;
    const themeColor = isConstruction ? "text-blue-600" : "text-orange-500";
    const themeBg = isConstruction ? "bg-blue-50" : "bg-orange-50";
    const themeBtn = isConstruction ? "bg-blue-600 hover:bg-blue-700" : "bg-orange-500 hover:bg-orange-600";

    return (
        <div className="flex flex-col h-full bg-white relative">
            {/* Header */}
            <div className={`p-4 border-b flex items-center gap-2 font-semibold ${isConstruction ? 'bg-blue-50/50 border-blue-100' : 'bg-orange-50/50 border-orange-100'}`}>
                {isConstruction ? <Bot className="text-blue-600" /> : <Sparkles className="text-orange-500" />}
                <span className="text-slate-700">
                    {isConstruction ? "AI 架构师 (构建阶段)" : "AI 产品经理 (构思阶段)"}
                </span>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                {messages.map((msg) => (
                    <div 
                        key={msg.id} 
                        className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`flex max-w-[85%] md:max-w-[75%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-1 ${
                                msg.role === 'user' ? 'bg-slate-200 text-slate-600' : themeBg
                            }`}>
                                {msg.role === 'user' ? <User size={16}/> : <Bot size={16} className={themeColor}/>}
                            </div>

                            <div className={`p-3 rounded-lg text-sm leading-relaxed shadow-sm ${
                                msg.role === 'user' 
                                ? 'bg-slate-800 text-white rounded-tr-none' 
                                : 'bg-white border border-slate-100 text-slate-700 rounded-tl-none'
                            }`}>
                                <div className="whitespace-pre-wrap">{msg.content}</div>
                            </div>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex w-full justify-start">
                         <div className="flex gap-3 ml-11">
                            <div className={`p-3 rounded-lg bg-white border border-slate-100 shadow-sm flex items-center gap-2 text-sm text-slate-500`}>
                                <Loader2 size={14} className="animate-spin" />
                                思考中...
                            </div>
                         </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-slate-100 bg-slate-50/50">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={isConstruction ? "询问代码相关问题或要求修改..." : "描述你的产品想法..."}
                        className="flex-1 border border-slate-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-opacity-50 focus:ring-offset-0 transition-all text-sm"
                        style={{ 
                            borderColor: isConstruction ? '#93c5fd' : '#fdba74',
                            boxShadow: 'none'
                        }}
                        disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !input.trim()}
                        className={`px-4 py-2 rounded-md text-white transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${themeBtn}`}
                    >
                        <Send size={16} />
                        发送
                    </button>
                </form>
            </div>
        </div>
    );
};