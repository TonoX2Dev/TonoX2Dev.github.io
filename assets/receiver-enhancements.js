const result = document.getElementById("result");
if (!result) throw new Error("Receiver result container is missing.");

const labels =
  document.documentElement.lang === "th"
    ? {
        letter: "จดหมายปิดผนึก",
        greeting: "การ์ดอวยพร",
        birthday: "กล่องของขวัญวันเกิด",
        christmas: "กล่องของขวัญวันคริสต์มาส",
        scroll: "ประกาศผล",
        open: "เปิด",
        doubleClick: "ดับเบิลคลิกที่ฝากล่องเพื่อเปิด",
        close: "ปิด",
        copy: "คัดลอก",
        copied: "คัดลอกแล้ว",
        copyFailed: "คัดลอกไม่สำเร็จ",
        animationFailed: "โหลดภาพเคลื่อนไหวไม่สำเร็จ",
        previewTitle: "ตัวอย่างเอกสาร",
        previewLoading: "กำลังเตรียมตัวอย่าง…",
        previewFailed: "ไม่สามารถแสดงตัวอย่างได้",
      }
    : {
        letter: "A sealed letter",
        greeting: "A greeting card",
        birthday: "A birthday gift",
        christmas: "A Christmas gift",
        scroll: "An announcement",
        open: "Open",
        doubleClick: "Double-click the lid to open",
        close: "Close",
        copy: "Copy",
        copied: "Copied",
        copyFailed: "Copy failed",
        animationFailed: "Could not load the presentation animation.",
        previewTitle: "Document preview",
        previewLoading: "Preparing preview…",
        previewFailed: "This preview could not be rendered.",
      };

const presentations = {
  letter: { icon: "✉️", label: labels.letter },
  greeting: { icon: "💌", label: labels.greeting },
  birthday: { icon: "🎁", label: labels.birthday },
  christmas: { icon: "🎁", label: labels.christmas },
  scroll: { icon: "📜", label: labels.scroll },
};

let confettiModule;
let envelopeTemplatePromise;
let pdfJsModulePromise;
let presentationDialog;
let presentationDialogTitle;
let presentationDialogMessage;

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

function showPresentationMessage(title, message) {
  if (!presentationDialog) {
    presentationDialog = document.createElement("dialog");
    presentationDialog.className = "help-dialog enhancement-dialog";
    presentationDialog.setAttribute(
      "aria-labelledby",
      "presentation-dialog-title",
    );
    presentationDialogTitle = document.createElement("h2");
    presentationDialogTitle.id = "presentation-dialog-title";
    presentationDialogTitle.tabIndex = -1;
    presentationDialogMessage = document.createElement("p");
    presentationDialogMessage.className = "received-note";
    const close = document.createElement("button");
    close.type = "button";
    close.className = "secondary-button";
    close.textContent = labels.close;
    close.addEventListener("click", () => presentationDialog.close());
    presentationDialog.append(
      presentationDialogTitle,
      presentationDialogMessage,
      close,
    );
    document.body.append(presentationDialog);
  }

  if (presentationDialog.open) presentationDialog.close();
  presentationDialogTitle.textContent = title;
  presentationDialogMessage.textContent = message;
  presentationDialog.showModal();
  presentationDialogTitle.focus();
}

function completePresentationOpen(card, title, message, animationDuration) {
  celebrate();
  window.setTimeout(() => {
    if (card.isConnected) showPresentationMessage(title, message);
  }, animationDuration);
}

function loadEnvelopeTemplate() {
  if (!envelopeTemplatePromise) {
    envelopeTemplatePromise = fetch(new URL("./animation/letter.html", import.meta.url))
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Could not load envelope template (${response.status}).`);
        }
        return response.text();
      })
      .then((html) => {
        const templateDocument = new DOMParser().parseFromString(html, "text/html");
        const wrapper = templateDocument.querySelector(".envelope-wrapper");
        if (!wrapper) throw new Error("Envelope template markup is missing.");
        return wrapper;
      })
      .catch((error) => {
        envelopeTemplatePromise = undefined;
        throw error;
      });
  }
  return envelopeTemplatePromise.then((wrapper) => wrapper.cloneNode(true));
}

function enhanceSnippet(note) {
  if (note.dataset.presentationHandled === "true") return;
  const match = note.textContent.match(
    /^\[\[TONOFASTCODE:DISPLAY:(letter|greeting|birthday|christmas|scroll)\]\]\n?/,
  );

  if (!match) {
    note.dataset.presentationHandled = "true";
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
  const card = document.createElement("section");
  card.className = `snippet-presentation snippet-presentation-${mode}`;
  card.setAttribute("aria-label", presentation.label);
  const title = document.createElement("h2");
  title.className = "snippet-presentation-title";
  title.textContent = presentation.label;
  card.append(title);

  const content = document.createElement("p");
  content.className = "snippet-presentation-message";
  content.textContent = message;
  if (mode === "letter") {
    loadEnvelopeTemplate()
      .then((envelopeWrapper) => {
        if (!card.isConnected) return;
        const text = envelopeWrapper.querySelector(".envelope .letter .text");
        const templateSeal = envelopeWrapper.querySelector(".heart");
        if (!text || !templateSeal) {
          throw new Error("Envelope template is missing its letter or seal.");
        }
        text.replaceChildren(content);
        text.setAttribute("aria-hidden", "true");
        const seal = document.createElement("button");
        seal.type = "button";
        seal.className = templateSeal.className;
        seal.setAttribute("aria-label", `${presentation.label}: ${labels.open}`);
        seal.setAttribute("aria-expanded", "false");
        templateSeal.replaceWith(seal);
        seal.addEventListener("click", () => {
          if (seal.getAttribute("aria-expanded") === "true") return;
          seal.setAttribute("aria-expanded", "true");
          text.setAttribute("aria-hidden", "false");
          envelopeWrapper.classList.add("flap");
          completePresentationOpen(card, presentation.label, message, 1500);
        });
        card.append(envelopeWrapper);
      })
      .catch((error) => {
        console.error("Could not render the envelope presentation.", error);
        const failure = document.createElement("p");
        failure.className = "presentation-error";
        failure.textContent = labels.animationFailed;
        card.append(failure);
      });
  } else if (mode === "birthday" || mode === "christmas") {
    const gift = document.createElement("div");
    gift.className = "gift-box";
    const paper = document.createElement("div");
    paper.className = "gift-paper";
    paper.setAttribute("aria-hidden", "true");
    paper.append(content);
    const box = document.createElement("div");
    box.className = "gift-base";
    const lid = document.createElement("button");
    lid.type = "button";
    lid.className = "gift-lid";
    lid.textContent = labels.doubleClick;
    lid.setAttribute("aria-expanded", "false");
    let lastClick = 0;
    lid.addEventListener("click", () => {
      if (lid.getAttribute("aria-expanded") === "true") return;
      const now = performance.now();
      if (lastClick && now - lastClick <= 650) {
        lid.setAttribute("aria-expanded", "true");
        lid.disabled = true;
        paper.setAttribute("aria-hidden", "false");
        gift.classList.add("is-open");
        completePresentationOpen(card, presentation.label, message, 800);
        return;
      }
      lastClick = now;
    });
    gift.append(paper, box, lid);
    card.append(gift);
  } else if (mode === "scroll") {
    const scroll = document.createElement("div");
    scroll.className = "announcement-scroll";
    const paper = document.createElement("div");
    paper.className = "scroll-paper";
    paper.setAttribute("aria-hidden", "true");
    paper.append(content);
    const control = document.createElement("button");
    control.type = "button";
    control.className = "scroll-open";
    control.textContent = labels.open;
    control.setAttribute("aria-expanded", "false");
    control.addEventListener("click", () => {
      if (control.getAttribute("aria-expanded") === "true") return;
      control.setAttribute("aria-expanded", "true");
      control.disabled = true;
      paper.setAttribute("aria-hidden", "false");
      scroll.classList.add("is-open");
      completePresentationOpen(card, presentation.label, message, 850);
    });
    scroll.append(control, paper);
    card.append(scroll);
  } else {
    const greeting = document.createElement("div");
    greeting.className = "greeting-card";
    const inside = document.createElement("div");
    inside.className = "greeting-inside";
    inside.setAttribute("aria-hidden", "true");
    inside.append(content);
    const cover = document.createElement("button");
    cover.type = "button";
    cover.className = "greeting-cover";
    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = presentation.icon;
    cover.append(icon);
    cover.setAttribute("aria-label", `${presentation.label}: ${labels.open}`);
    cover.setAttribute("aria-expanded", "false");
    cover.addEventListener("click", () => {
      if (cover.getAttribute("aria-expanded") === "true") return;
      cover.setAttribute("aria-expanded", "true");
      cover.disabled = true;
      inside.setAttribute("aria-hidden", "false");
      greeting.classList.add("is-open");
      completePresentationOpen(card, presentation.label, message, 800);
    });
    greeting.append(inside, cover);
    card.append(greeting);
  }

  note.replaceWith(card);
}

function extensionOf(name) {
  return name.split(".").pop().toLowerCase();
}

async function renderOfficePreview(download, body) {
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

async function renderPdfPreview(download, body) {
  const response = await fetch(download.href);
  if (!response.ok) throw new Error(`Could not read file (${response.status}).`);

  pdfJsModulePromise ??= import(
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs"
  )
    .catch((error) => {
      pdfJsModulePromise = undefined;
      throw error;
    });
  const pdfjs = await pdfJsModulePromise;
  pdfjs.GlobalWorkerOptions.workerSrc =
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.worker.min.mjs";
  const pdf = await pdfjs.getDocument({
    data: new Uint8Array(await response.arrayBuffer()),
  }).promise;
  const pages = document.createElement("div");
  pages.className = "document-preview-pages";
  const availableWidth = Math.max(body.clientWidth || 640, 280);

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const baseViewport = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({
        scale: Math.min(1.25, availableWidth / baseViewport.width),
      });
      const outputScale = Math.min(window.devicePixelRatio || 1, 2);
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Could not create a PDF preview canvas.");
      canvas.width = Math.ceil(viewport.width * outputScale);
      canvas.height = Math.ceil(viewport.height * outputScale);
      canvas.style.width = `${viewport.width}px`;
      canvas.setAttribute("role", "img");
      canvas.setAttribute(
        "aria-label",
        `${download.download}, page ${pageNumber} of ${pdf.numPages}`,
      );
      pages.append(canvas);
      await page.render({
        canvasContext: context,
        viewport,
        transform:
          outputScale === 1
            ? undefined
            : [outputScale, 0, 0, outputScale, 0, 0],
      }).promise;
    }
  } finally {
    await pdf.destroy();
  }

  body.replaceChildren(pages);
}

async function renderFilePreview(download, body) {
  const extension = extensionOf(download.download);
  try {
    if (extension === "pdf") {
      await renderPdfPreview(download, body);
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
    if (extension === "pdf") {
      const frame = document.createElement("iframe");
      frame.title = download.download;
      frame.loading = "lazy";
      frame.src = download.href;
      body.append(frame);
    }
  }
}

function addDocumentPreview(download) {
  const extension = extensionOf(download.download);
  if (!["pdf", "txt", "docx", "xlsx", "pptx"].includes(extension)) return;

  const existing = result.querySelector("[data-document-preview]");
  if (existing?.dataset.source === download.href) return;

  const preview = document.createElement("section");
  preview.className = "document-preview";
  preview.dataset.documentPreview = "true";
  preview.dataset.source = download.href;
  const heading = document.createElement("h2");
  heading.textContent = labels.previewTitle;
  const body = document.createElement("div");
  body.className = "document-preview-content";
  body.textContent = labels.previewLoading;
  preview.append(heading, body);

  if (existing) existing.replaceWith(preview);
  else result.append(preview);
  void renderFilePreview(download, body);
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
