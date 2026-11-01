
const GREEN = {
  level0: "#ebedf0",
  level1: "#9be9a8",
  level2: "#40c463",
  level3: "#30a14e",
  level4: "#216e39"
};

(() => {
  // Stop any previous version of this painter
  window.__lcHeatmapPainter?.stop?.();

  const palette = [
    GREEN.level1,
    GREEN.level2,
    GREEN.level3,
    GREEN.level4
  ];

  // Generate one random pattern and keep it stable
  const pattern = Array.from({ length: 30 }, () =>
    palette[Math.floor(Math.random() * palette.length)]
  );

  let observer;

  function paint() {
    const candidates = [...document.querySelectorAll("svg")]
      .map(svg => ({
        svg,
        cells: [...svg.querySelectorAll("rect.cursor-pointer")],
        box: svg.getBoundingClientRect()
      }))
      .filter(x =>
        x.box.width > 100 &&
        x.box.height > 40 &&
        x.cells.length > 100
      )
      .sort((a, b) => b.cells.length - a.cells.length);

    if (!candidates.length) return;

    const cells = candidates[0].cells.slice(-30);

    cells.forEach((cell, i) => {
      if (cell.dataset.savedFill === undefined) {
        cell.dataset.savedFill = cell.getAttribute("fill") || "";
        cell.dataset.savedStyle = cell.style.getPropertyValue("fill");
        cell.dataset.savedPriority = cell.style.getPropertyPriority("fill");
      }

      cell.style.setProperty("fill", pattern[i], "important");
    });
  }

  const resizeHandler = () => paint();

  paint();

  window.addEventListener("resize", resizeHandler);

  observer = new MutationObserver(paint);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  window.__lcHeatmapPainter = {
    stop() {
      observer.disconnect();
      window.removeEventListener("resize", resizeHandler);
    },
    pattern
  };

  console.log("Random green pattern applied!", pattern);
})();
