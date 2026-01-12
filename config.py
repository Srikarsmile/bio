"""
StrokeSense AI Configuration
"""
import os
from dotenv import load_dotenv

load_dotenv()

# API Configuration
OPENAI_API_KEY = os.getenv("OPENAI_API_KEY", "")
MODEL_NAME = "gpt-4o"  # Best for clinical analysis

# Classification Thresholds
HIGH_PROBABILITY_THRESHOLD = 80
MEDIUM_PROBABILITY_THRESHOLD = 50

# tPA Time Window (in hours)
TPA_TIME_WINDOW_HOURS = 4.5

# Urgency Score Criteria
URGENCY_CRITERIA = {
    5: "Immediate activation - classic stroke presentation within treatment window",
    4: "High urgency - strong stroke indicators, verify eligibility",
    3: "Moderate urgency - mixed presentation, needs further evaluation",
    2: "Low urgency - mimic features present, stroke less likely",
    1: "Minimal urgency - classic mimic presentation"
}

# Known tPA Contraindications
TPA_CONTRAINDICATIONS = [
    "active internal bleeding",
    "recent intracranial surgery",
    "recent head trauma",
    "intracranial hemorrhage",
    "subarachnoid hemorrhage",
    "uncontrolled hypertension",
    "blood glucose <50",
    "platelet count <100000",
    "INR >1.7",
    "current anticoagulation",
    "warfarin use",
    "heparin use",
    "recent major surgery",
    "arterial puncture at non-compressible site",
    "seizure at onset with postictal state",
    "previous stroke within 3 months",
    "previous intracranial hemorrhage",
    "brain tumor",
    "arteriovenous malformation",
    "aneurysm",
    "bleeding diathesis"
]
