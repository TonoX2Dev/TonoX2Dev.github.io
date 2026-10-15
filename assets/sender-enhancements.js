const textarea = document.getElementById("snippet-text");
const mode = document.getElementById("snippet-display-mode");
const sendButton = document.getElementById("send-snippet");

if (textarea && mode && sendButton) {
  sendButton.addEventListener(
    "click",
    () => {
      if (mode.value === "none") return;

      const original = textarea.value;
      textarea.value = `[[TONOFASTCODE:DISPLAY:${mode.value}]]\n${original}`;
      queueMicrotask(() => {
        textarea.value = original;
      });
    },
    { capture: true },
  );
}
