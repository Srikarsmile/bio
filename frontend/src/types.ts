export interface AnalysisResponse {
    stroke_probability: number;
    classification: string;
    primary_impression: string;
    key_phrases: { phrase: string; significance: string }[];
    stroke_indicators: string[];
    mimic_indicators: string[];
    tpa_assessment: {
        eligible: boolean | string;
        contraindications_found: string[];
        contraindications_missing_info: string[];
        time_from_lkw: string;
    };
    lkw_time: string;
    urgency_score: number;
    urgency_rationale: string;
    flags: string[];
    differential_diagnosis: { diagnosis: string; likelihood: string }[];
    recommended_action: string;
    error?: string;
}
