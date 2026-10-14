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
    const button = statusLine.querySelector("button");
    if (!button || settingsLink.contains(button)) return;

    const separator = button.previousSibling;
    if (separator?.nodeType === Node.TEXT_NODE) {
      separator.textContent = separator.textContent.replace(/\s*[—-]\s*$/, "");
    }
    settingsLink.append(button);
  };

  new MutationObserver(moveShareButton).observe(statusLine, {
    childList: true,
    subtree: true,
  });
  moveShareButton();
}
