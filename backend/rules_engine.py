"""
Plain Python Deterministic Rules Engine for Claim Passport
Checks expiry dates, banned terms, terminology, and required disclaimers.
"""

from datetime import date
from typing import Dict, List, Any
import re

SYSTEM_CURRENT_DATE = date(2026, 10, 26)

def check_fact_staleness(expiry_date: date) -> bool:
    """Returns True if fact has expired as of current system date."""
    return expiry_date <= SYSTEM_CURRENT_DATE

def check_banned_terms(content: str) -> List[Dict[str, str]]:
    """Checks for banned absolute guarantees and uncalibrated claims."""
    banned_rules = [
        {"regex": r"(100%\s*safe|completely\s*safe)", "term": "100% safe", "rule": "GUIDE-001", "sev": "Critical"},
        {"regex": r"(zero\s*risk|100%\s*risk-free)", "term": "zero risk", "rule": "GUIDE-001", "sev": "Critical"},
        {"regex": r"(miracle\s*bottle|cure-all)", "term": "miracle", "rule": "GUIDE-004", "sev": "Medium"},
    ]
    detected = []
    for r in banned_rules:
        match = re.search(r["regex"], content, re.IGNORECASE)
        if match:
            detected.append({
                "flagged_text": match.group(0),
                "rule_id": r["rule"],
                "severity": r["sev"],
                "explanation": f"Violates brand guideline {r['rule']} prohibiting absolute claims."
            })
    return detected
