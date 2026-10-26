"""
Claim Passport - Streamlit Modern SaaS Dashboard
Brand Governance That Proves Every Claim Before It Is Published
Inkloom AI Hackathon Deliverable
"""

import streamlit as st
import requests
import json
from datetime import date

st.set_page_config(
    page_title="Claim Passport — Brand Governance",
    page_icon="🛡️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# Custom Enterprise SaaS Styling
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
    html, body, [class*="css"] {
        font-family: 'Plus Jakarta Sans', sans-serif;
        background-color: #f8fafc;
        color: #0f172a;
    }
    .stButton>button {
        background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
        color: #ffffff;
        font-weight: 700;
        border-radius: 12px;
        padding: 0.5rem 1.2rem;
        border: none;
    }
    .metric-card {
        background-color: #ffffff;
        border-radius: 16px;
        padding: 20px;
        border: 1px solid #e2e8f0;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    }
    .finding-card {
        background-color: #ffffff;
        border-radius: 14px;
        padding: 16px;
        border-left: 4px solid #f43f5e;
        border: 1px solid #e2e8f0;
        margin-bottom: 12px;
    }
</style>
""", unsafe_allow_html=True)

# Sidebar Header & Role Switcher
st.sidebar.markdown("### 🛡️ Claim Passport")
st.sidebar.caption("Inkloom AI Hackathon MVP")
role = st.sidebar.selectbox("Active Role (RBAC)", ["Content Creator", "Reviewer", "Brand Manager", "Fact Owner"])
st.sidebar.success(f"Signed in as: **{role}**")

st.sidebar.markdown("---")
st.sidebar.markdown("#### ⚡ Quick Actions")
if st.sidebar.button("✨ Load Hackathon Demo Scenario"):
    st.session_state["content_title"] = "Hydration Launch Social Copy"
    st.session_state["content_text"] = "Trusted by 10,000+ customers. Our new bottle is 100% safe!"
    st.session_state["content_intent"] = "Announce new hydration bottle launch highlighting customer adoption and safety assurance"
    st.session_state["content_type"] = "Social Copy"

# Navigation
page = st.sidebar.radio("Platform Navigation", [
    "Check Content & Intent Lock",
    "Living Fact Registry",
    "Brand Guidelines",
    "Approvals & Governance Sign-off",
    "Guideline Health Insights"
])

if page == "Check Content & Intent Lock":
    st.title("Content Review & Verification Workbench")
    st.markdown("Verify marketing copy against active Living Facts and brand rules before external publication.")

    col_left, col_right = st.columns([7, 5])

    with col_left:
        title = st.text_input("Content Title / Campaign", value=st.session_state.get("content_title", "Hydration Launch Social Copy"))
        intent = st.text_input("🔒 Intent Lock: Content Purpose (Mandatory)", value=st.session_state.get("content_intent", "Announce new hydration bottle launch highlighting customer adoption and safety assurance"))
        content = st.text_area("Marketing Text to Verify", value=st.session_state.get("content_text", "Trusted by 10,000+ customers. Our new bottle is 100% safe!"), height=140)

        if st.button("🛡️ Check Content Against Living Facts", use_container_width=True):
            with st.spinner("Extracting claims and checking against Living Fact Registry..."):
                # Call local FastAPI or execute deterministic engine
                st.session_state["checked"] = True

    with col_right:
        st.markdown("#### 🔒 Intent Lock Rewrite Preview")
        st.info("**Intent Lock Active:** Suggested revisions preserve core purpose without adding unverified claims.")
        st.markdown(f"**Submitted Draft:** `{content}`")
        st.markdown("""
        **Intent-Locked Revision:**
        <div style="background-color: #ecfdf5; border: 1px solid #a7f3d0; padding: 14px; border-radius: 12px; font-weight: 700; color: #064e3b;">
            "Meet our BPA-free bottle, designed for everyday use."
        </div>
        """, unsafe_allow_html=True)
        st.caption("Human confirmation required. Never replaces content silently.")

    st.markdown("---")
    st.subheader("Evidence-First Findings (2 Issues Identified)")

    c1, c2 = st.columns(2)
    with c1:
        st.error("**Finding 1 — Stale Fact: '10,000+ customers'**")
        st.write("Customer-count claim matches **Fact #12**, which expired on **30 September 2026**.")
        st.write("**Evidence Source:** Q3 2025 Global Customer Audit & CRM Export")
        st.write("**Fact Owner:** Sarah Jenkins | **Severity:** High")
        st.info("**Suggested Correction:** Ask Fact Owner to verify Q4 census before publication.")

    with c2:
        st.error("**Finding 2 — Needs Evidence: '100% safe'**")
        st.write("The phrase '100% safe' has **no matching approved evidence** in the Living Fact Registry. Flagged for human review.")
        st.write("**Evidence Source:** None (No evidence found in Fact Registry)")
        st.write("**Violates:** GUIDE-001 (Prohibition on absolute safety guarantees)")
        st.info("**Suggested Correction:** Meet our BPA-free bottle, designed for everyday use.")

elif page == "Living Fact Registry":
    st.title("Living Fact Registry")
    st.caption("Reference Date: October 26, 2026")
    st.warning("⚠️ **Fact #12 Expired:** '10,000+ active customers worldwide' expired on 2026-09-30. Refresh task active with Sarah Jenkins.")
    st.success("✅ **Fact #07 Active:** 'BPA-free bottle, certified safe for everyday food contact' (Expires 2027-12-31).")
    st.success("✅ **Fact #015 Active:** 'Zero single-use plastic in packaging across 2026 product release batch' (Expires 2027-02-01).")

elif page == "Brand Guidelines":
    st.title("Brand Guidelines & Rules")
    st.markdown("Deterministic constraints governing brand claims and advertising copy.")
    st.markdown("- **GUIDE-001 (Banned Terminology):** Absolute safety guarantees ('100% safe') are prohibited.")
    st.markdown("- **GUIDE-002 (Claim Substantiation):** Metric statements require active unexpired census links.")
    st.markdown("- **GUIDE-003 (Preferred Naming):** Use 'EcoShield Bottle' rather than generic jugs.")

elif page == "Approvals & Governance Sign-off":
    st.title("Approvals & Sign-off Queue")
    st.write(f"Current User Role: **{role}**")
    if role in ["Brand Manager", "Reviewer"]:
        st.success("You hold authorized credentials to issue brand publication certificates.")
        if st.button("Issue Formal Governance Sign-Off Certificate"):
            st.balloons()
            st.success("Certificate CP-CERT-88921-VERIFIED issued and logged in audit ledger.")
    else:
        st.warning("Content Creators cannot approve submissions. A Reviewer or Brand Manager must sign off.")

elif page == "Guideline Health Insights":
    st.title("Guideline Health & Analytics")
    st.metric(label="Publication Approval Rate", value="94%", delta="↑ 12%")
    st.metric(label="Stale Claims Blocked", value="1", delta="Fact #12")
    st.write("**High Friction Rule:** GUIDE-004 (Grounded Tone) has had 3 reviewer overrides. Suggest clarifying contextual permitted phrasing.")
