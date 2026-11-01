(() => {
  const enabledInput = document.getElementById("enabled");
  const status = document.getElementById("status");
  const preview = document.getElementById("preview");
  const olderPreview = document.getElementById("older-preview");
  const notice = document.getElementById("notice");
  const regenerate = document.getElementById("regenerate");
  const restore = document.getElementById("restore");
  let settings;

  function message(text, isError = false) {
    notice.textContent = text;
    notice.classList.toggle("error", isError);
  }

  function drawPreview(pattern) {
    preview.replaceChildren(...pattern.map(color => {
      const cell = document.createElement("span");
      cell.className = "preview-cell";
      cell.style.backgroundColor = color;
      return cell;
    }));
  }

  function drawOlderPreview(pattern) {
    olderPreview.replaceChildren(...pattern.map(highlighted => {
      const cell = document.createElement("span");
      cell.className = `preview-cell${highlighted ? "" : " unchanged"}`;
      if (highlighted) cell.style.backgroundColor = globalThis.HeatmapPattern.palette.level1;
      return cell;
    }));
  }

  function render() {
    enabledInput.checked = settings.enabled;
    status.textContent = settings.enabled ? "On · pattern active" : "Off · original colors";
    status.classList.toggle("on", settings.enabled);
    drawPreview(settings.pattern);
    drawOlderPreview(settings.olderPattern);
  }

  async function notifyTab(type = "HEATMAP_SYNC") {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url?.startsWith("https://leetcode.com/")) return;
    try { await chrome.tabs.sendMessage(tab.id, { type }); }
    catch (error) { console.debug("No active LeetCode content script to notify", error); }
  }

  async function setState(changes, statusMessage) {
    try {
      settings = await globalThis.HeatmapStorage.saveSettings({ ...settings, ...changes });
      render();
      await notifyTab();
      message(statusMessage);
    } catch (error) {
      message(`Couldn't save settings: ${error.message || error}`, true);
    }
  }

  enabledInput.addEventListener("change", () => setState({ enabled: enabledInput.checked }, enabledInput.checked ? "Customization enabled" : "Original colors restored"));
  regenerate.addEventListener("click", async () => {
    const pattern = globalThis.HeatmapPattern.generatePattern();
    const olderPattern = globalThis.HeatmapPattern.generateOlderPattern();
    await setState({ pattern, olderPattern }, "New patterns saved");
  });
  restore.addEventListener("click", async () => {
    await setState({ enabled: false }, "Original colors restored");
    await notifyTab("HEATMAP_RESTORE");
  });

  globalThis.HeatmapStorage.getSettings().then(value => { settings = value; render(); }).catch(error => message(`Couldn't load settings: ${error.message || error}`, true));
})();
