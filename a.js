const GREEN = {
  level0: "#ebedf0",
  level1: "#9be9a8",
  level2: "#40c463",
  level3: "#30a14e",
  level4: "#216e39"
};


(() => {
  const GREEN = "#26a641";

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

    if (!candidates.length) {
      console.log("No visible heatmap found.");
      return;
    }

    const heatmap = candidates[0];

    heatmap.cells.slice(-30).forEach(cell => {
      cell.style.setProperty("fill", GREEN, "important");
    });

    console.log({
      selectedWidth: heatmap.box.width,
      selectedHeight: heatmap.box.height,
      totalCells: heatmap.cells.length,
      painted: 30
    });
  }

  paint();
  window.addEventListener("resize", paint);

  const observer = new MutationObserver(paint);
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });

  console.log("Desktop/mobile heatmap painter active.");
})();



// turn off


(() => {
  // Restore original inline fills where previously saved
  document.querySelectorAll('svg rect.cursor-pointer').forEach(cell => {
    if (cell.dataset.originalFill !== undefined) {
      if (cell.dataset.originalFill) {
        cell.style.setProperty('fill', cell.dataset.originalFill);
      } else {
        cell.style.removeProperty('fill');
      }
      delete cell.dataset.originalFill;
    } else {
      cell.style.removeProperty('fill');
    }
  });

  console.log("Heatmap colors restored!");
})();


