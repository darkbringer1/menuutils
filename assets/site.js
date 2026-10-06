// MenuUtils — shared site behavior for every page:
// live menu bar (clock, demo readouts, status-item popover), screenshot
// lightbox, scroll reveals, split headings, doc-page table of contents.
// Works without GSAP; GSAP only adds motion.
(() => {
  const root = document.documentElement;
  const gsap = window.gsap;
  const hasGSAP = typeof gsap !== "undefined";

  if (hasGSAP) {
    const plugins = [
      window.ScrollTrigger,
      window.ScrollToPlugin,
      window.SplitText,
      window.Flip,
      window.ScrambleTextPlugin,
    ].filter(Boolean);
    gsap.registerPlugin(...plugins);
    window.__muMotion = true;
  } else {
    root.classList.remove("motion");
  }

  const motion = hasGSAP && root.classList.contains("motion");
  const q = (selector, scope = document) => scope.querySelector(selector);
  const qa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const menubarHeight = () => q(".menubar")?.offsetHeight ?? 34;

  const scrollToTarget = (target, offset = menubarHeight() + 16) => {
    if (!target) return;
    if (motion && window.ScrollToPlugin) {
      gsap.to(window, {
        duration: 1.1,
        ease: "expo.inOut",
        scrollTo: { y: target, offsetY: offset, autoKill: true },
      });
    } else {
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: root.classList.contains("motion") ? "smooth" : "auto" });
    }
  };

  window.MU = { motion, hasGSAP, q, qa, scrollToTarget, menubarHeight };

  /* ---------- Clock ---------- */
  const clocks = qa("[data-clock]");
  const shortClocks = qa("[data-clock-short]");
  const tickClock = () => {
    const now = new Date();
    const date = now.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" }).replace(/,/g, "");
    const time = now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    clocks.forEach((el) => { el.textContent = `${date} ${time}`; });
    shortClocks.forEach((el) => { el.textContent = time; });
  };
  if (clocks.length || shortClocks.length) {
    tickClock();
    setInterval(tickClock, 10_000);
  }

  /* ---------- Demo readouts in the menu bar ---------- */
  const readouts = {
    up: { el: q('[data-readout="up"]'), value: 11.7, min: 0.4, max: 420, digits: 1 },
    down: { el: q('[data-readout="down"]'), value: 15.8, min: 0.6, max: 940, digits: 1 },
    cpu: { el: q('[data-readout="cpu"]'), value: 22, min: 6, max: 64, digits: 0 },
  };
  const spark = q("[data-spark]");
  const cpuHistory = Array.from({ length: 18 }, () => 14 + Math.random() * 16);

  const drawSpark = () => {
    if (!spark) return;
    const step = 30 / (cpuHistory.length - 1);
    spark.setAttribute(
      "points",
      cpuHistory.map((v, i) => `${(i * step).toFixed(1)},${(13 - (v / 70) * 12).toFixed(1)}`).join(" ")
    );
  };

  const nextValue = (r) => {
    // Bursty random walk: mostly small drift, occasionally a spike.
    const burst = Math.random() < 0.12 ? (Math.random() * r.max) / 3 : 0;
    const drift = r.value * (Math.random() * 0.5 - 0.25);
    return Math.min(r.max, Math.max(r.min, r.value + drift + burst - (r.value > r.max / 4 ? r.value * 0.35 : 0)));
  };

  const tickReadouts = () => {
    if (document.hidden) return;
    Object.values(readouts).forEach((r) => {
      if (!r.el) return;
      const target = nextValue(r);
      if (motion) {
        const proxy = { v: r.value };
        gsap.to(proxy, {
          v: target,
          duration: 0.9,
          ease: "power2.out",
          onUpdate: () => { r.el.textContent = proxy.v.toFixed(r.digits); },
        });
      } else {
        r.el.textContent = target.toFixed(r.digits);
      }
      r.value = target;
    });
    cpuHistory.push(readouts.cpu.value);
    cpuHistory.shift();
    drawSpark();
  };
  if (readouts.cpu.el || readouts.up.el) {
    drawSpark();
    setInterval(tickReadouts, 1800);
  }

  /* ---------- Status-item popover ---------- */
  const toggle = q(".mb-toggle");
  const pop = q("#mb-pop");
  if (toggle && pop) {
    const place = () => {
      const rect = toggle.getBoundingClientRect();
      const width = pop.offsetWidth;
      const center = rect.left + rect.width / 2;
      const left = Math.min(window.innerWidth - width - 8, Math.max(8, center - width / 2));
      pop.style.left = `${left}px`;
      pop.style.setProperty("--notch-x", `${center - left}px`);
    };

    const isOpen = () => toggle.getAttribute("aria-expanded") === "true";

    const open = () => {
      pop.hidden = false;
      place();
      toggle.setAttribute("aria-expanded", "true");
      if (motion) {
        gsap.killTweensOf(pop);
        gsap.fromTo(pop, { autoAlpha: 0, scale: 0.94, y: -8 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.42, ease: "expo.out" });
        gsap.fromTo(
          qa(".mb-pop-modules li", pop),
          { autoAlpha: 0, x: -6 },
          { autoAlpha: 1, x: 0, duration: 0.35, ease: "power2.out", stagger: 0.025, delay: 0.05 }
        );
        gsap.fromTo(
          qa(".switch", pop),
          { backgroundColor: "rgba(128,128,128,.35)" },
          { backgroundColor: "", duration: 0.3, stagger: 0.04, delay: 0.18, clearProps: "backgroundColor" }
        );
      }
      q("a", pop)?.focus({ preventScroll: true });
    };

    const close = (returnFocus = false) => {
      if (!isOpen()) return;
      toggle.setAttribute("aria-expanded", "false");
      const finish = () => {
        pop.hidden = true;
        if (returnFocus) toggle.focus();
      };
      if (motion) {
        gsap.killTweensOf(pop);
        gsap.to(pop, { autoAlpha: 0, scale: 0.97, y: -4, duration: 0.16, ease: "power2.in", onComplete: finish });
      } else {
        finish();
      }
    };

    toggle.addEventListener("click", () => (isOpen() ? close() : open()));
    document.addEventListener("pointerdown", (event) => {
      if (isOpen() && !pop.contains(event.target) && !toggle.contains(event.target)) close();
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && isOpen()) close(true);
    });
    pop.addEventListener("click", (event) => {
      if (event.target.closest("a")) close();
    });
    window.addEventListener("resize", () => isOpen() && place());
  }

  /* ---------- Menu bar hider: the site's own arrow hides its readouts ---------- */
  const hider = q(".mb-hider");
  const bar = q(".menubar");
  if (hider && bar) {
    const items = qa(".mb-net, .mb-cpu", bar);
    hider.addEventListener("click", () => {
      const hide = hider.getAttribute("aria-pressed") !== "true";
      const label = hide ? "Show hidden menu bar icons" : "Hide menu bar icons";
      hider.setAttribute("aria-pressed", String(hide));
      hider.setAttribute("aria-label", label);
      hider.title = label;
      if (!motion) {
        bar.classList.toggle("icons-hidden", hide);
        return;
      }
      gsap.killTweensOf(items);
      const collapsed = { width: 0, autoAlpha: 0, paddingLeft: 0, paddingRight: 0 };
      if (hide) {
        gsap.to(items, {
          ...collapsed,
          duration: 0.45,
          ease: "power3.inOut",
          stagger: 0.05,
          onComplete: () => {
            bar.classList.add("icons-hidden");
            gsap.set(items, { clearProps: "all" });
          },
        });
      } else {
        bar.classList.remove("icons-hidden");
        gsap.from(items, { ...collapsed, duration: 0.5, ease: "power3.out", stagger: -0.05, clearProps: "all" });
      }
    });
  }

  /* ---------- Same-page anchors use eased scrolling ---------- */
  const onHome = location.pathname === "/" || location.pathname.endsWith("/index.html");
  document.addEventListener("click", (event) => {
    const link = event.target.closest('a[href^="#"], a[href^="/#"]');
    if (!link || event.defaultPrevented || event.metaKey || event.ctrlKey || event.shiftKey) return;
    const hash = link.getAttribute("href").replace(/^\//, "");
    if (link.getAttribute("href").startsWith("/#") && !onHome) return;
    const target = hash.length > 1 ? document.getElementById(hash.slice(1)) : null;
    if (!target) return;
    event.preventDefault();
    history.pushState(null, "", hash);
    scrollToTarget(target);
  });

  /* ---------- Copy buttons ---------- */
  qa("[data-copy]").forEach((button) => {
    button.addEventListener("click", async () => {
      const code = button.parentElement.querySelector("code");
      try {
        await navigator.clipboard.writeText(code.textContent.trim());
        button.classList.add("is-done");
        button.querySelector("use")?.setAttribute("href", "#ic-check");
        button.setAttribute("aria-label", "Copied");
        setTimeout(() => {
          button.classList.remove("is-done");
          button.querySelector("use")?.setAttribute("href", "#ic-copy");
          button.setAttribute("aria-label", "Copy command");
        }, 1600);
      } catch {
        const range = document.createRange();
        range.selectNodeContents(code);
        getSelection().removeAllRanges();
        getSelection().addRange(range);
      }
    });
  });

  /* ---------- Doc-page table of contents ---------- */
  const tocLinks = qa(".doc-toc a");
  if (tocLinks.length) {
    const targets = tocLinks.map((a) => document.getElementById(a.hash.slice(1))).filter(Boolean);
    let frame = 0;
    const update = () => {
      frame = 0;
      const line = window.innerHeight * 0.35;
      let active = 0;
      targets.forEach((t, i) => { if (t.getBoundingClientRect().top < line) active = i; });
      tocLinks.forEach((a, i) => a.classList.toggle("is-active", i === active));
    };
    window.addEventListener("scroll", () => { if (!frame) frame = requestAnimationFrame(update); }, { passive: true });
    update();
  }

  /* ---------- Screenshot lightbox ---------- */
  const screenshots = qa("[data-zoomable]");
  if (screenshots.length && typeof HTMLDialogElement !== "undefined") {
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

    const stage = q(".screenshot-lightbox-stage", dialog);
    const lightboxImage = q(".screenshot-lightbox-image", dialog);
    const title = q(".screenshot-lightbox-title", dialog);
    const level = q(".screenshot-lightbox-level", dialog);
    const zoomOut = q("[data-zoom-out]", dialog);
    const zoomIn = q("[data-zoom-in]", dialog);
    const closeButton = q("[data-close]", dialog);

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
      if (!lightboxImage.naturalWidth || !lightboxImage.naturalHeight) return;
      fitScale = Math.min(
        1,
        (stage.clientWidth - 40) / lightboxImage.naturalWidth,
        (stage.clientHeight - 40) / lightboxImage.naturalHeight
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
      if (motion) {
        gsap.fromTo(dialog, { autoAlpha: 0, scale: 0.97, y: 12 }, { autoAlpha: 1, scale: 1, y: 0, duration: 0.45, ease: "expo.out" });
      }
      if (lightboxImage.complete) requestAnimationFrame(fitImage);
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
    dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
    dialog.addEventListener("close", () => {
      document.body.classList.remove("screenshot-viewer-open");
      lightboxImage.removeAttribute("src");
      sourceButton?.focus();
    });
    window.addEventListener("resize", () => { if (dialog.open) fitImage(); });
  }

  /* ---------- Scroll reveals & split headings ----------
     Created on DOMContentLoaded so that page scripts (home.js) register their
     pinned sections first; ScrollTrigger refreshes in creation order. */
  if (!motion || !window.ScrollTrigger) return;

  document.addEventListener("DOMContentLoaded", () => {
    const reveals = qa("[data-reveal]");
    if (reveals.length) {
      gsap.set(reveals, { autoAlpha: 0, y: 28 });
      ScrollTrigger.batch(reveals, {
        start: "top 90%",
        once: true,
        batchMax: 4,
        onEnter: (batch) =>
          gsap.to(batch, { autoAlpha: 1, y: 0, duration: 1, ease: "expo.out", stagger: 0.08, overwrite: true }),
      });
    }

    if (window.SplitText) {
      qa("[data-split]").forEach((heading) => {
        SplitText.create(heading, {
          type: "lines",
          mask: "lines",
          linesClass: "split-line",
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 105,
              duration: 1.1,
              ease: "expo.out",
              stagger: 0.09,
              scrollTrigger: { trigger: heading, start: "top 88%", once: true },
            }),
        });
      });
    }
  });

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
