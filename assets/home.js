// MenuUtils — homepage choreography (GSAP).
// Hero panel drops out of the menu-bar status item; the module stage swaps
// panels as each module scrolls past; three surfaces fan out on a pinned
// scrub; editions re-sort with Flip. Everything degrades to the static page.
(() => {
  const MU = window.MU;
  if (!MU || !MU.hasGSAP) return;

  const { q, qa, scrollToTarget } = MU;
  const root = document.documentElement;
  const mm = gsap.matchMedia();
  const motionQuery = "(prefers-reduced-motion: no-preference)";

  const safe = (name, setup) => {
    try {
      setup();
    } catch (error) {
      console.error(`[MenuUtils] ${name} animation failed`, error);
      root.classList.remove("motion");
    }
  };

  /* ---------- Hero ---------- */
  safe("hero", () => {
    const title = q("[data-hero-title]");
    const stage = q("[data-hero-stage]");
    const status = q(".mb-toggle");
    if (!title || !stage) return;

    mm.add(
      {
        desktop: `(min-width: 1024px) and ${motionQuery}`,
        compact: `(max-width: 1023px) and ${motionQuery}`,
      },
      (context) => {
        const { desktop } = context.conditions;
        gsap.set(title, { autoAlpha: 1 });
        const split = SplitText.create(title, { type: "lines", mask: "lines", linesClass: "split-line" });
        const tl = gsap.timeline({ defaults: { ease: "expo.out" }, delay: 0.05 });

        tl.from(split.lines, { yPercent: 108, duration: 1.25, stagger: 0.1 }, 0).fromTo(
          "[data-hero]",
          { autoAlpha: 0, y: 22 },
          { autoAlpha: 1, y: 0, duration: 1.05, stagger: 0.08 },
          0.3
        );

        if (desktop && status) {
          // The panel opens out of the real status item in the menu bar.
          const from = status.getBoundingClientRect();
          const to = stage.getBoundingClientRect();
          const dx = from.left + from.width / 2 - (to.left + to.width / 2);
          const dy = from.bottom + 6 - to.top;
          tl.add(() => status.classList.add("is-pressed"), 0.45)
            .fromTo(
              stage,
              { autoAlpha: 0, x: dx, y: dy, scale: 0.05, transformOrigin: "50% 0%" },
              { autoAlpha: 1, x: 0, y: 0, scale: 1, duration: 1.35, ease: "expo.inOut" },
              0.5
            )
            .add(() => status.classList.remove("is-pressed"), 1.55)
            .fromTo(
              ".readout",
              { autoAlpha: 0, y: 14, scale: 0.92 },
              { autoAlpha: 1, y: 0, scale: 1, duration: 0.9, stagger: 0.12, ease: "back.out(1.5)" },
              1.55
            );
        } else {
          tl.fromTo(stage, { autoAlpha: 0, y: 40 }, { autoAlpha: 1, y: 0, duration: 1.2 }, 0.45).fromTo(
            ".readout",
            { autoAlpha: 0, y: 10 },
            { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.1 },
            1
          );
        }

        qa("[data-scramble]").forEach((dd, i) => {
          tl.to(dd, { duration: 1.2, scrambleText: { text: dd.dataset.scramble, chars: "0123456789", speed: 0.5 }, ease: "none" }, 0.9 + i * 0.12);
        });

        // Atmosphere: the brand's three menu lines breathe behind the hero.
        gsap.to(".atmos-bar", {
          scaleX: (i) => [0.82, 1.1, 0.9][i],
          duration: (i) => 6 + i * 1.5,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
        });
        gsap.to(".hero-atmos", {
          yPercent: 18,
          ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hero-shot", {
          yPercent: -6,
          ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
        });

        return () => {
          split.revert();
          if (status) status.classList.remove("is-pressed");
        };
      }
    );

    // Readouts drift with the pointer, at different depths.
    mm.add(`(min-width: 1024px) and (pointer: fine) and ${motionQuery}`, () => {
      const floats = qa("[data-float]").map((el) => ({
        depth: parseFloat(el.dataset.float),
        x: gsap.quickTo(el, "x", { duration: 0.9, ease: "power3" }),
        y: gsap.quickTo(el, "y", { duration: 0.9, ease: "power3" }),
      }));
      const hero = q(".hero");
      const move = (event) => {
        const nx = event.clientX / window.innerWidth - 0.5;
        const ny = event.clientY / window.innerHeight - 0.5;
        floats.forEach((f) => {
          f.x(nx * 18 * f.depth);
          f.y(ny * 14 * f.depth);
        });
      };
      hero.addEventListener("pointermove", move);
      return () => hero.removeEventListener("pointermove", move);
    });
  });

  /* ---------- Magnetic primary buttons ---------- */
  safe("magnetic", () => {
    mm.add(`(pointer: fine) and ${motionQuery}`, () => {
      const cleanups = qa("[data-magnetic]").map((button) => {
        const xTo = gsap.quickTo(button, "x", { duration: 0.5, ease: "power3" });
        const yTo = gsap.quickTo(button, "y", { duration: 0.5, ease: "power3" });
        const move = (event) => {
          const r = button.getBoundingClientRect();
          xTo((event.clientX - (r.left + r.width / 2)) * 0.22);
          yTo((event.clientY - (r.top + r.height / 2)) * 0.3);
        };
        const leave = () => gsap.to(button, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.4)" });
        button.addEventListener("pointermove", move);
        button.addEventListener("pointerleave", leave);
        return () => {
          button.removeEventListener("pointermove", move);
          button.removeEventListener("pointerleave", leave);
        };
      });
      return () => cleanups.forEach((fn) => fn());
    });
  });

  /* ---------- Module stage ---------- */
  safe("modules", () => {
    const modules = qa(".module");
    const scenes = qa(".scene");
    const icons = qa(".stage-icon");
    const view = q(".stage-view");
    const countEl = q("[data-stage-count]");
    const nameEl = q("[data-stage-name]");
    const progressEl = q("[data-stage-progress]");
    if (!modules.length || !scenes.length || !view) return;

    icons.forEach((icon) => {
      icon.addEventListener("click", () => {
        const target = document.getElementById(icon.dataset.target);
        if (target) scrollToTarget(target, window.innerHeight * 0.32);
      });
    });

    mm.add(
      { desktop: "(min-width: 1024px)", reduce: "(prefers-reduced-motion: reduce)" },
      (context) => {
        const { desktop, reduce } = context.conditions;
        if (!desktop) return;
        let current = -1;

        const setChrome = (index) => {
          modules.forEach((m, i) => m.classList.toggle("is-active", i === index));
          icons.forEach((b, i) => {
            b.classList.toggle("is-active", i === index);
            b.setAttribute("aria-pressed", String(i === index));
          });
          if (countEl) countEl.textContent = String(index + 1).padStart(2, "0");
          if (nameEl) nameEl.textContent = q(".module-title", modules[index]).textContent.trim();
          if (progressEl) {
            gsap.to(progressEl, { scaleX: (index + 1) / modules.length, duration: reduce ? 0 : 0.6, ease: "expo.out" });
          }
        };

        const activate = (index) => {
          if (index === current) return;
          const previous = current;
          current = index;
          setChrome(index);

          const next = scenes[index];
          const old = scenes[previous];
          scenes.forEach((scene, i) => {
            if (i !== index && i !== previous) {
              gsap.killTweensOf(scene);
              gsap.set(scene, { autoAlpha: 0 });
              scene.classList.remove("is-active");
            }
          });

          if (reduce || !old) {
            if (old) {
              gsap.set(old, { autoAlpha: 0 });
              old.classList.remove("is-active");
            }
            next.classList.add("is-active");
            gsap.set(next, { autoAlpha: 1, scale: 1, y: 0 });
            return;
          }

          // New panel drops from its status-item icon in the stage's menu bar.
          const iconRect = icons[index].getBoundingClientRect();
          const viewRect = view.getBoundingClientRect();
          const originX = iconRect.left + iconRect.width / 2 - viewRect.left;

          gsap.killTweensOf([old, next]);
          gsap.to(old, {
            autoAlpha: 0,
            scale: 0.97,
            y: 14,
            duration: 0.3,
            ease: "power2.in",
            onComplete: () => old.classList.remove("is-active"),
          });
          next.classList.add("is-active");
          gsap.fromTo(
            next,
            { autoAlpha: 0, scale: 0.86, y: -24, transformOrigin: `${originX}px 0px` },
            { autoAlpha: 1, scale: 1, y: 0, duration: 0.85, ease: "expo.out", delay: 0.06 }
          );
          const back = q(".layer-back", next);
          const front = q(".layer-front", next);
          if (back) gsap.fromTo(back, { xPercent: 8, autoAlpha: 0 }, { xPercent: 0, autoAlpha: 1, duration: 1, ease: "expo.out", delay: 0.16 });
          if (front) gsap.fromTo(front, { scale: 0.92, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.9, ease: "back.out(1.4)", delay: 0.1 });
        };

        modules.forEach((module, index) => {
          ScrollTrigger.create({
            trigger: module,
            start: "top center",
            end: "bottom center",
            onToggle: (self) => self.isActive && activate(index),
          });
        });

        if (!reduce) {
          // Depth inside each scene: back and front layers drift apart while scrolling.
          scenes.forEach((scene, index) => {
            const back = q(".layer-back", scene);
            const front = q(".layer-front", scene);
            const trigger = modules[index];
            if (back) {
              gsap.fromTo(back, { y: 36 }, { y: -36, ease: "none", scrollTrigger: { trigger, start: "top bottom", end: "bottom top", scrub: true } });
            }
            if (front) {
              gsap.fromTo(front, { y: -20 }, { y: 28, ease: "none", scrollTrigger: { trigger, start: "top bottom", end: "bottom top", scrub: true } });
            }
          });
        }

        activate(0);
        return () => {
          current = -1;
          scenes.forEach((scene, i) => scene.classList.toggle("is-active", i === 0));
          modules.forEach((m) => m.classList.remove("is-active"));
        };
      }
    );

    // Compact layout: each module simply rises into view.
    mm.add(`(max-width: 1023px) and ${motionQuery}`, () => {
      const parts = modules.flatMap((m) => [...m.children]);
      gsap.set(parts, { autoAlpha: 0, y: 26 });
      ScrollTrigger.batch(parts, {
        start: "top 90%",
        once: true,
        batchMax: 4,
        onEnter: (batch) => gsap.to(batch, { autoAlpha: 1, y: 0, duration: 0.9, ease: "expo.out", stagger: 0.06, overwrite: true }),
      });
    });
  });

  /* ---------- Menu Bar Hider illustration ---------- */
  safe("hider", () => {
    const demos = qa("[data-hider-demo]");
    if (!demos.length) return;
    const states = {
      hidden: ["Icons hidden", "Apps hidden: 5. Click the arrow to show them."],
      shown: ["Icons shown", "The always-hidden section stays hidden. Option-click the arrow to show it too."],
      all: ["All icons shown", "⌘-drag icons left of the arrow to hide them."],
    };

    mm.add(motionQuery, () => {
      demos.forEach((demo) => {
        const always = q(".hd-always", demo);
        const hidden = q(".hd-hidden", demo);
        const divider = q(".hd-divider", demo);
        const arrow = q(".hd-arrow .icon", demo);
        const title = q("[data-hd-title]", demo);
        const detail = q("[data-hd-detail]", demo);
        const alwaysIcons = qa(".hd-always .icon", demo);
        const hiddenIcons = qa(".hd-hidden .icon", demo);
        const say = (key) => () => {
          const [heading, body] = states[key];
          gsap.to(title, { duration: 0.6, scrambleText: { text: heading, chars: "lowerCase", speed: 0.9 } });
          detail.textContent = body;
          gsap.fromTo(detail, { autoAlpha: 0, y: 4 }, { autoAlpha: 1, y: 0, duration: 0.4, ease: "power2.out" });
        };

        const tl = gsap.timeline({ repeat: -1, paused: true, defaults: { ease: "power3.inOut" } });
        tl.addLabel("collapse", 1.8)
          .to([...alwaysIcons, ...hiddenIcons], { autoAlpha: 0, x: 18, duration: 0.4, stagger: 0.03 }, "collapse")
          .to([always, hidden], { width: 0, duration: 0.7 }, "collapse+=0.1")
          .to(divider, { width: 0, marginLeft: 0, marginRight: 0, autoAlpha: 0, duration: 0.6 }, "collapse+=0.1")
          .to(arrow, { rotation: 180, duration: 0.5 }, "collapse")
          .call(say("hidden"), null, "collapse")
          .addLabel("expand", "+=2")
          .to(hidden, { width: "auto", duration: 0.7 }, "expand")
          .to(hiddenIcons, { autoAlpha: 1, x: 0, duration: 0.45, stagger: 0.04 }, "expand+=0.2")
          .to(arrow, { rotation: 0, duration: 0.5 }, "expand")
          .call(say("shown"), null, "expand")
          .addLabel("all", "+=2.2")
          .to(divider, { width: 2, marginLeft: 6, marginRight: 6, autoAlpha: 1, duration: 0.5 }, "all")
          .to(always, { width: "auto", duration: 0.7 }, "all")
          .to(alwaysIcons, { autoAlpha: 1, x: 0, duration: 0.45, stagger: 0.04 }, "all+=0.2")
          .call(say("all"), null, "all")
          .to({}, { duration: 1.4 });

        ScrollTrigger.create({
          trigger: demo.closest(".stage") ? ".modules" : demo,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => (self.isActive ? tl.play() : tl.pause()),
        });
      });
    });
  });

  /* ---------- Three surfaces (pinned scrub) ---------- */
  safe("surfaces", () => {
    const section = q(".depths");
    const steps = qa(".depth-steps li");
    if (!section) return;

    const setStep = (index) => steps.forEach((li, i) => li.classList.toggle("is-active", i === index));

    mm.add(`(min-width: 1024px) and (min-height: 640px) and ${motionQuery}`, () => {
      const tl = gsap.timeline({
        defaults: { ease: "power2.inOut" },
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=190%",
          pin: true,
          scrub: 0.7,
          anticipatePin: 1,
          onUpdate: (self) => setStep(self.progress < 0.3 ? 0 : self.progress < 0.68 ? 1 : 2),
        },
      });

      tl.from(".depth-panel", { xPercent: 52, yPercent: -18, scale: 1.25, duration: 1 }, 0)
        .from(".depth-detail", { autoAlpha: 0, xPercent: -40, yPercent: 14, scale: 0.5, duration: 1, ease: "power3.out" }, 0.45)
        .from(".depth-prefs", { autoAlpha: 0, xPercent: 38, yPercent: 26, scale: 0.55, duration: 1, ease: "power3.out" }, 1.25)
        .from(".depth figcaption", { autoAlpha: 0, y: 6, duration: 0.3, stagger: 0.2 }, 1.9)
        .to({}, { duration: 0.35 });

      return () => setStep(0);
    });

    // Without the pin, steps simply light up together.
    mm.add(`(max-width: 1023px), (max-height: 639px), (prefers-reduced-motion: reduce)`, () => {
      steps.forEach((li) => li.classList.add("is-active"));
      return () => steps.forEach((li, i) => li.classList.toggle("is-active", i === 0));
    });
  });

  /* ---------- Preferences gallery (pinned horizontal scroll) ---------- */
  safe("preferences", () => {
    const section = q(".prefs");
    const track = q("[data-prefs-track]");
    if (!section || !track) return;
    const cards = qa(".pref-card", track);
    const countEl = q("[data-pref-count]");
    const progressEl = q("[data-pref-progress]");
    let current = -1;
    const setActive = (index) => {
      if (index === current) return;
      current = index;
      cards.forEach((card, i) => card.classList.toggle("is-active", i === index));
      if (countEl) countEl.textContent = String(index + 1).padStart(2, "0");
      if (progressEl) gsap.to(progressEl, { scaleX: (index + 1) / cards.length, duration: 0.4, ease: "power2.out" });
    };

    mm.add(`(min-width: 1024px) and (min-height: 640px) and ${motionQuery}`, () => {
      const distance = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const slide = gsap.to(track, {
        x: () => -distance(),
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.6,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => setActive(Math.round(self.progress * (cards.length - 1))),
        },
      });
      cards.forEach((card) => {
        gsap.fromTo(
          card,
          { y: 36, scale: 0.94 },
          {
            y: 0,
            scale: 1,
            ease: "none",
            scrollTrigger: { trigger: card, containerAnimation: slide, start: "left right", end: "center 60%", scrub: true },
          }
        );
      });
      setActive(0);
      return () => {
        current = -1;
        cards.forEach((card) => card.classList.remove("is-active"));
      };
    });

    // Compact layouts swipe natively; the counter follows the centered card.
    mm.add("(max-width: 1023px), (max-height: 639px), (prefers-reduced-motion: reduce)", () => {
      const onScroll = () => {
        const center = track.scrollLeft + track.clientWidth / 2;
        let best = 0;
        let bestDistance = Infinity;
        cards.forEach((card, i) => {
          const d = Math.abs(card.offsetLeft + card.offsetWidth / 2 - center);
          if (d < bestDistance) { bestDistance = d; best = i; }
        });
        setActive(best);
      };
      track.addEventListener("scroll", onScroll, { passive: true });
      onScroll();
      return () => track.removeEventListener("scroll", onScroll);
    });
  });

  /* ---------- Editions (Flip) ---------- */
  safe("editions", () => {
    const seg = q(".seg");
    const buttons = qa(".seg-btn");
    const caps = qa(".cap").sort((a, b) => a.dataset.order - b.dataset.order);
    const inList = q('[data-caps="in"]');
    const outList = q('[data-caps="out"]');
    const countIn = q("[data-count-in]");
    const countOut = q("[data-count-out]");
    const facts = qa("[data-fact]");
    if (!seg || !inList || !outList) return;

    const setEdition = (edition) => {
      const animate = MU.motion && window.Flip && !matchMedia("(prefers-reduced-motion: reduce)").matches;
      seg.dataset.active = edition;
      buttons.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.edition === edition)));

      const state = animate ? Flip.getState(caps) : null;
      let included = 0;
      caps.forEach((cap) => {
        const isIn = cap.dataset[edition] === "1";
        (isIn ? inList : outList).appendChild(cap);
        if (isIn) included += 1;
      });
      if (countIn) countIn.textContent = included;
      if (countOut) countOut.textContent = caps.length - included;

      facts.forEach((dd) => {
        const text = dd.dataset[edition];
        if (dd.textContent === text) return;
        if (animate) gsap.to(dd, { duration: 0.7, scrambleText: { text, chars: "lowerCase", speed: 0.8 } });
        else dd.textContent = text;
      });

      if (animate) {
        Flip.from(state, {
          duration: 0.8,
          ease: "power3.inOut",
          stagger: 0.025,
          zIndex: 5,
        });
      }
    };

    buttons.forEach((b) => b.addEventListener("click", () => setEdition(b.dataset.edition)));
  });

  /* ---------- Privacy statement ---------- */
  safe("privacy", () => {
    const statement = q("[data-words]");
    if (!statement) return;
    mm.add(motionQuery, () => {
      const split = SplitText.create(statement, { type: "words", wordsClass: "word" });
      gsap.fromTo(
        split.words,
        { opacity: 0.14 },
        {
          opacity: 1,
          stagger: 0.1,
          ease: "none",
          scrollTrigger: { trigger: statement, start: "top 82%", end: "bottom 42%", scrub: true },
        }
      );
      return () => split.revert();
    });
  });

  /* ---------- Download icon ---------- */
  safe("download", () => {
    const icon = q("[data-tilt]");
    if (!icon) return;

    mm.add(motionQuery, () => {
      gsap.from(icon, {
        y: 90,
        rotationX: 38,
        scale: 0.8,
        autoAlpha: 0,
        duration: 1.4,
        ease: "expo.out",
        scrollTrigger: { trigger: ".download", start: "top 72%", once: true },
      });
      gsap.to(".icon-bar", {
        scaleX: (i) => [0.7, 1.14, 0.84][i],
        duration: 1.8,
        ease: "sine.inOut",
        repeat: -1,
        yoyo: true,
        stagger: 0.3,
      });
      gsap.to(".icon-dot", { scale: 0.6, transformOrigin: "50% 50%", duration: 1.1, ease: "sine.inOut", repeat: -1, yoyo: true });
    });

    mm.add(`(pointer: fine) and ${motionQuery}`, () => {
      const holder = q(".download-icon");
      const rx = gsap.quickTo(icon, "rotationX", { duration: 0.8, ease: "power3" });
      const ry = gsap.quickTo(icon, "rotationY", { duration: 0.8, ease: "power3" });
      const move = (event) => {
        const r = holder.getBoundingClientRect();
        ry(((event.clientX - r.left) / r.width - 0.5) * 26);
        rx(-((event.clientY - r.top) / r.height - 0.5) * 22);
      };
      const leave = () => { rx(0); ry(0); };
      holder.addEventListener("pointermove", move);
      holder.addEventListener("pointerleave", leave);
      return () => {
        holder.removeEventListener("pointermove", move);
        holder.removeEventListener("pointerleave", leave);
      };
    });
  });

  /* ---------- Footer wordmark ---------- */
  safe("footer", () => {
    mm.add(motionQuery, () => {
      gsap.fromTo(
        ".footer-mark span",
        { yPercent: 70 },
        {
          yPercent: 0,
          ease: "none",
          scrollTrigger: { trigger: ".site-footer", start: "top bottom", end: "bottom bottom", scrub: true },
        }
      );
    });
  });
})();
