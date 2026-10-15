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
        previewFailed: "ไม่สามารถเปิดดูได้ กรุณาดาวน์โหลดไฟล์เพื่อรับชม",
        downloadFile: "ดาวน์โหลดไฟล์",
        downloadToView: "ดาวน์โหลดเพื่อเปิดดู",
        packName: "ชื่อแพ็ก",
        packDescription: "รายละเอียด",
        packVersion: "เวอร์ชัน",
        packType: "ประเภทแพ็ก",
        fileFormat: "รูปแบบไฟล์",
        resourcePack: "แพ็กทรัพยากร",
        behaviorPack: "แพ็กพฤติกรรม",
        scriptPack: "แพ็กสคริปต์",
        packIconMissing: "ไม่มีไอคอนแพ็ก",
        worldSave: "โลก Minecraft",
        notSpecified: "ไม่ระบุ",
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
        previewFailed: "Could not preview this file. Please download it to view.",
        downloadFile: "Download file",
        downloadToView: "Download to View",
        packName: "Pack name",
        packDescription: "Description",
        packVersion: "Version",
        packType: "Pack type",
        fileFormat: "File format",
        resourcePack: "Resource pack",
        behaviorPack: "Behavior pack",
        scriptPack: "Script pack",
        packIconMissing: "Pack icon unavailable",
        worldSave: "Minecraft world",
        notSpecified: "Not specified",
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
let jsZipModulePromise;
let pdfJsModulePromise;
let presentationDialog;
let presentationDialogTitle;
let presentationDialogMessage;
const minecraftIconUrls = new Set();

const minecraftExtensions = new Set(["mcaddon", "mcpack", "mcworld"]);

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

async function renderLocalOfficePreview(download, container) {
  const { OfficeParser } = await import(
    "https://cdn.jsdelivr.net/npm/officeparser@8.1.1/dist/officeparser.browser.slim.mjs"
  );
  if (!container.isConnected || container.dataset.previewState !== "pending") {
    return;
  }
  const response = await fetch(download.href);
  if (!response.ok) throw new Error(`Could not read file (${response.status}).`);
  const blob = await response.blob();
  if (!container.isConnected || container.dataset.previewState !== "pending") {
    return;
  }
  const file = new File([blob], download.download, { type: blob.type });
  const ast = await OfficeParser.parseOffice(file);
  if (extensionOf(download.download) === "docx") {
    const parsed = await ast.to("html");
    if (typeof parsed.value !== "string" || !parsed.value.trim()) {
      throw new Error("The Word document did not produce preview content.");
    }

    const parsedDocument = new DOMParser().parseFromString(
      parsed.value,
      "text/html",
    );
    if (!parsedDocument.body.textContent.trim()) {
      throw new Error("The Word document preview is empty.");
    }
    parsedDocument
      .querySelectorAll(
        "script, style, iframe, object, embed, form, link, meta, base, svg",
      )
      .forEach((element) => element.remove());
    for (const element of parsedDocument.body.querySelectorAll("*")) {
      for (const attribute of [...element.attributes]) {
        if (
          attribute.name.toLowerCase().startsWith("on") ||
          attribute.name === "style" ||
          attribute.name === "class" ||
          attribute.name === "id"
        ) {
          element.removeAttribute(attribute.name);
        }
      }
    }
    if (!parsedDocument.body.textContent.trim()) {
      throw new Error("The Word document contains no readable preview content.");
    }
    if (!container.isConnected || container.dataset.previewState !== "pending") {
      return;
    }
    const frame = createDocumentFrame(
      "about:blank",
      `${download.download} ${labels.previewTitle}`,
    );
    frame.className = "document-preview-word-frame";
    frame.setAttribute("sandbox", "");
    frame.srcdoc = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: blob:; style-src 'unsafe-inline'; font-src data:"><style>
      :root { color-scheme: light; font-family: Arial, Helvetica, sans-serif; color: #252525; background: #e8eaed; }
      * { box-sizing: border-box; }
      body { margin: 0; padding: 24px; }
      .word-page { width: min(100%, 850px); min-height: 100%; margin: 0 auto; padding: 48px; background: #fff; box-shadow: 0 2px 12px rgb(0 0 0 / 15%); font: 16px/1.6 Arial, Helvetica, sans-serif; overflow-wrap: anywhere; }
      .word-page h1, .word-page h2, .word-page h3, .word-page h4, .word-page h5, .word-page h6 { line-height: 1.3; }
      .word-page table { width: 100%; border-collapse: collapse; margin: 1em 0; }
      .word-page th, .word-page td { border: 1px solid #9aa0a6; padding: 7px 10px; text-align: start; vertical-align: top; }
      .word-page img { max-width: 100%; height: auto; }
      @media (max-width: 600px) { body { padding: 8px; } .word-page { padding: 22px; } }
    </style></head><body><main class="word-page">${parsedDocument.body.innerHTML}</main></body></html>`;
    container.replaceChildren();
    appendPreviewFrame(frame, download, container);
    container.dataset.previewState = "rendered";
    return;
  }

  const parsed = await ast.to("text");
  if (typeof parsed.value !== "string" || !parsed.value.trim()) {
    throw new Error("The Office document did not produce preview content.");
  }
  if (!container.isConnected || container.dataset.previewState !== "pending") {
    return;
  }
  const preview = document.createElement("pre");
  preview.textContent = parsed.value;
  container.replaceChildren(preview);
  container.dataset.previewState = "rendered";
}

async function renderPdfPreview(download, container) {
  const response = await fetch(download.href);
  if (!response.ok) throw new Error(`Could not read PDF (${response.status}).`);
  pdfJsModulePromise ??= import(
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build/pdf.min.mjs"
  ).catch((error) => {
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
  const availableWidth = Math.max(container.clientWidth || 640, 280);

  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      if (
        !container.isConnected ||
        container.dataset.previewState !== "pending"
      ) {
        return;
      }
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
    if (
      !container.isConnected ||
      container.dataset.previewState !== "pending"
    ) {
      return;
    }
    container.replaceChildren(pages);
    container.dataset.previewState = "rendered";
  } finally {
    await pdf.destroy();
  }
}

function isMobilePreviewDevice() {
  return (
    navigator.userAgentData?.mobile === true ||
    /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function createDocumentFrame(url, title) {
  const frame = document.createElement("iframe");
  frame.src = url;
  frame.title = title;
  frame.referrerPolicy = "no-referrer";
  return frame;
}

function showDocumentPreviewFallback(download, container, mobile = false) {
  container.dataset.previewState = "failed";
  container.classList.add("document-preview-fallback-card");
  const message = document.createElement("p");
  message.className = "document-preview-fallback";
  message.textContent = labels.previewFailed;
  const link = document.createElement("a");
  link.className = "download document-preview-download";
  link.href = download.href;
  link.download = download.download;
  link.textContent = mobile ? labels.downloadToView : labels.downloadFile;
  container.replaceChildren(message, link);
}

function showPackPreviewFallback(download, container, error) {
  if (error) console.error("Could not render the Minecraft pack preview.", error);
  showDocumentPreviewFallback(download, container, isMobilePreviewDevice());
}

function releaseMinecraftIconUrls() {
  for (const url of minecraftIconUrls) URL.revokeObjectURL(url);
  minecraftIconUrls.clear();
}

function appendPreviewFrame(frame, download, container) {
  let timeoutId;
  const fallback = () => {
    window.clearTimeout(timeoutId);
    showDocumentPreviewFallback(download, container);
  };
  frame.addEventListener("error", fallback, { once: true });
  frame.addEventListener(
    "load",
    () => window.clearTimeout(timeoutId),
    { once: true },
  );
  timeoutId = window.setTimeout(fallback, 20000);
  container.append(frame);
}

function commonDirectoryPrefixLength(left, right) {
  const leftParts = left.split("/").filter(Boolean);
  const rightParts = right.split("/").filter(Boolean);
  let length = 0;
  while (leftParts[length] && leftParts[length] === rightParts[length]) length += 1;
  return length;
}

function findPackIcon(zip, manifestPath) {
  const manifestDirectory = manifestPath.slice(
    0,
    Math.max(0, manifestPath.lastIndexOf("/") + 1),
  );
  const candidates = Object.values(zip.files).filter((entry) => {
    if (
      entry.dir ||
      entry.name.split("/").pop().toLowerCase() !== "pack_icon.png"
    ) {
      return false;
    }
    const iconDirectory = entry.name.slice(
      0,
      Math.max(0, entry.name.lastIndexOf("/") + 1),
    );
    return (
      iconDirectory === manifestDirectory ||
      iconDirectory.startsWith(manifestDirectory) ||
      manifestDirectory.startsWith(iconDirectory)
    );
  });
  candidates.sort((left, right) => {
    const leftScore = commonDirectoryPrefixLength(
      manifestDirectory,
      left.name.slice(0, left.name.lastIndexOf("/") + 1),
    );
    const rightScore = commonDirectoryPrefixLength(
      manifestDirectory,
      right.name.slice(0, right.name.lastIndexOf("/") + 1),
    );
    if (leftScore !== rightScore) return rightScore - leftScore;
    const leftDistance =
      manifestDirectory.length +
      left.name.length -
      2 * leftScore;
    const rightDistance =
      manifestDirectory.length +
      right.name.length -
      2 * rightScore;
    return leftDistance - rightDistance;
  });
  return candidates[0];
}

function normalizePackValue(value) {
  if (Array.isArray(value)) return value.join(".");
  if (value && typeof value === "object") {
    return Object.values(value).filter((part) => typeof part === "string").join(" ");
  }
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}

function appendPackField(card, label, value) {
  const field = document.createElement("p");
  field.className = "minecraft-pack-field";
  const name = document.createElement("strong");
  name.textContent = `${label}: `;
  const content = document.createElement("span");
  content.textContent = value;
  field.append(name, content);
  card.append(field);
}

async function readMinecraftPacks(download) {
  jsZipModulePromise ??= import(
    "https://cdn.jsdelivr.net/npm/jszip@3.10.1/+esm"
  )
    .then((module) => module.default ?? module)
    .catch((error) => {
      jsZipModulePromise = undefined;
      throw error;
    });
  const JSZip = await jsZipModulePromise;
  const blobResponse = await fetch(download.href);
  if (!blobResponse.ok) {
    throw new Error(`Could not read pack file (${blobResponse.status}).`);
  }
  const sourceBlob = await blobResponse.blob();
  const file = new File([sourceBlob], download.download, {
    type: sourceBlob.type,
  });
  const outerArchive = await JSZip.loadAsync(file);
  const packs = [];
  const processedArchives = new Set();

  async function inspectArchive(zip, depth, sourceName) {
    if (depth > 3 || processedArchives.has(sourceName)) return;
    processedArchives.add(sourceName);

    const manifestEntries = Object.values(zip.files).filter(
      (entry) =>
        !entry.dir &&
        entry.name.split("/").pop().toLowerCase() === "manifest.json",
    );
    for (const manifestEntry of manifestEntries) {
      try {
        const manifest = JSON.parse(await manifestEntry.async("string"));
        const header = manifest.header;
        if (!header || typeof header !== "object") {
          throw new Error(`Manifest has no header: ${manifestEntry.name}`);
        }
        const packIcon = findPackIcon(zip, manifestEntry.name);
        const iconBlob = packIcon
          ? await packIcon.async("blob")
          : undefined;
        packs.push({
          manifest,
          header,
          iconBlob,
          source: `${sourceName}!${manifestEntry.name}`,
        });
      } catch (error) {
        console.error("Could not read a Minecraft pack manifest.", error);
      }
    }

    if (depth === 3) return;
    const nestedArchives = Object.values(zip.files).filter(
      (entry) =>
        !entry.dir &&
        /\.(?:mcpack|mcaddon)$/i.test(entry.name),
    );
    for (const archiveEntry of nestedArchives) {
      try {
        const bytes = await archiveEntry.async("uint8array");
        const nestedZip = await JSZip.loadAsync(bytes);
        await inspectArchive(
          nestedZip,
          depth + 1,
          `${sourceName}!${archiveEntry.name}`,
        );
      } catch (error) {
        console.error(
          `Could not open nested pack archive ${archiveEntry.name}.`,
          error,
        );
      }
    }
  }

  await inspectArchive(outerArchive, 0, download.download);
  if (packs.length === 0 && extensionOf(download.download) === "mcworld") {
    const worldName = Object.values(outerArchive.files).find(
      (entry) =>
        !entry.dir && entry.name.split("/").pop().toLowerCase() === "levelname.txt",
    );
    if (worldName) {
      const icon = Object.values(outerArchive.files).find(
        (entry) =>
          !entry.dir &&
          ["world_icon.jpeg", "world_icon.jpg", "world_icon.png"].includes(
            entry.name.split("/").pop().toLowerCase(),
          ),
      );
      const iconExtension = icon?.name.split(".").pop().toLowerCase();
      const iconMimeType =
        iconExtension === "png" ? "image/png" : "image/jpeg";
      packs.push({
        manifest: { modules: [] },
        header: {
          name: (await worldName.async("string")).trim(),
          description: "",
          version: "",
          type: "world",
        },
        iconBlob: icon
          ? new Blob([await icon.async("uint8array")], { type: iconMimeType })
          : undefined,
        source: download.download,
      });
    }
  }
  return packs;
}

async function renderMinecraftPreview(download, container) {
  container.dataset.previewState = "pending";
  container.textContent = labels.previewLoading;
  let timeoutId;
  try {
    const packs = await Promise.race([
      readMinecraftPacks(download),
      new Promise((resolve, reject) => {
        timeoutId = window.setTimeout(
          () => reject(new Error("The Minecraft pack preview timed out.")),
          20000,
        );
      }),
    ]);
    if (!container.isConnected || container.dataset.previewState !== "pending") {
      return;
    }
    if (packs.length === 0) {
      showPackPreviewFallback(
        download,
        container,
        new Error("No valid pack manifests were found."),
      );
      return;
    }

    const packList = document.createElement("div");
    packList.className = "minecraft-pack-list";
    const fileType = extensionOf(download.download).toUpperCase();
    for (const pack of packs) {
      const card = document.createElement("article");
      card.className = "minecraft-pack-card";
      card.setAttribute(
        "aria-label",
        normalizePackValue(pack.header.name) || labels.packName,
      );
      if (pack.iconBlob) {
        const iconUrl = URL.createObjectURL(pack.iconBlob);
        minecraftIconUrls.add(iconUrl);
        const icon = document.createElement("img");
        icon.className = "minecraft-pack-icon";
        icon.src = iconUrl;
        icon.alt = "";
        icon.addEventListener(
          "error",
          () => {
            URL.revokeObjectURL(iconUrl);
            minecraftIconUrls.delete(iconUrl);
            const fallback = document.createElement("div");
            fallback.className = "minecraft-pack-icon-fallback";
            fallback.textContent = labels.packIconMissing;
            icon.replaceWith(fallback);
          },
          { once: true },
        );
        card.append(icon);
      } else {
        const fallback = document.createElement("div");
        fallback.className = "minecraft-pack-icon-fallback";
        fallback.textContent = labels.packIconMissing;
        card.append(fallback);
      }
      const details = document.createElement("div");
      details.className = "minecraft-pack-details";
      const moduleTypes = new Set(
        (Array.isArray(pack.manifest.modules) ? pack.manifest.modules : [])
          .map((module) =>
            module && typeof module.type === "string"
              ? module.type.toLowerCase()
              : "",
          )
          .filter(Boolean),
      );
      const packTypes = [];
      if (moduleTypes.has("resources")) packTypes.push(labels.resourcePack);
      if (moduleTypes.has("data")) packTypes.push(labels.behaviorPack);
      if (moduleTypes.has("script")) packTypes.push(labels.scriptPack);
      const packType = packTypes.length
        ? packTypes.join(", ")
        : pack.header.type === "world"
          ? labels.worldSave
          : normalizePackValue(pack.header.type);
      appendPackField(
        details,
        labels.packName,
        normalizePackValue(pack.header.name) || labels.notSpecified,
      );
      appendPackField(
        details,
        labels.packDescription,
        normalizePackValue(pack.header.description) || labels.notSpecified,
      );
      appendPackField(
        details,
        labels.packVersion,
        normalizePackValue(pack.header.version) || labels.notSpecified,
      );
      appendPackField(details, labels.packType, packType || labels.notSpecified);
      appendPackField(details, labels.fileFormat, fileType);
      card.append(details);
      packList.append(card);
    }
    container.replaceChildren(packList);
    container.dataset.previewState = "rendered";
  } catch (error) {
    showPackPreviewFallback(download, container, error);
  } finally {
    window.clearTimeout(timeoutId);
  }
}

function renderDocumentViewer(fileUrl, fileExtension, download, container) {
  container.replaceChildren();
  container.classList.remove("document-preview-fallback-card");

  const ext = fileExtension.toLowerCase();
  if (minecraftExtensions.has(ext)) {
    if (isMobilePreviewDevice()) {
      showDocumentPreviewFallback(download, container, true);
    } else {
      void renderMinecraftPreview(download, container);
    }
    return;
  }

  if (isMobilePreviewDevice()) {
    showDocumentPreviewFallback(download, container, true);
    return;
  }

  if (ext === "pdf") {
    container.dataset.previewState = "pending";
    container.textContent = labels.previewLoading;
    let timeoutId;
    void Promise.race([
      renderPdfPreview(download, container),
      new Promise((resolve, reject) => {
        timeoutId = window.setTimeout(
          () => reject(new Error("The PDF preview timed out.")),
          20000,
        );
      }),
    ])
      .catch((error) => {
        console.error("Could not render the PDF preview.", error);
        if (container.dataset.previewState === "pending") {
          showDocumentPreviewFallback(download, container);
        }
      })
      .finally(() => window.clearTimeout(timeoutId));
    return;
  }

  if (["txt", "md"].includes(ext)) {
    const frame = createDocumentFrame(fileUrl, labels.previewTitle);
    container.dataset.previewState = "rendered";
    appendPreviewFrame(frame, download, container);
    return;
  }

  if (!["docx", "xlsx", "pptx", "doc", "xls", "ppt"].includes(ext)) {
    showDocumentPreviewFallback(download, container);
    return;
  }

  if (fileUrl.startsWith("blob:")) {
    container.dataset.previewState = "pending";
    container.textContent = labels.previewLoading;
    let timeoutId;
    const timeout = new Promise((resolve, reject) => {
      timeoutId = window.setTimeout(
        () => reject(new Error("The Office preview timed out.")),
        10000,
      );
    });
    void Promise.race([
      renderLocalOfficePreview(download, container),
      timeout,
    ])
      .catch((error) => {
        console.error("Could not render the local Office document preview.", error);
        if (container.dataset.previewState === "pending") {
          showDocumentPreviewFallback(download, container);
        }
      })
      .finally(() => window.clearTimeout(timeoutId));
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(fileUrl, window.location.href);
  } catch (error) {
    console.error("Could not parse the document URL.", error);
    showDocumentPreviewFallback(download, container);
    return;
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) {
    showDocumentPreviewFallback(download, container);
    return;
  }

  const viewerUrl = new URL("https://docs.google.com/viewer");
  viewerUrl.searchParams.set("url", parsedUrl.href);
  viewerUrl.searchParams.set("embedded", "true");
  const frame = createDocumentFrame(viewerUrl.href, labels.previewTitle);
  container.dataset.previewState = "rendered";
  appendPreviewFrame(frame, download, container);
}

function addDocumentPreview(download) {
  const extension = extensionOf(download.download);

  const existing = result.querySelector("[data-document-preview]");
  if (existing?.dataset.source === download.href) return;

  releaseMinecraftIconUrls();
  const preview = document.createElement("section");
  preview.className = "document-preview";
  preview.dataset.documentPreview = "true";
  preview.dataset.source = download.href;
  const heading = document.createElement("h2");
  heading.textContent = labels.previewTitle;
  const container = document.createElement("div");
  container.id = "document-preview-container";
  container.className = "document-preview-content";
  container.dataset.previewState = "pending";
  preview.append(heading, container);

  if (existing) existing.replaceWith(preview);
  else result.append(preview);
  renderDocumentViewer(download.href, extension, download, container);
}

function updateResult() {
  if (!result.querySelector("[data-document-preview]")) {
    releaseMinecraftIconUrls();
  }

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
