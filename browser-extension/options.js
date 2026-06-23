const input = document.getElementById("streamlitUrl");
const saveBtn = document.getElementById("saveBtn");
const status = document.getElementById("status");

document.addEventListener("DOMContentLoaded", async () => {
  const { streamlitUrl } = await chrome.storage.sync.get("streamlitUrl");
  if (streamlitUrl) input.value = streamlitUrl;
});

saveBtn.addEventListener("click", async () => {
  let value = input.value.trim();

  if (!value) {
    status.style.color = "#ff5c5c";
    status.textContent = "Please enter a URL.";
    return;
  }

  if (!/^https?:\/\//i.test(value)) {
    value = "https://" + value;
  }

  await chrome.storage.sync.set({ streamlitUrl: value });
  status.style.color = "#34d399";
  status.textContent = "Saved.";
});
