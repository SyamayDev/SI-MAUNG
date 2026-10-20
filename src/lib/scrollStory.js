/**
 * Scroll → story progress for pinned chapters. Native scrolling is never
 * hijacked: the page scrolls normally and this controller only *reads* it.
 *
 * Each chapter is a tall <section data-chapter="i" data-steps="n"> whose
 * .chapter__stage is position: sticky (styles/story.css). Per section:
 *   arriving — section top travels from the viewport bottom to the top  → --enter 0→1, story ∈ [i − 0.3, i)
 *   pinned   — the stage holds while the page scrolls through it        → --p 0→1,     story ∈ [i, i + 0.7)
 *              the panel shows its steps in turn (data-step), then fades out (--exit 0→1)
 *              before the stage is released, so the text never travels across MAUNG.
 * The 3D world moves between chapters while the outgoing text has faded and
 * the incoming one is still arriving (three/world/keyframes: chapterBlend).
 *
 * One passive scroll listener and at most one rAF per frame; measurements are
 * redone on resize/rotation and when chapter content changes height. Writes:
 *   scene.story / scene.chapter         (read by the WebGL scene every frame, no React renders)
 *   --enter / --p / --exit, data-step   (on each section, for CSS)
 *   data-active on the chapter in view, <html data-story="i"> (sky colours)
 */
import { scene, setScene } from "./sceneStore";

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
/** Share of the pinned phase used by the steps; the rest fades the panel out. */
const STEPS_SHARE = 0.8;

export function startStory(root, { onChapter } = {}) {
  const sections = [...root.querySelectorAll("[data-chapter]")];
  const html = document.documentElement;
  let segs = [];
  let raf = 0;
  let lastChapter = -1;
  let zones = [];

  const measure = () => {
    const vh = window.innerHeight;
    segs = sections.map((el, i) => {
      const top = el.getBoundingClientRect().top + window.scrollY;
      const pinStart = top;
      const pinEnd = Math.max(pinStart + 1, top + el.offsetHeight - vh);
      return { el, i, last: i === sections.length - 1, steps: Math.max(1, Number(el.dataset.steps) || 1), arrive: top - vh, pinStart, pinEnd, step: -1 };
    });
    // Phones/tablets: per chapter, MAUNG is framed in the stage's first grid
    // row — the space left above that chapter's text panel.
    const tall = window.innerWidth < 1024;
    zones = tall
      ? sections.map((el) => {
          const stage = el.querySelector(".chapter__stage");
          return stage ? parseFloat(getComputedStyle(stage).gridTemplateRows) || 0 : 0;
        })
      : [];
    if (zones[lastChapter]) html.style.setProperty("--maung-zone", `${zones[lastChapter]}px`);
    setScene({
      layout: tall ? "tall" : "wide",
      bandTop: parseFloat(getComputedStyle(root).getPropertyValue("--story-top")) || 0,
      bandBottom: zones,
    });
  };

  const update = () => {
    raf = 0;
    const y = window.scrollY;
    let story = 0;
    for (const s of segs) {
      const enter = s.i === 0 ? 1 : clamp01((y - s.arrive) / (s.pinStart - s.arrive));
      const p = clamp01((y - s.pinStart) / (s.pinEnd - s.pinStart));
      const exit = s.last ? 0 : clamp01((p - STEPS_SHARE) / (1 - STEPS_SHARE));
      const step = Math.min(s.steps - 1, Math.floor((Math.min(p, STEPS_SHARE - 1e-6) / STEPS_SHARE) * s.steps));
      const st = s.el.style;
      st.setProperty("--enter", enter.toFixed(3));
      st.setProperty("--p", p.toFixed(3));
      st.setProperty("--exit", exit.toFixed(3));
      if (step !== s.step) {
        s.step = step;
        s.el.dataset.step = String(step);
      }
      // A faded-out panel must not catch taps meant for what is on screen.
      s.el.toggleAttribute("data-faded", enter < 0.35 || exit > 0.65);
      if (y >= s.arrive || s.i === 0) {
        story = y < s.pinStart && s.i > 0 ? s.i - 0.3 + 0.3 * enter : s.i + 0.7 * p;
      }
    }
    scene.story = story;
    const current = Math.max(0, Math.min(segs.length - 1, Math.floor(story + 0.15)));
    if (current !== lastChapter) {
      lastChapter = current;
      sections.forEach((el, i) => el.toggleAttribute("data-active", i === current));
      sections[current]?.classList.add("is-seen"); // revealed content stays visible when scrolling back
      html.dataset.story = String(current);
      // 2D fallback posters (no WebGL) size themselves to this chapter's free zone
      if (zones[current]) html.style.setProperty("--maung-zone", `${zones[current]}px`);
      setScene({ chapter: current });
      onChapter?.(current);
    }
  };

  const onScroll = () => {
    if (!raf) raf = requestAnimationFrame(update);
  };
  const onResize = () => {
    measure();
    update();
  };

  // Keyboard users: focusing something in a chapter (or in a not-yet-shown
  // step card) scrolls the story to that place, so focus is never invisible.
  const onFocusIn = (e) => {
    const section = e.target.closest?.("[data-chapter]");
    const s = section && segs.find((x) => x.el === section);
    if (!s) return;
    const card = e.target.closest("[data-step-card]");
    const n = card ? Number(card.dataset.stepCard) : s.step < 0 ? 0 : s.step;
    const y = window.scrollY;
    const shown = y >= s.pinStart && y <= s.pinStart + (s.pinEnd - s.pinStart) * STEPS_SHARE && s.step === n;
    if (shown) return;
    const target = s.pinStart + (s.pinEnd - s.pinStart) * STEPS_SHARE * ((n + 0.5) / s.steps);
    window.scrollTo({ top: Math.round(target), behavior: "auto" });
  };

  measure();
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  root.addEventListener("focusin", onFocusIn);
  const ro = new ResizeObserver(onResize);
  sections.forEach((s) => {
    ro.observe(s);
    const panel = s.querySelector(".chapter__panel");
    if (panel) ro.observe(panel); // a panel growing (data loaded) moves MAUNG's zone
  });

  // Pause the WebGL loop when the story is scrolled away entirely.
  const io = new IntersectionObserver(([entry]) => setScene({ inView: entry.isIntersecting }));
  io.observe(root);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    root.removeEventListener("focusin", onFocusIn);
    ro.disconnect();
    io.disconnect();
    sections.forEach((el) => {
      el.removeAttribute("data-active");
      el.removeAttribute("data-step");
      el.removeAttribute("data-faded");
      el.classList.remove("is-seen");
    });
    delete html.dataset.story;
    html.style.removeProperty("--maung-zone");
    scene.story = 0;
    setScene({ chapter: 0, inView: true });
  };
}

/** Scroll so chapter i is pinned at its first step. */
export function scrollToChapter(i) {
  const el = document.querySelector(`[data-chapter="${i}"]`);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const top = i === 0 ? 0 : el.getBoundingClientRect().top + window.scrollY + 2;
  window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
}
