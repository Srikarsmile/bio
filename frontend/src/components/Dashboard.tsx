import { AlertTriangle, Clock, CheckCircle2, AlertOctagon, Brain, Zap } from 'lucide-react';
import clsx from 'clsx';
import type { AnalysisResponse } from '../types';

function ProbabilityCard({ probability, classification }: { probability: number; classification: string }) {
    const isHigh = classification === 'HIGH';
    const isMed = classification === 'MEDIUM';

    // Solid colors
    const strokeColor = isHigh ? 'text-health-red' : isMed ? 'text-health-orange' : 'text-health-green';
    const badgeClass = isHigh ? 'bg-health-red/10 text-health-red' : isMed ? 'bg-health-orange/10 text-health-orange' : 'bg-health-green/10 text-health-green';

    return (
        <div className="card flex flex-col items-center justify-center py-8">
            <span className="section-label mb-4">Stroke Probability</span>

            <div className="relative mb-2">
                {/* Circular ring bg */}
                <svg className="w-40 h-40 transform -rotate-90">
                    <circle cx="50%" cy="50%" r="45%" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-gray-100 dark:text-gray-800" />
                    <circle
                        cx="50%" cy="50%" r="45%"
                        stroke="currentColor"
                        strokeWidth="10"
                        fill="transparent"
                        strokeLinecap="round"
                        strokeDasharray={`${2 * Math.PI * 45}%`}
                        strokeDashoffset={`${2 * Math.PI * 45 * (1 - probability / 100)}%`}
                        className={clsx("transition-all duration-1000 ease-out", strokeColor)}
                        style={{ r: "45%" }}
                    />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-5xl font-bold tracking-tight text-[--text-primary]">
                        {probability}<span className="text-2xl text-[--text-muted] font-medium">%</span>
                    </span>
                </div>
            </div>

            <div className={clsx("badge mt-2 px-3", badgeClass)}>
                {classification} Risk
            </div>
        </div>
    );
}

function UrgencyBar({ score, rationale }: { score: number; rationale: string }) {
    return (
        <div className="card">
            <div className="flex justify-between items-center mb-4">
                <span className="section-label flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-health-blue" />
                    Urgency Score
                </span>
                <span className="text-lg font-bold text-[--text-primary]">{score}<span className="text-xs text-[--text-secondary] font-normal">/5</span></span>
            </div>

            {/* Simple Segmented Bar */}
            <div className="flex gap-1 h-2.5 mb-4">
                {[1, 2, 3, 4, 5].map((level) => (
                    <div
                        key={level}
                        className={clsx(
                            "flex-1 rounded-sm",
                            level <= score
                                ? level >= 4 ? "bg-health-red"
                                    : level === 3 ? "bg-health-orange"
                                        : "bg-health-green"
                                : "bg-gray-100 dark:bg-gray-800"
                        )}
                    />
                ))}
            </div>
            <p className="text-sm text-[--text-secondary] leading-relaxed">{rationale}</p>
        </div>
    );
}

export default function Dashboard({ data }: { data: AnalysisResponse | null }) {
    if (!data) return null;

    // Generate patient-specific recommendations
    const getPatientRecommendations = () => {
        const recommendations: string[] = [];
        const isHigh = data.classification === 'HIGH';
        const isMed = data.classification === 'MEDIUM';

        if (isHigh) {
            recommendations.push("🚨 Call emergency services (911) immediately");
            recommendations.push("⏱️ Note the exact time symptoms started");
            recommendations.push("🚫 Do not eat, drink, or take any medications");
            recommendations.push("🏥 Go to the nearest stroke center if possible");
        } else if (isMed) {
            recommendations.push("👀 Monitor symptoms closely for any changes");
            recommendations.push("📞 Contact your doctor or urgent care");
            recommendations.push("⏱️ Track when symptoms began");
            recommendations.push("📝 List all current medications");
        } else {
            recommendations.push("📋 Document symptoms for your next doctor visit");
            recommendations.push("💊 Continue prescribed medications as normal");
            recommendations.push("🔍 Watch for any new or worsening symptoms");
            recommendations.push("🩺 Schedule a follow-up if symptoms persist");
        }

        return recommendations;
    };

    return (
        <div className="space-y-4 md:space-y-6 animate-fade-up">
            {/* Top Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <ProbabilityCard probability={data.stroke_probability} classification={data.classification} />

                <div className="space-y-4 md:space-y-6">
                    <UrgencyBar score={data.urgency_score} rationale={data.urgency_rationale} />

                    <div className="grid grid-cols-2 gap-3 md:gap-4">
                        <div className="card py-4 md:py-6">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-health-blue" />
                                <span className="section-label mb-0 text-xs">LKW Time</span>
                            </div>
                            <div className="text-base md:text-xl font-semibold text-[--text-primary] mt-1">{data.lkw_time}</div>
                        </div>

                        <div className="card py-4 md:py-6">
                            <div className="flex items-center gap-2 mb-2">
                                {String(data.tpa_assessment.eligible) === 'true'
                                    ? <CheckCircle2 className="w-4 h-4 text-health-green" />
                                    : <AlertOctagon className="w-4 h-4 text-health-orange" />
                                }
                                <span className="section-label mb-0 text-xs">tPA Status</span>
                            </div>
                            <div className={clsx(
                                "text-sm font-semibold mt-1",
                                String(data.tpa_assessment.eligible) === 'true' ? "text-health-green" : "text-health-orange"
                            )}>
                                {String(data.tpa_assessment.eligible) === 'true' ? "Likely Eligible" : "Verify Criteria"}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Patient Recommendations - NEW */}
            <div className="card border-2 border-health-pink/30 bg-health-pink/5">
                <span className="section-label flex items-center gap-1.5 mb-3 text-health-pink">
                    <CheckCircle2 className="w-4 h-4" />
                    What You Should Do
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {getPatientRecommendations().map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-[--text-primary] py-1.5">
                            <span>{rec}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Bottom Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                <div className="md:col-span-2 card">
                    <span className="section-label flex items-center gap-1.5 mb-3 text-health-blue">
                        <Brain className="w-4 h-4" />
                        Recommended Protocol
                    </span>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4">
                        <div className="flex-1">
                            <h3 className="text-base md:text-lg font-bold mb-1 text-[--text-primary]">
                                {data.recommended_action.replace(/_/g, " ")}
                            </h3>
                            <p className="text-sm text-[--text-secondary]">{data.primary_impression}</p>
                        </div>
                        <button className="btn btn-primary rounded-full px-5 py-2 text-sm font-medium w-full sm:w-auto">
                            Activate Protocol
                        </button>
                    </div>
                </div>

                <div className="card">
                    <span className="section-label flex items-center gap-1.5 mb-3">
                        <AlertTriangle className="w-4 h-4 text-[--text-muted]" />
                        Findings
                    </span>
                    <div className="flex flex-wrap gap-1.5 md:gap-2">
                        {data.stroke_indicators.map((tag, i) => (
                            <span key={`s-${i}`} className="badge badge-critical border-none text-xs">{tag}</span>
                        ))}
                        {data.mimic_indicators.map((tag, i) => (
                            <span key={`m-${i}`} className="badge badge-success border-none text-xs">{tag}</span>
                        ))}
                        {data.stroke_indicators.length === 0 && data.mimic_indicators.length === 0 && (
                            <span className="text-xs text-[--text-muted] italic">No specific keywords</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
