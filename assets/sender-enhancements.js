const textarea = document.getElementById("snippet-text");
const mode = document.getElementById("snippet-display-mode");
const sendButton = document.getElementById("send-snippet");

if (textarea && mode && sendButton) {
  sendButton.addEventListener(
    "click",
    () => {
      if (mode.value === "none") return;

      textarea.value = `[[TONOFASTCODE:DISPLAY:${mode.value}]]\n${textarea.value}`;
      window.setTimeout(() => {
        textarea.value = textarea.value.replace(
          /^\[\[TONOFASTCODE:DISPLAY:(?:letter|greeting|birthday|christmas|scroll)\]\]\n/,
          "",
        );
      }, 0);
    },
    { capture: true },
  );
}
