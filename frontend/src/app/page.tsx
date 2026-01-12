'use client';

import dynamic from 'next/dynamic';
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Moon, Sun, ArrowLeft } from 'lucide-react';

const BrainVis = dynamic(() => import('../components/BrainVis'), { ssr: false });
import Dashboard from '../components/Dashboard';
import LandingPage from '../components/LandingPage';
import ChatAssistant from '../components/ChatAssistant';
import PreliminaryAssessment from '../components/PreliminaryAssessment';
import type { AnalysisResponse } from '../types';

type Page = 'landing' | 'app';

export default function Home() {
    const [page, setPage] = useState<Page>('landing');
    const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDark, setIsDark] = useState(false);
    const [chatTranscript, setChatTranscript] = useState('');

    // Handle system theme preference
    useEffect(() => {
        if (typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            setIsDark(true);
        }
    }, []);

    // Update DOM for Tailwind dark mode
    useEffect(() => {
        if (typeof document !== 'undefined') {
            document.documentElement.classList.toggle('dark', isDark);
        }
    }, [isDark]);

    const handleAnalyze = async (note: string) => {
        setIsLoading(true);
        try {
            // Next.js API route path
            const response = await axios.post<AnalysisResponse>('/api/analyze', { note });
            setAnalysis(response.data);
        } catch (error) {
            console.error("Analysis failed:", error);
            alert("Failed to connect to analysis server.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleChatAnalyze = () => {
        if (chatTranscript.trim()) {
            handleAnalyze(chatTranscript);
        }
    };

    const handleTranscriptReady = useCallback((transcript: string) => {
        setChatTranscript(transcript);
    }, []);

    const handleReset = useCallback(() => {
        setAnalysis(null);
        setChatTranscript('');
    }, []);

    const toggleTheme = () => setIsDark(!isDark);

    // Landing Page
    if (page === 'landing') {
        return (
            <LandingPage
                onGetStarted={() => setPage('app')}
                isDark={isDark}
                onToggleTheme={toggleTheme}
            />
        );
    }

    // App/Dashboard Page
    return (
        <div className="min-h-screen p-4 md:p-6 lg:p-8 safe-padding bg-[--bg] transition-colors duration-300">
            <div className="max-w-7xl mx-auto">

                {/* Header - Simplified without Notes toggle */}
                <header className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setPage('landing')}
                            className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-[--border] transition-colors"
                            aria-label="Back to home"
                        >
                            <ArrowLeft className="w-5 h-5 text-[--text-secondary]" />
                        </button>
                        <div className="flex items-center gap-3">
                            <img
                                src="/logo-health.png"
                                alt="StrokeSense AI"
                                className="w-10 h-10 rounded-xl object-cover shadow-sm"
                            />
                            <div>
                                <h1 className="text-xl font-bold flex items-center gap-2 leading-none">
                                    StrokeSense AI
                                    <span className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-health-pink/10 text-health-pink">
                                        Pro
                                    </span>
                                </h1>
                            </div>
                        </div>
                    </div>

                    {/* Theme Toggle Only */}
                    <button
                        onClick={toggleTheme}
                        className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-[--border] transition-colors"
                        aria-label="Toggle theme"
                    >
                        {isDark ? (
                            <Sun className="w-5 h-5 text-health-orange" />
                        ) : (
                            <Moon className="w-5 h-5 text-health-pink" />
                        )}
                    </button>
                </header>

                {/* Main Content */}
                <main className="space-y-6 md:space-y-0 md:grid md:grid-cols-12 md:gap-6">

                    {/* Left Column: Chat Assistant */}
                    <div className="md:col-span-5 lg:col-span-4 flex flex-col">
                        <ChatAssistant
                            onTranscriptReady={handleTranscriptReady}
                            onAnalyzeRequest={handleChatAnalyze}
                            onReset={handleReset}
                            isAnalyzing={isLoading}
                        />
                    </div>

                    {/* Right Column: Visualization & Dashboard */}
                    <div className="md:col-span-7 lg:col-span-8 flex flex-col gap-6">

                        {/* 3D Visualization */}
                        <div className="w-full h-[280px] md:h-[320px] relative rounded-ios-lg overflow-hidden shadow-sm border-none">
                            <BrainVis riskLevel={analysis?.stroke_probability ?? 0} />

                            {!analysis && !isLoading && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <div className="bg-black/60 backdrop-blur-md px-4 py-2 rounded-lg text-white">
                                        <p className="text-sm font-medium">System Ready</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Results Dashboard */}
                        <div className="min-h-[200px]">
                            {analysis ? (
                                <Dashboard data={analysis} />
                            ) : (
                                <PreliminaryAssessment transcript={chatTranscript} />
                            )}
                        </div>
                    </div>

                </main>
            </div>
        </div>
    );
}
