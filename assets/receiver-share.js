import { i as loadMessages } from "./dialog-BCNB4hJ8.js";
import { w as createShareHandler } from "./share-dialog-B4uABdxi.js";

await loadMessages();
const openButton = document.getElementById("share-open");
if (!openButton) throw new Error("Receiver share button is missing.");
openButton.addEventListener("click", createShareHandler());
