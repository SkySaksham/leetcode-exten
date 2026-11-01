(() => {
  const KEYS = { enabled: "enabled", pattern: "pattern", palette: "palette" };
  const defaults = {
    enabled: false,
    pattern: globalThis.HeatmapPattern.generatePattern(),
    palette: globalThis.HeatmapPattern.palette
  };

  async function getSettings() {
    const stored = await chrome.storage.local.get(KEYS);
    const result = {
      enabled: typeof stored.enabled === "boolean" ? stored.enabled : defaults.enabled,
      pattern: globalThis.HeatmapPattern.isValidPattern(stored.pattern) ? stored.pattern : defaults.pattern,
      palette: stored.palette && typeof stored.palette === "object" ? stored.palette : defaults.palette
    };
    if (typeof stored.enabled !== "boolean" || !globalThis.HeatmapPattern.isValidPattern(stored.pattern) || !stored.palette) {
      await chrome.storage.local.set(result);
    }
    return result;
  }

  async function saveSettings(settings) {
    const validated = {};
    if (typeof settings.enabled === "boolean") validated.enabled = settings.enabled;
    if (globalThis.HeatmapPattern.isValidPattern(settings.pattern)) validated.pattern = settings.pattern;
    if (settings.palette && typeof settings.palette === "object") validated.palette = settings.palette;
    await chrome.storage.local.set(validated);
    return getSettings();
  }

  globalThis.HeatmapStorage = { getSettings, saveSettings };
})();
