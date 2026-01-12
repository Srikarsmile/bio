"""
StrokeSense AI - Premium Clinical Dashboard
A medical-grade decision support tool for stroke triage
"""
import streamlit as st
import json
import os
from pathlib import Path

# Set page config first
st.set_page_config(
    page_title="StrokeSense AI",
    page_icon="⚕️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Premium Medical-Grade CSS
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
    
    /* Global Reset */
    * {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    /* Dark Medical Theme */
    .stApp {
        background: #0a0f1a;
    }
    
    [data-testid="stSidebar"] {
        background: linear-gradient(180deg, #0d1321 0%, #0a0f1a 100%);
        border-right: 1px solid rgba(255,255,255,0.05);
    }
    
    [data-testid="stSidebar"] [data-testid="stMarkdownContainer"] p {
        color: #94a3b8;
    }
    
    /* Hide Streamlit Branding */
    #MainMenu, footer, header {visibility: hidden;}
    .stDeployButton {display: none;}
    
    /* Custom Scrollbar */
    ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
    }
    ::-webkit-scrollbar-track {
        background: #0a0f1a;
    }
    ::-webkit-scrollbar-thumb {
        background: #1e293b;
        border-radius: 3px;
    }
    
    /* Header */
    .header-container {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        border: 1px solid rgba(59, 130, 246, 0.2);
        border-radius: 16px;
        padding: 24px 32px;
        margin-bottom: 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    
    .header-left {
        display: flex;
        align-items: center;
        gap: 16px;
    }
    
    .header-icon {
        width: 48px;
        height: 48px;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
    }
    
    .header-title {
        color: #f8fafc;
        font-size: 24px;
        font-weight: 600;
        margin: 0;
        letter-spacing: -0.5px;
    }
    
    .header-subtitle {
        color: #64748b;
        font-size: 14px;
        margin: 4px 0 0 0;
    }
    
    .header-badge {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
        padding: 6px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: 500;
        border: 1px solid rgba(34, 197, 94, 0.2);
    }
    
    /* Patient Info Bar */
    .patient-bar {
        background: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 12px;
        padding: 16px 24px;
        margin-bottom: 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
    }
    
    .patient-info {
        display: flex;
        align-items: center;
        gap: 32px;
    }
    
    .patient-field {
        display: flex;
        flex-direction: column;
    }
    
    .patient-label {
        color: #64748b;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 2px;
    }
    
    .patient-value {
        color: #f1f5f9;
        font-size: 14px;
        font-weight: 500;
    }
    
    .status-badge {
        padding: 6px 14px;
        border-radius: 6px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .status-stroke {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.3);
    }
    
    .status-mimic {
        background: rgba(34, 197, 94, 0.15);
        color: #22c55e;
        border: 1px solid rgba(34, 197, 94, 0.3);
    }
    
    /* Main Probability Card */
    .prob-card {
        background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
        border-radius: 20px;
        padding: 32px;
        text-align: center;
        border: 1px solid rgba(255,255,255,0.05);
        margin-bottom: 20px;
    }
    
    .prob-card.critical {
        border: 2px solid rgba(239, 68, 68, 0.4);
        box-shadow: 0 0 40px rgba(239, 68, 68, 0.1);
    }
    
    .prob-card.warning {
        border: 2px solid rgba(245, 158, 11, 0.4);
        box-shadow: 0 0 40px rgba(245, 158, 11, 0.1);
    }
    
    .prob-card.safe {
        border: 2px solid rgba(34, 197, 94, 0.4);
        box-shadow: 0 0 40px rgba(34, 197, 94, 0.1);
    }
    
    .prob-label {
        color: #64748b;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 8px;
    }
    
    .prob-value {
        font-size: 72px;
        font-weight: 700;
        line-height: 1;
        margin: 0;
        background: linear-gradient(135deg, #fff 0%, #94a3b8 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
    }
    
    .prob-value.critical { 
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        -webkit-background-clip: text;
        background-clip: text;
    }
    
    .prob-value.warning { 
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        -webkit-background-clip: text;
        background-clip: text;
    }
    
    .prob-value.safe { 
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        -webkit-background-clip: text;
        background-clip: text;
    }
    
    .prob-classification {
        display: inline-block;
        padding: 8px 20px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 16px;
    }
    
    .prob-classification.critical {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
    }
    
    .prob-classification.warning {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
    }
    
    .prob-classification.safe {
        background: rgba(34, 197, 94, 0.15);
        color: #22c55e;
    }
    
    /* Info Cards */
    .info-card {
        background: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 16px;
        padding: 20px 24px;
        margin-bottom: 16px;
    }
    
    .info-card-header {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 16px;
        padding-bottom: 12px;
        border-bottom: 1px solid #1e293b;
    }
    
    .info-card-icon {
        width: 32px;
        height: 32px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
    }
    
    .info-card-icon.tpa { background: rgba(59, 130, 246, 0.15); }
    .info-card-icon.urgency { background: rgba(245, 158, 11, 0.15); }
    .info-card-icon.time { background: rgba(168, 85, 247, 0.15); }
    .info-card-icon.impression { background: rgba(34, 197, 94, 0.15); }
    
    .info-card-title {
        color: #94a3b8;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        font-weight: 500;
    }
    
    .info-card-value {
        color: #f1f5f9;
        font-size: 15px;
        line-height: 1.6;
    }
    
    /* TPA Status */
    .tpa-status {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        border-radius: 10px;
        font-weight: 500;
    }
    
    .tpa-eligible {
        background: rgba(34, 197, 94, 0.1);
        color: #22c55e;
        border: 1px solid rgba(34, 197, 94, 0.2);
    }
    
    .tpa-contraindicated {
        background: rgba(239, 68, 68, 0.1);
        color: #ef4444;
        border: 1px solid rgba(239, 68, 68, 0.2);
    }
    
    .tpa-uncertain {
        background: rgba(245, 158, 11, 0.1);
        color: #f59e0b;
        border: 1px solid rgba(245, 158, 11, 0.2);
    }
    
    .tpa-icon {
        width: 20px;
        height: 20px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
    }
    
    .tpa-eligible .tpa-icon { background: rgba(34, 197, 94, 0.2); }
    .tpa-contraindicated .tpa-icon { background: rgba(239, 68, 68, 0.2); }
    .tpa-uncertain .tpa-icon { background: rgba(245, 158, 11, 0.2); }
    
    /* Urgency Meter */
    .urgency-meter {
        display: flex;
        align-items: center;
        gap: 8px;
    }
    
    .urgency-bar {
        flex: 1;
        height: 8px;
        background: #1e293b;
        border-radius: 4px;
        overflow: hidden;
    }
    
    .urgency-fill {
        height: 100%;
        border-radius: 4px;
        transition: width 0.5s ease;
    }
    
    .urgency-fill.level-5 { background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%); }
    .urgency-fill.level-4 { background: linear-gradient(90deg, #f59e0b 0%, #ef4444 100%); }
    .urgency-fill.level-3 { background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%); }
    .urgency-fill.level-2 { background: linear-gradient(90deg, #22c55e 0%, #f59e0b 100%); }
    .urgency-fill.level-1 { background: linear-gradient(90deg, #22c55e 0%, #16a34a 100%); }
    
    .urgency-label {
        color: #f1f5f9;
        font-size: 18px;
        font-weight: 600;
        min-width: 45px;
    }
    
    /* Key Phrases */
    .phrases-container {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }
    
    .phrase-tag {
        padding: 8px 14px;
        border-radius: 8px;
        font-size: 13px;
        font-weight: 500;
    }
    
    .phrase-stroke {
        background: rgba(239, 68, 68, 0.1);
        color: #fca5a5;
        border: 1px solid rgba(239, 68, 68, 0.2);
    }
    
    .phrase-mimic {
        background: rgba(34, 197, 94, 0.1);
        color: #86efac;
        border: 1px solid rgba(34, 197, 94, 0.2);
    }
    
    /* Differential Diagnosis */
    .diff-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 0;
        border-bottom: 1px solid #1e293b;
    }
    
    .diff-item:last-child {
        border-bottom: none;
        padding-bottom: 0;
    }
    
    .diff-name {
        color: #e2e8f0;
        font-size: 14px;
    }
    
    .diff-likelihood {
        padding: 4px 10px;
        border-radius: 4px;
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
    }
    
    .diff-high {
        background: rgba(239, 68, 68, 0.15);
        color: #ef4444;
    }
    
    .diff-medium {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
    }
    
    .diff-low {
        background: rgba(34, 197, 94, 0.15);
        color: #22c55e;
    }
    
    /* Flags */
    .flag-item {
        display: flex;
        align-items: flex-start;
        gap: 12px;
        padding: 14px 16px;
        background: rgba(245, 158, 11, 0.05);
        border: 1px solid rgba(245, 158, 11, 0.15);
        border-radius: 10px;
        margin-bottom: 10px;
    }
    
    .flag-icon {
        color: #f59e0b;
        font-size: 16px;
        margin-top: 2px;
    }
    
    .flag-text {
        color: #fcd34d;
        font-size: 14px;
        line-height: 1.5;
    }
    
    /* Action Buttons */
    .action-btn {
        width: 100%;
        padding: 16px 24px;
        border-radius: 12px;
        font-size: 14px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        cursor: pointer;
        transition: all 0.2s ease;
        border: none;
        margin-bottom: 12px;
    }
    
    .action-primary {
        background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
        color: white;
        box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3);
    }
    
    .action-primary:hover {
        box-shadow: 0 6px 30px rgba(239, 68, 68, 0.4);
        transform: translateY(-1px);
    }
    
    .action-secondary {
        background: #1e293b;
        color: #94a3b8;
        border: 1px solid #334155;
    }
    
    .action-secondary:hover {
        background: #334155;
        color: #f1f5f9;
    }
    
    /* Note Display */
    .note-container {
        background: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 12px;
        padding: 20px;
        font-family: 'SF Mono', 'Fira Code', monospace;
        font-size: 13px;
        color: #94a3b8;
        line-height: 1.7;
        max-height: 400px;
        overflow-y: auto;
        white-space: pre-wrap;
    }
    
    /* Welcome Screen */
    .welcome-container {
        text-align: center;
        padding: 80px 40px;
    }
    
    .welcome-icon {
        width: 80px;
        height: 80px;
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        border-radius: 20px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-size: 40px;
        margin-bottom: 24px;
    }
    
    .welcome-title {
        color: #f8fafc;
        font-size: 32px;
        font-weight: 600;
        margin: 0 0 12px 0;
    }
    
    .welcome-subtitle {
        color: #64748b;
        font-size: 16px;
        margin: 0 0 48px 0;
    }
    
    .stats-grid {
        display: flex;
        justify-content: center;
        gap: 24px;
        flex-wrap: wrap;
    }
    
    .stat-card {
        background: #0f172a;
        border: 1px solid #1e293b;
        border-radius: 16px;
        padding: 24px 32px;
        min-width: 160px;
    }
    
    .stat-value {
        color: #3b82f6;
        font-size: 28px;
        font-weight: 700;
        margin: 0;
    }
    
    .stat-label {
        color: #64748b;
        font-size: 13px;
        margin: 8px 0 0 0;
    }
    
    /* Sidebar Styling */
    .sidebar-section {
        margin-bottom: 24px;
    }
    
    .sidebar-title {
        color: #64748b;
        font-size: 11px;
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-bottom: 12px;
        font-weight: 500;
    }
    
    /* Override Streamlit button styling */
    .stButton > button {
        background: #1e293b !important;
        color: #e2e8f0 !important;
        border: 1px solid #334155 !important;
        border-radius: 10px !important;
        padding: 10px 16px !important;
        font-weight: 500 !important;
        transition: all 0.2s ease !important;
    }
    
    .stButton > button:hover {
        background: #334155 !important;
        border-color: #475569 !important;
    }
    
    .stButton > button[kind="primary"] {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%) !important;
        border: none !important;
        color: white !important;
    }
    
    .stButton > button[kind="primary"]:hover {
        box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3) !important;
    }
    
    /* Text Input Styling */
    .stTextInput > div > div > input,
    .stTextArea > div > div > textarea {
        background: #0f172a !important;
        border: 1px solid #1e293b !important;
        color: #e2e8f0 !important;
        border-radius: 10px !important;
    }
    
    .stTextInput > div > div > input:focus,
    .stTextArea > div > div > textarea:focus {
        border-color: #3b82f6 !important;
        box-shadow: 0 0 0 1px #3b82f6 !important;
    }
    
    /* Expander */
    .streamlit-expanderHeader {
        background: #0f172a !important;
        border: 1px solid #1e293b !important;
        border-radius: 10px !important;
        color: #e2e8f0 !important;
    }
</style>
""", unsafe_allow_html=True)


def load_synthetic_notes():
    """Load synthetic ED notes from JSON file."""
    data_path = Path(__file__).parent / "data" / "synthetic_notes.json"
    if data_path.exists():
        with open(data_path, 'r') as f:
            data = json.load(f)
            return data.get('notes', [])
    return []


def get_analyzer():
    """Get the appropriate analyzer based on API key availability."""
    api_key = os.getenv("OPENAI_API_KEY", "") or st.session_state.get("api_key", "")
    
    if api_key:
        from nlp.analyzer import StrokeAnalyzer
        return StrokeAnalyzer(api_key=api_key)
    else:
        from nlp.analyzer import MockStrokeAnalyzer
        return MockStrokeAnalyzer()


def get_severity_class(probability):
    """Get CSS class based on probability."""
    if probability >= 70:
        return "critical"
    elif probability >= 40:
        return "warning"
    return "safe"


def render_header():
    """Render the main header."""
    st.markdown("""
    <div class="header-container">
        <div class="header-left">
            <div class="header-icon">⚕️</div>
            <div>
                <h1 class="header-title">StrokeSense AI</h1>
                <p class="header-subtitle">Clinical Decision Support System</p>
            </div>
        </div>
        <span class="header-badge">● ACTIVE</span>
    </div>
    """, unsafe_allow_html=True)


def render_patient_bar(note):
    """Render patient information bar."""
    category = note.get('category', 'unknown')
    status_class = "status-stroke" if category == "true_stroke" else "status-mimic"
    
    st.markdown(f"""
    <div class="patient-bar">
        <div class="patient-info">
            <div class="patient-field">
                <span class="patient-label">Case ID</span>
                <span class="patient-value">{note.get('id', 'Unknown').upper()}</span>
            </div>
            <div class="patient-field">
                <span class="patient-label">Ground Truth</span>
                <span class="patient-value">{note.get('diagnosis', 'Unknown')}</span>
            </div>
        </div>
        <span class="status-badge {status_class}">{category.replace('_', ' ')}</span>
    </div>
    """, unsafe_allow_html=True)


def render_probability_card(probability, classification):
    """Render main probability display."""
    severity = get_severity_class(probability)
    
    st.markdown(f"""
    <div class="prob-card {severity}">
        <p class="prob-label">Stroke Probability</p>
        <p class="prob-value {severity}">{probability}%</p>
        <span class="prob-classification {severity}">{classification} Risk</span>
    </div>
    """, unsafe_allow_html=True)


def render_tpa_card(tpa_assessment):
    """Render tPA eligibility card."""
    eligible = tpa_assessment.get('eligible', 'uncertain')
    lkw = tpa_assessment.get('time_from_lkw', 'Unknown')
    contras = tpa_assessment.get('contraindications_found', [])
    
    if eligible == True or eligible == "true":
        status_class = "tpa-eligible"
        icon = "✓"
        text = "Likely Eligible"
    elif eligible == False or eligible == "false":
        status_class = "tpa-contraindicated"
        icon = "✗"
        text = "Contraindicated"
    else:
        status_class = "tpa-uncertain"
        icon = "?"
        text = "Requires Verification"
    
    contras_html = ""
    if contras:
        for c in contras:
            contras_html += '<div style="color:#94a3b8; font-size:13px; margin-top:8px;">• ' + str(c) + '</div>'
    
    html = '<div class="info-card">'
    html += '<div class="info-card-header">'
    html += '<div class="info-card-icon tpa">💉</div>'
    html += '<span class="info-card-title">tPA Eligibility</span>'
    html += '</div>'
    html += '<div class="tpa-status ' + status_class + '">'
    html += '<span class="tpa-icon">' + icon + '</span>'
    html += '<span>' + text + '</span>'
    html += '</div>'
    html += contras_html
    html += '<div style="margin-top:12px; color:#64748b; font-size:12px;">LKW: ' + str(lkw) + '</div>'
    html += '</div>'
    
    st.markdown(html, unsafe_allow_html=True)


def render_urgency_card(score, rationale):
    """Render urgency score card."""
    width = score * 20
    
    st.markdown(f"""
    <div class="info-card">
        <div class="info-card-header">
            <div class="info-card-icon urgency">⚡</div>
            <span class="info-card-title">Urgency Level</span>
        </div>
        <div class="urgency-meter">
            <div class="urgency-bar">
                <div class="urgency-fill level-{score}" style="width: {width}%;"></div>
            </div>
            <span class="urgency-label">{score}/5</span>
        </div>
        <p style="color:#94a3b8; font-size:13px; margin-top:12px; line-height:1.5;">{rationale}</p>
    </div>
    """, unsafe_allow_html=True)


def render_key_phrases(stroke_indicators, mimic_indicators):
    """Render key phrases."""
    phrases_html = ""
    
    for indicator in stroke_indicators[:6]:
        phrases_html += f'<span class="phrase-tag phrase-stroke">{indicator}</span>'
    
    for indicator in mimic_indicators[:3]:
        phrases_html += f'<span class="phrase-tag phrase-mimic">{indicator}</span>'
    
    st.markdown(f"""
    <div class="info-card">
        <div class="info-card-header">
            <div class="info-card-icon" style="background: rgba(168, 85, 247, 0.15);">🔍</div>
            <span class="info-card-title">Key Clinical Findings</span>
        </div>
        <div class="phrases-container">
            {phrases_html if phrases_html else '<span style="color:#64748b;">No specific findings identified</span>'}
        </div>
    </div>
    """, unsafe_allow_html=True)


def render_impression(impression, lkw):
    """Render clinical impression."""
    st.markdown(f"""
    <div class="info-card">
        <div class="info-card-header">
            <div class="info-card-icon impression">📋</div>
            <span class="info-card-title">Clinical Impression</span>
        </div>
        <div class="info-card-value">{impression}</div>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown(f"""
    <div class="info-card">
        <div class="info-card-header">
            <div class="info-card-icon time">🕐</div>
            <span class="info-card-title">Last Known Well</span>
        </div>
        <div class="info-card-value" style="font-size:18px; font-weight:600;">{lkw}</div>
    </div>
    """, unsafe_allow_html=True)


def render_differential(differential):
    """Render differential diagnosis."""
    items_html = ""
    for dx in differential[:4]:
        diagnosis = dx.get('diagnosis', 'Unknown')
        likelihood = dx.get('likelihood', 'MEDIUM')
        diff_class = "diff-" + likelihood.lower()
        items_html += '<div class="diff-item">'
        items_html += '<span class="diff-name">' + str(diagnosis) + '</span>'
        items_html += '<span class="diff-likelihood ' + diff_class + '">' + str(likelihood) + '</span>'
        items_html += '</div>'
    
    html = '<div class="info-card">'
    html += '<div class="info-card-header">'
    html += '<div class="info-card-icon" style="background: rgba(99, 102, 241, 0.15);">📊</div>'
    html += '<span class="info-card-title">Differential Diagnosis</span>'
    html += '</div>'
    html += items_html
    html += '</div>'
    
    st.markdown(html, unsafe_allow_html=True)


def render_flags(flags):
    """Render warning flags."""
    if not flags:
        return
    
    flags_html = ""
    for flag in flags:
        clean_flag = flag.replace("⚠️", "").strip()
        flags_html += f'''
        <div class="flag-item">
            <span class="flag-icon">⚠</span>
            <span class="flag-text">{clean_flag}</span>
        </div>
        '''
    
    st.markdown(f"""
    <div class="info-card">
        <div class="info-card-header">
            <div class="info-card-icon" style="background: rgba(245, 158, 11, 0.15);">⚠️</div>
            <span class="info-card-title">Alerts & Warnings</span>
        </div>
        {flags_html}
    </div>
    """, unsafe_allow_html=True)


def render_welcome():
    """Render welcome screen."""
    st.markdown("""
    <div class="welcome-container">
        <div class="welcome-icon">⚕️</div>
        <h1 class="welcome-title">Welcome to StrokeSense AI</h1>
        <p class="welcome-subtitle">Select a case from the sidebar or paste an ED note to begin analysis</p>
        <div class="stats-grid">
            <div class="stat-card">
                <p class="stat-value">>95%</p>
                <p class="stat-label">Target Sensitivity</p>
            </div>
            <div class="stat-card">
                <p class="stat-value"><30s</p>
                <p class="stat-label">Analysis Time</p>
            </div>
            <div class="stat-card">
                <p class="stat-value">SHAP</p>
                <p class="stat-label">Explainability</p>
            </div>
        </div>
    </div>
    """, unsafe_allow_html=True)


def main():
    """Main application entry point."""
    
    # Initialize session state
    if 'analysis_result' not in st.session_state:
        st.session_state.analysis_result = None
    if 'selected_note' not in st.session_state:
        st.session_state.selected_note = None
    if 'api_key' not in st.session_state:
        st.session_state.api_key = ""
    
    # Sidebar
    with st.sidebar:
        st.markdown('<p class="sidebar-title">Configuration</p>', unsafe_allow_html=True)
        
        api_key = st.text_input(
            "OpenAI API Key",
            type="password",
            value=st.session_state.api_key,
            placeholder="sk-..."
        )
        if api_key:
            st.session_state.api_key = api_key
            st.success("API key configured")
        else:
            st.caption("Demo mode active")
        
        st.markdown("---")
        st.markdown('<p class="sidebar-title">Sample Cases</p>', unsafe_allow_html=True)
        
        notes = load_synthetic_notes()
        
        if notes:
            stroke_notes = [n for n in notes if n['category'] == 'true_stroke']
            mimic_notes = [n for n in notes if n['category'] == 'mimic']
            
            st.caption("TRUE STROKES")
            for note in stroke_notes[:5]:
                label = note['diagnosis'][:35] + "..." if len(note['diagnosis']) > 35 else note['diagnosis']
                if st.button(label, key=note['id'], use_container_width=True):
                    st.session_state.selected_note = note
                    st.session_state.analysis_result = None
            
            st.caption("MIMICS")
            for note in mimic_notes[:5]:
                label = note['diagnosis'][:35] + "..." if len(note['diagnosis']) > 35 else note['diagnosis']
                if st.button(label, key=note['id'], use_container_width=True):
                    st.session_state.selected_note = note
                    st.session_state.analysis_result = None
        
        st.markdown("---")
        st.markdown('<p class="sidebar-title">Custom Analysis</p>', unsafe_allow_html=True)
        
        custom_note = st.text_area(
            "ED Note",
            height=120,
            placeholder="Paste clinical note here..."
        )
        
        if st.button("Analyze Custom Note", use_container_width=True):
            if custom_note.strip():
                st.session_state.selected_note = {
                    'id': 'custom',
                    'category': 'unknown',
                    'diagnosis': 'Custom Analysis',
                    'note': custom_note
                }
                st.session_state.analysis_result = None
    
    # Main content
    render_header()
    
    if st.session_state.selected_note:
        note = st.session_state.selected_note
        render_patient_bar(note)
        
        # Analyze button
        if st.session_state.analysis_result is None:
            if st.button("Analyze Case", type="primary", use_container_width=True):
                with st.spinner("Analyzing clinical note..."):
                    analyzer = get_analyzer()
                    result = analyzer.analyze(note['note'])
                    st.session_state.analysis_result = result
                    st.experimental_rerun()
        
        # Results
        if st.session_state.analysis_result:
            result = st.session_state.analysis_result
            
            col1, col2, col3 = st.columns([1, 1, 1])
            
            with col1:
                render_probability_card(
                    result.get('stroke_probability', 50),
                    result.get('classification', 'MEDIUM')
                )
                render_tpa_card(result.get('tpa_assessment', {}))
                render_urgency_card(
                    result.get('urgency_score', 3),
                    result.get('urgency_rationale', '')
                )
            
            with col2:
                render_key_phrases(
                    result.get('stroke_indicators', []),
                    result.get('mimic_indicators', [])
                )
                render_flags(result.get('flags', []))
                render_differential(result.get('differential_diagnosis', []))
            
            with col3:
                render_impression(
                    result.get('primary_impression', 'Analysis pending'),
                    result.get('lkw_time', 'Not documented')
                )
                
                st.markdown("<br>", unsafe_allow_html=True)
                
                action = result.get('recommended_action', '')
                
                if action == "ACTIVATE_STROKE_ALERT":
                    if st.button("🚨 ACTIVATE STROKE ALERT", type="primary", use_container_width=True):
                        st.success("Stroke alert activated")
                        st.balloons()
                else:
                    if st.button("Activate Stroke Alert", use_container_width=True):
                        st.success("Stroke alert activated")
                        st.balloons()
                
                if st.button("Defer Case", use_container_width=True):
                    st.info("Case deferred for additional workup")
                
                if st.button("Re-analyze", use_container_width=True):
                    st.session_state.analysis_result = None
                    st.experimental_rerun()
            
            with st.expander("View Original Note"):
                st.markdown(f'<div class="note-container">{note["note"]}</div>', unsafe_allow_html=True)
    
    else:
        render_welcome()


if __name__ == "__main__":
    main()
