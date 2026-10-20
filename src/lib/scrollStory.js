/**
 * Scroll → story progress. Native scrolling is never hijacked: the page
 * scrolls normally and this controller only *reads* it.
 *
 * Each chapter is a <section data-chapter="i">. The story position is
 * continuous and monotonic in scrollY:
 *   arriving  — chapter top travels from the viewport bottom to the reading line → story ∈ [i − 0.3, i)
 *   holding   — until the next chapter starts to arrive                         → story ∈ [i, i + 0.7)
 * One passive scroll listener and at most one rAF per frame; measurements are
 * redone on resize/rotation and when chapter content changes height. Writes:
 *   scene.story / scene.chapter   (read by the WebGL scene every frame, no React renders)
 *   --p 0..1 on each section      (progress through its holding phase, for CSS)
 *   data-active on the chapter in view
 */
import { scene, setScene } from "./sceneStore";

const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
const READING_LINE = 0.45; // fraction of the viewport height

export function startStory(root, { onChapter, headerOffset = () => (window.innerWidth < 1024 ? 58 : 0) } = {}) {
  const sections = [...root.querySelectorAll("[data-chapter]")];
  let segs = [];
  let raf = 0;
  let lastChapter = -1;

  const measure = () => {
    const vh = window.innerHeight;
    const line = vh * READING_LINE;
    const docEnd = Math.max(1, document.documentElement.scrollHeight - vh);
    const tops = sections.map((el) => el.getBoundingClientRect().top + window.scrollY);
    segs = sections.map((el, i) => {
      const settle = i === 0 ? 0 : Math.max(0, tops[i] - line);
      const arrive = i === 0 ? 0 : Math.min(settle - 1, Math.max(0, tops[i] - vh));
      const nextArrive = i < sections.length - 1 ? Math.max(0, tops[i + 1] - vh) : docEnd;
      return { el, arrive, settle, end: Math.max(settle + 1, nextArrive) };
    });
    // Phones/tablets: MAUNG is framed in the free band above each chapter's panel.
    const tall = window.innerWidth < 1024;
    setScene({
      layout: tall ? "tall" : "wide",
      bandTop: headerOffset() / vh,
      bandBottom: sections.map((el) => {
        const panel = el.querySelector("[data-panel]");
        return panel ? clamp01((panel.getBoundingClientRect().top - el.getBoundingClientRect().top) / vh) : 0.55;
      }),
    });
  };

  const update = () => {
    raf = 0;
    const y = window.scrollY;
    let story = 0;
    for (let i = 0; i < segs.length; i++) {
      const s = segs[i];
      const p = clamp01((y - s.settle) / (s.end - s.settle));
      s.el.style.setProperty("--p", p.toFixed(3));
      if (y >= s.arrive) {
        story = y < s.settle && i > 0 ? i - 0.3 + 0.3 * clamp01((y - s.arrive) / (s.settle - s.arrive)) : i + 0.7 * p;
      }
    }
    scene.story = story;
    const current = Math.max(0, Math.min(segs.length - 1, Math.floor(story + 0.15)));
    if (current !== lastChapter) {
      lastChapter = current;
      sections.forEach((el, i) => el.toggleAttribute("data-active", i === current));
      sections[current]?.classList.add("is-seen"); // revealed content stays visible when scrolling back
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

  measure();
  update();
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  const ro = new ResizeObserver(onResize);
  sections.forEach((s) => ro.observe(s));

  // Pause the WebGL loop when the story is scrolled away entirely.
  const io = new IntersectionObserver(([entry]) => setScene({ inView: entry.isIntersecting }));
  io.observe(root);

  return () => {
    cancelAnimationFrame(raf);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    ro.disconnect();
    io.disconnect();
    sections.forEach((el) => {
      el.removeAttribute("data-active");
      el.classList.remove("is-seen");
    });
    scene.story = 0;
    setScene({ chapter: 0, inView: true, bandBottom: [] });
  };
}

/** Scroll so chapter i sits at the reading position. */
export function scrollToChapter(i) {
  const el = document.querySelector(`[data-chapter="${i}"]`);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const offset = window.innerWidth < 1024 ? 58 : 0;
  const top = i === 0 ? 0 : el.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
}
