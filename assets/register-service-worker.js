if ("serviceWorker" in navigator) {
  const workerUrl = new URL("../sw.js", import.meta.url);
  const scopeUrl = new URL("../", import.meta.url);

  const registerServiceWorker = () => {
    const wasControlled = Boolean(navigator.serviceWorker.controller);
    let reloading = false;

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (!wasControlled || reloading) return;
      reloading = true;
      window.location.reload();
    });

    navigator.serviceWorker
      .register(workerUrl, { scope: scopeUrl.href })
      .then((registration) => {
        const activateWaitingWorker = (worker) => {
          worker?.postMessage({ type: "SKIP_WAITING" });
        };

        activateWaitingWorker(registration.waiting);
        registration.addEventListener("updatefound", () => {
          const installingWorker = registration.installing;
          if (!installingWorker) return;

          installingWorker.addEventListener("statechange", () => {
            if (installingWorker.state === "installed") {
              activateWaitingWorker(registration.waiting || installingWorker);
            }
          });
        });
      })
      .catch((error) => {
        console.error("Could not register the service worker.", error);
      });
  };

  if (document.readyState === "complete") {
    registerServiceWorker();
  } else {
    window.addEventListener("load", registerServiceWorker, { once: true });
  }
}
