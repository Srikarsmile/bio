import { Heart, Shield, CheckCircle, ArrowRight, Activity, Brain, Clock } from 'lucide-react';

interface LandingPageProps {
    onGetStarted: () => void;
    isDark: boolean;
    onToggleTheme: () => void;
}

export default function LandingPage({ onGetStarted, isDark, onToggleTheme }: LandingPageProps) {
    return (
        <div className="min-h-screen font-sans bg-[--bg] overflow-hidden">
            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-[--surface]/80 backdrop-blur-xl border-b border-[--border]">
                <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo-health.png"
                            alt="StrokeSense AI"
                            className="w-9 h-9 rounded-xl object-cover"
                        />
                        <span className="font-semibold text-lg tracking-tight">StrokeSense AI</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onToggleTheme}
                            className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            {isDark ? '☀️' : '🌙'}
                        </button>
                        <button onClick={onGetStarted} className="btn btn-primary rounded-full px-5 py-2 text-sm">
                            Try Now
                        </button>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative py-24 md:py-32 px-4">
                {/* Subtle background decoration */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-health-pink/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-health-red/10 rounded-full blur-3xl" />
                </div>

                <div className="max-w-4xl mx-auto text-center relative">
                    {/* Badge */}
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-health-pink/10 text-health-pink text-xs font-semibold uppercase tracking-wider mb-8">
                        <Heart className="w-3.5 h-3.5" fill="currentColor" />
                        AI-Powered Clinical Support
                    </div>

                    {/* Main Headline */}
                    <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-[--text-primary]">
                        Stroke Detection
                        <br />
                        <span className="bg-gradient-to-r from-health-pink to-health-red bg-clip-text text-transparent">
                            in Seconds
                        </span>
                    </h1>

                    {/* Subtitle */}
                    <p className="text-xl md:text-2xl text-[--text-secondary] mb-12 leading-relaxed font-normal max-w-2xl mx-auto">
                        Instant stroke probability assessment and tPA eligibility using advanced clinical NLP.
                    </p>

                    {/* CTA Buttons */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                        <button
                            onClick={onGetStarted}
                            className="btn btn-primary rounded-full px-10 py-4 text-base font-semibold flex items-center gap-2 shadow-lg shadow-health-pink/25 hover:shadow-health-pink/40 transition-shadow"
                        >
                            Get Started
                            <ArrowRight className="w-5 h-5" />
                        </button>
                        <button className="text-health-pink font-medium hover:text-health-red transition-colors px-6 py-3 flex items-center gap-2">
                            <span>How it works</span>
                            <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Trust indicators */}
                    <div className="mt-16 flex flex-wrap justify-center gap-x-10 gap-y-4 text-sm text-[--text-secondary]">
                        <span className="flex items-center gap-2">
                            <CheckCircle className="w-5 h-5 text-health-green" />
                            HIPAA Compliant
                        </span>
                        <span className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-health-green" />
                            FDA Guidelines
                        </span>
                        <span className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-health-green" />
                            Real-time Analysis
                        </span>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 border-y border-[--border] bg-[--surface]">
                <div className="max-w-5xl mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
                        {[
                            { value: '94%', label: 'Accuracy', color: 'text-health-pink' },
                            { value: '<5s', label: 'Analysis Time', color: 'text-health-green' },
                            { value: '10k+', label: 'Cases Analyzed', color: 'text-health-pink' },
                            { value: '50+', label: 'Medical Partners', color: 'text-health-orange' },
                        ].map((stat, i) => (
                            <div key={i} className="p-4">
                                <div className={`text-4xl md:text-5xl font-bold mb-2 ${stat.color}`}>
                                    {stat.value}
                                </div>
                                <div className="text-sm font-medium text-[--text-secondary] tracking-wide">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="py-24 px-4">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-health-pink/10 text-health-pink text-xs font-semibold uppercase tracking-wider mb-4">
                            Capabilities
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">Everything You Need</h2>
                        <p className="text-lg text-[--text-secondary] max-w-xl mx-auto">
                            Comprehensive tools for rapid stroke assessment and clinical decision support.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: Brain,
                                title: 'NLP Analysis',
                                desc: 'Advanced natural language processing extracts critical indicators from clinical notes.',
                                color: 'text-health-pink',
                                bg: 'bg-health-pink/10'
                            },
                            {
                                icon: Activity,
                                title: 'Risk Scoring',
                                desc: 'Real-time probability calculation based on validated clinical parameters.',
                                color: 'text-health-red',
                                bg: 'bg-health-red/10'
                            },
                            {
                                icon: Shield,
                                title: 'Protocol Check',
                                desc: 'Automated verification of tPA eligibility criteria and contraindications.',
                                color: 'text-health-green',
                                bg: 'bg-health-green/10'
                            },
                        ].map((feature, i) => (
                            <div
                                key={i}
                                className="card p-8 hover:shadow-lg transition-all duration-300 group"
                            >
                                <div className={`w-14 h-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                                    <feature.icon className={`w-7 h-7 ${feature.color}`} />
                                </div>
                                <h3 className="font-bold text-lg mb-3">{feature.title}</h3>
                                <p className="text-[--text-secondary] leading-relaxed">{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 bg-gradient-to-br from-health-pink to-health-red relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-30" />
                <div className="max-w-3xl mx-auto text-center relative">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                        Ready to Transform Your Clinical Workflow?
                    </h2>
                    <p className="text-lg text-white/80 mb-10 max-w-xl mx-auto">
                        Join healthcare providers using AI-powered stroke detection to save lives.
                    </p>
                    <button
                        onClick={onGetStarted}
                        className="bg-white text-health-pink font-semibold px-10 py-4 rounded-full hover:bg-gray-50 transition-colors shadow-xl flex items-center gap-2 mx-auto"
                    >
                        Start Free Analysis
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 border-t border-[--border] bg-[--surface]">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <img
                            src="/logo-health.png"
                            alt="StrokeSense AI"
                            className="w-8 h-8 rounded-lg object-cover"
                        />
                        <span className="font-semibold">StrokeSense AI</span>
                    </div>
                    <div className="flex items-center gap-8 text-sm text-[--text-secondary]">
                        <a href="#" className="hover:text-health-pink transition-colors">Privacy</a>
                        <a href="#" className="hover:text-health-pink transition-colors">Terms</a>
                        <a href="#" className="hover:text-health-pink transition-colors">Contact</a>
                    </div>
                    <p className="text-sm text-[--text-muted]">
                        © 2026 StrokeSense AI. All rights reserved.
                    </p>
                </div>
            </footer>
        </div>
    );
}
