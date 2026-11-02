(() => {
  const api = globalThis.HeatmapStorage;
  const patternApi = globalThis.HeatmapPattern;
  const originals = new WeakMap();
  const originalStats = new WeakMap();
  const originalDates = new WeakMap();
  let enabled = false;
  let pattern = [];
  let olderPattern = [];
  let observer = null;
  let statsObserver = null;
  let latestSettings = null;
  let resizeHandler = null;
  let routeTimer = null;
  let lastUrl = location.href;
  let scheduled = false;
  let statsEnabled = false;
  let totalActiveDays = 10;
  let maxStreak = 30;
  let questionDatesShifted = false;

  function syncQuestionDates(settings) {
    questionDatesShifted = settings.questionDatesShifted;
    const datePattern = /^(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}$/i;
    const labels = [...document.querySelectorAll("div.h-full.overflow-hidden.text-ellipsis")]
      .filter(el => datePattern.test(el.textContent.trim()));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    labels.forEach((el, index) => {
      if (!questionDatesShifted) {
        if (originalDates.has(el)) {
          el.textContent = originalDates.get(el);
          originalDates.delete(el);
        }
        return;
      }
      if (!originalDates.has(el)) originalDates.set(el, el.textContent);
      const date = new Date(today);
      date.setDate(date.getDate() - (index + 1));
      const display = date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (el.textContent.trim() !== display) el.textContent = display;
    });
  }

  function syncStats(settings) {
    statsEnabled = settings.statsEnabled;
    totalActiveDays = settings.totalActiveDays;
    maxStreak = settings.maxStreak;
    const values = [["Total active days:", totalActiveDays], ["Max streak:", maxStreak]];
    for (const [label, value] of values) {
      const target = [...document.querySelectorAll("span")].find(el => el.textContent.trim() === label)?.nextElementSibling;
      if (!target) continue;
      if (statsEnabled) {
        if (!originalStats.has(target)) originalStats.set(target, target.textContent);
        const text = String(value);
        if (target.textContent !== text) target.textContent = text;
      } else if (originalStats.has(target)) {
        target.textContent = originalStats.get(target);
        originalStats.delete(target);
      }
    }
  }

  function syncHover(disabled) {
    const existing = document.getElementById("no-heatmap-hover");
    if (!disabled) {
      existing?.remove();
      return;
    }
    if (existing) return;
    const style = document.createElement("style");
    style.id = "no-heatmap-hover";
    style.textContent = "svg rect.cursor-pointer { pointer-events: none !important; }";
    (document.head || document.documentElement).appendChild(style);
  }

  function restoreCell(cell) {
    const original = originals.get(cell);
    if (!original) return;
    if (original.fill === null) cell.removeAttribute("fill");
    else cell.setAttribute("fill", original.fill);
    if (original.styleValue) cell.style.setProperty("fill", original.styleValue, original.priority);
    else cell.style.removeProperty("fill");
    originals.delete(cell);
  }

  function restoreAll() {
    document.querySelectorAll("svg rect.cursor-pointer").forEach(restoreCell);
  }

  function visibleHeatmaps() {
    return [...document.querySelectorAll("svg")]
      .map(svg => ({ svg, cells: [...svg.querySelectorAll("rect.cursor-pointer")], box: svg.getBoundingClientRect() }))
      .filter(item => {
        let node = item.svg;
        let visible = true;
        while (node && node.nodeType === Node.ELEMENT_NODE) {
          const style = getComputedStyle(node);
          if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
            visible = false;
            break;
          }
          node = node.parentElement;
        }
        return visible && item.box.width > 100 && item.box.height > 40 && item.cells.length > 100;
      })
      .sort((a, b) => b.cells.length - a.cells.length);
  }

  function paint() {
    scheduled = false;
    if (!enabled || !location.hostname.endsWith("leetcode.com")) return;
    const best = visibleHeatmaps()[0];
    if (!best) return;

    // Clear stale painted cells in previously selected visible charts before selecting the last 30.
    const recentCells = best.cells.slice(-30);
    const earlierCells = best.cells.slice(-60, -30);
    const target = new Set([...recentCells, ...earlierCells.filter((_cell, index) => olderPattern[index])]);
    document.querySelectorAll("svg rect.cursor-pointer").forEach(cell => {
      if (originals.has(cell) && !target.has(cell)) restoreCell(cell);
    });
    [...target].forEach(cell => {
      if (!originals.has(cell)) {
        originals.set(cell, {
          fill: cell.getAttribute("fill"),
          styleValue: cell.style.getPropertyValue("fill"),
          priority: cell.style.getPropertyPriority("fill")
        });
      }
      const recentIndex = recentCells.indexOf(cell);
      const color = recentIndex >= 0 ? pattern[recentIndex] : patternApi.palette.level1;
      if (cell.style.getPropertyValue("fill") !== color || cell.style.getPropertyPriority("fill") !== "important") {
        cell.style.setProperty("fill", color, "important");
      }
    });
  }

  function schedulePaint() {
    if (scheduled || !enabled) return;
    scheduled = true;
    requestAnimationFrame(paint);
  }

  function stop() {
    enabled = false;
    if (observer) observer.disconnect();
    observer = null;
    if (resizeHandler) window.removeEventListener("resize", resizeHandler);
    resizeHandler = null;
    if (routeTimer) clearInterval(routeTimer);
    routeTimer = null;
    restoreAll();
  }

  function start(nextPattern, nextOlderPattern) {
    pattern = patternApi.isValidPattern(nextPattern) ? nextPattern : patternApi.generatePattern();
    olderPattern = patternApi.isValidOlderPattern(nextOlderPattern) ? nextOlderPattern : patternApi.generateOlderPattern();
    if (enabled) {
      schedulePaint();
      return;
    }
    enabled = true;
    observer = new MutationObserver(schedulePaint);
    observer.observe(document.body, { childList: true, subtree: true });
    resizeHandler = schedulePaint;
    window.addEventListener("resize", resizeHandler);
    routeTimer = setInterval(() => {
      if (location.href !== lastUrl) {
        lastUrl = location.href;
        schedulePaint();
      }
    }, 500);
    schedulePaint();
  }

  async function sync() {
    try {
      const settings = await api.getSettings();
      latestSettings = settings;
      syncHover(settings.hoverDisabled);
      syncStats(settings);
      syncQuestionDates(settings);
      if (!statsObserver && document.body) {
        statsObserver = new MutationObserver(() => {
          if (latestSettings) syncStats(latestSettings);
        });
        statsObserver.observe(document.body, { childList: true, subtree: true });
      }
      if (settings.enabled) start(settings.pattern, settings.olderPattern);
      else stop();
    } catch (error) {
      console.error("Heatmap Customizer: unable to read settings", error);
      stop();
    }
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === "local" && (changes.enabled || changes.hoverDisabled || changes.statsEnabled || changes.totalActiveDays || changes.maxStreak || changes.questionDatesShifted || changes.pattern || changes.olderPattern)) sync();
  });
  chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
    if (message?.type === "HEATMAP_SYNC") {
      sync().then(() => sendResponse({ ok: true })).catch(error => sendResponse({ ok: false, error: String(error) }));
      return true;
    }
    if (message?.type === "HEATMAP_RESTORE") {
      stop();
      sendResponse({ ok: true });
    }
    return undefined;
  });

  sync();
})();
