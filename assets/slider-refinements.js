const slider = document.getElementById("cfg-size");
const value = document.getElementById("cfg-size-value");
const stage = document.getElementById("stage");
const grid = document.getElementById("cfg-grid");
const qrSpec = document.getElementById("spec-qr");

if (!slider || !value || !stage || !grid || !qrSpec) {
  throw new Error("Display-size slider markup is incomplete.");
}

function updateSliderBounds() {
  const shell = slider.closest(".send-shell");
  if (!shell) {
    throw new Error("Display-size slider is missing its send-page container.");
  }

  const stageStyle = getComputedStyle(stage);
  const stageInsets =
    Number.parseFloat(stageStyle.paddingLeft) +
    Number.parseFloat(stageStyle.paddingRight) +
    Number.parseFloat(stageStyle.borderLeftWidth) +
    Number.parseFloat(stageStyle.borderRightWidth);
  const shellWidth = shell.getBoundingClientRect().width;
  const version = Number(qrSpec.textContent.match(/\bV(\d+)\b/)?.[1]);
  const codeCount = Number(grid.value) || 1;
  const columns = Math.floor(Math.sqrt(codeCount));
  const rows = Math.ceil(codeCount / columns);
  const codeModules = version ? 17 + 4 * version + 8 : 0;
  const resolutionMinimum = Math.ceil(
    (codeModules * Math.max(columns, rows)) / (window.devicePixelRatio || 1),
  );
  const maximum = Math.max(
    1,
    Math.floor(
      Math.min(
        1200,
        window.innerWidth * 0.9,
        window.innerHeight * 0.9,
        shellWidth - stageInsets,
      ),
    ),
  );
  const minimum = Math.min(maximum, Math.max(100, resolutionMinimum));

  slider.min = String(minimum);
  slider.max = String(maximum);
  if (Number(slider.value) < minimum || Number(slider.value) > maximum) {
    slider.value = String(Math.min(maximum, Math.max(minimum, Number(slider.value))));
    slider.dispatchEvent(new Event("change", { bubbles: true }));
  }
  value.value = `${slider.value} px`;
  slider.setAttribute("aria-valuetext", `${slider.value} px`);
}

slider.addEventListener("input", () => {
  value.value = `${slider.value} px`;
  slider.setAttribute("aria-valuetext", `${slider.value} px`);
});
grid.addEventListener("change", updateSliderBounds);
window.addEventListener("resize", updateSliderBounds);
new MutationObserver(updateSliderBounds).observe(qrSpec, {
  childList: true,
  characterData: true,
  subtree: true,
});
updateSliderBounds();
