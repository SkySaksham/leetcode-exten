(() => {
  const palette = {
    level0: "#ebedf0",
    level1: "#9be9a8",
    level2: "#40c463",
    level3: "#30a14e",
    level4: "#216e39"
  };

  // Weighted random sampling favors light and medium cells, with fewer dark cells.
  const levels = [palette.level1, palette.level2, palette.level3, palette.level4];
  const weights = [0.38, 0.34, 0.19, 0.09];

  function generatePattern() {
    let result;
    do {
      result = Array.from({ length: 30 }, () => {
        const roll = Math.random();
        let cumulative = 0;
        for (let i = 0; i < weights.length; i += 1) {
          cumulative += weights[i];
          if (roll < cumulative) return levels[i];
        }
        return levels[levels.length - 1];
      });
    } while (new Set(result).size < 3 || result.every((color, i) => i < 2 || color === result[i - 1] && color === result[i - 2]));
    return result;
  }

  function isValidPattern(value) {
    return Array.isArray(value) && value.length === 30 && value.every(color => levels.includes(color));
  }

  globalThis.HeatmapPattern = { palette, generatePattern, isValidPattern };
})();
