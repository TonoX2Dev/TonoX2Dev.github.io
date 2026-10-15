const result = document.getElementById("result");
if (!result) throw new Error("Receiver result container is missing.");

const labels =
  document.documentElement.lang === "th"
    ? {
        preview: "ดูตัวอย่าง",
        close: "ปิด",
        letter: "จดหมายปิดผนึก",
        greeting: "การ์ดอวยพร",
        birthday: "กล่องของขวัญวันเกิด",
        christmas: "กล่องของขวัญวันคริสต์มาส",
        scroll: "ประกาศผล",
        open: "เปิด",
        clickAgain: "คลิกอีกครั้งเพื่อเปิด",
        copy: "คัดลอก",
        copied: "คัดลอกแล้ว",
        copyFailed: "คัดลอกไม่สำเร็จ",
        previewTitle: "ตัวอย่างเอกสาร",
        previewLoading: "กำลังเตรียมตัวอย่าง…",
        download: "ดาวน์โหลดไฟล์",
        officeConsent:
          "ต้องโหลดตัวแยกวิเคราะห์เอกสารจาก CDN เพื่อแสดงข้อความในไฟล์ Office ไฟล์จะถูกประมวลผลในอุปกรณ์นี้เท่านั้น ดำเนินการต่อหรือไม่?",
        officeFallback: "ยกเลิกการโหลดตัวแยกวิเคราะห์ ใช้ปุ่มดาวน์โหลดไฟล์แทนได้",
        previewFailed: "ไม่สามารถแสดงตัวอย่างได้",
      }
    : {
        preview: "Preview",
        close: "Close",
        letter: "A sealed letter",
        greeting: "A greeting card",
        birthday: "A birthday gift",
        christmas: "A Christmas gift",
        scroll: "An announcement",
        open: "Open",
        clickAgain: "Click once more to open",
        copy: "Copy",
        copied: "Copied",
        copyFailed: "Copy failed",
        previewTitle: "Document preview",
        previewLoading: "Preparing preview…",
        download: "Download file",
        officeConsent:
          "Load an Office document parser from a CDN to preview this file? The file is processed on this device only.",
        officeFallback: "Preview cancelled. You can download the file instead.",
        previewFailed: "This preview could not be rendered.",
      };

const presentations = {
  letter: { icon: "✉️", label: labels.letter },
  greeting: { icon: "💌", label: labels.greeting },
  birthday: { icon: "🎁", label: labels.birthday },
  christmas: { icon: "🎄", label: labels.christmas },
  scroll: { icon: "📜", label: labels.scroll },
};

let dialog;
let dialogTitle;
let dialogBody;
let confettiModule;

function celebrate() {
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  confettiModule ??= import(
    "https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/+esm"
  )
    .then((module) => module.default)
    .catch((error) => {
      confettiModule = undefined;
      console.error("Could not load the celebration effect.", error);
      return null;
    });

  confettiModule
    .then((confetti) => {
      if (!confetti) return;
      confetti({ particleCount: 100, spread: 75, origin: { y: 0.65 } });
      window.setTimeout(
        () => confetti({ particleCount: 45, spread: 105, origin: { y: 0.65 } }),
        220,
      );
    })
    .catch((error) => console.error("Could not play the celebration effect.", error));
}

function ensureDialog() {
  if (dialog) return;

  dialog = document.createElement("dialog");
  dialog.className = "help-dialog enhancement-dialog";
  dialog.setAttribute("aria-labelledby", "enhancement-dialog-title");
  dialogTitle = document.createElement("h2");
  dialogTitle.id = "enhancement-dialog-title";
  dialogBody = document.createElement("div");
  dialogBody.className = "enhancement-dialog-body";
  const close = document.createElement("button");
  close.type = "button";
  close.className = "secondary-button";
  close.textContent = labels.close;
  close.addEventListener("click", () => dialog.close());
  dialog.append(dialogTitle, dialogBody, close);
  document.body.append(dialog);
}

function showDialog(title, content) {
  ensureDialog();
  dialogTitle.textContent = title;
  dialogBody.replaceChildren(content);
  dialog.showModal();
}

function textContent(text) {
  const message = document.createElement("p");
  message.className = "received-note";
  message.textContent = text;
  return message;
}

function enhanceSnippet(note) {
  if (note.dataset.presentationHandled === "true") return;
  const match = note.textContent.match(
    /^\[\[TONOFASTCODE:DISPLAY:(letter|greeting|birthday|christmas|scroll)\]\]\n?/,
  );

  if (!match) {
    note.dataset.presentationHandled = "true";
    if (note.dataset.celebrated !== "true") {
      note.dataset.celebrated = "true";
      celebrate();
    }
    return;
  }

  const mode = match[1];
  const message = note.textContent.slice(match[0].length);
  const presentation = presentations[mode];
  const copyButton = result.querySelector(".note-actions button.text-button");
  copyButton?.addEventListener(
    "click",
    async (event) => {
      event.stopImmediatePropagation();
      try {
        await navigator.clipboard.writeText(message);
        copyButton.textContent = labels.copied;
      } catch {
        copyButton.textContent = labels.copyFailed;
      }
    },
    { capture: true },
  );
  const card = document.createElement("button");
  let clicks = 0;
  card.type = "button";
  card.className = `snippet-presentation snippet-presentation-${mode}`;
  card.setAttribute("aria-label", `${presentation.label}. ${labels.open}`);
  const icon = document.createElement("span");
  icon.className = "snippet-presentation-icon";
  icon.setAttribute("aria-hidden", "true");
  icon.textContent = presentation.icon;
  const title = document.createElement("span");
  title.textContent = presentation.label;
  card.append(icon, title);
  card.addEventListener("click", () => {
    clicks += 1;
    if (mode === "letter" && clicks < 2) {
      title.textContent = labels.clickAgain;
      card.classList.add("is-unsealed");
      return;
    }

    const content = textContent(message);
    showDialog(presentation.label, content);
    celebrate();
  });
  note.replaceWith(card);
}

function extensionOf(name) {
  return name.split(".").pop().toLowerCase();
}

function fallbackLink(download) {
  const link = document.createElement("a");
  link.className = "download";
  link.href = download.href;
  link.download = download.download;
  link.textContent = labels.download;
  return link;
}

async function renderOfficePreview(download, body) {
  if (!window.confirm(labels.officeConsent)) {
    body.textContent = labels.officeFallback;
    return;
  }

  const { OfficeParser } = await import(
    "https://cdn.jsdelivr.net/npm/officeparser@8.1.1/dist/officeparser.browser.slim.mjs"
  );
  const response = await fetch(download.href);
  if (!response.ok) throw new Error(`Could not read file (${response.status}).`);
  const blob = await response.blob();
  const file = new File([blob], download.download, { type: blob.type });
  const ast = await OfficeParser.parseOffice(file);
  const parsed = await ast.to("text");
  body.textContent = parsed.value || labels.previewFailed;
}

async function showFilePreview(download) {
  const extension = extensionOf(download.download);
  const body = document.createElement("div");
  body.className = "document-preview";
  body.textContent = labels.previewLoading;
  showDialog(labels.previewTitle, body);
  celebrate();

  try {
    if (extension === "pdf") {
      const frame = document.createElement("iframe");
      frame.title = download.download;
      frame.src = download.href;
      body.replaceChildren(frame);
    } else if (extension === "txt") {
      const response = await fetch(download.href);
      if (!response.ok) throw new Error(`Could not read file (${response.status}).`);
      const preview = document.createElement("pre");
      preview.textContent = await response.text();
      body.replaceChildren(preview);
    } else {
      await renderOfficePreview(download, body);
    }
  } catch (error) {
    console.error("Could not render the document preview.", error);
    const message = document.createElement("p");
    message.textContent = `${labels.previewFailed} ${String(error)}`;
    body.replaceChildren(message);
  }

  body.append(fallbackLink(download));
}

function addDocumentPreview(download) {
  const extension = extensionOf(download.download);
  if (!["pdf", "txt", "docx", "xlsx", "pptx"].includes(extension)) return;

  const actions = download.parentElement;
  if (!actions || actions.querySelector("[data-document-preview]")) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = "secondary-button";
  button.dataset.documentPreview = "true";
  button.textContent = labels.preview;
  button.addEventListener("click", () => void showFilePreview(download));
  actions.append(button);
}

function updateResult() {
  const note = result.querySelector(".received-note");
  if (note) enhanceSnippet(note);

  const download = result.querySelector("a.download");
  if (download) addDocumentPreview(download);

  for (const media of result.querySelectorAll(".received")) {
    if (media.dataset.celebrated === "true") continue;
    media.dataset.celebrated = "true";
    celebrate();
  }
}

result.addEventListener("click", (event) => {
  if (event.target instanceof Element && event.target.closest("a.download")) {
    celebrate();
  }
});

new MutationObserver(updateResult).observe(result, {
  childList: true,
  subtree: true,
});
updateResult();
