const themeStorageKey = "tonofastcode-selected-theme";
const themes = ["dark", "green", "light"];

try {
  const theme = window.localStorage.getItem(themeStorageKey);
  if (themes.includes(theme)) {
    document.documentElement.dataset.theme = theme;
    document.documentElement.classList.add("theme-user-selected");
  } else {
    document.documentElement.dataset.theme = "green";
  }
} catch (error) {
  if (!(error instanceof DOMException) || error.name !== "SecurityError") {
    throw error;
  }
  console.warn("Saved theme is unavailable; using the default theme.", error);
}
