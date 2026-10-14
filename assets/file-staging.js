const input = document.getElementById("cfg-file");
const section = document.getElementById("staged-files");
const list = document.getElementById("staged-file-list");
const status = document.getElementById("staged-file-status");
const transfer = document.getElementById("transfer-now");
const filePicker = document.getElementById("pane-file");

if (!input || !section || !list || !status || !transfer || !filePicker) {
  throw new Error("File staging markup is incomplete.");
}

const isThai = document.documentElement.lang === "th";
const text = isThai
  ? {
      adding: "กำลังเพิ่มไฟล์...",
      empty: "เลือกไฟล์ก่อนเริ่มส่ง",
      file: "ไฟล์",
      files: (count) => `เตรียมไฟล์แล้ว ${count} ไฟล์`,
      remove: (name) => `ลบ ${name}`,
      sending: "กำลังเตรียมไฟล์สำหรับส่ง...",
      tooLarge: "ไฟล์รวมมีขนาดเกิน 64 MB",
      tooMany: "รวมไฟล์ได้ไม่เกิน 65,535 ไฟล์",
      zip: "กำลังบีบอัดไฟล์เป็น ZIP...",
      failed: (message) => `เตรียมไฟล์ไม่สำเร็จ: ${message}`,
    }
  : {
      adding: "Adding files...",
      empty: "Choose files before starting the transfer.",
      file: "file",
      files: (count) => `${count} ${count === 1 ? "file" : "files"} staged`,
      remove: (name) => `Remove ${name}`,
      sending: "Preparing staged files for transfer...",
      tooLarge: "Combined files exceed the 64 MB transfer limit.",
      tooMany: "A ZIP archive can contain at most 65,535 files.",
      zip: "Packing files into a ZIP archive...",
      failed: (message) => `Could not prepare files: ${message}`,
    };

const icons = new URL("./icons/", import.meta.url);
const iconUrl = (name) => new URL(name, icons).href;
const documentIcon = iconUrl("document.ico");
const imageIcon = iconUrl("image.ico");
const stagedFiles = [];
const previewUrls = new Set();
let submitting = false;
const maxTransferSize = 64 * 1024 * 1024;

const imageTypes = new Set(["jpg", "jpeg", "png", "gif", "webp", "svg"]);
const iconByExtension = new Map([
  ...["zip", "rar", "7z", "tar", "gz"].map((extension) => [extension, "zip.ico"]),
  ...["mp4", "mkv", "mov", "avi"].map((extension) => [extension, "video.ico"]),
  ...["mp3", "wav", "aac", "flac"].map((extension) => [extension, "audio.ico"]),
  ...["txt", "log", "md"].map((extension) => [extension, "text.ico"]),
  ...["doc", "docx"].map((extension) => [extension, "docs.ico"]),
  ...["xls", "xlsx", "csv"].map((extension) => [extension, "xlsx.ico"]),
  ["pdf", "pdf.ico"],
]);

function extensionOf(name) {
  return name.includes(".") ? name.split(".").pop().toLowerCase() : "";
}

function iconFor(file) {
  const extension = extensionOf(file.name);
  return iconByExtension.get(extension) ?? "document.ico";
}

function formatSize(size) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function revokePreview(url) {
  URL.revokeObjectURL(url);
  previewUrls.delete(url);
}

function showFallbackIcon(icon, fallbackUrl) {
  if (icon.dataset.fallback === "true") {
    icon.remove();
    return;
  }
  icon.dataset.fallback = "true";
  icon.classList.remove("staged-file-thumbnail");
  icon.src = fallbackUrl;
}

function render() {
  for (const url of previewUrls) URL.revokeObjectURL(url);
  previewUrls.clear();
  list.replaceChildren();
  for (const [index, file] of stagedFiles.entries()) {
    const item = document.createElement("li");
    item.className = "staged-file-card";

    const icon = document.createElement("img");
    icon.className = "staged-file-icon";
    icon.width = 24;
    icon.height = 24;
    icon.alt = "";
    icon.src = iconUrl(iconFor(file));
    icon.onerror = () =>
      showFallbackIcon(icon, icon.dataset.preview === "true" ? imageIcon : documentIcon);

    if (imageTypes.has(extensionOf(file.name)) && file.type.startsWith("image/")) {
      const previewUrl = URL.createObjectURL(file);
      previewUrls.add(previewUrl);
      icon.dataset.preview = "true";
      icon.classList.add("staged-file-thumbnail");
      icon.src = previewUrl;
      icon.onload = () => revokePreview(previewUrl);
      icon.addEventListener("error", () => revokePreview(previewUrl), { once: true });
    }

    const details = document.createElement("span");
    details.className = "staged-file-details";
    const name = document.createElement("span");
    name.className = "staged-file-name";
    name.textContent = file.name;
    const size = document.createElement("span");
    size.className = "staged-file-size";
    size.textContent = formatSize(file.size);
    details.append(name, size);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "staged-file-remove";
    remove.setAttribute("aria-label", text.remove(file.name));
    remove.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m3 0-.8 13H6.8L6 7m4 4v5m4-5v5"/></svg>';
    remove.addEventListener("click", () => {
      stagedFiles.splice(index, 1);
      render();
    });

    item.append(icon, details, remove);
    list.append(item);
  }

  section.hidden = stagedFiles.length === 0;
  transfer.disabled = stagedFiles.length === 0 || transfer.dataset.busy === "true";
  status.textContent = stagedFiles.length ? text.files(stagedFiles.length) : "";
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date) {
  const year = Math.max(1980, date.getFullYear());
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1),
    date: ((year - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

function createZip(files, contents) {
  const encoder = new TextEncoder();
  const locals = [];
  const centrals = [];
  let offset = 0;
  const now = dosDateTime(new Date());

  for (let index = 0; index < files.length; index++) {
    const filename = encoder.encode(files[index].name);
    const data = contents[index];
    const checksum = crc32(data);
    const local = new Uint8Array(30 + filename.length);
    const localView = new DataView(local.buffer);
    localView.setUint32(0, 0x04034b50, true);
    localView.setUint16(4, 20, true);
    localView.setUint16(6, 0x0800, true);
    localView.setUint16(8, 0, true);
    localView.setUint16(10, now.time, true);
    localView.setUint16(12, now.date, true);
    localView.setUint32(14, checksum, true);
    localView.setUint32(18, data.length, true);
    localView.setUint32(22, data.length, true);
    localView.setUint16(26, filename.length, true);
    local.set(filename, 30);
    locals.push(local, data);

    const central = new Uint8Array(46 + filename.length);
    const centralView = new DataView(central.buffer);
    centralView.setUint32(0, 0x02014b50, true);
    centralView.setUint16(4, 20, true);
    centralView.setUint16(6, 20, true);
    centralView.setUint16(8, 0x0800, true);
    centralView.setUint16(10, 0, true);
    centralView.setUint16(12, now.time, true);
    centralView.setUint16(14, now.date, true);
    centralView.setUint32(16, checksum, true);
    centralView.setUint32(20, data.length, true);
    centralView.setUint32(24, data.length, true);
    centralView.setUint16(28, filename.length, true);
    centralView.setUint32(42, offset, true);
    central.set(filename, 46);
    centrals.push(central);
    offset += local.length + data.length;
  }

  const centralSize = centrals.reduce((total, chunk) => total + chunk.length, 0);
  const end = new Uint8Array(22);
  const endView = new DataView(end.buffer);
  endView.setUint32(0, 0x06054b50, true);
  endView.setUint16(8, files.length, true);
  endView.setUint16(10, files.length, true);
  endView.setUint32(12, centralSize, true);
  endView.setUint32(16, offset, true);
  return new Blob([...locals, ...centrals, end], { type: "application/zip" });
}

document.addEventListener(
  "change",
  (event) => {
    if (event.target !== input) return;
    if (submitting) {
      submitting = false;
      return;
    }
    event.stopImmediatePropagation();
    const selected = [...(input.files ?? [])];
    input.value = "";
    if (selected.length === 0) return;
    if (stagedFiles.length + selected.length > 65535) {
      status.textContent = text.tooMany;
      return;
    }
    stagedFiles.push(...selected);
    status.textContent = text.files(stagedFiles.length);
    render();
  },
  true,
);

transfer.addEventListener("click", async () => {
  if (stagedFiles.length === 0 || transfer.dataset.busy === "true") return;
  transfer.dataset.busy = "true";
  transfer.disabled = true;
  filePicker.classList.add("staging-busy");
  status.textContent = text.sending;

  try {
    let file;
    if (stagedFiles.length === 1) {
      file = stagedFiles[0];
    } else {
      status.textContent = text.zip;
      const encoder = new TextEncoder();
      const estimatedSize = stagedFiles.reduce((total, item) => {
        const filenameLength = encoder.encode(item.name).length;
        if (filenameLength > 65535) throw new Error(text.tooLarge);
        return total + item.size + 76 + filenameLength;
      }, 22);
      if (estimatedSize > maxTransferSize) throw new Error(text.tooLarge);
      const contents = await Promise.all(
        stagedFiles.map(async (item) => new Uint8Array(await item.arrayBuffer())),
      );
      const zip = createZip(stagedFiles, contents);
      if (zip.size > maxTransferSize) throw new Error(text.tooLarge);
      file = new File([zip], "tonofastcode-files.zip", {
        type: "application/zip",
        lastModified: Date.now(),
      });
    }

    const transferList = new DataTransfer();
    transferList.items.add(file);
    input.files = transferList.files;
    submitting = true;
    input.dispatchEvent(new Event("change", { bubbles: true }));
    stagedFiles.length = 0;
    render();
  } catch (error) {
    status.textContent = text.failed(error instanceof Error ? error.message : String(error));
  } finally {
    transfer.dataset.busy = "false";
    filePicker.classList.remove("staging-busy");
    transfer.disabled = stagedFiles.length === 0;
  }
});

render();
