# Phishing Detection — Streamlit App + Chrome Extension

This package has two parts that work together:

```
project/
├── streamlit-app/        ← your existing ML app (modified to accept the extension's data)
│   ├── app1.py
│   ├── phishing_detector.pkl
│   ├── pca.pkl
│   ├── scaler.pkl
│   ├── requirements.txt
│   └── sample_dataset.csv
│
├── browser-extension/      ← the Chrome extension (Manifest V3)
│   ├── manifest.json
│   ├── popup.html / popup.css / popup.js
│   ├── options.html / options.js
│   └── icons/
│
└── outlook-addin/          ← the Outlook add-in (sideloadable, requires HTTPS hosting)
    ├── manifest.xml
    ├── taskpane.html / taskpane.css / taskpane.js
    ├── commands.html / commands.js
    ├── icons/
    └── README.md            ← setup steps specific to the Outlook add-in
```

## How it works

1. The **Streamlit app** is deployed publicly (e.g. on Streamlit Community Cloud)
   so it has a real web address, like `https://your-app.streamlit.app`.
2. `app1.py` was modified to read a `url` query parameter
   (`https://your-app.streamlit.app/?url=https://example.com`) and
   automatically run the prediction — this is what lets the extension hand it
   a URL without the user typing it in manually.
3. The **browser extension** reads the URL of whatever tab is active, runs an
   instant local heuristic check, and — when you click "Run full AI scan" —
   opens your Streamlit app in a new tab with that URL pre-filled, so the
   real ML model gives its verdict.

See the full chat response for step-by-step setup, deployment, and Chrome
Web Store publishing instructions.
