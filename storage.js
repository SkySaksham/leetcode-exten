(() => {
  const KEYS = { enabled: "enabled", hoverDisabled: "hoverDisabled", statsEnabled: "statsEnabled", totalActiveDays: "totalActiveDays", maxStreak: "maxStreak", questionDatesShifted: "questionDatesShifted", pattern: "pattern", olderPattern: "olderPattern", palette: "palette" };
  const defaults = {
    enabled: false,
    hoverDisabled: false,
    statsEnabled: false,
    totalActiveDays: 10,
    maxStreak: 30,
    questionDatesShifted: false,
    pattern: globalThis.HeatmapPattern.generatePattern(),
    olderPattern: globalThis.HeatmapPattern.generateOlderPattern(),
    palette: globalThis.HeatmapPattern.palette
  };

  async function getSettings() {
    const stored = await chrome.storage.local.get(KEYS);
    const result = {
      enabled: typeof stored.enabled === "boolean" ? stored.enabled : defaults.enabled,
      hoverDisabled: typeof stored.hoverDisabled === "boolean" ? stored.hoverDisabled : defaults.hoverDisabled,
      statsEnabled: typeof stored.statsEnabled === "boolean" ? stored.statsEnabled : defaults.statsEnabled,
      totalActiveDays: Number.isSafeInteger(stored.totalActiveDays) && stored.totalActiveDays >= 0 ? stored.totalActiveDays : defaults.totalActiveDays,
      maxStreak: Number.isSafeInteger(stored.maxStreak) && stored.maxStreak >= 0 ? stored.maxStreak : defaults.maxStreak,
      questionDatesShifted: typeof stored.questionDatesShifted === "boolean" ? stored.questionDatesShifted : defaults.questionDatesShifted,
      pattern: globalThis.HeatmapPattern.isValidPattern(stored.pattern) ? stored.pattern : defaults.pattern,
      olderPattern: globalThis.HeatmapPattern.isValidOlderPattern(stored.olderPattern) ? stored.olderPattern : defaults.olderPattern,
      palette: stored.palette && typeof stored.palette === "object" ? stored.palette : defaults.palette
    };
    if (typeof stored.enabled !== "boolean" || typeof stored.hoverDisabled !== "boolean" || typeof stored.statsEnabled !== "boolean" || typeof stored.questionDatesShifted !== "boolean" || !Number.isSafeInteger(stored.totalActiveDays) || stored.totalActiveDays < 0 || !Number.isSafeInteger(stored.maxStreak) || stored.maxStreak < 0 || !globalThis.HeatmapPattern.isValidPattern(stored.pattern) || !globalThis.HeatmapPattern.isValidOlderPattern(stored.olderPattern) || !stored.palette) {
      await chrome.storage.local.set(result);
    }
    return result;
  }

  async function saveSettings(settings) {
    const validated = {};
    if (typeof settings.enabled === "boolean") validated.enabled = settings.enabled;
    if (typeof settings.hoverDisabled === "boolean") validated.hoverDisabled = settings.hoverDisabled;
    if (typeof settings.statsEnabled === "boolean") validated.statsEnabled = settings.statsEnabled;
    if (typeof settings.questionDatesShifted === "boolean") validated.questionDatesShifted = settings.questionDatesShifted;
    if (Number.isSafeInteger(settings.totalActiveDays) && settings.totalActiveDays >= 0) validated.totalActiveDays = settings.totalActiveDays;
    if (Number.isSafeInteger(settings.maxStreak) && settings.maxStreak >= 0) validated.maxStreak = settings.maxStreak;
    if (globalThis.HeatmapPattern.isValidPattern(settings.pattern)) validated.pattern = settings.pattern;
    if (globalThis.HeatmapPattern.isValidOlderPattern(settings.olderPattern)) validated.olderPattern = settings.olderPattern;
    if (settings.palette && typeof settings.palette === "object") validated.palette = settings.palette;
    await chrome.storage.local.set(validated);
    return getSettings();
  }

  globalThis.HeatmapStorage = { getSettings, saveSettings };
})();
