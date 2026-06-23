// ==========================
// HEURISTIC SIGNALS (mirrors behavioral_analysis() in app1.py)
// This gives the user an INSTANT local read while the full ML
// verdict (from the Streamlit model) is only a click away.
// ==========================

function localHeuristicScan(url) {
  const signals = [];

  if (url.length > 75) {
    signals.push({ flag: true, text: "Very long URL" });
  }
  if ((url.match(/\./g) || []).length > 3) {
    signals.push({ flag: true, text: "Too many subdomains" });
  }
  if (url.includes("@")) {
    signals.push({ flag: true, text: "'@' symbol present (common phishing trick)" });
  }
  if (url.startsWith("http://")) {
    signals.push({ flag: true, text: "Not using HTTPS" });
  }
  if (/login|verify|secure|bank|update/i.test(url)) {
    signals.push({ flag: true, text: "Sensitive keyword in URL" });
  }

  if (signals.length === 0) {
    signals.push({ flag: false, text: "No obvious red flags found" });
  }

  return signals;
}

function verdictFromSignals(signals) {
  const flagCount = signals.filter(s => s.flag).length;
  if (flagCount === 0) return { level: "safe", label: "Looks OK" };
  if (flagCount <= 2) return { level: "warn", label: "Worth a closer look" };
  return { level: "danger", label: "High-risk signals" };
}

// ==========================
// DOM REFS
// ==========================

const currentUrlEl = document.getElementById("currentUrl");
const statusMark = document.getElementById("statusMark");
const quickVerdictValue = document.getElementById("quickVerdictValue");
const signalsList = document.getElementById("signalsList");
const fullScanBtn = document.getElementById("fullScanBtn");
const configHint = document.getElementById("configHint");
const settingsBtn = document.getElementById("settingsBtn");
const scanLine = document.getElementById("scanLine");

let activeTabUrl = "";

// ==========================
// INIT
// ==========================

document.addEventListener("DOMContentLoaded", async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  activeTabUrl = tab?.url || "";

  currentUrlEl.textContent = activeTabUrl || "No active tab URL";

  // Skip scanning internal browser pages (chrome://, about:, etc.)
  const isScannable = /^https?:\/\//i.test(activeTabUrl);

  if (!isScannable) {
    scanLine.style.display = "none";
    quickVerdictValue.textContent = "Not applicable";
    signalsList.innerHTML = "<li>This page can't be scanned (not a website).</li>";
    fullScanBtn.disabled = true;
    return;
  }

  // Small delay so the scan animation feels purposeful, not instant/fake
  setTimeout(() => {
    const signals = localHeuristicScan(activeTabUrl);
    const verdict = verdictFromSignals(signals);

    statusMark.className = "brand__mark " + verdict.level;
    quickVerdictValue.textContent = verdict.label;
    quickVerdictValue.className = "verdict__value " + verdict.level;

    signalsList.innerHTML = "";
    signals.forEach(s => {
      const li = document.createElement("li");
      li.textContent = (s.flag ? "⚠ " : "✓ ") + s.text;
      li.className = s.flag ? "flag" : "ok";
      signalsList.appendChild(li);
    });

    scanLine.style.animationPlayState = "paused";
    scanLine.style.opacity = "0.25";
  }, 700);

  await checkConfig();
});

// ==========================
// CONFIG (the user's deployed Streamlit app URL)
// ==========================

async function checkConfig() {
  const { streamlitUrl } = await chrome.storage.sync.get("streamlitUrl");
  if (!streamlitUrl) {
    configHint.textContent = "Set your Streamlit app URL in settings (⚙) first.";
  } else {
    configHint.textContent = "";
  }
}

// ==========================
// ACTIONS
// ==========================

fullScanBtn.addEventListener("click", async () => {
  const { streamlitUrl } = await chrome.storage.sync.get("streamlitUrl");

  if (!streamlitUrl) {
    chrome.runtime.openOptionsPage();
    return;
  }

  const target = `${streamlitUrl.replace(/\/$/, "")}/?url=${encodeURIComponent(activeTabUrl)}`;
  chrome.tabs.create({ url: target });
});

settingsBtn.addEventListener("click", () => {
  chrome.runtime.openOptionsPage();
});
