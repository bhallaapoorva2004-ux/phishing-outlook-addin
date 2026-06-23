/* global Office */

// ==========================
// SAME HEURISTICS AS app1.py's behavioral_analysis()
// ==========================

function localHeuristicScan(url) {
  const signals = [];

  if (url.length > 75) signals.push({ flag: true, text: "Very long URL" });
  if ((url.match(/\./g) || []).length > 3) signals.push({ flag: true, text: "Too many subdomains" });
  if (url.includes("@")) signals.push({ flag: true, text: "'@' symbol present" });
  if (url.startsWith("http://")) signals.push({ flag: true, text: "Not using HTTPS" });
  if (/login|verify|secure|bank|update/i.test(url)) signals.push({ flag: true, text: "Sensitive keyword in URL" });

  if (signals.length === 0) signals.push({ flag: false, text: "No obvious red flags" });
  return signals;
}

function verdictFromSignals(signals) {
  const flagCount = signals.filter(s => s.flag).length;
  if (flagCount === 0) return { level: "safe", label: "Looks OK" };
  if (flagCount <= 2) return { level: "warn", label: "Worth a closer look" };
  return { level: "danger", label: "High-risk signals" };
}

function extractUrls(text) {
  const matches = text.match(/https?:\/\/[^\s"'<>)]+/gi) || [];
  // De-duplicate while preserving order
  return [...new Set(matches)];
}

// ==========================
// DOM REFS
// ==========================

const streamlitUrlInput = document.getElementById("streamlitUrl");
const saveUrlBtn = document.getElementById("saveUrlBtn");
const configStatus = document.getElementById("configStatus");
const scanBtn = document.getElementById("scanBtn");
const results = document.getElementById("results");
const emptyState = document.getElementById("emptyState");
const statusMark = document.getElementById("statusMark");

const STORAGE_KEY = "phishingChecker.streamlitUrl";

// ==========================
// OFFICE INIT
// ==========================

Office.onReady(() => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) streamlitUrlInput.value = saved;
});

saveUrlBtn.addEventListener("click", () => {
  let value = streamlitUrlInput.value.trim();
  if (!value) {
    configStatus.style.color = "#ff5c5c";
    configStatus.textContent = "Please enter a URL.";
    return;
  }
  if (!/^https?:\/\//i.test(value)) value = "https://" + value;
  localStorage.setItem(STORAGE_KEY, value);
  streamlitUrlInput.value = value;
  configStatus.style.color = "#34d399";
  configStatus.textContent = "Saved.";
});

// ==========================
// SCAN THE OPEN EMAIL
// ==========================

scanBtn.addEventListener("click", () => {
  scanBtn.disabled = true;
  scanBtn.textContent = "Scanning…";

  Office.context.mailbox.item.body.getAsync(Office.CoercionType.Text, (result) => {
    scanBtn.disabled = false;
    scanBtn.textContent = "Scan links in this email";

    if (result.status !== Office.AsyncResultStatus.Succeeded) {
      results.innerHTML = `<p class="empty">Couldn't read this email's body. Try again.</p>`;
      return;
    }

    const urls = extractUrls(result.value);
    renderResults(urls);
  });
});

function renderResults(urls) {
  results.innerHTML = "";

  if (urls.length === 0) {
    results.innerHTML = `<p class="empty">No links found in this email.</p>`;
    statusMark.className = "brand__mark";
    return;
  }

  let worstLevel = "safe";

  urls.forEach((url) => {
    const signals = localHeuristicScan(url);
    const verdict = verdictFromSignals(signals);

    if (verdict.level === "danger") worstLevel = "danger";
    else if (verdict.level === "warn" && worstLevel !== "danger") worstLevel = "warn";

    const card = document.createElement("div");
    card.className = "link-card";

    const urlEl = document.createElement("div");
    urlEl.className = "link-card__url";
    urlEl.textContent = url;
    card.appendChild(urlEl);

    const verdictEl = document.createElement("div");
    verdictEl.className = "link-card__verdict " + verdict.level;
    verdictEl.textContent = verdict.label;
    card.appendChild(verdictEl);

    const signalsEl = document.createElement("ul");
    signalsEl.className = "link-card__signals";
    signals.forEach((s) => {
      const li = document.createElement("li");
      li.className = s.flag ? "flag" : "";
      li.textContent = (s.flag ? "⚠ " : "✓ ") + s.text;
      signalsEl.appendChild(li);
    });
    card.appendChild(signalsEl);

    const scanLinkBtn = document.createElement("button");
    scanLinkBtn.className = "link-card__scan";
    scanLinkBtn.textContent = "Run full AI scan";
    scanLinkBtn.addEventListener("click", () => {
      const streamlitUrl = localStorage.getItem(STORAGE_KEY);
      if (!streamlitUrl) {
        configStatus.style.color = "#ff5c5c";
        configStatus.textContent = "Set your Streamlit app URL above first.";
        return;
      }
      const target = `${streamlitUrl.replace(/\/$/, "")}/?url=${encodeURIComponent(url)}`;
      // Outlook task panes run in a sandboxed webview; open the result in
      // the user's real browser via Office.context.ui.openBrowserWindow when
      // available, otherwise fall back to window.open.
      if (Office.context.ui && Office.context.ui.openBrowserWindow) {
        Office.context.ui.openBrowserWindow(target);
      } else {
        window.open(target, "_blank");
      }
    });
    card.appendChild(scanLinkBtn);

    results.appendChild(card);
  });

  statusMark.className = "brand__mark " + worstLevel;
}
