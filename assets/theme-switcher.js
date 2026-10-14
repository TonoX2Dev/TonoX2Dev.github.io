const labels =
  document.documentElement.lang === "th"
    ? {
        dark: "ธีมมืดแบบ VS Code",
        green: "ธีมแฮกเกอร์สีเขียว",
        light: "ธีมสว่าง",
        title: "สลับธีม",
        tip: "กดเลือกธีมที่ต้องการเพื่อหยุดการสลับอัตโนมัติ",
        tipButton: "คำแนะนำเกี่ยวกับการเปลี่ยนธีม",
        dismissTip: "ปิดคำแนะนำ",
      }
    : {
        dark: "VS Code dark theme",
        green: "Hacker green theme",
        light: "Light theme",
        title: "Switch theme",
        tip: "Choose a theme to stop automatic switching.",
        tipButton: "Theme switching tip",
        dismissTip: "Dismiss theme tip",
      };

const icons = {
  dark: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.2 15.4A8.5 8.5 0 0 1 8.6 3.8 8.6 8.6 0 1 0 20.2 15.4Z"/></svg>',
  green: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8 21.2 12 12 21.2 2.8 12 12 2.8Z"/><path d="M8.5 12h7M12 8.5v7"/></svg>',
  light: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
};

const header = document.querySelector(".site-header");
if (!header) throw new Error("Theme switcher requires a site header.");

const wrapper = document.createElement("div");
wrapper.className = "theme-switcher-wrap";

const bar = document.createElement("div");
bar.className = "theme-switcher";
bar.setAttribute("role", "group");
bar.setAttribute("aria-label", labels.title);

const tipButton = document.createElement("button");
tipButton.className = "theme-tip";
tipButton.type = "button";
tipButton.setAttribute("aria-label", labels.tipButton);
tipButton.setAttribute("aria-expanded", "false");
tipButton.textContent = "?";

const tip = document.createElement("div");
tip.className = "theme-tip-message";
tip.id = "theme-tip-message";
tip.setAttribute("role", "note");
tip.hidden = true;
tip.textContent = labels.tip;
tipButton.setAttribute("aria-controls", tip.id);

const dismissTip = document.createElement("button");
dismissTip.className = "theme-tip-dismiss";
dismissTip.type = "button";
dismissTip.setAttribute("aria-label", labels.dismissTip);
dismissTip.textContent = "×";
tip.append(dismissTip);

function setTipVisible(visible) {
  tip.hidden = !visible;
  tipButton.setAttribute("aria-expanded", String(visible));
}

tipButton.addEventListener("click", () => setTipVisible(tip.hidden));
dismissTip.addEventListener("click", () => {
  setTipVisible(false);
  tipButton.hidden = true;
});

const themes = ["dark", "green", "light"];
const buttons = new Map();

for (const theme of themes) {
  const button = document.createElement("button");
  button.className = `theme-choice theme-choice-${theme}`;
  button.type = "button";
  button.setAttribute("aria-label", labels[theme]);
  button.setAttribute("aria-pressed", "false");
  button.innerHTML = icons[theme];
  button.addEventListener("click", () => selectTheme(theme, true));
  bar.append(button);
  buttons.set(theme, button);
}

const nav = header.querySelector(".mode-nav");
wrapper.append(bar, tipButton, tip);
header.insertBefore(wrapper, nav ?? null);

const themeStorageKey = "tonofastcode-selected-theme";
const tipStorageKey = "tonofastcode-theme-tip-seen";
const savedTheme = window.localStorage.getItem(themeStorageKey);
const hasSavedTheme = themes.includes(savedTheme);
let activeIndex = themes.indexOf(hasSavedTheme ? savedTheme : "green");
let transitionTimer;
let autoCycleTimer;

function selectTheme(theme, userSelected = false) {
  activeIndex = themes.indexOf(theme);
  if (activeIndex < 0) throw new Error(`Unknown theme: ${theme}`);
  document.documentElement.classList.add("theme-transition");
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle(
    "theme-user-selected",
    userSelected || hasSavedTheme,
  );
  for (const [name, button] of buttons) {
    button.setAttribute("aria-pressed", String(name === theme));
  }
  window.clearTimeout(transitionTimer);
  transitionTimer = window.setTimeout(
    () => document.documentElement.classList.remove("theme-transition"),
    450,
  );

  if (userSelected) {
    window.localStorage.setItem(themeStorageKey, theme);
    window.clearInterval(autoCycleTimer);
    setTipVisible(false);
    tipButton.hidden = true;
  }
}

selectTheme(hasSavedTheme ? savedTheme : "green");

if (window.localStorage.getItem(tipStorageKey) !== "true") {
  setTipVisible(true);
  window.localStorage.setItem(tipStorageKey, "true");
} else {
  tipButton.hidden = true;
}

if (!hasSavedTheme) {
  autoCycleTimer = window.setInterval(() => {
    selectTheme(themes[(activeIndex + 1) % themes.length]);
  }, 5000);
}
