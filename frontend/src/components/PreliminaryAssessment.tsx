import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle, HelpCircle, Activity } from 'lucide-react';

interface PreliminaryAssessmentProps {
    transcript: string;
}

interface Assessment {
    riskLevel: 'unknown' | 'low' | 'medium' | 'high';
    summary: string;
    indicators: string[];
}

export default function PreliminaryAssessment({ transcript }: PreliminaryAssessmentProps) {
    const [assessment, setAssessment] = useState<Assessment>({
        riskLevel: 'unknown',
        summary: 'Waiting for patient information...',
        indicators: []
    });

    useEffect(() => {
        if (!transcript.trim()) {
            setAssessment({
                riskLevel: 'unknown',
                summary: 'Describe symptoms to see preliminary assessment',
                indicators: []
            });
            return;
        }

        // Analyze transcript for stroke indicators
        const lower = transcript.toLowerCase();
        const strokeIndicators: string[] = [];
        const mimicIndicators: string[] = [];

        // Check for stroke symptoms
        if (lower.includes('facial droop') || lower.includes('face droop')) strokeIndicators.push('Facial drooping');
        if (lower.includes('arm weakness') || lower.includes('weak arm')) strokeIndicators.push('Arm weakness');
        if (lower.includes('leg weakness') || lower.includes('weak leg')) strokeIndicators.push('Leg weakness');
        if (lower.includes('slurred speech') || lower.includes('speech')) strokeIndicators.push('Speech changes');
        if (lower.includes('sudden') || lower.includes('sudden onset')) strokeIndicators.push('Sudden onset');
        if (lower.includes('left side') || lower.includes('right side')) strokeIndicators.push('Unilateral symptoms');
        if (lower.includes('numbness') || lower.includes('tingling')) strokeIndicators.push('Numbness/tingling');
        if (lower.includes('vision') || lower.includes('blind')) strokeIndicators.push('Vision changes');
        if (lower.includes('confusion') || lower.includes('confused')) strokeIndicators.push('Confusion');
        if (lower.includes('severe headache')) strokeIndicators.push('Severe headache');

        // Check for mimic indicators
        if (lower.includes('fever')) mimicIndicators.push('Fever (possible infection)');
        if (lower.includes('seizure') || lower.includes('postictal')) mimicIndicators.push('Seizure history');
        if (lower.includes('migraine')) mimicIndicators.push('Migraine history');
        if (lower.includes('anxiety') || lower.includes('stressed')) mimicIndicators.push('Anxiety/stress');
        if (lower.includes('nope') || lower.includes('no nothing') || lower.includes('nothing')) mimicIndicators.push('No focal neuro signs');
        if (lower.includes('body pain') || lower.includes('body ache')) mimicIndicators.push('Generalized symptoms');

        // Determine risk level
        let riskLevel: 'unknown' | 'low' | 'medium' | 'high' = 'unknown';
        let summary = '';

        if (strokeIndicators.length >= 3) {
            riskLevel = 'high';
            summary = 'Multiple stroke indicators present. Urgent evaluation recommended.';
        } else if (strokeIndicators.length >= 1 && mimicIndicators.length === 0) {
            riskLevel = 'medium';
            summary = 'Some stroke indicators noted. Further assessment needed.';
        } else if (mimicIndicators.length > 0 && strokeIndicators.length === 0) {
            riskLevel = 'low';
            summary = 'Symptoms suggest possible non-stroke cause. Continue gathering history.';
        } else if (strokeIndicators.length > 0 && mimicIndicators.length > 0) {
            riskLevel = 'medium';
            summary = 'Mixed presentation. Both stroke and mimic features present.';
        } else {
            riskLevel = 'unknown';
            summary = 'Need more information to assess stroke risk.';
        }

        setAssessment({
            riskLevel,
            summary,
            indicators: [...strokeIndicators.map(i => `+ ${i}`), ...mimicIndicators.map(i => `- ${i}`)]
        });
    }, [transcript]);

    const riskColors = {
        unknown: 'text-[--text-muted] bg-gray-500/10',
        low: 'text-health-green bg-health-green/10',
        medium: 'text-health-orange bg-health-orange/10',
        high: 'text-health-red bg-health-red/10'
    };

    const riskIcons = {
        unknown: HelpCircle,
        low: CheckCircle,
        medium: Activity,
        high: AlertCircle
    };

    const RiskIcon = riskIcons[assessment.riskLevel];

    return (
        <div className="card p-5 border border-[--border]">
            <div className="flex items-center gap-3 mb-4">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${riskColors[assessment.riskLevel]}`}>
                    <RiskIcon className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-semibold text-sm">Preliminary Assessment</h3>
                    <p className="text-xs text-[--text-secondary]">Based on conversation</p>
                </div>
            </div>

            {/* Risk Level Badge */}
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-3 ${riskColors[assessment.riskLevel]}`}>
                {assessment.riskLevel === 'unknown' ? 'Gathering Info' : `${assessment.riskLevel} Risk`}
            </div>

            {/* Summary */}
            <p className="text-sm text-[--text-secondary] mb-4">{assessment.summary}</p>

            {/* Indicators */}
            {assessment.indicators.length > 0 && (
                <div className="space-y-1.5">
                    <p className="text-xs font-medium text-[--text-muted] uppercase tracking-wide">Key Findings</p>
                    <div className="flex flex-wrap gap-2">
                        {assessment.indicators.slice(0, 6).map((indicator, i) => (
                            <span
                                key={i}
                                className={`text-xs px-2 py-1 rounded-md ${indicator.startsWith('+')
                                        ? 'bg-health-red/10 text-health-red'
                                        : 'bg-health-green/10 text-health-green'
                                    }`}
                            >
                                {indicator.substring(2)}
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
