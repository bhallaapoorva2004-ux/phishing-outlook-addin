import streamlit as st
import joblib
import pandas as pd
from urllib.parse import urlparse
import re

# ==========================
# PAGE CONFIG
# ==========================

st.set_page_config(page_title="Phishing Detection System", page_icon="🛡️", layout="centered")

# ==========================
# LOAD MODELS
# ==========================

model = joblib.load("phishing_detector.pkl")
pca = joblib.load("pca.pkl")
scaler = joblib.load("scaler.pkl")

st.title("🛡️ Phishing Detection System with Behavioral Analysis")

# ==========================
# FEATURE ENGINEERING
# ==========================

def extract_features(url):

    parsed = urlparse(url)

    return [
        len(url),                              # URL length
        url.count("."),                        # subdomains
        url.count("/"),                        # slashes
        url.count("-"),                        # hyphen
        len(parsed.netloc),                    # domain length
        len(re.findall(r'[?&=%@]', url)),     # special chars
        1 if parsed.scheme == "https" else 0  # HTTPS
    ]

# ==========================
# BEHAVIORAL ANALYSIS FUNCTION
# ==========================

def behavioral_analysis(url):

    analysis = []

    if len(url) > 75:
        analysis.append("⚠️ Very Long URL (Suspicious)")

    if url.count(".") > 3:
        analysis.append("⚠️ Too Many Subdomains")

    if "@" in url:
        analysis.append("⚠️ '@' symbol used (Phishing technique)")

    if "http://" in url:
        analysis.append("⚠️ Non-secure HTTP detected")

    if re.search(r'login|verify|secure|bank|update', url.lower()):
        analysis.append("⚠️ Sensitive keyword detected")

    if len(analysis) == 0:
        analysis.append("✅ No major suspicious behavior detected")

    return analysis

# ==========================
# CORE: RUN A PREDICTION AND RENDER RESULTS
# ==========================

def run_prediction(url):

    # Feature extraction
    features = extract_features(url)

    sample = pd.DataFrame([features], columns=[
        "URLLength",
        "DotCount",
        "SlashCount",
        "HyphenCount",
        "DomainLength",
        "SpecialCharCount",
        "HTTPS"
    ])

    # Scaling + PCA
    sample_scaled = scaler.transform(sample)
    sample_pca = pca.transform(sample_scaled)

    # Prediction
    prediction = model.predict(sample_pca)[0]
    risk_score = model.predict_proba(sample_pca)[0][1]

    # ==========================
    # RESULTS
    # ==========================

    st.subheader("📊 Prediction Result")

    st.write("URL:", url)
    st.write("Risk Score:", round(risk_score * 100, 2), "%")

    if prediction == 1:
        st.error("🚨 PHISHING URL DETECTED")
        action = "BLOCK"
    else:
        st.success("✅ LEGITIMATE URL")
        action = "ALLOW"

    st.write("Recommended Action:", action)

    # ==========================
    # BEHAVIOURAL ANALYSIS
    # ==========================

    st.subheader("🧠 Behavioral Analysis")

    results = behavioral_analysis(url)

    for r in results:
        st.write(r)

    # ==========================
    # FEATURE VIEW
    # ==========================

    st.subheader("📌 Extracted Features")
    st.dataframe(sample.T)

    # ==========================
    # INPUT URL SHOW
    # ==========================

    st.subheader("🌐 Input URL")
    st.code(url)

# ==========================
# READ QUERY PARAMETER (sent by the browser extension)
# ==========================
# When the extension opens this app it appends ?url=<the current tab's address>
# Example: https://your-app.streamlit.app/?url=https://example.com
# This lets the app auto-fill and auto-run without the user typing anything.

query_params = st.query_params
url_from_extension = query_params.get("url", "")

# st.query_params.get can return a string or a list depending on Streamlit version
if isinstance(url_from_extension, list):
    url_from_extension = url_from_extension[0] if url_from_extension else ""

# ==========================
# INPUT
# ==========================

url = st.text_input("🔗 Enter URL to Analyze", value=url_from_extension)

auto_triggered = bool(url_from_extension) and "checked" not in st.session_state

if auto_triggered:
    st.session_state["checked"] = True

# ==========================
# PREDICTION
# ==========================

if st.button("Predict") or auto_triggered:

    if url == "":
        st.warning("Please enter a URL")
    else:
        run_prediction(url)
