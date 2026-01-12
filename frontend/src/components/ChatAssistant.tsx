import { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { Send, Loader2, Sparkles, RotateCcw } from 'lucide-react';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatAssistantProps {
    onTranscriptReady: (transcript: string) => void;
    onAnalyzeRequest: () => void;
    onReset: () => void;
    isAnalyzing: boolean;
}

export default function ChatAssistant({ onTranscriptReady, onAnalyzeRequest, onReset, isAnalyzing }: ChatAssistantProps) {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: 'assistant',
            content: "Hi! I'm here to help assess stroke risk. Describe the patient's symptoms - when did they start and what are you seeing?"
        }
    ]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Generate transcript from chat history
    useEffect(() => {
        const transcript = messages
            .filter(m => m.role === 'user')
            .map(m => m.content)
            .join('\n\n');
        onTranscriptReady(transcript);
    }, [messages, onTranscriptReady]);

    // Auto-resize textarea
    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.style.height = 'auto';
            inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
        }
    }, [input]);

    const sendMessage = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { role: 'user', content: input };
        const updatedMessages = [...messages, userMessage];
        setMessages(updatedMessages);
        setInput('');
        setIsLoading(true);

        try {
            const response = await axios.post('/api/chat', {
                messages: updatedMessages
            });

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: response.data.message
            }]);
        } catch (error) {
            console.error('Chat error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I apologize, but I encountered an error. Please try again."
            }]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    const resetChat = () => {
        setMessages([{
            role: 'assistant',
            content: "Hi! I'm here to help assess stroke risk. Describe the patient's symptoms - when did they start and what are you seeing?"
        }]);
        setInput('');
        onReset(); // Clear analysis results too
    };

    const hasEnoughInfo = messages.length >= 3;

    // Simple markdown parser for bold text
    const formatMessage = (text: string) => {
        // Split by **bold** pattern and render accordingly
        const parts = text.split(/(\*\*[^*]+\*\*)/g);
        return parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
                return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
            }
            return part;
        });
    };

    return (
        <div className="card h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-[--border]">
                <div className="flex items-center gap-3">
                    <img
                        src="/logo-health.png"
                        alt="StrokeSense AI"
                        className="w-10 h-10 rounded-xl object-cover shadow-sm"
                    />
                    <div>
                        <h2 className="font-semibold text-base">Clinical Assistant</h2>
                        <p className="text-xs text-[--text-secondary]">Powered by Gemini</p>
                    </div>
                </div>
                <button
                    onClick={resetChat}
                    className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[--border] transition-colors"
                    title="New assessment"
                >
                    <RotateCcw className="w-4 h-4 text-[--text-secondary]" />
                </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto py-4 space-y-3 min-h-[280px] max-h-[400px]">
                {messages.map((message, index) => (
                    <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[88%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                ? 'bg-health-pink text-white rounded-br-sm'
                                : 'bg-[--surface-secondary] border border-[--border] rounded-bl-sm'
                                }`}
                        >
                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{formatMessage(message.content)}</p>
                        </div>
                    </div>
                ))}
                {isLoading && (
                    <div className="flex justify-start">
                        <div className="bg-[--surface-secondary] border border-[--border] rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-2">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-health-pink rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <div className="w-2 h-2 bg-health-pink rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <div className="w-2 h-2 bg-health-pink rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Improved */}
            <div className="pt-4 border-t border-[--border] space-y-3">
                <div className="relative flex items-end gap-2 bg-[--surface-secondary] rounded-2xl border border-[--border] p-2 focus-within:border-health-pink transition-colors">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Describe symptoms, onset time, medical history..."
                        className="flex-1 bg-transparent border-none outline-none resize-none text-sm py-2 px-2 min-h-[40px] max-h-[120px] placeholder:text-[--text-muted]"
                        style={{ color: 'var(--text-primary)' }}
                        disabled={isLoading || isAnalyzing}
                        rows={1}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={!input.trim() || isLoading || isAnalyzing}
                        className="w-10 h-10 rounded-xl bg-health-pink text-white flex items-center justify-center disabled:opacity-40 transition-all hover:bg-health-pink/90 shrink-0"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>

                {/* Analyze Button - Always visible after initial exchange */}
                {hasEnoughInfo && (
                    <button
                        onClick={onAnalyzeRequest}
                        disabled={isAnalyzing}
                        className="w-full btn btn-primary flex items-center justify-center gap-2 py-3"
                    >
                        {isAnalyzing ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Analyzing...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-4 h-4" />
                                Run Stroke Analysis
                            </>
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
