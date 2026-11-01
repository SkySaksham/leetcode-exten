(() => {
  const KEYS = { enabled: "enabled", hoverDisabled: "hoverDisabled", pattern: "pattern", olderPattern: "olderPattern", palette: "palette" };
  const defaults = {
    enabled: false,
    hoverDisabled: false,
    pattern: globalThis.HeatmapPattern.generatePattern(),
    olderPattern: globalThis.HeatmapPattern.generateOlderPattern(),
    palette: globalThis.HeatmapPattern.palette
  };

  async function getSettings() {
    const stored = await chrome.storage.local.get(KEYS);
    const result = {
      enabled: typeof stored.enabled === "boolean" ? stored.enabled : defaults.enabled,
      hoverDisabled: typeof stored.hoverDisabled === "boolean" ? stored.hoverDisabled : defaults.hoverDisabled,
      pattern: globalThis.HeatmapPattern.isValidPattern(stored.pattern) ? stored.pattern : defaults.pattern,
      olderPattern: globalThis.HeatmapPattern.isValidOlderPattern(stored.olderPattern) ? stored.olderPattern : defaults.olderPattern,
      palette: stored.palette && typeof stored.palette === "object" ? stored.palette : defaults.palette
    };
    if (typeof stored.enabled !== "boolean" || typeof stored.hoverDisabled !== "boolean" || !globalThis.HeatmapPattern.isValidPattern(stored.pattern) || !globalThis.HeatmapPattern.isValidOlderPattern(stored.olderPattern) || !stored.palette) {
      await chrome.storage.local.set(result);
    }
    return result;
  }

  async function saveSettings(settings) {
    const validated = {};
    if (typeof settings.enabled === "boolean") validated.enabled = settings.enabled;
    if (typeof settings.hoverDisabled === "boolean") validated.hoverDisabled = settings.hoverDisabled;
    if (globalThis.HeatmapPattern.isValidPattern(settings.pattern)) validated.pattern = settings.pattern;
    if (globalThis.HeatmapPattern.isValidOlderPattern(settings.olderPattern)) validated.olderPattern = settings.olderPattern;
    if (settings.palette && typeof settings.palette === "object") validated.palette = settings.palette;
    await chrome.storage.local.set(validated);
    return getSettings();
  }

  globalThis.HeatmapStorage = { getSettings, saveSettings };
})();
