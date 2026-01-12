import { useState } from 'react';
import { Send, FileText, Loader2 } from 'lucide-react';

interface PatientInputProps {
    onAnalyze: (note: string) => void;
    isLoading: boolean;
}

export default function PatientInput({ onAnalyze, isLoading }: PatientInputProps) {
    const [note, setNote] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (note.trim()) {
            onAnalyze(note);
        }
    };

    const loadSample = () => {
        setNote(`72M hx HTN, DM2 presents with acute onset R sided weakness and slurred speech starting 45 mins ago. BP 180/100. denial of headache. taking lisinopril, metformin. blood sugar 145.`);
    };

    return (
        <div className="card h-full flex flex-col">
            <div className="flex justify-between items-center mb-5">
                <h2 className="font-bold text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-health-blue" />
                    Clinical Note
                </h2>
                <button
                    onClick={loadSample}
                    className="text-xs font-semibold text-health-blue bg-health-blue/10 px-3 py-1.5 rounded-full hover:bg-health-blue/20 transition-colors"
                >
                    Load Sample
                </button>
            </div>

            <form onSubmit={handleSubmit} className="flex-1 flex flex-col gap-5">
                <div className="relative flex-1">
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="Paste ED triage note here..."
                        className="input-ios h-full min-h-[200px] resize-none font-mono text-sm leading-relaxed"
                    />
                    <div className="absolute bottom-3 right-3 text-xs text-[--text-muted] font-medium pointer-events-none">
                        {note.length} chars
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={isLoading || !note.trim()}
                    className="btn btn-primary w-full flex items-center justify-center gap-2 py-3 rounded-lg text-white font-semibold"
                >
                    {isLoading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            <span>Analyzing...</span>
                        </>
                    ) : (
                        <>
                            <Send className="w-5 h-5" />
                            <span>Run Analysis</span>
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}
