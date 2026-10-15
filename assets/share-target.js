const field = document.getElementById("share-url");

if (field) {
  const pathname = window.location.pathname
    .replace(/(?:send|receive)\/?$/, "")
    .replace(/index\.html$/, "");
  const base = pathname.endsWith("/") ? pathname : `${pathname}/`;
  field.value = new URL(`${base}receive/`, window.location.origin).href;
}

const settingsLink = document.getElementById("settings-share-link");
const statusLine = document.getElementById("specs");

if (settingsLink && statusLine) {
  const moveShareButton = () => {
    const buttons = statusLine.querySelectorAll("button");
    const button = buttons[0];
    if (!button) return;

    const separator = button.previousSibling;
    if (separator?.nodeType === Node.TEXT_NODE) {
      separator.textContent = separator.textContent.replace(/\s*[—-]\s*$/, "");
    }
    settingsLink.replaceChildren(button);
  };

  new MutationObserver(moveShareButton).observe(statusLine, {
    childList: true,
    subtree: true,
  });
  moveShareButton();
}

const footer = document.querySelector(".site-footer");
if (footer) {
  const keepOneLanguageSelector = () => {
    const selectors = footer.querySelectorAll(".footer-lang");
    for (const selector of [...selectors].slice(1)) selector.remove();
  };

  new MutationObserver(keepOneLanguageSelector).observe(footer, {
    childList: true,
    subtree: true,
  });
  keepOneLanguageSelector();
}
