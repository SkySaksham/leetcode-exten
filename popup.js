(() => {
  const enabledInput = document.getElementById("enabled");
  const hoverDisabledInput = document.getElementById("hover-disabled");
  const hoverStatus = document.getElementById("hover-status");
  const statsEnabledInput = document.getElementById("stats-enabled");
  const statsStatus = document.getElementById("stats-status");
  const activeDaysInput = document.getElementById("active-days");
  const maxStreakInput = document.getElementById("max-streak");
  const datesShiftedInput = document.getElementById("dates-shifted");
  const datesStatus = document.getElementById("dates-status");
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
    hoverDisabledInput.checked = settings.hoverDisabled;
    statsEnabledInput.checked = settings.statsEnabled;
    statsStatus.textContent = settings.statsEnabled ? "On · values shown on profile" : "Off · LeetCode values shown";
    statsStatus.classList.toggle("on", settings.statsEnabled);
    activeDaysInput.value = settings.totalActiveDays;
    maxStreakInput.value = settings.maxStreak;
    activeDaysInput.disabled = !settings.statsEnabled;
    maxStreakInput.disabled = !settings.statsEnabled;
    datesShiftedInput.checked = settings.questionDatesShifted;
    datesStatus.textContent = settings.questionDatesShifted ? "On · dates moved back one day" : "Off · original dates shown";
    datesStatus.classList.toggle("on", settings.questionDatesShifted);
    hoverStatus.textContent = settings.hoverDisabled ? "Off · hover effects disabled" : "On · hover effects active";
    hoverStatus.classList.toggle("on", settings.hoverDisabled);
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
  hoverDisabledInput.addEventListener("change", () => setState({ hoverDisabled: hoverDisabledInput.checked }, hoverDisabledInput.checked ? "Heatmap hover disabled" : "Heatmap hover enabled"));
  statsEnabledInput.addEventListener("change", () => setState({ statsEnabled: statsEnabledInput.checked }, statsEnabledInput.checked ? "Custom profile stats enabled" : "Custom profile stats disabled"));
  datesShiftedInput.addEventListener("change", () => setState({ questionDatesShifted: datesShiftedInput.checked }, datesShiftedInput.checked ? "Question dates shifted back" : "Original question dates restored"));
  async function saveNumber(input, key, label) {
    const value = Number(input.value);
    if (!Number.isSafeInteger(value) || value < 0) {
      message(`${label} must be a whole number of 0 or more`, true);
      render();
      return;
    }
    await setState({ [key]: value }, `${label} saved`);
  }
  activeDaysInput.addEventListener("change", () => saveNumber(activeDaysInput, "totalActiveDays", "Total active days"));
  maxStreakInput.addEventListener("change", () => saveNumber(maxStreakInput, "maxStreak", "Max streak"));
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
