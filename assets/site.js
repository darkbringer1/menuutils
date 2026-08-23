(() => {
  const screenshots = [...document.querySelectorAll("[data-zoomable]")];

  if (screenshots.length === 0 || typeof HTMLDialogElement === "undefined") {
    return;
  }

  const dialog = document.createElement("dialog");
  dialog.className = "screenshot-lightbox";
  dialog.setAttribute("aria-label", "Screenshot viewer");
  dialog.innerHTML = `
    <div class="screenshot-lightbox-shell">
      <header class="screenshot-lightbox-toolbar">
        <p class="screenshot-lightbox-title"></p>
        <div class="screenshot-lightbox-controls" aria-label="Image zoom controls">
          <button class="screenshot-lightbox-control" type="button" data-zoom-out aria-label="Zoom out">−</button>
          <output class="screenshot-lightbox-level" aria-live="polite">100%</output>
          <button class="screenshot-lightbox-control" type="button" data-zoom-in aria-label="Zoom in">+</button>
          <button class="screenshot-lightbox-control screenshot-lightbox-close" type="button" data-close aria-label="Close screenshot">×</button>
        </div>
      </header>
      <div class="screenshot-lightbox-stage">
        <img class="screenshot-lightbox-image" alt="" draggable="false">
      </div>
    </div>
  `;
  document.body.append(dialog);

  const stage = dialog.querySelector(".screenshot-lightbox-stage");
  const lightboxImage = dialog.querySelector(".screenshot-lightbox-image");
  const title = dialog.querySelector(".screenshot-lightbox-title");
  const level = dialog.querySelector(".screenshot-lightbox-level");
  const zoomOut = dialog.querySelector("[data-zoom-out]");
  const zoomIn = dialog.querySelector("[data-zoom-in]");
  const closeButton = dialog.querySelector("[data-close]");

  let scale = 1;
  let fitScale = 1;
  let sourceButton = null;

  const updateZoom = (nextScale) => {
    scale = Math.min(1, Math.max(fitScale, nextScale));
    lightboxImage.style.width = `${Math.round(lightboxImage.naturalWidth * scale)}px`;
    level.value = `${Math.round(scale * 100)}%`;
    level.textContent = level.value;
    zoomOut.disabled = scale <= fitScale + 0.005;
    zoomIn.disabled = scale >= 0.995;
  };

  const fitImage = () => {
    if (!lightboxImage.naturalWidth || !lightboxImage.naturalHeight) {
      return;
    }

    const horizontalPadding = 40;
    const verticalPadding = 40;
    fitScale = Math.min(
      1,
      (stage.clientWidth - horizontalPadding) / lightboxImage.naturalWidth,
      (stage.clientHeight - verticalPadding) / lightboxImage.naturalHeight
    );
    updateZoom(fitScale);
    stage.scrollTo({ top: 0, left: 0 });
  };

  const openScreenshot = (source, button) => {
    sourceButton = button;
    title.textContent = source.alt || "Product screenshot";
    lightboxImage.alt = source.alt || "Product screenshot";
    lightboxImage.src = source.currentSrc || source.src;
    dialog.showModal();
    document.body.classList.add("screenshot-viewer-open");

    if (lightboxImage.complete) {
      requestAnimationFrame(fitImage);
    }
  };

  screenshots.forEach((screenshot) => {
    const button = document.createElement("button");
    const hint = document.createElement("span");
    button.type = "button";
    button.className = "screenshot-button";
    button.setAttribute("aria-label", `Open screenshot: ${screenshot.alt || "MenuUtils"}`);
    hint.className = "screenshot-zoom-hint";
    hint.setAttribute("aria-hidden", "true");
    hint.textContent = "Open image";

    screenshot.before(button);
    button.append(screenshot, hint);
    button.addEventListener("click", () => openScreenshot(screenshot, button));
  });

  lightboxImage.addEventListener("load", fitImage);
  zoomIn.addEventListener("click", () => updateZoom(scale * 1.4));
  zoomOut.addEventListener("click", () => updateZoom(scale / 1.4));
  closeButton.addEventListener("click", () => dialog.close());

  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      dialog.close();
    }
  });

  dialog.addEventListener("close", () => {
    document.body.classList.remove("screenshot-viewer-open");
    lightboxImage.removeAttribute("src");
    sourceButton?.focus();
  });

  window.addEventListener("resize", () => {
    if (dialog.open) {
      fitImage();
    }
  });
})();
