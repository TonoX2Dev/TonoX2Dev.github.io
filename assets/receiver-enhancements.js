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
        previewFailed: "ไม่สามารถเปิดดูได้",
        mobilePdfUnsupported: "ไม่สามารถเปิดดูในมือถือได้",
        downloadFile: "ดาวน์โหลดไฟล์",
        downloadPack: "ดาวน์โหลด",
        packAuthors: "ผู้สร้าง",
        unknownCreator: "ไม่ทราบผู้สร้าง",
        packIconMissing: "ไม่มีไอคอนแพ็ก",
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
        previewFailed: "Could not preview this file.",
        mobilePdfUnsupported: "PDF previews are unavailable on mobile. Download the file to view it.",
        downloadFile: "Download file",
        downloadPack: "Download",
        packAuthors: "Created by",
        unknownCreator: "Unknown Creator",
        packIconMissing: "Pack icon unavailable",
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

const previewLibraries = new Map();
const previewObjectUrls = new Set();

function loadPreviewLibrary(globalName, sourceUrl) {
  if (globalThis[globalName]) return Promise.resolve(globalThis[globalName]);
  if (previewLibraries.has(globalName)) return previewLibraries.get(globalName);

  const libraryPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = sourceUrl;
    script.async = true;
    script.referrerPolicy = "no-referrer";
    script.onload = () => {
      const library = globalThis[globalName];
      if (!library) {
        reject(new Error(globalName + " loaded without exposing its API."));
        return;
      }
      resolve(library);
    };
    script.onerror = () => reject(new Error("Could not load " + globalName + "."));
    document.head.append(script);
  }).catch((error) => {
    previewLibraries.delete(globalName);
    throw error;
  });
  previewLibraries.set(globalName, libraryPromise);
  return libraryPromise;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function appendSafeConvertedHtml(sourceHtml, container) {
  const source = new DOMParser().parseFromString(sourceHtml, "text/html");
  const allowedTags = new Set([
    "P", "BR", "H1", "H2", "H3", "H4", "H5", "H6", "UL", "OL",
    "LI", "TABLE", "THEAD", "TBODY", "TFOOT", "TR", "TH", "TD",
    "STRONG", "B", "EM", "I", "U", "S", "SUB", "SUP", "BLOCKQUOTE",
    "PRE", "CODE", "SPAN", "IMG",
  ]);
  const blockedTags = new Set([
    "SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "FORM", "LINK",
    "META", "BASE", "SVG", "MATH",
  ]);

  function copyNode(node, parent) {
    if (node.nodeType === Node.TEXT_NODE) {
      parent.append(document.createTextNode(node.nodeValue || ""));
      return;
    }
    if (!(node instanceof Element)) return;
    if (blockedTags.has(node.tagName)) return;
    if (!allowedTags.has(node.tagName)) {
      for (const child of node.childNodes) copyNode(child, parent);
      return;
    }
    const safe = document.createElement(node.tagName.toLowerCase());
    if (node.tagName === "TH" || node.tagName === "TD") {
      for (const attribute of ["colspan", "rowspan"]) {
        const value = Number(node.getAttribute(attribute));
        if (Number.isInteger(value) && value > 0 && value <= 100) {
          safe.setAttribute(attribute, String(value));
        }
      }
    }
    if (node.tagName === "IMG") {
      const sourceUrl = node.getAttribute("src") || "";
      if (!/^data:image\/(?:png|jpeg|gif|webp);base64,/i.test(sourceUrl)) return;
      safe.setAttribute("src", sourceUrl);
      safe.setAttribute("alt", node.getAttribute("alt") || "");
    }
    for (const child of node.childNodes) copyNode(child, safe);
    parent.append(safe);
  }

  const paper = document.createElement("div");
  paper.className = "document-preview-word-content";
  for (const child of source.body.childNodes) copyNode(child, paper);
  if (!paper.textContent.trim() && !paper.querySelector("img, table")) {
    throw new Error("The Word document did not produce readable preview content.");
  }
  container.replaceChildren(paper);
}

function createDownloadIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute(
    "d",
    "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3",
  );
  svg.append(path);
  return svg;
}

function renderFallbackDownload(container, fileName, downloadUrl, message) {
  if (!container) return;
  container.dataset.previewState = "failed";
  container.classList.add("document-preview-fallback-card");
  const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  icon.setAttribute("width", "48");
  icon.setAttribute("height", "48");
  icon.setAttribute("viewBox", "0 0 24 24");
  icon.setAttribute("fill", "none");
  icon.setAttribute("stroke", "currentColor");
  icon.setAttribute("stroke-width", "1.5");
  icon.setAttribute("aria-hidden", "true");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6");
  icon.append(path);
  const messageText = document.createElement("p");
  messageText.className = "document-preview-fallback";
  messageText.textContent = message;
  const file = document.createElement("p");
  file.className = "document-preview-file";
  file.textContent = fileName;
  const link = document.createElement("a");
  link.className = "document-preview-download";
  link.href = downloadUrl || "#";
  link.download = fileName;
  link.setAttribute("aria-label", labels.downloadFile + ": " + fileName);
  link.append(createDownloadIcon(), document.createTextNode(labels.downloadFile));
  container.replaceChildren(icon, messageText, file, link);
}

function isMobilePreviewDevice() {
  return (
    navigator.userAgentData?.mobile === true ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent,
    ) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
  );
}

function normalizeMinecraftValue(value, fallback = "") {
  if (Array.isArray(value)) return value.map(String).join(".");
  if (typeof value === "string" || typeof value === "number") return String(value);
  return fallback;
}

function renderMinecraftPackCard(container, fileName, extension, downloadUrl, manifest, iconFile) {
  const header = manifest.header || {};
  const metadata = manifest.metadata || {};
  const packName = normalizeMinecraftValue(header.name, fileName);
  const description = normalizeMinecraftValue(
    header.description,
    document.documentElement.lang === "th" ? "??????????????????????" : "No description provided.",
  );
  const version = normalizeMinecraftValue(header.version, "1.0.0");
  const authorValue = metadata.authors ?? metadata.author ?? labels.unknownCreator;
  const authors = Array.isArray(authorValue)
    ? authorValue.map((author) => typeof author === "string" ? author : normalizeMinecraftValue(author?.name ?? author?.displayName)).filter(Boolean).join(", ")
    : normalizeMinecraftValue(authorValue, labels.unknownCreator);
  const card = document.createElement("article");
  card.className = "minecraft-pack-card mc-card";
  card.setAttribute("aria-label", packName);
  const details = document.createElement("div");
  details.className = "minecraft-pack-details";
  const title = document.createElement("h3");
  title.className = "minecraft-pack-name";
  title.textContent = packName;
  const summary = document.createElement("p");
  summary.className = "minecraft-pack-description";
  summary.textContent = description;
  const creator = document.createElement("p");
  creator.className = "minecraft-pack-author";
  creator.textContent = labels.packAuthors + ": " + (authors || labels.unknownCreator);
  const badges = document.createElement("div");
  badges.className = "minecraft-pack-badges";
  const formatBadge = document.createElement("span");
  formatBadge.className = "minecraft-pack-badge minecraft-pack-format";
  formatBadge.textContent = "." + extension;
  const versionBadge = document.createElement("span");
  versionBadge.className = "minecraft-pack-badge minecraft-pack-version";
  versionBadge.textContent = "v" + version.replace(/^v/i, "");
  badges.append(formatBadge, versionBadge);
  details.append(title, summary, creator, badges);

  if (iconFile) {
    const icon = document.createElement("img");
    icon.className = "minecraft-pack-icon";
    icon.alt = "";
    iconFile.async("blob").then((blob) => {
      if (!icon.isConnected) return;
      const iconUrl = URL.createObjectURL(blob);
      previewObjectUrls.add(iconUrl);
      icon.src = iconUrl;
    }).catch((error) => console.error("Could not load the Minecraft pack icon.", error));
    card.append(icon);
  } else {
    const placeholder = document.createElement("div");
    placeholder.className = "minecraft-pack-icon-fallback";
    placeholder.textContent = labels.packIconMissing;
    card.append(placeholder);
  }

  const action = document.createElement("div");
  action.className = "minecraft-pack-action";
  const downloadLink = document.createElement("a");
  downloadLink.className = "minecraft-pack-download";
  downloadLink.href = downloadUrl || "#";
  downloadLink.download = fileName;
  downloadLink.setAttribute("aria-label", labels.downloadPack + ": " + fileName);
  downloadLink.title = labels.downloadPack;
  downloadLink.append(createDownloadIcon());
  action.append(downloadLink);
  card.append(details, action);
  container.replaceChildren(card);
  container.dataset.previewState = "rendered";
}

async function processFilePreview(fileBlob, fileName, fileType, containerElement, downloadUrl) {
  if (
    !containerElement ||
    !containerElement.isConnected ||
    containerElement.dataset.previewState !== "pending"
  ) return;
  containerElement.replaceChildren();
  const ext = extensionOf(fileName);
  const isMobile = isMobilePreviewDevice();
  const previewBlob = fileType && fileBlob.type !== fileType
    ? fileBlob.slice(0, fileBlob.size, fileType)
    : fileBlob;
  const archiveExtensions = ["mcpack", "mcaddon", "mcworld", "zip"];

  if (archiveExtensions.includes(ext)) {
    try {
      const JSZip = await loadPreviewLibrary(
        "JSZip",
        "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
      );
      const zipContent = await new JSZip().loadAsync(previewBlob);
      let manifestFile = null;
      let iconFile = null;
      zipContent.forEach((relativePath, fileEntry) => {
        const lowerPath = relativePath.toLowerCase();
        if (!manifestFile && lowerPath.endsWith("manifest.json")) manifestFile = fileEntry;
        if (!iconFile && lowerPath.endsWith("pack_icon.png")) iconFile = fileEntry;
      });
      if (manifestFile) {
        const manifest = JSON.parse(await manifestFile.async("string"));
        if (!containerElement.isConnected || containerElement.dataset.previewState !== "pending") return;
        renderMinecraftPackCard(containerElement, fileName, ext, downloadUrl, manifest, iconFile);
        return;
      }
    } catch (error) {
      console.warn("Minecraft add-on parsing failed; showing the download fallback.", error);
    }
  }
  if (containerElement.dataset.previewState !== "pending") return;

  if (["pdf", "docx", "xlsx", "txt", "md"].includes(ext)) {
    if (isMobile && ext === "pdf") {
      renderFallbackDownload(containerElement, fileName, downloadUrl, labels.mobilePdfUnsupported);
      return;
    }

    try {
      if (ext === "pdf") {
        const blobUrl = URL.createObjectURL(previewBlob);
        previewObjectUrls.add(blobUrl);
        const frame = document.createElement("iframe");
        frame.src = blobUrl;
        frame.title = labels.previewTitle;
        frame.referrerPolicy = "no-referrer";
        containerElement.replaceChildren(frame);
        containerElement.dataset.previewState = "rendered";
        return;
      }

      if (ext === "docx") {
        const mammoth = await loadPreviewLibrary(
          "mammoth",
          "https://cdnjs.cloudflare.com/ajax/libs/mammoth/1.6.0/mammoth.browser.min.js",
        );
        const result = await mammoth.convertToHtml({ arrayBuffer: await previewBlob.arrayBuffer() });
        if (typeof result.value !== "string" || !result.value.trim()) {
          throw new Error("The Word document did not produce preview content.");
        }
        if (!containerElement.isConnected || containerElement.dataset.previewState !== "pending") return;
        appendSafeConvertedHtml(result.value, containerElement);
        containerElement.dataset.previewState = "rendered";
        return;
      }

      if (ext === "xlsx") {
        const XLSX = await loadPreviewLibrary(
          "XLSX",
          "https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js",
        );
        const workbook = XLSX.read(new Uint8Array(await previewBlob.arrayBuffer()), { type: "array" });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        if (!firstSheet) throw new Error("The spreadsheet contains no readable sheets.");
        const tableSource = new DOMParser().parseFromString(
          XLSX.utils.sheet_to_html(firstSheet),
          "text/html",
        );
        const table = tableSource.querySelector("table");
        if (!table) throw new Error("The spreadsheet preview is empty.");
        const safeTable = document.createElement("div");
        safeTable.className = "document-preview-sheet";
        const safe = document.createElement("table");
        for (const row of table.rows) {
          const safeRow = document.createElement("tr");
          for (const cell of row.cells) {
            const safeCell = document.createElement(cell.tagName === "TH" ? "th" : "td");
            safeCell.textContent = cell.textContent || "";
            safeRow.append(safeCell);
          }
          safe.append(safeRow);
        }
        safeTable.append(safe);
        if (!containerElement.isConnected || containerElement.dataset.previewState !== "pending") return;
        containerElement.replaceChildren(safeTable);
        containerElement.dataset.previewState = "rendered";
        return;
      }

      if (["txt", "md"].includes(ext)) {
        const pre = document.createElement("pre");
        pre.className = "document-preview-text";
        pre.textContent = await previewBlob.text();
        if (!containerElement.isConnected || containerElement.dataset.previewState !== "pending") return;
        containerElement.replaceChildren(pre);
        containerElement.dataset.previewState = "rendered";
        return;
      }
    } catch (error) {
      console.error("Document preview render error.", error);
    }
  }

  renderFallbackDownload(containerElement, fileName, downloadUrl, labels.previewFailed);
}

function addDocumentPreview(download) {
  const extension = extensionOf(download.download);
  const documentTypes = new Set(["pdf", "docx", "xlsx", "txt", "md"]);
  const archiveTypes = new Set(["mcaddon", "mcpack", "mcworld", "zip"]);
  const existing = result.querySelector("[data-file-preview]");
  if (existing?.dataset.source === download.href) return;

  for (const node of result.querySelectorAll("[data-file-preview]")) node.remove();
  for (const url of previewObjectUrls) URL.revokeObjectURL(url);
  previewObjectUrls.clear();
  const preview = document.createElement("section");
  preview.className = documentTypes.has(extension) ? "document-preview" : "file-preview";
  preview.dataset.filePreview = "true";
  preview.dataset.source = download.href;
  if (documentTypes.has(extension)) preview.dataset.documentPreview = "true";
  if (archiveTypes.has(extension)) preview.dataset.minecraftPreview = "true";
  const container = document.createElement("div");
  container.className = "document-preview-content";
  container.dataset.previewState = "pending";
  if (documentTypes.has(extension)) {
    const heading = document.createElement("h2");
    heading.textContent = labels.previewTitle;
    preview.append(heading);
  }
  preview.append(container);
  result.append(preview);

  let timeoutId;
  const timeout = new Promise((resolve, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error("The file preview timed out.")), 25000);
  });
  Promise.race([
    (async () => {
      const response = await fetch(download.href);
      if (!response.ok) throw new Error("Could not read file (" + response.status + ").");
      const blob = await response.blob();
      if (!container.isConnected || container.dataset.previewState !== "pending") return;
      const contentTypes = {
        pdf: "application/pdf",
        docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        txt: "text/plain",
        md: "text/markdown",
      };
      const responseType = response.headers.get("content-type") || "";
      const fileType =
        contentTypes[extension] ||
        (responseType.includes("octet-stream") ? blob.type : responseType) ||
        blob.type;
      await processFilePreview(
        blob,
        download.download,
        fileType,
        container,
        download.href,
      );
    })(),
    timeout,
  ]).catch((error) => {
    console.error("Could not prepare the file preview.", error);
    if (container.dataset.previewState === "pending") {
      renderFallbackDownload(container, download.download, download.href, labels.previewFailed);
    }
  }).finally(() => window.clearTimeout(timeoutId));
}

function updateResult() {
  if (
    !result.querySelector("[data-document-preview]") &&
    !result.querySelector("[data-minecraft-preview]")
  ) {
    for (const url of previewObjectUrls) URL.revokeObjectURL(url);
    previewObjectUrls.clear();
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
